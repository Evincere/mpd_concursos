/**
 * Configuración de Karma para Tests del Sistema CV
 * 
 * @description Configuración específica para ejecutar tests del sistema CV
 * @author Augment Agent
 * @date 2025-06-21
 * @version 1.0.0
 */

module.exports = function(config) {
  config.set({
    // Directorio base para resolver archivos
    basePath: '',

    // Frameworks de testing
    frameworks: ['jasmine', '@angular-devkit/build-angular'],

    // Plugins necesarios
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],

    // Configuración del cliente
    client: {
      jasmine: {
        // Configuración específica de Jasmine
        random: false, // Ejecutar tests en orden determinístico
        seed: '12345', // Semilla fija para reproducibilidad
        stopOnFailure: false, // Continuar ejecutando tests aunque fallen algunos
        failFast: false, // No parar en el primer fallo
        timeoutInterval: 10000 // Timeout de 10 segundos por test
      },
      clearContext: false, // Mantener resultados visibles en el navegador
      captureConsole: true // Capturar logs de consola
    },

    // Configuración del reporter HTML de Jasmine
    jasmineHtmlReporter: {
      suppressAll: true, // Suprimir mensajes duplicados
      suppressFailed: false // Mostrar tests fallidos
    },

    // Configuración de cobertura de código
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/cv-tests'),
      subdir: '.',
      reporters: [
        { type: 'html', subdir: 'html' },
        { type: 'text-summary' },
        { type: 'lcov', subdir: 'lcov' },
        { type: 'json', subdir: 'json' },
        { type: 'clover', subdir: 'clover' }
      ],
      check: {
        // Umbrales mínimos de cobertura
        global: {
          statements: 80,
          branches: 75,
          functions: 80,
          lines: 80
        },
        each: {
          statements: 70,
          branches: 65,
          functions: 70,
          lines: 70
        }
      },
      watermarks: {
        statements: [70, 85],
        functions: [70, 85],
        branches: [65, 80],
        lines: [70, 85]
      }
    },

    // Reporters a utilizar
    reporters: ['progress', 'kjhtml', 'coverage'],

    // Puerto del servidor
    port: 9876,

    // Habilitar colores en la salida
    colors: true,

    // Nivel de logging
    logLevel: config.LOG_INFO,

    // Configuración de auto-watch
    autoWatch: false,

    // Navegadores para ejecutar tests
    browsers: ['ChromeHeadless'],

    // Configuración específica de Chrome
    customLaunchers: {
      ChromeHeadlessCustom: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--remote-debugging-port=9222'
        ]
      },
      ChromeDebugging: {
        base: 'Chrome',
        flags: [
          '--remote-debugging-port=9333',
          '--disable-web-security'
        ]
      }
    },

    // Ejecutar una sola vez y salir
    singleRun: true,

    // No reiniciar en cambios de archivos
    restartOnFileChange: false,

    // Configuración de timeouts
    browserDisconnectTimeout: 10000,
    browserDisconnectTolerance: 3,
    browserNoActivityTimeout: 60000,
    captureTimeout: 60000,

    // Configuración de archivos
    files: [
      // Archivos específicos del CV para testing
      { pattern: 'src/app/core/services/cv/**/*.spec.ts', type: 'js' },
      { pattern: 'src/app/features/perfil/components/cv/**/*.spec.ts', type: 'js' }
    ],

    // Archivos a excluir
    exclude: [
      'src/app/**/*.e2e-spec.ts',
      'src/app/**/*.integration-spec.ts'
    ],

    // Configuración de preprocesadores
    preprocessors: {
      'src/app/core/services/cv/**/*.ts': ['coverage'],
      'src/app/features/perfil/components/cv/**/*.ts': ['coverage']
    },

    // Configuración de proxies si es necesario
    proxies: {
      '/api/': 'http://localhost:8080/api/'
    },

    // Configuración de middleware personalizado
    middleware: ['custom-middleware'],

    // Plugins personalizados
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
      {
        'middleware:custom-middleware': ['factory', function() {
          return function(req, res, next) {
            // Middleware personalizado para tests CV
            if (req.url.startsWith('/api/cv/')) {
              // Interceptar llamadas API del CV para testing
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ mock: true }));
            } else {
              next();
            }
          };
        }]
      }
    ],

    // Configuración específica para CI/CD
    ...(process.env.CI && {
      browsers: ['ChromeHeadlessCustom'],
      singleRun: true,
      autoWatch: false,
      reporters: ['progress', 'coverage', 'junit'],
      junitReporter: {
        outputDir: 'coverage/cv-tests/junit',
        outputFile: 'test-results.xml',
        suite: 'CV System Tests',
        useBrowserName: false
      }
    })
  });

  // Configuración específica para desarrollo local
  if (process.env.NODE_ENV === 'development') {
    config.set({
      browsers: ['Chrome'],
      singleRun: false,
      autoWatch: true,
      reporters: ['progress', 'kjhtml']
    });
  }

  // Configuración para debugging
  if (process.env.DEBUG_TESTS) {
    config.set({
      browsers: ['ChromeDebugging'],
      singleRun: false,
      autoWatch: true,
      logLevel: config.LOG_DEBUG
    });
  }
};
