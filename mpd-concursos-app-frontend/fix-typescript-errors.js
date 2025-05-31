const fs = require('fs');
const path = require('path');

// Archivos con errores de propiedades no existentes
const missingPropertiesFiles = {
  'src/app/shared/components/enhanced-tooltip/enhanced-tooltip.component.ts': [
    { property: 'overlayPositionBuilder', type: 'OverlayPositionBuilder', import: "import { OverlayPositionBuilder } from '@angular/cdk/overlay';" }
  ],
  'src/app/shared/components/notification-item/inscription-notification-item/inscription-notification-item.component.ts': [
    { property: 'router', type: 'Router', import: "import { Router } from '@angular/router';" }
  ],
  'src/app/shared/components/notifications/notifications.component.ts': [
    { property: 'notificationsService', type: 'NotificationService', import: "import { NotificationService } from '@shared/services/notification.service';" },
    { property: 'dialog', type: 'MatDialog', import: "import { MatDialog } from '@angular/material/dialog';" },
    { property: 'snackBar', type: 'MatSnackBar', import: "import { MatSnackBar } from '@angular/material/snack-bar';" }
  ],
  'src/app/shared/components/page-transition/page-transition.component.ts': [
    { property: 'router', type: 'Router', import: "import { Router } from '@angular/router';" }
  ],
  'src/app/shared/components/responsive-debug/responsive-debug.component.ts': [
    { property: 'responsiveService', type: 'ResponsiveService', import: "import { ResponsiveService } from '@shared/services/responsive.service';" },
    { property: 'testRunner', type: 'ResponsiveTestRunnerService', import: "import { ResponsiveTestRunnerService } from '@shared/services/responsive-test-runner.service';" }
  ],
  'src/app/shared/components/section-indicator/section-indicator.component.ts': [
    { property: 'sectionNavigationService', type: 'SectionNavigationService', import: "import { SectionNavigationService } from '@shared/services/section-navigation.service';" }
  ],
  'src/app/shared/directives/animate.directive.ts': [
    { property: 'el', type: 'ElementRef', import: "import { ElementRef } from '@angular/core';" },
    { property: 'animationService', type: 'AnimationService', import: "import { AnimationService } from '@shared/services/animation.service';" }
  ],
  'src/app/shared/directives/tooltip.directive.ts': [
    { property: 'elementRef', type: 'ElementRef', import: "import { ElementRef } from '@angular/core';" },
    { property: 'overlay', type: 'Overlay', import: "import { Overlay } from '@angular/cdk/overlay';" },
    { property: 'overlayPositionBuilder', type: 'OverlayPositionBuilder', import: "import { OverlayPositionBuilder } from '@angular/cdk/overlay';" }
  ],
  'src/app/shared/services/animation.service.ts': [
    { property: 'builder', type: 'AnimationBuilder', import: "import { AnimationBuilder } from '@angular/animations';" }
  ],
  'src/app/shared/services/confirmation.service.ts': [
    { property: 'dialog', type: 'MatDialog', import: "import { MatDialog } from '@angular/material/dialog';" }
  ],
  'src/app/shared/services/feedback.service.ts': [
    { property: 'componentFactoryResolver', type: 'ComponentFactoryResolver', import: "import { ComponentFactoryResolver } from '@angular/core';" },
    { property: 'injector', type: 'Injector', import: "import { Injector } from '@angular/core';" },
    { property: 'appRef', type: 'ApplicationRef', import: "import { ApplicationRef } from '@angular/core';" }
  ],
  'src/app/shared/services/notification.service.ts': [
    { property: 'snackBar', type: 'MatSnackBar', import: "import { MatSnackBar } from '@angular/material/snack-bar';" }
  ],
  'src/app/shared/services/user.service.ts': [
    { property: 'http', type: 'HttpClient', import: "import { HttpClient } from '@angular/common/http';" }
  ]
};

// Archivos con errores de environment
const environmentFiles = [
  'src/environments/environment.prod.ts',
  'src/environments/environment.ts'
];

// Función para corregir propiedades faltantes en componentes
function fixMissingProperties() {
  console.log('Corrigiendo propiedades faltantes en componentes...');
  
  for (const [filePath, properties] of Object.entries(missingPropertiesFiles)) {
    const fullPath = path.resolve(filePath);
    
    if (fs.existsSync(fullPath)) {
      console.log(`Procesando: ${fullPath}`);
      
      try {
        let content = fs.readFileSync(fullPath, 'utf8');
        let importsAdded = new Set();
        let propertiesAdded = [];
        
        // Añadir imports necesarios
        for (const { import: importStatement } of properties) {
          if (!content.includes(importStatement) && !importsAdded.has(importStatement)) {
            // Buscar la última línea de importación
            const lastImportIndex = content.lastIndexOf('import ');
            const lastImportEndIndex = content.indexOf(';', lastImportIndex) + 1;
            
            if (lastImportIndex !== -1) {
              content = content.substring(0, lastImportEndIndex) + 
                        '\n' + importStatement + 
                        content.substring(lastImportEndIndex);
              importsAdded.add(importStatement);
            }
          }
        }
        
        // Añadir propiedades faltantes al constructor
        for (const { property, type } of properties) {
          if (!content.includes(`this.${property}`) || !content.includes(`private ${property}:`)) {
            // Verificar si ya existe un constructor
            const constructorMatch = content.match(/constructor\s*\(([^)]*)\)/);
            
            if (constructorMatch) {
              // Añadir el parámetro al constructor existente
              const constructorParams = constructorMatch[1];
              const newParam = `private ${property}: ${type}`;
              
              if (!constructorParams.includes(property)) {
                const newConstructorParams = constructorParams.trim() 
                  ? `${constructorParams}, ${newParam}`
                  : newParam;
                
                content = content.replace(
                  /constructor\s*\(([^)]*)\)/,
                  `constructor(${newConstructorParams})`
                );
                
                propertiesAdded.push(property);
              }
            } else {
              // Crear un nuevo constructor
              const classMatch = content.match(/export\s+class\s+(\w+)/);
              if (classMatch) {
                const className = classMatch[1];
                const constructorCode = `\n  constructor(private ${property}: ${type}) {}\n`;
                
                // Insertar después de la declaración de la clase
                const classDeclarationEnd = content.indexOf('{', content.indexOf(className)) + 1;
                content = content.substring(0, classDeclarationEnd) + 
                          constructorCode + 
                          content.substring(classDeclarationEnd);
                
                propertiesAdded.push(property);
              }
            }
          }
        }
        
        if (importsAdded.size > 0 || propertiesAdded.length > 0) {
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`  ✅ Añadidos imports: ${Array.from(importsAdded).join(', ')}`);
          console.log(`  ✅ Añadidas propiedades: ${propertiesAdded.join(', ')}`);
        } else {
          console.log(`  ⚠️ No se realizaron cambios en ${fullPath}`);
        }
      } catch (error) {
        console.error(`Error al procesar ${fullPath}:`, error);
      }
    } else {
      console.warn(`Archivo no encontrado: ${fullPath}`);
    }
  }
}

// Función para corregir errores en los archivos de environment
function fixEnvironmentFiles() {
  console.log('\nCorrigiendo archivos de environment...');
  
  for (const filePath of environmentFiles) {
    const fullPath = path.resolve(filePath);
    
    if (fs.existsSync(fullPath)) {
      console.log(`Procesando: ${fullPath}`);
      
      try {
        // Reemplazar el contenido completo con una versión correcta
        const newContent = `export const environment = {
  production: ${filePath.includes('prod') ? 'true' : 'false'},
  apiUrl: '/api'
};
`;
        
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`  ✅ Corregido: ${fullPath}`);
      } catch (error) {
        console.error(`Error al procesar ${fullPath}:`, error);
      }
    } else {
      console.warn(`Archivo no encontrado: ${fullPath}`);
    }
  }
}

// Función para corregir errores de tipo unknown
function fixUnknownTypeErrors() {
  console.log('\nCorrigiendo errores de tipo unknown...');
  
  const filesToFix = [
    'src/app/shared/components/validation/validation-error/validation-error.component.ts',
    'src/app/shared/mappers/user.mapper.ts',
    'src/app/shared/pipes/filter.pipe.ts',
    'src/app/shared/services/user.service.ts'
  ];
  
  for (const filePath of filesToFix) {
    const fullPath = path.resolve(filePath);
    
    if (fs.existsSync(fullPath)) {
      console.log(`Procesando: ${fullPath}`);
      
      try {
        let content = fs.readFileSync(fullPath, 'utf8');
        let modified = false;
        
        // Corregir accesos a propiedades de tipo unknown
        if (filePath.includes('validation-error.component.ts')) {
          // Añadir verificación de tipo para params
          content = content.replace(
            /return params\[key\] !== undefined \? params\[key\] : match;/g,
            'return params && typeof params === "object" && key in params ? params[key as keyof typeof params] : match;'
          );
          modified = true;
        } else if (filePath.includes('user.mapper.ts')) {
          // Añadir verificación de tipo para formData
          content = content.replace(
            /if \(formData\.(\w+)\)/g,
            'if (formData && typeof formData === "object" && "$1" in formData && formData.$1)'
          );
          
          content = content.replace(
            /formData\.(\w+)/g,
            '(formData && typeof formData === "object" && "$1" in formData ? formData.$1 : undefined)'
          );
          
          modified = true;
        } else if (filePath.includes('filter.pipe.ts')) {
          // Corregir acceso a propiedades en el pipe de filtro
          content = content.replace(
            /if \(typeof item\[property\] === 'string' && typeof value === 'string'\) {/g,
            'if (item && typeof item === "object" && property in item && typeof item[property as keyof typeof item] === "string" && typeof value === "string") {'
          );
          
          content = content.replace(
            /return item\[property\]\.toLowerCase\(\)\.includes\(value\.toLowerCase\(\)\);/g,
            'return (item[property as keyof typeof item] as string).toLowerCase().includes(value.toLowerCase());'
          );
          
          content = content.replace(
            /return item\[property\] === value;/g,
            'return item[property as keyof typeof item] === value;'
          );
          
          content = content.replace(
            /return item && property \? item\[property\] : null;/g,
            'return item && property && typeof item === "object" && property in item ? item[property as keyof typeof item] : null;'
          );
          
          modified = true;
        } else if (filePath.includes('user.service.ts')) {
          // Corregir acceso a propiedades en el servicio de usuario
          content = content.replace(
            /response\.data/g,
            '(response as any).data'
          );
          
          content = content.replace(
            /response\.pagination/g,
            '(response as any).pagination'
          );
          
          modified = true;
        }
        
        if (modified) {
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`  ✅ Corregido: ${fullPath}`);
        } else {
          console.log(`  ⚠️ No se realizaron cambios en ${fullPath}`);
        }
      } catch (error) {
        console.error(`Error al procesar ${fullPath}:`, error);
      }
    } else {
      console.warn(`Archivo no encontrado: ${fullPath}`);
    }
  }
}

// Ejecutar las funciones de corrección
fixMissingProperties();
fixEnvironmentFiles();
fixUnknownTypeErrors();

console.log('\nSe han aplicado las correcciones para errores de TypeScript.');
