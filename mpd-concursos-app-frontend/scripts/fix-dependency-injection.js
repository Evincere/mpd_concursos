/**
 * Script para corregir errores de inyección de dependencias
 */
const fs = require('fs');
const path = require('path');

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

// Función para corregir errores de inyección de dependencias
function fixDependencyInjection(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Verificar si es una clase sin decorador
    const classRegex = /export\s+class\s+(\w+)(?!\s+extends|\s+implements)(?!\s*{[^{]*@Injectable)/;
    const match = classRegex.exec(content);
    
    if (match && !content.includes('@Injectable') && !content.includes('@Component') && 
        !content.includes('@Directive') && !content.includes('@Pipe') && 
        !content.includes('@NgModule')) {
      
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
          modified = true;
        } else if (!content.includes('Injectable')) {
          // Agregar Injectable a la importación existente
          content = content.replace(
            /import\s*{([^}]*)}\s*from\s*'@angular\/core'/,
            (match, imports) => `import { ${imports}, Injectable } from '@angular/core'`
          );
          modified = true;
        }
        
        // Agregar decorador @Injectable
        content = content.replace(
          /export\s+class\s+(\w+)/,
          `@Injectable({\n  providedIn: 'root'\n})\nexport class $1`
        );
        modified = true;
        
        if (modified) {
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`✅ Agregado @Injectable a la clase ${className} en ${filePath}`);
          return true;
        }
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
  console.log('Iniciando corrección de errores de inyección de dependencias...');
  
  // Buscar archivos TypeScript
  const tsFiles = findFiles('src', /\.service\.ts$/);
  console.log(`Se encontraron ${tsFiles.length} archivos de servicio para procesar.`);
  
  // Aplicar correcciones
  let fixedFiles = 0;
  
  for (const file of tsFiles) {
    if (fixDependencyInjection(file)) {
      fixedFiles++;
    }
  }
  
  console.log(`\nProceso completado. Se corrigieron errores de inyección de dependencias en ${fixedFiles} archivos.`);
}

// Ejecutar la función principal
main();
