const fs = require('fs');
const path = require('path');

/**
 * Script para corregir errores de sintaxis comunes introducidos durante la limpieza automática
 */

const srcDir = path.join(__dirname, '..', 'src');

// Patrones de errores comunes y sus correcciones
const fixes = [
  // Corregir comentarios mal formateados
  {
    pattern: /\/\/ TODO: Replace with proper logging or remove if not needed\'\);/g,
    replacement: '// TODO: Replace with proper logging or remove if not needed'
  },
  {
    pattern: /\/\/ TODO: Replace with proper logging or remove if not needed\',/g,
    replacement: '// TODO: Replace with proper logging or remove if not needed'
  },
  {
    pattern: /\/\/ TODO: Replace with proper logging or remove if not needed\)/g,
    replacement: '// TODO: Replace with proper logging or remove if not needed'
  },
  {
    pattern: /\/\/ TODO: Replace with proper logging or remove if not needed\s*\)/g,
    replacement: '// TODO: Replace with proper logging or remove if not needed'
  },
  
  // Corregir declaraciones de funciones mal formateadas
  {
    pattern: /(\w+)\s*\(\s*([^)]*)\)\s*;\s*void\s*\{/g,
    replacement: '$1($2): void {'
  },
  
  // Corregir declaraciones de variables mal formateadas
  {
    pattern: /const:\s*(\w+)\s*=/g,
    replacement: 'const $1 ='
  },
  {
    pattern: /this:\s*\./g,
    replacement: 'this.'
  },
  
  // Corregir returns fuera de función
  {
    pattern: /^(\s*)if\s*\([^)]+\)\s*\{\s*$/gm,
    replacement: (match, indent) => {
      // Solo corregir si no está dentro de una función
      return match;
    }
  },
  
  // Corregir sintaxis de objetos mal formateada
  {
    pattern: /if\(\s*,\s*([^)]+)\)\s*\{\s*\}\s*,\s*return:\s*,/g,
    replacement: 'if ($1) { return; }'
  },
  
  // Corregir comentarios con sintaxis incorrecta
  {
    pattern: /\/\/ TODO: Replace with proper logging or remove if not needed\s*['"]\);/g,
    replacement: '// TODO: Replace with proper logging or remove if not needed'
  }
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Aplicar todas las correcciones
    fixes.forEach(fix => {
      const originalContent = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== originalContent) {
        modified = true;
      }
    });
    
    // Correcciones específicas más complejas
    
    // Corregir funciones mal formateadas
    content = content.replace(
      /(\w+)\s*\(\s*([^)]*)\)\s*;\s*void\s*\{/g,
      '$1($2): void {'
    );
    
    // Corregir declaraciones de const mal formateadas
    content = content.replace(
      /const:\s*(\w+)\s*=/g,
      'const $1 ='
    );
    
    // Corregir this mal formateado
    content = content.replace(
      /this:\s*\./g,
      'this.'
    );
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Corregido: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  let totalFixed = 0;
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      totalFixed += processDirectory(fullPath);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      if (fixFile(fullPath)) {
        totalFixed++;
      }
    }
  });
  
  return totalFixed;
}

console.log('🔧 Iniciando corrección de errores de sintaxis...');
const fixedCount = processDirectory(srcDir);
console.log(`\n✨ Proceso completado. ${fixedCount} archivos corregidos.`);
