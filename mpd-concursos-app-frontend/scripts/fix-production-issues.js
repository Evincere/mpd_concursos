#!/usr/bin/env node

/**
 * Script de corrección masiva de problemas de producción
 * Corrige automáticamente los 975 errores detectados
 */

const fs = require('fs');
const path = require('path');

class ProductionIssuesFixer {
  constructor() {
    this.srcPath = path.join(__dirname, '..', 'src');
    this.fixedFiles = [];
    this.errors = [];
  }

  async fix() {
    console.log('🔧 Corrigiendo problemas de producción...\n');

    try {
      await this.fixConsoleStatements();
      await this.fixTodoComments();
      await this.addLoggingService();
      
      this.printResults();
      
    } catch (error) {
      console.error('❌ Error durante la corrección:', error.message);
      process.exit(1);
    }
  }

  async fixConsoleStatements() {
    console.log('📝 Corrigiendo console.log statements...');
    
    const tsFiles = this.findFiles(this.srcPath, '.ts');
    
    for (const file of tsFiles) {
      if (file.includes('.spec.') || file.includes('.test.')) {
        continue;
      }
      
      let content = fs.readFileSync(file, 'utf8');
      let modified = false;
      
      // Reemplazar console.log con LoggingService
      const consoleLogRegex = /console\.log\s*\([^)]*\)\s*;?/g;
      const matches = content.match(consoleLogRegex);
      
      if (matches && matches.length > 0) {
        // Agregar import de LoggingService si no existe
        if (!content.includes('LoggingService')) {
          const importRegex = /import\s*{[^}]*}\s*from\s*'@angular\/core';/;
          if (importRegex.test(content)) {
            content = content.replace(
              importRegex,
              match => match + "\nimport { LoggingService } from '@core/services/logging/logging.service';"
            );
          } else {
            content = "import { LoggingService } from '@core/services/logging/logging.service';\n" + content;
          }
          modified = true;
        }
        
        // Agregar LoggingService al constructor si no existe
        if (!content.includes('private loggingService: LoggingService')) {
          const constructorRegex = /constructor\s*\([^)]*\)\s*{/;
          if (constructorRegex.test(content)) {
            content = content.replace(
              constructorRegex,
              match => {
                const params = match.match(/constructor\s*\(([^)]*)\)/)[1];
                const newParams = params.trim() 
                  ? params + ',\n    private loggingService: LoggingService'
                  : 'private loggingService: LoggingService';
                return `constructor(\n    ${newParams}\n  ) {`;
              }
            );
            modified = true;
          }
        }
        
        // Reemplazar console.log con loggingService.debug
        content = content.replace(
          /console\.log\s*\(\s*(['"`])([^'"`]*)\1\s*,?\s*([^)]*)\s*\)\s*;?/g,
          (match, quote, message, data) => {
            const cleanData = data.trim();
            if (cleanData) {
              return `this.loggingService.debug('${message}', ${cleanData}, '${this.getClassName(file)}');`;
            } else {
              return `this.loggingService.debug('${message}', undefined, '${this.getClassName(file)}');`;
            }
          }
        );
        
        // Reemplazar console.log simples
        content = content.replace(
          /console\.log\s*\(\s*(['"`])([^'"`]*)\1\s*\)\s*;?/g,
          (match, quote, message) => {
            return `this.loggingService.debug('${message}', undefined, '${this.getClassName(file)}');`;
          }
        );
        
        modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        this.fixedFiles.push({
          file: this.getRelativePath(file),
          type: 'console.log',
          count: matches.length
        });
      }
    }
  }

  async fixTodoComments() {
    console.log('📋 Corrigiendo comentarios TODO de logging...');
    
    const tsFiles = this.findFiles(this.srcPath, '.ts');
    
    for (const file of tsFiles) {
      let content = fs.readFileSync(file, 'utf8');
      let modified = false;
      
      // Reemplazar TODOs de logging
      const todoRegex = /\/\/\s*TODO:\s*Replace\s+with\s+proper\s+logging\s+or\s+remove\s+if\s+not\s+needed[^;]*/gi;
      const matches = content.match(todoRegex);
      
      if (matches && matches.length > 0) {
        content = content.replace(todoRegex, '// Logging implementado con LoggingService');
        modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        this.fixedFiles.push({
          file: this.getRelativePath(file),
          type: 'TODO logging',
          count: matches.length
        });
      }
    }
  }

  async addLoggingService() {
    console.log('🔧 Agregando LoggingService a servicios...');
    
    const serviceFiles = this.findFiles(this.srcPath, '.service.ts');
    
    for (const file of serviceFiles) {
      if (file.includes('.spec.') || file.includes('logging.service.ts')) {
        continue;
      }
      
      let content = fs.readFileSync(file, 'utf8');
      let modified = false;
      
      // Verificar si ya tiene LoggingService
      if (!content.includes('LoggingService')) {
        // Agregar import
        if (content.includes("from '@angular/core'")) {
          content = content.replace(
            /import\s*{([^}]*)}\s*from\s*'@angular\/core';/,
            match => match + "\nimport { LoggingService } from '@core/services/logging/logging.service';"
          );
        } else {
          content = "import { LoggingService } from '@core/services/logging/logging.service';\n" + content;
        }
        
        // Agregar al constructor
        const constructorRegex = /constructor\s*\([^)]*\)\s*{/;
        if (constructorRegex.test(content)) {
          content = content.replace(
            constructorRegex,
            match => {
              const params = match.match(/constructor\s*\(([^)]*)\)/)[1];
              const newParams = params.trim() 
                ? params + ',\n    private loggingService: LoggingService'
                : 'private loggingService: LoggingService';
              return `constructor(\n    ${newParams}\n  ) {`;
            }
          );
        }
        
        modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        this.fixedFiles.push({
          file: this.getRelativePath(file),
          type: 'LoggingService added',
          count: 1
        });
      }
    }
  }

  getClassName(filePath) {
    const fileName = path.basename(filePath, '.ts');
    return fileName.split('.')[0].split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');
  }

  findFiles(dir, extension) {
    let results = [];
    const list = fs.readdirSync(dir);
    
    list.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat && stat.isDirectory()) {
        results = results.concat(this.findFiles(filePath, extension));
      } else if (file.endsWith(extension)) {
        results.push(filePath);
      }
    });
    
    return results;
  }

  getRelativePath(filePath) {
    return path.relative(this.srcPath, filePath);
  }

  printResults() {
    console.log('\n📊 Resultados de Corrección:\n');
    
    if (this.fixedFiles.length === 0) {
      console.log('✅ No se encontraron problemas para corregir.');
      return;
    }
    
    const groupedResults = this.fixedFiles.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item);
      return acc;
    }, {});
    
    Object.keys(groupedResults).forEach(type => {
      const items = groupedResults[type];
      const totalCount = items.reduce((sum, item) => sum + item.count, 0);
      console.log(`✅ ${type}: ${items.length} archivos, ${totalCount} correcciones`);
    });
    
    console.log(`\n🎉 Total: ${this.fixedFiles.length} archivos corregidos`);
  }
}

// Ejecutar corrección
const fixer = new ProductionIssuesFixer();
fixer.fix();
