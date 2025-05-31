/**
 * Script para corregir errores de TypeScript en el proyecto
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
          console.log(`Archivo encontrado: ${filePath}`);
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

// Función para corregir errores de acceso a propiedades de objetos indexados
function fixObjectPropertyAccess(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Importar utilidades si es necesario
    if (content.includes('.authorities') || 
        content.includes('.queueId') || 
        content.includes('.progress') || 
        content.includes('.status') || 
        content.includes('.documentId') || 
        content.includes('.errorMessage')) {
      
      // Verificar si ya se importan las utilidades
      if (!content.includes("import { getProperty") && !content.includes("from '@shared/utils/object-access.utils'")) {
        // Buscar la última importación
        const lastImportIndex = content.lastIndexOf('import ');
        if (lastImportIndex !== -1) {
          const lastImportEndIndex = content.indexOf(';', lastImportIndex) + 1;
          content = content.substring(0, lastImportEndIndex) + 
                    "\nimport { getProperty, hasProperty } from '@shared/utils/object-access.utils';" + 
                    content.substring(lastImportEndIndex);
          modified = true;
        }
      }
      
      // Reemplazar accesos directos a propiedades
      const propertyAccessRegex = /(\w+)\.(\w+)/g;
      let match;
      let newContent = content;
      
      while ((match = propertyAccessRegex.exec(content)) !== null) {
        const obj = match[1];
        const prop = match[2];
        
        // Verificar si es un acceso a una propiedad que podría causar errores
        if (['authorities', 'queueId', 'progress', 'status', 'documentId', 'errorMessage'].includes(prop)) {
          // Verificar que no sea parte de una importación o declaración
          const prevChar = content.charAt(match.index - 1);
          if (prevChar !== ' ' && prevChar !== '{' && prevChar !== ',') {
            const originalAccess = match[0];
            const newAccess = `getProperty(${obj}, '${prop}')`;
            
            // Reemplazar solo esta ocurrencia
            newContent = newContent.substring(0, match.index) + 
                         newAccess + 
                         newContent.substring(match.index + originalAccess.length);
            
            modified = true;
          }
        }
      }
      
      if (modified) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ Corregidos accesos a propiedades en ${filePath}`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Error al procesar ${filePath}:`, error);
    return false;
  }
}

// Función para corregir errores de tipos incompatibles
function fixIncompatibleTypes(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Importar utilidades si es necesario
    if (content.includes('.some(') || 
        content.includes('.length') || 
        content.includes('.map(')) {
      
      // Verificar si ya se importan las utilidades
      if (!content.includes("import { isArray") && !content.includes("from '@shared/utils/type-guards.utils'")) {
        // Buscar la última importación
        const lastImportIndex = content.lastIndexOf('import ');
        if (lastImportIndex !== -1) {
          const lastImportEndIndex = content.indexOf(';', lastImportIndex) + 1;
          content = content.substring(0, lastImportEndIndex) + 
                    "\nimport { isArray, isObject } from '@shared/utils/type-guards.utils';" + 
                    content.substring(lastImportEndIndex);
          modified = true;
        }
      }
      
      // Reemplazar llamadas a métodos de array sin verificación
      const arrayMethodRegex = /(\w+)\.some\(/g;
      content = content.replace(arrayMethodRegex, (match, obj) => {
        return `isArray(${obj}) ? ${obj}.some(`;
      });
      
      const arrayLengthRegex = /(\w+)\.length/g;
      content = content.replace(arrayLengthRegex, (match, obj) => {
        return `(isArray(${obj}) ? ${obj}.length : 0)`;
      });
      
      const arrayMapRegex = /(\w+)\.map\(/g;
      content = content.replace(arrayMapRegex, (match, obj) => {
        return `(isArray(${obj}) ? ${obj}.map(`;
      });
      
      // Cerrar paréntesis para map
      content = content.replace(/\)\s*=>\s*{([^}]*)}\)/g, ') => {$1}) : [])');
      
      modified = true;
      
      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Corregidos tipos incompatibles en ${filePath}`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Error al procesar ${filePath}:`, error);
    return false;
  }
}

// Función para corregir errores de importación
function fixImportErrors(filePath) {
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
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Corregidas importaciones en ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error al procesar ${filePath}:`, error);
    return false;
  }
}

// Función para corregir errores de conversión de tipos
function fixTypeConversionErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Importar utilidades si es necesario
    if (content.includes('updatedAt') || 
        content.includes('createdAt') || 
        content.includes('Date')) {
      
      // Verificar si ya se importan las utilidades
      if (!content.includes("import { dateToISOString") && !content.includes("from '@shared/utils/type-conversion.utils'")) {
        // Buscar la última importación
        const lastImportIndex = content.lastIndexOf('import ');
        if (lastImportIndex !== -1) {
          const lastImportEndIndex = content.indexOf(';', lastImportIndex) + 1;
          content = content.substring(0, lastImportEndIndex) + 
                    "\nimport { dateToISOString, stringToDate } from '@shared/utils/type-conversion.utils';" + 
                    content.substring(lastImportEndIndex);
          modified = true;
        }
      }
      
      // Reemplazar conversiones de fecha
      const dateConversionRegex = /new Date\((\w+\.updatedAt|\w+\.createdAt)\)/g;
      content = content.replace(dateConversionRegex, (match, dateProp) => {
        return `stringToDate(${dateProp})`;
      });
      
      // Reemplazar accesos a propiedades de fecha
      const datePropertyRegex = /(\w+\.updatedAt|\w+\.createdAt)\.toISOString\(\)/g;
      content = content.replace(datePropertyRegex, (match, dateProp) => {
        return `dateToISOString(${dateProp})`;
      });
      
      modified = true;
      
      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Corregidas conversiones de tipos en ${filePath}`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Error al procesar ${filePath}:`, error);
    return false;
  }
}

// Función para corregir errores de inyección de dependencias
function fixDependencyInjectionErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar si es una clase sin decorador
    const classRegex = /export\s+class\s+(\w+)(?!\s+extends|\s+implements)(?!\s*{[^{]*@Injectable)/;
    const match = classRegex.exec(content);
    
    if (match && !content.includes('@Injectable') && !content.includes('@Component') && 
        !content.includes('@Directive') && !content.includes('@Pipe') && 
        !content.includes('@NgModule') && !content.includes('@Injectable')) {
      
      // Es una clase sin decorador que podría necesitar @Injectable
      const className = match[1];
      
      // Verificar si tiene constructor con inyección de dependencias
      const constructorRegex = new RegExp(`constructor\\s*\\(([^)]*(private|public|protected)[^)]*?)\\)`, 'g');
      const constructorMatch = constructorRegex.exec(content);
      
      if (constructorMatch) {
        // Tiene constructor con inyección, agregar @Injectable
        
        // Importar Injectable si no está importado
        if (!content.includes('@angular/core')) {
          // Agregar importación
          content = `import { Injectable } from '@angular/core';\n${content}`;
        } else if (!content.includes('Injectable')) {
          // Agregar Injectable a la importación existente
          content = content.replace(
            /import\s*{([^}]*)}\s*from\s*'@angular\/core'/,
            (match, imports) => `import { ${imports}, Injectable } from '@angular/core'`
          );
        }
        
        // Agregar decorador @Injectable
        content = content.replace(
          /export\s+class\s+(\w+)/,
          `@Injectable({\n  providedIn: 'root'\n})\nexport class $1`
        );
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Agregado @Injectable a la clase ${className} en ${filePath}`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Error al procesar ${filePath}:`, error);
    return false;
  }
}

// Función principal
function main() {
  console.log('Iniciando corrección de errores de TypeScript...');
  
  // Buscar archivos TypeScript
  const tsFiles = findFiles('src', /\.ts$/);
  console.log(`Se encontraron ${tsFiles.length} archivos TypeScript para procesar.`);
  
  // Aplicar correcciones
  let fixedObjectPropertyFiles = 0;
  let fixedIncompatibleTypesFiles = 0;
  let fixedImportFiles = 0;
  let fixedTypeConversionFiles = 0;
  let fixedDependencyInjectionFiles = 0;
  
  for (const file of tsFiles) {
    console.log(`\nProcesando archivo: ${file}`);
    
    if (fixObjectPropertyAccess(file)) {
      fixedObjectPropertyFiles++;
    }
    
    if (fixIncompatibleTypes(file)) {
      fixedIncompatibleTypesFiles++;
    }
    
    if (fixImportErrors(file)) {
      fixedImportFiles++;
    }
    
    if (fixTypeConversionErrors(file)) {
      fixedTypeConversionFiles++;
    }
    
    if (fixDependencyInjectionErrors(file)) {
      fixedDependencyInjectionFiles++;
    }
  }
  
  console.log('\nResumen de correcciones:');
  console.log(`- Errores de acceso a propiedades: ${fixedObjectPropertyFiles} archivos corregidos`);
  console.log(`- Errores de tipos incompatibles: ${fixedIncompatibleTypesFiles} archivos corregidos`);
  console.log(`- Errores de importación: ${fixedImportFiles} archivos corregidos`);
  console.log(`- Errores de conversión de tipos: ${fixedTypeConversionFiles} archivos corregidos`);
  console.log(`- Errores de inyección de dependencias: ${fixedDependencyInjectionFiles} archivos corregidos`);
  
  console.log('\nProceso completado. Ejecuta "ng build" para verificar si se han resuelto todos los errores.');
}

// Ejecutar la función principal
main();
