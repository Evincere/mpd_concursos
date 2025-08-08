export const environment = {
  production: true,

  // API Configuration - PRODUCTION READY
  apiUrl: '/api',
  wsUrl: 'ws://vps-4778464-x.dattaweb.com/ws',

  // Security Configuration
  enableCSP: true,
  indexedDBEnabled: true,
  mockData: false,
  enableDebugTools: false,
  enableConsoleLogging: false,
  enablePerformanceMonitoring: true,

  // Logging Configuration
  logLevel: 'error',
  enableRemoteLogging: true,
  logEndpoint: '/api/logs',

  // App Configuration
  version: '1.0.0',
  buildDate: new Date().toISOString(),
  defaultLanguage: 'es',
  defaultTheme: 'light',

  // Feature Flags - PRODUCTION READY
  features: {
    exams: true,
    contests: true,
    inscriptions: true,
    documents: true,
    profiles: true,
    admin: true,
    debug: false,
    offlineMode: true,
    pushNotifications: true,
    realTimeUpdates: true,
    advancedSearch: true,
    filePreview: true,
    darkMode: true,
    accessibility: true,
    useMockCvData: false,  // ❌ Mock CV data DESHABILITADO en producción
    enableCvMockInterceptor: false  // ❌ Mock interceptor DESHABILITADO en producción
  },

  // Cache Configuration
  cache: {
    enabled: true,
    defaultTTL: 300000,        // 5 minutos
    maxSize: 100,              // 100 items
    persistToDisk: true,
  },

  // Performance Configuration
  performance: {
    enableLazyLoading: true,
    enablePreloading: true,
    enableCompression: true,
    enableCaching: true,
    chunkSize: 'medium',
  },

  // Security Configuration
  security: {
    enableCSP: true,
    enableHTTPS: true,
    enableHSTS: true,
    sessionTimeout: 3600000,   // 1 hora
    tokenRefreshThreshold: 300000, // 5 minutos
  },

  // Monitoring Configuration
  monitoring: {
    enableErrorTracking: true,
    enablePerformanceTracking: true,
    enableUserTracking: false, // GDPR compliance
    sampleRate: 0.1,          // 10% sampling
  }
};
