#!/usr/bin/env node

/**
 * Script de verificación de preparación para producción
 * Verifica que no haya problemas críticos que impidan el despliegue
 */

const fs = require('fs');
const path = require('path');

class ProductionReadinessChecker {
  constructor() {
    this.srcPath = path.join(__dirname, '..', 'src');
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }

  async check() {
    console.log('🔍 Verificando preparación para producción...\n');

    try {
      await this.checkConsoleStatements();
      await this.checkTodoComments();
      await this.checkHardcodedValues();
      await this.checkTypeAny();
      await this.checkEnvironmentConfig();
      await this.checkSecurityIssues();
      
      this.printResults();
      
      if (this.errors.length > 0) {
        console.log('\n❌ El proyecto NO está listo para producción.');
        process.exit(1);
      } else {
        console.log('\n✅ El proyecto está listo para producción.');
        process.exit(0);
      }
      
    } catch (error) {
      console.error('❌ Error durante la verificación:', error.message);
      process.exit(1);
    }
  }

  async checkConsoleStatements() {
    console.log('📝 Verificando declaraciones de consola...');
    
    const tsFiles = this.findFiles(this.srcPath, '.ts');
    
    for (const file of tsFiles) {
      if (file.includes('.spec.') || file.includes('.test.')) {
        continue;
      }
      
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (line.includes('console.log') && !line.includes('//')) {
          this.errors.push(`${this.getRelativePath(file)}:${index + 1} - console.log encontrado`);
        }
        if (line.includes('console.debug') && !line.includes('//')) {
          this.warnings.push(`${this.getRelativePath(file)}:${index + 1} - console.debug encontrado`);
        }
      });
    }
  }

  async checkTodoComments() {
    console.log('📋 Verificando comentarios TODO...');
    
    const allFiles = [
      ...this.findFiles(this.srcPath, '.ts'),
      ...this.findFiles(this.srcPath, '.html'),
      ...this.findFiles(this.srcPath, '.scss')
    ];
    
    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (line.includes('TODO: Replace with proper logging')) {
          this.errors.push(`${this.getRelativePath(file)}:${index + 1} - TODO de logging sin resolver`);
        }
        if (line.includes('TODO') && line.includes('FIXME')) {
          this.warnings.push(`${this.getRelativePath(file)}:${index + 1} - TODO/FIXME pendiente`);
        }
      });
    }
  }

  async checkHardcodedValues() {
    console.log('🔧 Verificando valores hardcodeados...');
    
    const tsFiles = this.findFiles(this.srcPath, '.ts');
    
    for (const file of tsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // Verificar URLs hardcodeadas
        if (line.includes('http://') || line.includes('https://')) {
          if (!line.includes('environment') && !line.includes('//')) {
            this.warnings.push(`${this.getRelativePath(file)}:${index + 1} - URL hardcodeada detectada`);
          }
        }
        
        // Verificar números mágicos (timeouts, delays, etc.)
        const magicNumbers = line.match(/\b(1000|3600|86400|5000|10000)\b/g);
        if (magicNumbers && !line.includes('//') && !line.includes('const')) {
          this.warnings.push(`${this.getRelativePath(file)}:${index + 1} - Posible número mágico: ${magicNumbers.join(', ')}`);
        }
      });
    }
  }

  async checkTypeAny() {
    console.log('🎯 Verificando uso de tipo "any"...');
    
    const tsFiles = this.findFiles(this.srcPath, '.ts');
    
    for (const file of tsFiles) {
      if (file.includes('.spec.') || file.includes('.test.')) {
        continue;
      }
      
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if ((line.includes(': any') || line.includes('as any')) && !line.includes('//')) {
          this.warnings.push(`${this.getRelativePath(file)}:${index + 1} - Uso de tipo "any" detectado`);
        }
      });
    }
  }

  async checkEnvironmentConfig() {
    console.log('🌍 Verificando configuración de entornos...');
    
    const envFiles = [
      path.join(this.srcPath, 'environments', 'environment.ts'),
      path.join(this.srcPath, 'environments', 'environment.prod.ts')
    ];
    
    for (const envFile of envFiles) {
      if (fs.existsSync(envFile)) {
        const content = fs.readFileSync(envFile, 'utf8');
        
        if (content.includes('localhost') && envFile.includes('prod')) {
          this.errors.push(`${this.getRelativePath(envFile)} - localhost en configuración de producción`);
        }
        
        if (content.includes('debug: true') && envFile.includes('prod')) {
          this.warnings.push(`${this.getRelativePath(envFile)} - debug habilitado en producción`);
        }
      }
    }
  }

  async checkSecurityIssues() {
    console.log('🔒 Verificando problemas de seguridad...');
    
    const allFiles = this.findFiles(this.srcPath, '.ts');
    
    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('password') && content.includes('=') && !content.includes('//')) {
        this.warnings.push(`${this.getRelativePath(file)} - Posible contraseña hardcodeada`);
      }
      
      if (content.includes('secret') && content.includes('=') && !content.includes('//')) {
        this.warnings.push(`${this.getRelativePath(file)} - Posible secreto hardcodeado`);
      }
    }
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
    console.log('\n📊 Resultados de Verificación:\n');
    
    if (this.errors.length > 0) {
      console.log(`❌ Errores Críticos (${this.errors.length}):`);
      this.errors.forEach(error => console.log(`   ${error}`));
      console.log();
    }
    
    if (this.warnings.length > 0) {
      console.log(`⚠️  Advertencias (${this.warnings.length}):`);
      this.warnings.forEach(warning => console.log(`   ${warning}`));
      console.log();
    }
    
    if (this.info.length > 0) {
      console.log(`ℹ️  Información (${this.info.length}):`);
      this.info.forEach(info => console.log(`   ${info}`));
      console.log();
    }
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ No se encontraron problemas de preparación para producción.');
    }
  }
}

// Ejecutar verificación
const checker = new ProductionReadinessChecker();
checker.check();
