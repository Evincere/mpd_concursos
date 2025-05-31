# Configuración del Entorno de Pruebas

Este documento proporciona instrucciones detalladas para configurar correctamente el entorno de pruebas en el proyecto MPD Concursos App.

## Problemas Identificados

Durante el desarrollo, se identificaron los siguientes problemas que impiden la ejecución de pruebas unitarias:

1. **Falta del archivo karma.conf.js**: No existe un archivo de configuración base para Karma en la raíz del proyecto.
2. **Configuración incompleta de pruebas en angular.json**: La configuración actual tiene deficiencias en la especificación de navegadores, assets y estilos.
3. **Posibles dependencias faltantes**: Aunque el proyecto tiene instaladas las dependencias básicas de Karma, podrían faltar otras importantes como karma-chrome-launcher y karma-coverage.
4. **Posibles problemas de compatibilidad**: Podría haber problemas de compatibilidad entre las versiones de TypeScript, Angular y la configuración de tsconfig.spec.json.

## Pasos para la Configuración

### 1. Crear archivo karma.conf.js

Crear un archivo `karma.conf.js` en la raíz del proyecto con la siguiente configuración:

```javascript
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      jasmine: {
        // Opciones de configuración para Jasmine
      },
      clearContext: false // Mantener visible la salida del Jasmine Spec Runner en el navegador
    },
    jasmineHtmlReporter: {
      suppressAll: true // Eliminar trazas duplicadas
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' }
      ]
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false,
    restartOnFileChange: true
  });
};
```

### 2. Instalar dependencias faltantes

Ejecutar el siguiente comando para instalar las dependencias necesarias:

```bash
npm install --save-dev karma-chrome-launcher karma-coverage
```

### 3. Actualizar configuración en angular.json

Modificar la sección `test` en `angular.json` para incluir todos los assets necesarios y configurar correctamente los estilos:

```json
"test": {
  "builder": "@angular-devkit/build-angular:karma",
  "options": {
    "main": "src/test.ts",
    "polyfills": [
      "zone.js",
      "zone.js/testing"
    ],
    "tsConfig": "tsconfig.spec.json",
    "karmaConfig": "karma.conf.js",
    "inlineStyleLanguage": "scss",
    "assets": [
      {
        "glob": "**/*",
        "input": "src/assets",
        "output": "/assets"
      },
      {
        "glob": "**/*",
        "input": "public",
        "output": "/"
      },
      "src/favicon.ico"
    ],
    "styles": [
      "src/styles.scss"
    ],
    "stylePreprocessorOptions": {
      "includePaths": [
        "src/styles"
      ]
    },
    "scripts": []
  }
}
```

### 4. Verificar archivo test.ts

Asegurarse de que exista un archivo `src/test.ts` con el siguiente contenido:

```typescript
// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);
```

### 5. Verificar tsconfig.spec.json

Asegurarse de que el archivo `tsconfig.spec.json` tenga la configuración correcta:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/spec",
    "types": [
      "jasmine",
      "node"
    ]
  },
  "include": [
    "src/**/*.spec.ts",
    "src/**/*.d.ts"
  ]
}
```

### 6. Verificar compatibilidad de versiones

Verificar que las versiones de Angular, TypeScript y las dependencias de pruebas sean compatibles entre sí:

```bash
npm list @angular/core typescript karma jasmine
```

## Ejecución de Pruebas

Una vez configurado el entorno, se pueden ejecutar las pruebas con los siguientes comandos:

### Ejecutar todas las pruebas

```bash
ng test
```

### Ejecutar pruebas sin vigilancia de cambios

```bash
ng test --watch=false
```

### Ejecutar pruebas con cobertura

```bash
ng test --code-coverage
```

### Ejecutar pruebas específicas

Para ejecutar pruebas específicas, se puede crear un archivo de configuración personalizado:

```javascript
// karma-specific.conf.js
const baseConfig = require('./karma.conf.js');

module.exports = function(config) {
  baseConfig(config);
  config.set({
    files: [
      // Archivos de prueba específicos
      { pattern: './src/app/shared/services/dialog/dialog.service.spec.ts' },
      { pattern: './src/app/shared/directives/lazy-load-image.directive.spec.ts' },
      { pattern: './src/app/core/services/error/error-handler.service.spec.ts' },
      { pattern: './src/app/core/interceptors/error-interceptor.spec.ts' }
    ],
    autoWatch: false,
    singleRun: true
  });
};
```

Y ejecutarlo con:

```bash
ng test --karma-config=karma-specific.conf.js
```

## Solución de Problemas Comunes

### Error: Cannot find module 'karma-*'

Instalar la dependencia faltante:

```bash
npm install --save-dev karma-*
```

### Error: No binary for Chrome browser on your platform

Instalar Chrome o usar ChromeHeadless:

```javascript
browsers: ['ChromeHeadless']
```

### Error: Angular is not defined

Verificar que el archivo test.ts esté configurado correctamente y que las versiones de Angular y sus dependencias sean compatibles.

### Error: Cannot find name 'describe' or 'it'

Asegurarse de que los tipos de Jasmine estén incluidos en tsconfig.spec.json:

```json
"types": [
  "jasmine",
  "node"
]
```

## Recursos Adicionales

- [Documentación oficial de pruebas en Angular](https://angular.io/guide/testing)
- [Documentación de Karma](https://karma-runner.github.io/latest/index.html)
- [Documentación de Jasmine](https://jasmine.github.io/)
