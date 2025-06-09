/**
 * Constantes de la aplicación
 * Centraliza todos los valores hardcodeados para facilitar mantenimiento
 */

// Timeouts y delays (en milisegundos)
export const TIMEOUTS = {
  HTTP_REQUEST: 30000,           // 30 segundos
  DEBOUNCE_SEARCH: 300,          // 300ms para búsquedas
  NOTIFICATION_DISPLAY: 5000,    // 5 segundos
  SESSION_CHECK: 60000,          // 1 minuto
  AUTO_SAVE: 30000,              // 30 segundos
  RETRY_DELAY: 1000,             // 1 segundo
  LONG_OPERATION: 120000,        // 2 minutos
  FILE_UPLOAD: 300000,           // 5 minutos
  WEBSOCKET_RECONNECT: 5000,     // 5 segundos
  CACHE_REFRESH: 3600000,        // 1 hora
} as const;

// Límites de archivos y datos
export const LIMITS = {
  MAX_FILE_SIZE: 20 * 1024 * 1024,    // 20MB
  MAX_FILES_PER_UPLOAD: 10,           // 10 archivos
  MAX_SEARCH_RESULTS: 100,            // 100 resultados
  MAX_PAGINATION_SIZE: 50,            // 50 items por página
  MAX_RETRY_ATTEMPTS: 3,              // 3 intentos
  MAX_CONCURRENT_UPLOADS: 3,          // 3 uploads simultáneos
  MAX_NOTIFICATION_QUEUE: 50,         // 50 notificaciones
  MAX_LOG_ENTRIES: 1000,              // 1000 logs en memoria
  MAX_CACHE_SIZE: 100,                // 100 items en cache
  MAX_HISTORY_ENTRIES: 50,            // 50 entradas de historial
} as const;

// Configuración de paginación
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100],
  MAX_VISIBLE_PAGES: 5,
} as const;

// Configuración de validación
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 50,
  MAX_EMAIL_LENGTH: 254,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_COMMENT_LENGTH: 500,
  DNI_LENGTH: 8,
  CUIL_LENGTH: 11,
} as const;

// Configuración de fechas
export const DATE_CONFIG = {
  DEFAULT_FORMAT: 'dd/MM/yyyy',
  DATETIME_FORMAT: 'dd/MM/yyyy HH:mm',
  TIME_FORMAT: 'HH:mm',
  ISO_FORMAT: 'yyyy-MM-dd',
  BUSINESS_DAYS_FOR_DOCS: 3,         // 3 días hábiles para documentación
  CONTEST_DURATION_DAYS: 30,         // 30 días duración por defecto
  NOTIFICATION_RETENTION_DAYS: 90,   // 90 días retención notificaciones
} as const;

// Configuración de UI
export const UI_CONFIG = {
  ANIMATION_DURATION: 300,           // 300ms animaciones
  DEBOUNCE_TIME: 300,               // 300ms debounce
  SCROLL_OFFSET: 100,               // 100px offset scroll
  MOBILE_BREAKPOINT: 768,           // 768px breakpoint móvil
  TABLET_BREAKPOINT: 1024,          // 1024px breakpoint tablet
  SIDEBAR_WIDTH: 280,               // 280px ancho sidebar
  HEADER_HEIGHT: 64,                // 64px altura header
  FOOTER_HEIGHT: 48,                // 48px altura footer
} as const;

// Estados de la aplicación
export const APP_STATES = {
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  IDLE: 'idle',
  PROCESSING: 'processing',
} as const;

// Tipos de notificación
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

// Configuración de cache
export const CACHE_CONFIG = {
  DEFAULT_TTL: 300000,              // 5 minutos
  LONG_TTL: 3600000,               // 1 hora
  SHORT_TTL: 60000,                // 1 minuto
  USER_DATA_TTL: 1800000,          // 30 minutos
  CONTEST_DATA_TTL: 600000,        // 10 minutos
} as const;

// Configuración de logging
export const LOG_CONFIG = {
  MAX_ENTRIES: 1000,
  BATCH_SIZE: 50,
  FLUSH_INTERVAL: 30000,           // 30 segundos
  ERROR_RETENTION: 86400000,       // 24 horas
} as const;

// Configuración de seguridad
export const SECURITY_CONFIG = {
  SESSION_TIMEOUT: 3600000,        // 1 hora
  TOKEN_REFRESH_THRESHOLD: 300000, // 5 minutos antes de expirar
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 900000,        // 15 minutos
  PASSWORD_HISTORY: 5,             // Últimas 5 contraseñas
} as const;

// Configuración de documentos
export const DOCUMENT_CONFIG = {
  ALLOWED_TYPES: ['application/pdf'],
  MAX_SIZE: 20 * 1024 * 1024,      // 20MB
  THUMBNAIL_SIZE: 200,              // 200px thumbnails
  PREVIEW_SIZE: 800,                // 800px preview
  COMPRESSION_QUALITY: 0.8,         // 80% calidad compresión
} as const;

// Configuración de exámenes
export const EXAM_CONFIG = {
  DEFAULT_DURATION: 7200000,        // 2 horas
  WARNING_TIME: 600000,             // 10 minutos warning
  AUTO_SAVE_INTERVAL: 30000,        // 30 segundos auto-save
  MAX_QUESTIONS: 100,               // 100 preguntas máximo
  MIN_QUESTIONS: 10,                // 10 preguntas mínimo
} as const;

// URLs y endpoints (para desarrollo)
export const DEV_ENDPOINTS = {
  API_BASE: 'http://localhost:8080/api',
  WEBSOCKET: 'ws://localhost:8080/ws',
  DOCS: 'http://localhost:8080/docs',
} as const;

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Verifique su conexión a internet.',
  UNAUTHORIZED: 'No tiene permisos para realizar esta acción.',
  SESSION_EXPIRED: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
  FILE_TOO_LARGE: 'El archivo es demasiado grande. Tamaño máximo: 20MB.',
  INVALID_FILE_TYPE: 'Tipo de archivo no válido. Solo se permiten archivos PDF.',
  GENERIC_ERROR: 'Ha ocurrido un error inesperado. Intente nuevamente.',
} as const;

// Configuración de PWA
export const PWA_CONFIG = {
  UPDATE_CHECK_INTERVAL: 3600000,   // 1 hora
  CACHE_VERSION: '1.0.0',
  OFFLINE_TIMEOUT: 5000,            // 5 segundos
  SYNC_RETRY_DELAY: 30000,          // 30 segundos
} as const;
