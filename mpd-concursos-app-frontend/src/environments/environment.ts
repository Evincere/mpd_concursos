export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  wsUrl: 'ws://localhost:3000',
  enableCSP: false, // Deshabilitar CSP en desarrollo
  indexedDBEnabled: true,
  mockData: false,
  logLevel: 'debug',
  enableConsoleLogging: true,
  logEndpoint: null,
  version: '1.0.0-dev',
  buildDate: new Date().toISOString(),
  defaultLanguage: 'es',
  defaultTheme: 'dark',
  features: {
    exams: true,
    contests: true,
    inscriptions: true,
    documents: true,
    profiles: true,
    admin: true,
    debug: true,
    useMockCvData: true,  // ✅ Mock CV data habilitado en desarrollo
    enableCvMockInterceptor: true  // ✅ Mock interceptor habilitado en desarrollo
  },

  // Monitoring Configuration (desarrollo)
  monitoring: {
    enableErrorTracking: false,
    enablePerformanceTracking: false,
    enableUserTracking: false,
    sampleRate: 1.0
  }
};
