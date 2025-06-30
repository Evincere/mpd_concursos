/**
 * Configuración de seguridad para MPD Concursos
 * ✅ SEGURIDAD: Configuración centralizada de políticas de seguridad
 */

import { environment } from '@env/environment';

/**
 * Content Security Policy configuration
 * Configuración restrictiva para prevenir XSS y otros ataques
 */
export const CSP_CONFIG = {
  // Fuentes permitidas para scripts
  scriptSrc: [
    "'self'",
    "'unsafe-inline'", // Temporal para Angular - se debe eliminar gradualmente
    "https://fonts.googleapis.com",
    "https://cdn.jsdelivr.net",
    ...(environment.production ? [] : ["'unsafe-eval'"]) // Solo en desarrollo
  ],

  // Fuentes permitidas para estilos
  styleSrc: [
    "'self'",
    "'unsafe-inline'", // Necesario para Angular Material y estilos dinámicos
    "https://fonts.googleapis.com",
    "https://fonts.gstatic.com"
  ],

  // Fuentes permitidas para imágenes
  imgSrc: [
    "'self'",
    "data:",
    "blob:",
    "https:",
    ...(environment.production ? [] : ["http://localhost:*"])
  ],

  // Fuentes permitidas para fuentes
  fontSrc: [
    "'self'",
    "https://fonts.gstatic.com",
    "data:"
  ],

  // Fuentes permitidas para conexiones
  connectSrc: [
    "'self'",
    environment.apiUrl,
    environment.wsUrl || '',
    ...(environment.production ? [] : [
      "http://localhost:*",
      "ws://localhost:*"
    ])
  ],

  // Fuentes permitidas para frames
  frameSrc: [
    "'self'"
  ],

  // Fuentes permitidas para objetos
  objectSrc: [
    "'none'"
  ],

  // Directiva base
  baseUri: [
    "'self'"
  ],

  // Formularios
  formAction: [
    "'self'"
  ]
};

/**
 * Genera la cadena CSP completa
 */
export function generateCSPString(): string {
  if (!environment.enableCSP) {
    return '';
  }

  const policies = [
    `default-src 'self'`,
    `script-src ${CSP_CONFIG.scriptSrc.join(' ')}`,
    `style-src ${CSP_CONFIG.styleSrc.join(' ')}`,
    `img-src ${CSP_CONFIG.imgSrc.join(' ')}`,
    `font-src ${CSP_CONFIG.fontSrc.join(' ')}`,
    `connect-src ${CSP_CONFIG.connectSrc.join(' ')}`,
    `frame-src ${CSP_CONFIG.frameSrc.join(' ')}`,
    `object-src ${CSP_CONFIG.objectSrc.join(' ')}`,
    `base-uri ${CSP_CONFIG.baseUri.join(' ')}`,
    `form-action ${CSP_CONFIG.formAction.join(' ')}`
  ];

  return policies.join('; ');
}

/**
 * Configuración de headers de seguridad adicionales
 */
export const SECURITY_HEADERS = {
  // Prevenir clickjacking
  'X-Frame-Options': 'SAMEORIGIN',
  
  // Prevenir MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Habilitar XSS protection del navegador
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  
  // Content Security Policy
  'Content-Security-Policy': generateCSPString()
};

/**
 * Configuración de logging seguro
 */
export const SECURE_LOGGING_CONFIG = {
  // Campos que nunca deben loggearse
  sensitiveFields: [
    'password',
    'token',
    'authorization',
    'cookie',
    'session',
    'cuit',
    'dni',
    'email',
    'phone',
    'address'
  ],

  // Patrones de datos sensibles
  sensitivePatterns: [
    /\b\d{2}-\d{8}-\d{1}\b/, // CUIT pattern
    /\b\d{8}\b/, // DNI pattern
    /Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/, // JWT pattern
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/ // Email pattern
  ],

  // Niveles de log permitidos por ambiente
  allowedLevels: environment.production 
    ? ['error', 'warn'] 
    : ['debug', 'info', 'warn', 'error']
};

/**
 * Sanitiza datos sensibles para logging
 */
export function sanitizeForLogging(data: any): any {
  if (!data) return data;

  if (typeof data === 'string') {
    let sanitized = data;
    SECURE_LOGGING_CONFIG.sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });
    return sanitized;
  }

  if (typeof data === 'object') {
    const sanitized = { ...data };
    
    SECURE_LOGGING_CONFIG.sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    // Recursivamente sanitizar objetos anidados
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object') {
        sanitized[key] = sanitizeForLogging(sanitized[key]);
      }
    });

    return sanitized;
  }

  return data;
}
