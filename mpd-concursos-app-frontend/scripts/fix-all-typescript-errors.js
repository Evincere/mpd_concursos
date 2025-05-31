/**
 * Script principal para corregir todos los errores de TypeScript
 */
const { execSync } = require('child_process');
const path = require('path');

console.log('Iniciando corrección de todos los errores de TypeScript...');

// Ejecutar scripts de corrección
try {
  console.log('\n1. Corrigiendo importaciones con prefijo "_"...');
  execSync('node scripts/fix-import-prefixes.js', { stdio: 'inherit' });
  
  console.log('\n2. Corrigiendo accesos a propiedades...');
  execSync('node scripts/fix-property-access.js', { stdio: 'inherit' });
  
  console.log('\n3. Corrigiendo errores de inyección de dependencias...');
  execSync('node scripts/fix-dependency-injection.js', { stdio: 'inherit' });
  
  console.log('\n✅ Proceso completado. Se han aplicado todas las correcciones.');
  console.log('\nEjecuta "ng build" para verificar si se han resuelto todos los errores.');
} catch (error) {
  console.error('\n❌ Error al ejecutar los scripts de corrección:', error);
}
