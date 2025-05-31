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

// Lista de eventos nativos del DOM que no deben usarse como nombres de salida
const nativeEvents = [
  'click', 'close', 'change', 'focus', 'blur', 'input', 'submit', 'reset',
  'keydown', 'keyup', 'keypress', 'mousedown', 'mouseup', 'mousemove',
  'mouseover', 'mouseout', 'mouseenter', 'mouseleave', 'scroll', 'resize',
  'load', 'unload', 'error', 'select', 'drag', 'drop'
];

// Función para corregir errores de salida nativa
function fixOutputNativeErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Buscar declaraciones de @Output con nombres de eventos nativos
    for (const event of nativeEvents) {
      const outputRegex = new RegExp(`@Output\\(\\s*(?:'${event}'|"${event}")\\s*\\)|@Output\\(\\)\\s+${event}\\s*=`, 'g');

      if (outputRegex.test(content)) {
        console.log(`  Encontrado evento nativo '${event}' en ${filePath}`);
        // Reemplazar con un nombre no nativo
        const newName = `${event}Event`;

        // Caso 1: @Output('event')
        content = content.replace(
          new RegExp(`@Output\\(\\s*(?:'${event}'|"${event}")\\s*\\)`, 'g'),
          `@Output('${newName}')`
        );

        // Caso 2: @Output() event
        content = content.replace(
          new RegExp(`@Output\\(\\)\\s+${event}\\s*=`, 'g'),
          `@Output() ${newName} =`
        );

        // También necesitamos actualizar las referencias a este evento en el mismo archivo
        // Por ejemplo: this.close.emit() -> this.closeEvent.emit()
        const eventRefRegex = new RegExp(`this\\.${event}\\.emit`, 'g');
        content = content.replace(eventRefRegex, `this.${newName}.emit`);

        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✅ Corregidos errores de salida nativa en ${filePath}`);
    }

    return modified;
  } catch (error) {
    console.error(`Error fixing output native errors in ${filePath}:`, error);
    return false;
  }
}

console.log('Iniciando búsqueda de archivos de componentes TypeScript...');
// Buscar archivos de componentes TypeScript
const tsFiles = findFiles('src', /\.component\.ts$/);
console.log(`Se encontraron ${tsFiles.length} archivos de componentes para procesar.`);

// Aplicar correcciones
console.log('Aplicando correcciones de eventos de salida nativos...');
let fixedFiles = 0;
let modifiedFiles = 0;

for (const file of tsFiles) {
  console.log(`\nProcesando archivo: ${file}`);
  try {
    const wasModified = fixOutputNativeErrors(file);
    fixedFiles++;
    if (wasModified) {
      modifiedFiles++;
      console.log(`✅ Se modificó el archivo: ${file}`);
    }
  } catch (error) {
    console.error(`Error al procesar ${file}:`, error);
  }
}

console.log(`\nSe procesaron ${fixedFiles} de ${tsFiles.length} archivos correctamente.`);
console.log(`Se modificaron ${modifiedFiles} archivos para corregir eventos de salida nativos.`);
console.log('Finished applying output native fixes');
