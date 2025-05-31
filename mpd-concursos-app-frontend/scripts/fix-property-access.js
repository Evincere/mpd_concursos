/**
 * Script para corregir accesos a propiedades
 */
const fs = require('fs');
const path = require('path');

// Lista de propiedades problemáticas que deben accederse con notación de corchetes
const problematicProperties = [
  'authorities',
  'queueId',
  'progress',
  'status',
  'documentId',
  'errorMessage',
  'data',
  'pagination',
  'totalItems',
  'currentPage',
  'pageSize',
  'totalPages',
  'hasPreviousPage',
  'hasNextPage'
];

// Función para buscar archivos recursivamente
function findFiles(dir, pattern) {
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

// Función para corregir accesos a propiedades
function fixPropertyAccess(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let newContent = content;

    // Importar utilidades si es necesario
    let needsImport = false;
    for (const prop of problematicProperties) {
      const regex = new RegExp(`\\.(${prop})\\b`, 'g');
      if (regex.test(content)) {
        needsImport = true;
        break;
      }
    }

    if (needsImport && !content.includes("import { safeGet }")) {
      // Buscar la última importación
      const lastImportIndex = content.lastIndexOf('import ');
      if (lastImportIndex !== -1) {
        const lastImportEndIndex = content.indexOf(';', lastImportIndex) + 1;
        newContent = content.substring(0, lastImportEndIndex) + 
                  "\nimport { safeGet, isArray, safeArrayMethod, safeLength } from '@shared/utils/safe-access.utils';" + 
                  content.substring(lastImportEndIndex);
        modified = true;
      }
    }

    // Reemplazar accesos directos a propiedades problemáticas
    for (const prop of problematicProperties) {
      const regex = new RegExp(`(\\w+)\\.(${prop})\\b(?!\\s*=)`, 'g');
      newContent = newContent.replace(regex, (match, obj, property) => {
        modified = true;
        return `safeGet(${obj}, '${property}')`;
      });
    }

    // Reemplazar accesos a length en posibles arrays
    const lengthRegex = /(\w+)\.length/g;
    newContent = newContent.replace(lengthRegex, (match, obj) => {
      // Evitar reemplazar en casos obvios como string.length
      if (['string', 'str', 'text', 'name', 'title', 'description', 'message', 'error', 'label'].includes(obj)) {
        return match;
      }
      modified = true;
      return `safeLength(${obj})`;
    });

    // Reemplazar llamadas a métodos de array sin verificación
    const arrayMethodRegex = /(\w+)\.(some|map|filter|forEach|find|findIndex|reduce|every|includes)\(/g;
    newContent = newContent.replace(arrayMethodRegex, (match, obj, method) => {
      // Evitar reemplazar en casos obvios
      if (['string', 'str', 'text'].includes(obj)) {
        return match;
      }
      modified = true;
      return `safeArrayMethod(${obj}, '${method}', [`;
    });

    // Cerrar los paréntesis de safeArrayMethod
    if (newContent.includes('safeArrayMethod(')) {
      newContent = newContent.replace(/safeArrayMethod\(([^,]+), '([^']+)', \[(.*?)\]\)/g, (match, obj, method, args) => {
        if (args.trim()) {
          return `safeArrayMethod(${obj}, '${method}', [${args}])`;
        } else {
          return `safeArrayMethod(${obj}, '${method}')`;
        }
      });

      // Corregir casos donde no se cerró correctamente
      const unclosedRegex = /safeArrayMethod\(([^,]+), '([^']+)', \[(.*?)\]\s*=>/g;
      newContent = newContent.replace(unclosedRegex, (match, obj, method, args) => {
        return `safeArrayMethod(${obj}, '${method}', [(${args}) =>`;
      });
    }
    
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Corregidos accesos a propiedades en ${filePath}`);
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
  console.log('Iniciando corrección de accesos a propiedades...');
  
  // Buscar archivos TypeScript
  const tsFiles = findFiles('src', /\.ts$/);
  console.log(`Se encontraron ${tsFiles.length} archivos TypeScript para procesar.`);
  
  // Aplicar correcciones
  let fixedFiles = 0;
  
  for (const file of tsFiles) {
    if (fixPropertyAccess(file)) {
      fixedFiles++;
    }
  }
  
  console.log(`\nProceso completado. Se corrigieron accesos a propiedades en ${fixedFiles} archivos.`);
}

// Ejecutar la función principal
main();
