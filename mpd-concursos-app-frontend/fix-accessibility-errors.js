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

// Función para corregir errores de accesibilidad en templates
function fixAccessibilityIssues(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Corregir elementos con click sin eventos de teclado
    // Buscar elementos con (click) pero sin (keyup), (keydown) o (keypress)
    const clickRegex = /\(click\)="([^"]+)"/g;
    let match;

    while ((match = clickRegex.exec(content)) !== null) {
      const clickHandler = match[1];
      const fullMatch = match[0];
      const position = match.index;

      // Verificar si ya tiene eventos de teclado
      const beforeMatch = content.substring(0, position + fullMatch.length);
      const hasKeyboardEvent = /\(keyup\)=|\(keydown\)=|\(keypress\)=/.test(beforeMatch);

      if (!hasKeyboardEvent) {
        // Añadir evento keydown con el mismo handler
        const replacement = `(click)="${clickHandler}" (keydown.enter)="${clickHandler}"`;
        content = content.replace(fullMatch, replacement);
      }
    }

    // Corregir elementos interactivos sin atributo tabindex
    // Buscar elementos con eventos pero sin tabindex
    const interactiveRegex = /<([a-z-]+)([^>]*)(click|keyup|keydown|keypress)([^>]*)>/g;

    while ((match = interactiveRegex.exec(content)) !== null) {
      const tagName = match[1];
      const beforeAttrs = match[2];
      const eventType = match[3];
      const afterAttrs = match[4];
      const fullMatch = match[0];

      // Verificar si ya tiene tabindex
      const hasTabIndex = /tabindex=/.test(fullMatch);

      // Excluir elementos que son naturalmente focusables
      const naturallyFocusable = ['a', 'button', 'input', 'select', 'textarea', 'details', 'summary'];

      if (!hasTabIndex && !naturallyFocusable.includes(tagName)) {
        // Añadir tabindex="0"
        const replacement = `<${tagName}${beforeAttrs}${eventType}${afterAttrs} tabindex="0">`;
        content = content.replace(fullMatch, replacement);
      }
    }

    // Corregir etiquetas label sin control asociado
    const labelRegex = /<label([^>]*)>([^<]*)<\/label>/g;

    while ((match = labelRegex.exec(content)) !== null) {
      const labelAttrs = match[1];
      const labelText = match[2];
      const fullMatch = match[0];

      // Verificar si ya tiene for o control asociado
      const hasFor = /for=/.test(labelAttrs);
      const hasControl = /<input|<select|<textarea/.test(fullMatch);

      if (!hasFor && !hasControl) {
        // Generar un ID único basado en el texto de la etiqueta
        const id = `input-${labelText.trim().toLowerCase().replace(/\s+/g, '-')}`;

        // Buscar el siguiente input después de la etiqueta
        const afterLabel = content.substring(match.index + fullMatch.length);
        const inputMatch = /<(input|select|textarea)([^>]*)>/.exec(afterLabel);

        if (inputMatch) {
          const inputTag = inputMatch[1];
          const inputAttrs = inputMatch[2];
          const fullInputMatch = inputMatch[0];

          // Verificar si el input ya tiene un ID
          const hasId = /id=/.test(inputAttrs);

          if (!hasId) {
            // Añadir ID al input y for a la etiqueta
            const newLabel = `<label${labelAttrs} for="${id}">${labelText}</label>`;
            const newInput = `<${inputTag}${inputAttrs} id="${id}">`;

            content = content.replace(fullMatch, newLabel);
            content = content.replace(fullInputMatch, newInput);
          }
        }
      }
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed accessibility issues in ${filePath}`);
  } catch (error) {
    console.error(`Error fixing accessibility issues in ${filePath}:`, error);
  }
}

console.log('Iniciando búsqueda de archivos HTML...');
// Buscar archivos HTML
const htmlFiles = findFiles('src', /\.html$/);
console.log(`Se encontraron ${htmlFiles.length} archivos HTML para procesar.`);

// Aplicar correcciones
console.log('Aplicando correcciones de accesibilidad...');
let fixedFiles = 0;

for (const file of htmlFiles) {
  console.log(`\nProcesando archivo: ${file}`);
  try {
    fixAccessibilityIssues(file);
    fixedFiles++;
  } catch (error) {
    console.error(`Error al procesar ${file}:`, error);
  }
}

console.log(`\nSe procesaron ${fixedFiles} de ${htmlFiles.length} archivos correctamente.`);
console.log('Finished applying accessibility fixes');
