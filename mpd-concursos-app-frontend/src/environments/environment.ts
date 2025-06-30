export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  wsUrl: 'ws://localhost:3000',
  enableCSP: true, // ✅ SEGURIDAD: CSP habilitado en desarrollo para detectar problemas temprano
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
    useMockCvData: false,  // ⚠️ Mock CV data temporalmente deshabilitado
    enableCvMockInterceptor: false  // ⚠️ Mock interceptor temporalmente deshabilitado
  },

  // Monitoring Configuration (desarrollo)
  monitoring: {
    enableErrorTracking: false,
    enablePerformanceTracking: false,
    enableUserTracking: false,
    sampleRate: 1.0
  }
};
