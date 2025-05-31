/**
 * Script para corregir importaciones con prefijo '_'
 */
const fs = require('fs');
const path = require('path');

// Función para buscar archivos recursivamente
function findFiles(dir, pattern) {
  console.log(`Buscando archivos en: ${dir} con patrón: ${pattern}`);
  let results = [];

  try {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);

      try {
        const stat = fs.statSync(filePath);

        if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('dist')) {
          results = results.concat(findFiles(filePath, pattern));
        } else if (pattern.test(file)) {
          results.push(filePath);
        }
      } catch (error) {
        console.error(`Error al acceder a ${filePath}:`, error.message);
      }
    }
  } catch (error) {
    console.error(`Error al leer el directorio ${dir}:`, error.message);
  }

  return results;
}

// Función para corregir importaciones con prefijo '_'
function fixImportPrefixes(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Buscar importaciones con prefijo '_'
    const importRegex = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    let newContent = content;

    while ((match = importRegex.exec(content)) !== null) {
      const imports = match[1].split(',').map(i => i.trim());
      const source = match[2];
      let hasModifiedImports = false;
      
      // Verificar si hay importaciones con prefijo '_'
      const newImports = imports.map(importItem => {
        if (importItem.startsWith('_')) {
          hasModifiedImports = true;
          return importItem.substring(1); // Eliminar el prefijo '_'
        }
        return importItem;
      });
      
      if (hasModifiedImports) {
        const originalImport = match[0];
        const newImport = `import { ${newImports.join(', ')} } from '${source}'`;
        
        newContent = newContent.replace(originalImport, newImport);
        modified = true;
        
        console.log(`Corregida importación en ${filePath}:`);
        console.log(`  Original: ${originalImport}`);
        console.log(`  Nueva: ${newImport}`);
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Archivo modificado: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error al procesar ${filePath}:`, error);
    return false;
  }
}

// Función principal
function main() {
  console.log('Iniciando corrección de importaciones con prefijo "_"...');
  
  // Buscar archivos TypeScript
  const tsFiles = findFiles('src', /\.(ts|js)$/);
  console.log(`Se encontraron ${tsFiles.length} archivos para procesar.`);
  
  // Aplicar correcciones
  let fixedFiles = 0;
  
  for (const file of tsFiles) {
    if (fixImportPrefixes(file)) {
      fixedFiles++;
    }
  }
  
  console.log(`\nProceso completado. Se corrigieron importaciones en ${fixedFiles} archivos.`);
}

// Ejecutar la función principal
main();
