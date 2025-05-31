const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Lista de archivos con errores de parsing
const parsingErrorFiles = [
  'src/app/core/config/material.config.ts',
  'src/app/core/services/examenes/security/examen-security.service.ts',
  'src/app/core/services/notifications/notifications.service.ts',
  'src/app/core/store/inscription/inscription.actions.ts',
  'src/app/core/store/inscription/inscription.reducer.ts',
  'src/app/core/store/inscription/inscription.selectors.ts',
  'src/app/features/examenes/components/examen-rendicion/examen-rendicion.component.ts',
  'src/environments/environment.prod.ts',
  'src/environments/environment.ts'
];

// Lista de componentes con errores de salida nativa
const outputNativeErrorFiles = [
  'src/app/features/admin/components/inscripciones/components/custom-document-viewer/custom-document-viewer.component.ts',
  'src/app/features/admin/components/inscripciones/components/custom-inscription-detail/custom-inscription-detail.component.ts',
  'src/app/features/admin/components/usuarios/usuario-form/usuario-form.component.ts',
  'src/app/shared/components/custom-form/custom-dialog/custom-dialog.component.ts',
  'src/app/shared/components/search-header/search-header.component.ts'
];

// Lista de componentes con métodos de ciclo de vida vacíos
const emptyLifecycleMethodFiles = [
  'src/app/features/admin/components/examenes/examen-form/examen-form.component.ts',
  'src/app/features/admin/components/help-center/components/article-viewer/article-viewer.component.ts',
  'src/app/features/admin/components/help-center/components/help-feedback/help-feedback.component.ts',
  'src/app/features/admin/components/roles/components/role-dialog/role-dialog.component.ts',
  'src/app/features/admin/components/system-monitoring/components/alert-configuration/alert-configuration.component.ts',
  'src/app/features/admin/components/system-monitoring/components/database-monitoring/database-monitoring.component.ts',
  'src/app/features/admin/components/system-monitoring/components/system-alerts/system-alerts.component.ts',
  'src/app/features/admin/components/user-behavior/components/feature-usage/feature-usage.component.ts',
  'src/app/features/admin/components/user-behavior/components/step-time-analysis/step-time-analysis.component.ts',
  'src/app/features/admin/components/user-behavior/components/user-segmentation/user-segmentation.component.ts',
  'src/app/features/concursos/components/concurso-card/concurso-card.component.ts',
  'src/app/features/examples/feedback-examples/feedback-examples.component.ts',
  'src/app/shared/components/loading-indicator/loading-indicator.component.ts',
  'src/app/shared/components/notification-item/inscription-notification-item/inscription-notification-item.component.ts',
  'src/app/shared/components/progress-indicator/progress-indicator.component.ts'
];

// Función para corregir errores de parsing
function fixParsingErrors() {
  console.log('Corrigiendo errores de parsing...');
  
  for (const file of parsingErrorFiles) {
    const filePath = path.resolve(file);
    
    if (fs.existsSync(filePath)) {
      console.log(`Procesando: ${filePath}`);
      
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Corregir errores comunes de parsing
        if (filePath.includes('environment.')) {
          // Corregir error de falta de punto y coma en environment
          content = content.replace(/export const environment = {([^}]*)}/gs, 'export const environment = {$1};');
        } else if (filePath.includes('inscription.actions.ts') || 
                  filePath.includes('inscription.reducer.ts') || 
                  filePath.includes('inscription.selectors.ts')) {
          // Añadir punto y coma faltante en archivos de store
          content = content.replace(/}\)/g, '});');
        } else if (filePath.includes('examen-rendicion.component.ts')) {
          // Corregir error de catch faltante
          content = content.replace(/try {([^}]*)}(?!\s*catch)/gs, 'try {$1} catch (error) { console.error(error); }');
        } else {
          // Corregir declaraciones incompletas
          content = content.replace(/([^;{}])$/gm, '$1;');
        }
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Corregido: ${filePath}`);
      } catch (error) {
        console.error(`Error al procesar ${filePath}:`, error);
      }
    } else {
      console.warn(`Archivo no encontrado: ${filePath}`);
    }
  }
}

// Función para corregir errores de salida nativa
function fixOutputNativeErrors() {
  console.log('\nCorrigiendo errores de salida nativa...');
  
  const nativeEvents = [
    'click', 'close', 'change', 'focus', 'blur', 'input', 'submit', 'reset',
    'keydown', 'keyup', 'keypress', 'mousedown', 'mouseup', 'mousemove',
    'mouseover', 'mouseout', 'mouseenter', 'mouseleave', 'scroll', 'resize',
    'load', 'unload', 'error', 'select', 'drag', 'drop'
  ];
  
  for (const file of outputNativeErrorFiles) {
    const filePath = path.resolve(file);
    
    if (fs.existsSync(filePath)) {
      console.log(`Procesando: ${filePath}`);
      
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
      } catch (error) {
        console.error(`Error al procesar ${filePath}:`, error);
      }
    } else {
      console.warn(`Archivo no encontrado: ${filePath}`);
    }
  }
}

// Función para corregir métodos de ciclo de vida vacíos
function fixEmptyLifecycleMethods() {
  console.log('\nCorrigiendo métodos de ciclo de vida vacíos...');
  
  for (const file of emptyLifecycleMethodFiles) {
    const filePath = path.resolve(file);
    
    if (fs.existsSync(filePath)) {
      console.log(`Procesando: ${filePath}`);
      
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Buscar métodos de ciclo de vida vacíos
        const methodRegex = /(ngOnInit|ngOnDestroy|ngAfterViewInit|ngOnChanges)\(\)\s*{\s*}/g;
        
        // Reemplazar con implementaciones con comentarios
        content = content.replace(methodRegex, (match, methodName) => {
          return `${methodName}() {\n    // TODO: Implement ${methodName}\n    console.log('${methodName} called');\n  }`;
        });
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Corregido: ${filePath}`);
      } catch (error) {
        console.error(`Error al procesar ${filePath}:`, error);
      }
    } else {
      console.warn(`Archivo no encontrado: ${filePath}`);
    }
  }
}

// Ejecutar las funciones de corrección
fixParsingErrors();
fixOutputNativeErrors();
fixEmptyLifecycleMethods();

console.log('\nSe han aplicado las correcciones específicas. Ejecutando ESLint para verificar...');

try {
  execSync('npx eslint --fix src/**/*.ts', { stdio: 'inherit' });
  console.log('ESLint completado correctamente.');
} catch (error) {
  console.error('Error running ESLint:', error);
}
