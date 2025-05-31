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

// Función para corregir errores de variables no utilizadas
function fixUnusedVars(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Buscar importaciones no utilizadas
    const importRegex = /import\s+{([^}]+)}\s+from\s+['"][^'"]+['"];/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const imports = match[1].split(',').map(i => i.trim());

      for (const importItem of imports) {
        // Si la importación tiene un alias, extraer el nombre real
        const importName = importItem.includes(' as ')
          ? importItem.split(' as ')[0].trim()
          : importItem;

        // Verificar si la importación se usa en el archivo (excluyendo la línea de importación)
        const restOfFile = content.substring(match.index + match[0].length);
        const regex = new RegExp(`\\b${importName}\\b`, 'g');

        if (!regex.test(restOfFile)) {
          // Eliminar esta importación
          const newImports = imports.filter(i => i.trim() !== importItem);

          if (newImports.length === 0) {
            // Eliminar toda la línea de importación
            content = content.replace(match[0], '');
          } else {
            // Reemplazar la lista de importaciones
            const newImportList = newImports.join(', ');
            const newImportStatement = `import { ${newImportList} } from ${match[0].split('from')[1]}`;
            content = content.replace(match[0], newImportStatement);
          }
        }
      }
    }

    // Buscar variables declaradas pero no utilizadas
    const varRegex = /(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=/g;

    while ((match = varRegex.exec(content)) !== null) {
      const varName = match[1];

      // Verificar si la variable se usa en el archivo (después de su declaración)
      const restOfFile = content.substring(match.index + match[0].length);
      const regex = new RegExp(`\\b${varName}\\b`, 'g');

      if (!regex.test(restOfFile)) {
        // Comentar la línea de declaración
        const lineStart = content.lastIndexOf('\n', match.index) + 1;
        const lineEnd = content.indexOf('\n', match.index);
        const line = content.substring(lineStart, lineEnd);

        content = content.replace(line, `// Unused: ${line}`);
      }
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed unused vars in ${filePath}`);
  } catch (error) {
    console.error(`Error fixing unused vars in ${filePath}:`, error);
  }
}

// Función para corregir métodos de ciclo de vida vacíos
function fixEmptyLifecycleMethods(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Buscar métodos de ciclo de vida vacíos
    const methodRegex = /(ngOnInit|ngOnDestroy|ngAfterViewInit|ngOnChanges)\(\)\s*{\s*}/g;

    // Reemplazar con implementaciones con comentarios
    content = content.replace(methodRegex, (match, methodName) => {
      return `${methodName}() {\n    // TODO: Implement ${methodName}\n  }`;
    });

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed empty lifecycle methods in ${filePath}`);
  } catch (error) {
    console.error(`Error fixing empty lifecycle methods in ${filePath}:`, error);
  }
}

// Función para corregir constructores vacíos
function fixEmptyConstructors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Buscar constructores vacíos
    const constructorRegex = /constructor\s*\([^)]*\)\s*{\s*}/g;

    // Eliminar constructores vacíos
    content = content.replace(constructorRegex, '');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed empty constructors in ${filePath}`);
  } catch (error) {
    console.error(`Error fixing empty constructors in ${filePath}:`, error);
  }
}

// Función para corregir tipos any explícitos
function fixExplicitAny(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Reemplazar any con tipos más específicos donde sea posible
    content = content.replace(/: any(\s*=\s*\[\])/g, ': unknown[]$1');
    content = content.replace(/: any(\s*=\s*\{\})/g, ': Record<string, unknown>$1');
    content = content.replace(/: any(\s*=\s*'')/g, ': string$1');
    content = content.replace(/: any(\s*=\s*0)/g, ': number$1');
    content = content.replace(/: any(\s*=\s*false)/g, ': boolean$1');
    content = content.replace(/: any(\s*=\s*true)/g, ': boolean$1');
    content = content.replace(/: any(\s*=\s*null)/g, ': unknown$1');

    // Para parámetros de función, usar unknown en lugar de any
    content = content.replace(/\(([^)]*): any([^)]*)\)/g, '($1: unknown$2)');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed explicit any in ${filePath}`);
  } catch (error) {
    console.error(`Error fixing explicit any in ${filePath}:`, error);
  }
}

console.log('Iniciando búsqueda de archivos TypeScript...');
// Buscar archivos TypeScript
const tsFiles = findFiles('src', /\.ts$/);
console.log(`Se encontraron ${tsFiles.length} archivos TypeScript para procesar.`);

// Aplicar correcciones
console.log('Aplicando correcciones automáticas...');
let fixedFiles = 0;

for (const file of tsFiles) {
  console.log(`\nProcesando archivo: ${file}`);
  try {
    fixUnusedVars(file);
    fixEmptyLifecycleMethods(file);
    fixEmptyConstructors(file);
    fixExplicitAny(file);
    fixedFiles++;
  } catch (error) {
    console.error(`Error al procesar ${file}:`, error);
  }
}

console.log(`\nSe procesaron ${fixedFiles} de ${tsFiles.length} archivos correctamente.`);
console.log('Finished applying automatic fixes');

// Ejecutar ESLint con --fix para corregir problemas adicionales
try {
  console.log('\nRunning ESLint with --fix option...');
  execSync('npx eslint --fix src/**/*.ts', { stdio: 'inherit' });
  console.log('ESLint completado correctamente.');
} catch (error) {
  console.error('Error running ESLint:', error);
}
