export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  enableCSP: true, // ✅ SEGURIDAD: CSP habilitado para detectar problemas en desarrollo
  indexedDBEnabled: true,
  mockData: true,
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
