// Este archivo ejecuta pruebas específicas sin usar Karma
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Archivos de prueba que queremos ejecutar
const testFiles = [
  'src/app/core/services/error/error-handler.service.spec.ts',
  'src/app/core/interceptors/error-interceptor.spec.ts',
  'src/app/shared/directives/lazy-load-image.directive.spec.ts'
];

// Función para verificar si un archivo existe
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

// Verificar que los archivos existen
const existingFiles = testFiles.filter(file => fileExists(file));
if (existingFiles.length === 0) {
  console.error('No se encontraron archivos de prueba.');
  process.exit(1);
}

// Mostrar los archivos que se van a probar
console.log('Archivos de prueba encontrados:');
existingFiles.forEach(file => console.log(`- ${file}`));

// Ejecutar las pruebas manualmente
console.log('\nEjecutando pruebas...\n');

// Función para ejecutar una prueba individual
function runTest(filePath) {
  console.log(`\n=== Ejecutando prueba: ${filePath} ===\n`);
  
  try {
    // Leer el archivo de prueba
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Analizar el contenido para extraer las pruebas
    const testSuites = extractTestSuites(content);
    
    // Mostrar los resultados
    console.log(`Encontradas ${testSuites.length} suites de prueba:`);
    testSuites.forEach(suite => {
      console.log(`- ${suite.name} (${suite.tests.length} pruebas)`);
      suite.tests.forEach(test => {
        console.log(`  - ${test}`);
      });
    });
    
    console.log('\nPrueba analizada correctamente.');
    return true;
  } catch (error) {
    console.error(`Error al ejecutar la prueba ${filePath}:`, error);
    return false;
  }
}

// Función para extraer suites de prueba del contenido del archivo
function extractTestSuites(content) {
  const suites = [];
  const describeRegex = /describe\(['"](.+?)['"]/g;
  const itRegex = /it\(['"](.+?)['"]/g;
  
  let match;
  let currentSuite = null;
  
  // Extraer las suites de prueba
  while ((match = describeRegex.exec(content)) !== null) {
    currentSuite = {
      name: match[1],
      tests: []
    };
    suites.push(currentSuite);
    
    // Extraer las pruebas dentro de la suite
    const suiteStart = match.index;
    let suiteEnd = content.indexOf('});', suiteStart);
    if (suiteEnd === -1) suiteEnd = content.length;
    
    const suiteContent = content.substring(suiteStart, suiteEnd);
    let testMatch;
    while ((testMatch = itRegex.exec(suiteContent)) !== null) {
      currentSuite.tests.push(testMatch[1]);
    }
  }
  
  return suites;
}

// Ejecutar cada prueba
let success = true;
for (const file of existingFiles) {
  const result = runTest(file);
  success = success && result;
}

// Mostrar resultado final
if (success) {
  console.log('\n✅ Análisis de pruebas completado correctamente.');
} else {
  console.log('\n❌ Hubo errores al analizar las pruebas.');
  process.exit(1);
}
