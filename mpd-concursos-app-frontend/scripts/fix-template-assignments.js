#!/usr/bin/env node

/**
 * Script para corregir assignments en bindings de templates
 */

const fs = require('fs');
const path = require('path');

class TemplateAssignmentFixer {
  constructor() {
    this.srcPath = path.join(__dirname, '..', 'src');
    this.fixedFiles = [];
    this.errors = [];
  }

  async fix() {
    console.log('🔧 Corrigiendo assignments en bindings de templates...\n');

    try {
      const htmlFiles = this.findFiles(this.srcPath, '.html');
      
      for (const file of htmlFiles) {
        await this.fixFile(file);
      }
      
      this.printResults();
      
    } catch (error) {
      console.error('❌ Error durante la corrección:', error.message);
      process.exit(1);
    }
  }

  async fixFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      
      let newContent = content;
      let hasChanges = false;
      const fixes = [];
      
      // Patrón para detectar assignments en event bindings
      const assignmentPatterns = [
        // (click)="variable = value"
        {
          pattern: /\(click\)\s*=\s*["']([^"']*=\s*[^"']*)["']/g,
          description: 'Click assignment'
        },
        // (change)="variable = value"
        {
          pattern: /\(change\)\s*=\s*["']([^"']*=\s*[^"']*)["']/g,
          description: 'Change assignment'
        },
        // Otros eventos con assignments
        {
          pattern: /\((input|blur|focus|keyup|keydown)\)\s*=\s*["']([^"']*=\s*[^"']*)["']/g,
          description: 'Event assignment'
        }
      ];

      for (const { pattern, description } of assignmentPatterns) {
        const matches = [...content.matchAll(pattern)];
        
        for (const match of matches) {
          const fullMatch = match[0];
          const assignment = match[1] || match[2];
          
          // Generar método sugerido
          const methodName = this.generateMethodName(assignment);
          const newBinding = fullMatch.replace(/=\s*["']([^"']*)["']/, `="${methodName}()"`);
          
          newContent = newContent.replace(fullMatch, newBinding);
          hasChanges = true;
          
          fixes.push({
            original: fullMatch,
            fixed: newBinding,
            suggestedMethod: this.generateMethodImplementation(methodName, assignment),
            description
          });
        }
      }
      
      // Solo escribir si hay cambios
      if (hasChanges && newContent !== originalContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        this.fixedFiles.push({
          file: filePath,
          fixes: fixes
        });
      }
      
    } catch (error) {
      this.errors.push(`Error procesando ${filePath}: ${error.message}`);
    }
  }

  generateMethodName(assignment) {
    // Extraer variable del assignment
    const variableMatch = assignment.match(/(\w+)\s*=/);
    if (variableMatch) {
      const variable = variableMatch[1];
      return `set${variable.charAt(0).toUpperCase() + variable.slice(1)}`;
    }
    return 'handleAction';
  }

  generateMethodImplementation(methodName, assignment) {
    return `
  /**
   * TODO: Implement this method in the component
   */
  ${methodName}(): void {
    ${assignment};
  }`;
  }

  findFiles(dir, extension) {
    const files = [];
    
    const scan = (currentDir) => {
      const items = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item.name);
        
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
          scan(fullPath);
        } else if (item.isFile() && item.name.endsWith(extension)) {
          files.push(fullPath);
        }
      }
    };
    
    scan(dir);
    return files;
  }

  printResults() {
    console.log('\n📊 Resultados de Corrección:\n');
    
    if (this.fixedFiles.length === 0 && this.errors.length === 0) {
      console.log('✅ No se encontraron assignments en bindings para corregir.');
      return;
    }
    
    if (this.fixedFiles.length > 0) {
      console.log(`✅ Archivos corregidos (${this.fixedFiles.length}):`);
      this.fixedFiles.forEach(({ file, fixes }) => {
        const relativePath = path.relative(this.srcPath, file);
        console.log(`\n   📄 ${relativePath} (${fixes.length} assignments corregidos):`);
        
        fixes.forEach((fix, index) => {
          console.log(`      ${index + 1}. ${fix.description}:`);
          console.log(`         Antes: ${fix.original}`);
          console.log(`         Después: ${fix.fixed}`);
          console.log(`         Método sugerido: ${fix.suggestedMethod}`);
        });
      });
      console.log();
    }
    
    if (this.errors.length > 0) {
      console.log(`❌ Errores (${this.errors.length}):`);
      this.errors.forEach(error => console.log(`   ${error}`));
      console.log();
    }
    
    console.log('📝 Próximos pasos:');
    console.log('   1. Revisar los archivos modificados');
    console.log('   2. Implementar los métodos sugeridos en los componentes');
    console.log('   3. Verificar que la funcionalidad sigue funcionando');
    console.log('   4. Ejecutar tests para validar los cambios');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const fixer = new TemplateAssignmentFixer();
  fixer.fix();
}

module.exports = TemplateAssignmentFixer;
