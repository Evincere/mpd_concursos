const fs = require('fs');
const path = require('path');

console.log('🔧 Aplicando parche para colorette...');

// Buscar todas las instalaciones de colorette
const colorettePaths = [
  'node_modules/.pnpm/colorette@2.0.20/node_modules/colorette/index.cjs',
  'node_modules/.pnpm/colorette@2.0.20/node_modules/colorette/index.js',
  'node_modules/colorette/index.cjs',
  'node_modules/colorette/index.js'
];

const fixContent = fs.readFileSync('colorette-fix.js', 'utf8');

let patchedCount = 0;

colorettePaths.forEach(colorettePath => {
  if (fs.existsSync(colorettePath)) {
    try {
      console.log(`📝 Parcheando: ${colorettePath}`);
      fs.writeFileSync(colorettePath, fixContent);
      patchedCount++;
      console.log(`✅ Parcheado exitosamente: ${colorettePath}`);
    } catch (error) {
      console.log(`❌ Error parcheando ${colorettePath}:`, error.message);
    }
  }
});

if (patchedCount > 0) {
  console.log(`🎉 Colorette parcheado exitosamente en ${patchedCount} ubicaciones`);
  console.log('🚀 Ahora puedes ejecutar: npm run start');
} else {
  console.log('⚠️  No se encontraron archivos de colorette para parchear');
  console.log('🔍 Verificando estructura de node_modules...');
  
  // Buscar colorette en cualquier ubicación
  const findColorette = (dir, depth = 0) => {
    if (depth > 3) return; // Limitar profundidad
    
    try {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          if (item === 'colorette') {
            console.log(`📍 Encontrado colorette en: ${fullPath}`);
            const indexFiles = ['index.cjs', 'index.js'].map(f => path.join(fullPath, f));
            indexFiles.forEach(indexFile => {
              if (fs.existsSync(indexFile)) {
                console.log(`📝 Parcheando: ${indexFile}`);
                fs.writeFileSync(indexFile, fixContent);
                console.log(`✅ Parcheado: ${indexFile}`);
              }
            });
          } else if (item === 'node_modules' || item.startsWith('.pnpm')) {
            findColorette(fullPath, depth + 1);
          }
        }
      });
    } catch (error) {
      // Ignorar errores de permisos
    }
  };
  
  findColorette('node_modules');
}
