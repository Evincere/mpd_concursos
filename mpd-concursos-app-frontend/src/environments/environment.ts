export const environment = {
  production: false,
  apiUrl: 'http://localhost:8082/api',
  enableCSP: false, // Deshabilitar CSP en desarrollo
  indexedDBEnabled: true,
  mockData: false,
  logLevel: 'debug',
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
    debug: true
  }
};
