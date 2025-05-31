const fs = require('fs');
const path = require('path');

// Archivos de prueba que queremos verificar
const testFiles = [
  'src/app/shared/services/dialog/dialog.service.spec.ts',
  'src/app/shared/directives/lazy-load-image.directive.spec.ts',
  'src/app/core/services/error/error-handler.service.spec.ts',
  'src/app/core/interceptors/error-interceptor.spec.ts'
];

// Función para verificar si un archivo existe
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
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

// Función para analizar un archivo de prueba
function analyzeTestFile(filePath) {
  console.log(`\n=== Analizando archivo: ${filePath} ===\n`);
  
  try {
    // Verificar si el archivo existe
    if (!fileExists(filePath)) {
      console.error(`El archivo ${filePath} no existe.`);
      return false;
    }
    
    // Leer el contenido del archivo
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extraer las suites de prueba
    const testSuites = extractTestSuites(content);
    
    // Mostrar los resultados
    console.log(`Encontradas ${testSuites.length} suites de prueba:`);
    
    let totalTests = 0;
    testSuites.forEach(suite => {
      console.log(`- ${suite.name} (${suite.tests.length} pruebas)`);
      suite.tests.forEach(test => {
        console.log(`  - ${test}`);
      });
      totalTests += suite.tests.length;
    });
    
    console.log(`\nTotal de pruebas: ${totalTests}`);
    
    return true;
  } catch (error) {
    console.error(`Error al analizar el archivo ${filePath}:`, error);
    return false;
  }
}

// Verificar que los archivos existen
const existingFiles = testFiles.filter(file => fileExists(file));
if (existingFiles.length === 0) {
  console.error('No se encontraron archivos de prueba.');
  process.exit(1);
}

// Mostrar los archivos que se van a analizar
console.log('Archivos de prueba encontrados:');
existingFiles.forEach(file => console.log(`- ${file}`));

// Analizar cada archivo
let success = true;
for (const file of existingFiles) {
  const result = analyzeTestFile(file);
  success = success && result;
}

// Mostrar resultado final
if (success) {
  console.log('\n✅ Análisis de pruebas completado correctamente.');
} else {
  console.log('\n❌ Hubo errores al analizar las pruebas.');
  process.exit(1);
}
