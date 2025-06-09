#!/usr/bin/env node

/**
 * Script para reemplazar console.log con sistema de logging apropiado
 */

const fs = require('fs');
const path = require('path');

class ConsoleLogFixer {
  constructor() {
    this.srcPath = path.join(__dirname, '..', 'src');
    this.fixedFiles = [];
    this.errors = [];
  }

  async fix() {
    console.log('🔧 Corrigiendo console.log en código de producción...\n');

    try {
      const tsFiles = this.findFiles(this.srcPath, '.ts');
      
      for (const file of tsFiles) {
        // Saltar archivos de test
        if (file.includes('.spec.') || file.includes('.test.')) {
          continue;
        }
        
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
      
      // Detectar si el archivo ya tiene el servicio de logging
      const hasLoggingService = content.includes('LoggingService') || 
                               content.includes('console.error') ||
                               content.includes('console.warn');
      
      let newContent = content;
      let hasChanges = false;
      
      // Reemplazar console.log con comentarios TODO para revisión manual
      const consoleLogRegex = /console\.log\s*\([^)]*\)\s*;?/g;
      const matches = content.match(consoleLogRegex);
      
      if (matches && matches.length > 0) {
        // Para archivos de servicios core, usar console.error para errores importantes
        if (filePath.includes('core/services') || filePath.includes('interceptors')) {
          newContent = newContent.replace(
            /console\.log\s*\(\s*['"`]([^'"`]*error[^'"`]*|[^'"`]*Error[^'"`]*|[^'"`]*failed[^'"`]*|[^'"`]*Failed[^'"`]*)['"`]\s*,?\s*([^)]*)\s*\)\s*;?/gi,
            '// TODO: Implement proper logging - console.error(\'$1\', $2);'
          );
          
          newContent = newContent.replace(
            /console\.log\s*\(\s*['"`]([^'"`]*)['"`]\s*,?\s*([^)]*)\s*\)\s*;?/g,
            '// TODO: Implement proper logging - console.debug(\'$1\', $2);'
          );
        } else {
          // Para componentes, comentar y sugerir logging apropiado
          newContent = newContent.replace(
            /console\.log\s*\([^)]*\)\s*;?/g,
            '// TODO: Replace with proper logging or remove if not needed'
          );
        }
        
        hasChanges = true;
      }
      
      // Solo escribir si hay cambios
      if (hasChanges && newContent !== originalContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        this.fixedFiles.push({
          file: filePath,
          matches: matches.length
        });
      }
      
    } catch (error) {
      this.errors.push(`Error procesando ${filePath}: ${error.message}`);
    }
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
      console.log('✅ No se encontraron console.log para corregir.');
      return;
    }
    
    if (this.fixedFiles.length > 0) {
      console.log(`✅ Archivos corregidos (${this.fixedFiles.length}):`);
      this.fixedFiles.forEach(({ file, matches }) => {
        const relativePath = path.relative(this.srcPath, file);
        console.log(`   ${relativePath} (${matches} console.log reemplazados)`);
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
    console.log('   2. Implementar LoggingService si es necesario');
    console.log('   3. Reemplazar TODOs con logging apropiado');
    console.log('   4. Ejecutar tests para verificar funcionalidad');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const fixer = new ConsoleLogFixer();
  fixer.fix();
}

module.exports = ConsoleLogFixer;
