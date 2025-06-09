#!/usr/bin/env node

/**
 * Pre-commit Hook
 * Ejecuta validaciones antes de cada commit
 */

const { execSync } = require('child_process');
const CodeValidator = require('./validate-code');

class PreCommitHook {
  constructor() {
    this.errors = [];
  }

  async run() {
    console.log('🚀 Ejecutando pre-commit hook...\n');

    try {
      // 1. Verificar que no hay archivos sin stagear
      await this.checkStagedFiles();
      
      // 2. Ejecutar linting
      await this.runLinting();
      
      // 3. Ejecutar validación de código personalizada
      await this.runCodeValidation();
      
      // 4. Ejecutar tests rápidos
      await this.runQuickTests();
      
      // 5. Verificar build
      await this.verifyBuild();
      
      if (this.errors.length > 0) {
        this.printErrors();
        process.exit(1);
      }
      
      console.log('✅ Pre-commit hook completado exitosamente!\n');
      
    } catch (error) {
      console.error('❌ Pre-commit hook falló:', error.message);
      process.exit(1);
    }
  }

  /**
   * Verifica archivos staged
   */
  async checkStagedFiles() {
    console.log('📁 Verificando archivos staged...');
    
    try {
      const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' });
      
      if (!stagedFiles.trim()) {
        this.errors.push('No hay archivos staged para commit.');
        return;
      }
      
      const files = stagedFiles.trim().split('\n');
      console.log(`   ${files.length} archivo(s) staged.`);
      
      // Verificar que no hay archivos grandes
      for (const file of files) {
        if (file.endsWith('.ts') || file.endsWith('.html') || file.endsWith('.scss')) {
          try {
            const stats = require('fs').statSync(file);
            if (stats.size > 50000) { // 50KB
              this.errors.push(`Archivo muy grande: ${file} (${Math.round(stats.size/1024)}KB)`);
            }
          } catch (e) {
            // Archivo eliminado, ignorar
          }
        }
      }
      
    } catch (error) {
      this.errors.push('Error verificando archivos staged: ' + error.message);
    }
  }

  /**
   * Ejecuta ESLint
   */
  async runLinting() {
    console.log('🔍 Ejecutando linting...');
    
    try {
      execSync('npm run lint', { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      console.log('   ✅ Linting pasó.');
    } catch (error) {
      this.errors.push('Linting falló. Ejecutar "npm run lint" para ver detalles.');
    }
  }

  /**
   * Ejecuta validación de código personalizada
   */
  async runCodeValidation() {
    console.log('🔧 Ejecutando validación de código...');
    
    try {
      const validator = new CodeValidator();
      await validator.validate();
      
      if (validator.errors.length > 0) {
        this.errors.push(`Validación de código falló con ${validator.errors.length} errores.`);
      }
      
      console.log('   ✅ Validación de código pasó.');
    } catch (error) {
      this.errors.push('Validación de código falló: ' + error.message);
    }
  }

  /**
   * Ejecuta tests rápidos (solo unitarios)
   */
  async runQuickTests() {
    console.log('🧪 Ejecutando tests rápidos...');
    
    try {
      // Solo ejecutar tests de archivos modificados
      const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' });
      const tsFiles = stagedFiles.split('\n').filter(f => f.endsWith('.ts') && !f.endsWith('.spec.ts'));
      
      if (tsFiles.length === 0) {
        console.log('   ⏭️  No hay archivos TypeScript modificados, saltando tests.');
        return;
      }
      
      // Ejecutar tests relacionados
      execSync('npm run test:quick', { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      console.log('   ✅ Tests rápidos pasaron.');
    } catch (error) {
      this.errors.push('Tests rápidos fallaron. Ejecutar "npm run test" para ver detalles.');
    }
  }

  /**
   * Verifica que el build funciona
   */
  async verifyBuild() {
    console.log('🏗️  Verificando build...');
    
    try {
      execSync('npm run build:check', { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      console.log('   ✅ Build verificado.');
    } catch (error) {
      this.errors.push('Build falló. Ejecutar "npm run build" para ver detalles.');
    }
  }

  /**
   * Imprime errores encontrados
   */
  printErrors() {
    console.log('\n❌ Pre-commit hook falló con los siguientes errores:\n');
    
    this.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
    
    console.log('\n💡 Corrige estos errores antes de hacer commit.\n');
    console.log('📚 Consulta CODING_STANDARDS.md para más información.\n');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const hook = new PreCommitHook();
  hook.run();
}

module.exports = PreCommitHook;
