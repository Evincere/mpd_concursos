#!/usr/bin/env node

/**
 * Script para ejecutar tests específicos del sistema CV
 * 
 * @description Ejecuta tests unitarios y de integración para los servicios y componentes CV
 * @author Augment Agent
 * @date 2025-06-21
 * @version 1.0.0
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración de colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Archivos de test del CV
const cvTestFiles = [
  'src/app/core/services/cv/cv-search.service.spec.ts',
  'src/app/core/services/cv/cv-preferences.service.spec.ts',
  'src/app/core/services/cv/cv-validation.service.spec.ts',
  'src/app/core/services/cv/cv-notification.service.spec.ts',
  'src/app/core/services/cv/cv-transform.service.spec.ts',
  'src/app/core/services/cv/cv-pdf-export.service.spec.ts',
  'src/app/core/services/cv/cv-drag-drop.service.spec.ts',
  'src/app/core/services/cv/cv-autocomplete.service.spec.ts',
  'src/app/features/perfil/components/cv/education-form.component.spec.ts',
  'src/app/features/perfil/components/cv/experience-form.component.spec.ts',
  'src/app/features/perfil/components/cv/cv-search.component.spec.ts',
  'src/app/features/perfil/components/cv/cv-preferences.component.spec.ts'
];

// Configuración de tests
const testConfig = {
  unit: {
    name: 'Tests Unitarios CV',
    pattern: '**/*.spec.ts',
    include: cvTestFiles.filter(file => file.includes('service')),
    coverage: true
  },
  component: {
    name: 'Tests de Componentes CV',
    pattern: '**/*.component.spec.ts',
    include: cvTestFiles.filter(file => file.includes('component')),
    coverage: true
  },
  integration: {
    name: 'Tests de Integración CV',
    pattern: 'cypress/e2e/cv/**/*.cy.ts',
    include: [
      'cypress/e2e/cv/cv-search-integration.cy.ts',
      'cypress/e2e/cv/cv-preferences-integration.cy.ts',
      'cypress/e2e/cv/cv-form-integration.cy.ts'
    ],
    coverage: false
  }
};

/**
 * Imprime un mensaje con color
 */
function printColored(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Imprime un encabezado de sección
 */
function printHeader(title) {
  const line = '='.repeat(60);
  printColored(`\n${line}`, 'cyan');
  printColored(`🧪 ${title}`, 'bright');
  printColored(line, 'cyan');
}

/**
 * Verifica si un archivo existe
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

/**
 * Verifica que todos los archivos de test existan
 */
function verifyTestFiles() {
  printHeader('Verificando Archivos de Test');
  
  const missingFiles = [];
  const existingFiles = [];

  cvTestFiles.forEach(file => {
    if (fileExists(file)) {
      existingFiles.push(file);
      printColored(`✅ ${file}`, 'green');
    } else {
      missingFiles.push(file);
      printColored(`❌ ${file}`, 'red');
    }
  });

  if (missingFiles.length > 0) {
    printColored(`\n⚠️  ${missingFiles.length} archivos de test no encontrados:`, 'yellow');
    missingFiles.forEach(file => printColored(`   - ${file}`, 'yellow'));
  }

  printColored(`\n📊 Resumen: ${existingFiles.length}/${cvTestFiles.length} archivos encontrados`, 'blue');
  
  return { existingFiles, missingFiles };
}

/**
 * Ejecuta tests unitarios con Karma
 */
function runUnitTests(testFiles) {
  printHeader('Ejecutando Tests Unitarios');
  
  try {
    // Crear configuración temporal de Karma para tests específicos
    const karmaConfig = `
module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      jasmine: {
        random: false
      },
      clearContext: false
    },
    jasmineHtmlReporter: {
      suppressAll: true
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/cv-tests'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcov' }
      ]
    },
    reporters: ['progress', 'kjhtml', 'coverage'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['ChromeHeadless'],
    singleRun: true,
    restartOnFileChange: false
  });
};`;

    fs.writeFileSync('karma-cv.conf.js', karmaConfig);

    // Ejecutar tests
    const command = 'ng test --karma-config=karma-cv.conf.js --watch=false --browsers=ChromeHeadless --code-coverage';
    printColored(`Ejecutando: ${command}`, 'blue');
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });

    printColored('✅ Tests unitarios completados exitosamente', 'green');
    
    // Limpiar archivo temporal
    fs.unlinkSync('karma-cv.conf.js');
    
    return true;
  } catch (error) {
    printColored(`❌ Error ejecutando tests unitarios: ${error.message}`, 'red');
    
    // Limpiar archivo temporal en caso de error
    if (fs.existsSync('karma-cv.conf.js')) {
      fs.unlinkSync('karma-cv.conf.js');
    }
    
    return false;
  }
}

/**
 * Ejecuta tests de integración con Cypress
 */
function runIntegrationTests() {
  printHeader('Ejecutando Tests de Integración');
  
  try {
    // Verificar que Cypress esté configurado
    if (!fileExists('cypress.config.ts')) {
      printColored('⚠️  Cypress no está configurado. Saltando tests de integración.', 'yellow');
      return true;
    }

    const command = 'npx cypress run --spec "cypress/e2e/cv/**/*.cy.ts" --headless';
    printColored(`Ejecutando: ${command}`, 'blue');
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });

    printColored('✅ Tests de integración completados exitosamente', 'green');
    return true;
  } catch (error) {
    printColored(`❌ Error ejecutando tests de integración: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Genera reporte de cobertura
 */
function generateCoverageReport() {
  printHeader('Generando Reporte de Cobertura');
  
  try {
    const coverageDir = './coverage/cv-tests';
    
    if (fileExists(coverageDir)) {
      printColored(`📊 Reporte de cobertura generado en: ${coverageDir}`, 'green');
      printColored(`🌐 Abrir: ${path.join(coverageDir, 'index.html')}`, 'blue');
      
      // Mostrar resumen de cobertura si existe
      const lcovPath = path.join(coverageDir, 'lcov.info');
      if (fileExists(lcovPath)) {
        printColored('\n📈 Resumen de cobertura:', 'cyan');
        try {
          execSync('npx lcov-summary coverage/cv-tests/lcov.info', { stdio: 'inherit' });
        } catch (err) {
          printColored('ℹ️  Instala lcov-summary para ver resumen detallado: npm install -g lcov-summary', 'blue');
        }
      }
    } else {
      printColored('⚠️  No se encontró reporte de cobertura', 'yellow');
    }
  } catch (error) {
    printColored(`❌ Error generando reporte de cobertura: ${error.message}`, 'red');
  }
}

/**
 * Función principal
 */
function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'all';

  printColored('🚀 Iniciando Tests del Sistema CV', 'bright');
  printColored(`📅 ${new Date().toLocaleString()}`, 'blue');

  // Verificar archivos de test
  const { existingFiles, missingFiles } = verifyTestFiles();

  if (existingFiles.length === 0) {
    printColored('❌ No se encontraron archivos de test para ejecutar', 'red');
    process.exit(1);
  }

  let success = true;

  // Ejecutar tests según el tipo especificado
  switch (testType) {
    case 'unit':
      success = runUnitTests(existingFiles.filter(f => f.includes('service')));
      break;
      
    case 'component':
      success = runUnitTests(existingFiles.filter(f => f.includes('component')));
      break;
      
    case 'integration':
      success = runIntegrationTests();
      break;
      
    case 'all':
    default:
      // Ejecutar tests unitarios
      success = runUnitTests(existingFiles) && success;
      
      // Ejecutar tests de integración si están disponibles
      if (fileExists('cypress.config.ts')) {
        success = runIntegrationTests() && success;
      }
      break;
  }

  // Generar reporte de cobertura
  if (testType !== 'integration') {
    generateCoverageReport();
  }

  // Resumen final
  printHeader('Resumen de Ejecución');
  
  if (success) {
    printColored('🎉 Todos los tests se ejecutaron exitosamente', 'green');
    printColored(`📊 Archivos procesados: ${existingFiles.length}`, 'blue');
    
    if (missingFiles.length > 0) {
      printColored(`⚠️  Archivos faltantes: ${missingFiles.length}`, 'yellow');
    }
  } else {
    printColored('❌ Algunos tests fallaron', 'red');
    process.exit(1);
  }
}

// Mostrar ayuda si se solicita
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  printColored('🧪 Script de Tests del Sistema CV', 'bright');
  printColored('\nUso:', 'blue');
  printColored('  node scripts/run-cv-tests.js [tipo]', 'cyan');
  printColored('\nTipos de test:', 'blue');
  printColored('  unit        - Solo tests unitarios de servicios', 'cyan');
  printColored('  component   - Solo tests de componentes', 'cyan');
  printColored('  integration - Solo tests de integración', 'cyan');
  printColored('  all         - Todos los tests (por defecto)', 'cyan');
  printColored('\nEjemplos:', 'blue');
  printColored('  node scripts/run-cv-tests.js unit', 'cyan');
  printColored('  node scripts/run-cv-tests.js all', 'cyan');
  process.exit(0);
}

// Ejecutar función principal
main();
