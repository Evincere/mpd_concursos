export const environment = {
  production: true,
  apiUrl: '/api',
  enableCSP: true,
  indexedDBEnabled: true,
  mockData: false,
  logLevel: 'error',
  version: '1.0.0',
  buildDate: new Date().toISOString(),
  defaultLanguage: 'es',
  defaultTheme: 'light',
  features: {
    exams: true,
    contests: true,
    inscriptions: true,
    documents: true,
    profiles: true,
    admin: true,
    debug: false
  }
};
