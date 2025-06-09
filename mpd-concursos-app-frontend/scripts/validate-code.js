#!/usr/bin/env node

/**
 * Script de Validación de Código
 * Valida estándares de codificación y detecta problemas comunes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CodeValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.srcPath = path.join(__dirname, '..', 'src');
  }

  /**
   * Ejecuta todas las validaciones
   */
  async validate() {
    console.log('🔍 Iniciando validación de código...\n');

    try {
      await this.validateTypeScript();
      await this.validateTemplates();
      await this.validateStyles();
      await this.validateArchitecture();
      await this.validateTests();
      
      this.printResults();
      
      if (this.errors.length > 0) {
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error durante la validación:', error.message);
      process.exit(1);
    }
  }

  /**
   * Valida archivos TypeScript
   */
  async validateTypeScript() {
    console.log('📝 Validando TypeScript...');
    
    const tsFiles = this.findFiles(this.srcPath, '.ts');
    
    for (const file of tsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Verificar uso de 'any'
      if (content.includes(': any') || content.includes('as any')) {
        this.warnings.push(`${file}: Uso de 'any' detectado. Considerar tipos específicos.`);
      }
      
      // Verificar console.log en archivos no de test
      if (!file.includes('.spec.') && content.includes('console.log')) {
        this.errors.push(`${file}: console.log encontrado en código de producción.`);
      }
      
      // Verificar imports relativos largos
      const longImports = content.match(/import.*from\s+['"](\.\.[\/\\]){4,}/g);
      if (longImports) {
        this.warnings.push(`${file}: Imports relativos muy largos. Considerar path mapping.`);
      }
      
      // Verificar métodos sin tipo de retorno
      const methodsWithoutReturn = content.match(/^\s*(public|private|protected)?\s*\w+\s*\([^)]*\)\s*{/gm);
      if (methodsWithoutReturn) {
        this.warnings.push(`${file}: Métodos sin tipo de retorno explícito detectados.`);
      }
    }
  }

  /**
   * Valida templates HTML
   */
  async validateTemplates() {
    console.log('🌐 Validando templates HTML...');
    
    const htmlFiles = this.findFiles(this.srcPath, '.html');
    
    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Verificar assignments en bindings
      const assignmentBindings = content.match(/\([^)]*\)="[^"]*=[^"]*"/g);
      if (assignmentBindings) {
        this.errors.push(`${file}: Assignments en bindings detectados: ${assignmentBindings.join(', ')}`);
      }
      
      // Verificar lógica compleja en templates
      const complexLogic = content.match(/\{\{[^}]*(\&\&|\|\|)[^}]*(\&\&|\|\|)[^}]*\}\}/g);
      if (complexLogic) {
        this.warnings.push(`${file}: Lógica compleja en template. Considerar métodos auxiliares.`);
      }
      
      // Verificar accesibilidad básica
      const imagesWithoutAlt = content.match(/<img(?![^>]*alt=)/g);
      if (imagesWithoutAlt) {
        this.warnings.push(`${file}: Imágenes sin atributo alt detectadas.`);
      }
      
      // Verificar botones sin type
      const buttonsWithoutType = content.match(/<button(?![^>]*type=)/g);
      if (buttonsWithoutType) {
        this.warnings.push(`${file}: Botones sin atributo type detectados.`);
      }
    }
  }

  /**
   * Valida archivos SCSS
   */
  async validateStyles() {
    console.log('🎨 Validando estilos SCSS...');
    
    const scssFiles = this.findFiles(this.srcPath, '.scss');
    
    for (const file of scssFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Verificar imports de variables
      if (content.includes('$') && !content.includes("@import") && !file.includes('variables')) {
        this.warnings.push(`${file}: Uso de variables sin import de variables.scss.`);
      }
      
      // Verificar valores hardcodeados
      const hardcodedColors = content.match(/#[0-9a-fA-F]{3,6}(?!\$)/g);
      if (hardcodedColors && hardcodedColors.length > 2) {
        this.warnings.push(`${file}: Colores hardcodeados detectados. Usar variables.`);
      }
      
      // Verificar !important
      if (content.includes('!important')) {
        this.warnings.push(`${file}: Uso de !important detectado. Revisar especificidad.`);
      }
    }
  }

  /**
   * Valida estructura de arquitectura
   */
  async validateArchitecture() {
    console.log('🏗️ Validando arquitectura...');
    
    // Verificar estructura de features
    const featuresPath = path.join(this.srcPath, 'app', 'features');
    if (fs.existsSync(featuresPath)) {
      const features = fs.readdirSync(featuresPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      for (const feature of features) {
        const featurePath = path.join(featuresPath, feature);
        const expectedDirs = ['components', 'services'];
        
        for (const dir of expectedDirs) {
          const dirPath = path.join(featurePath, dir);
          if (!fs.existsSync(dirPath)) {
            this.warnings.push(`Arquitectura: Feature '${feature}' no tiene directorio '${dir}'.`);
          }
        }
      }
    }
    
    // Verificar que core services no dependan de features
    const coreServicesPath = path.join(this.srcPath, 'app', 'core', 'services');
    if (fs.existsSync(coreServicesPath)) {
      const coreFiles = this.findFiles(coreServicesPath, '.ts');
      
      for (const file of coreFiles) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('from \'@features/') || content.includes('from \'../../../features/')) {
          this.errors.push(`Arquitectura: Core service ${file} depende de features.`);
        }
      }
    }
  }

  /**
   * Valida tests
   */
  async validateTests() {
    console.log('🧪 Validando tests...');
    
    const specFiles = this.findFiles(this.srcPath, '.spec.ts');
    const tsFiles = this.findFiles(this.srcPath, '.ts').filter(f => !f.includes('.spec.'));
    
    // Verificar cobertura básica de tests
    const componentsWithoutTests = [];
    const servicesWithoutTests = [];
    
    for (const file of tsFiles) {
      const specFile = file.replace('.ts', '.spec.ts');
      if (!fs.existsSync(specFile)) {
        if (file.includes('.component.ts')) {
          componentsWithoutTests.push(file);
        } else if (file.includes('.service.ts')) {
          servicesWithoutTests.push(file);
        }
      }
    }
    
    if (componentsWithoutTests.length > 0) {
      this.warnings.push(`Tests: ${componentsWithoutTests.length} componentes sin tests.`);
    }
    
    if (servicesWithoutTests.length > 0) {
      this.warnings.push(`Tests: ${servicesWithoutTests.length} servicios sin tests.`);
    }
    
    // Verificar estructura de tests
    for (const file of specFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      if (!content.includes('describe(')) {
        this.errors.push(`${file}: Test sin describe() principal.`);
      }
      
      if (!content.includes('beforeEach(')) {
        this.warnings.push(`${file}: Test sin beforeEach() para setup.`);
      }
    }
  }

  /**
   * Encuentra archivos por extensión
   */
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

  /**
   * Imprime resultados de validación
   */
  printResults() {
    console.log('\n📊 Resultados de Validación:\n');
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ ¡Excelente! No se encontraron problemas.');
      return;
    }
    
    if (this.errors.length > 0) {
      console.log(`❌ Errores (${this.errors.length}):`);
      this.errors.forEach(error => console.log(`   ${error}`));
      console.log();
    }
    
    if (this.warnings.length > 0) {
      console.log(`⚠️  Advertencias (${this.warnings.length}):`);
      this.warnings.forEach(warning => console.log(`   ${warning}`));
      console.log();
    }
    
    console.log(`📈 Resumen: ${this.errors.length} errores, ${this.warnings.length} advertencias`);
    
    if (this.errors.length > 0) {
      console.log('\n💡 Los errores deben corregirse antes de continuar.');
    }
    
    if (this.warnings.length > 0) {
      console.log('💡 Las advertencias son recomendaciones para mejorar la calidad del código.');
    }
  }
}

// Ejecutar validación si se llama directamente
if (require.main === module) {
  const validator = new CodeValidator();
  validator.validate();
}

module.exports = CodeValidator;
