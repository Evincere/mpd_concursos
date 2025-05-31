// Este archivo configura Karma para ejecutar solo pruebas específicas
module.exports = function(config) {
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
        // Puedes añadir configuración específica de Jasmine aquí
      },
      clearContext: false // deja visible los resultados de Jasmine en el navegador
    },
    jasmineHtmlReporter: {
      suppressAll: true // elimina los mensajes duplicados
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/specific-tests'),
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
    restartOnFileChange: true,
    files: [
      // Especifica solo los archivos de prueba que quieres ejecutar
      { pattern: './src/app/core/services/error/error-handler.service.spec.ts', type: 'js' },
      { pattern: './src/app/core/interceptors/error-interceptor.spec.ts', type: 'js' },
      { pattern: './src/app/shared/directives/lazy-load-image.directive.spec.ts', type: 'js' }
    ]
  });
};
