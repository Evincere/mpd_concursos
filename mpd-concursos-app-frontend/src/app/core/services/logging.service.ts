import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Servicio de logging profesional
 * ✅ Logs solo en desarrollo
 * ❌ Sin logs en producción
 */
@Injectable({
  providedIn: 'root'
})
export class LoggingService {

  /**
   * Log de información general
   */
  log(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.log(`[INFO] ${message}`, data || '');
    }
  }

  /**
   * Log de advertencias
   */
  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, data || '');
    }
  }

  /**
   * Log de errores
   */
  error(message: string, error?: any): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, error || '');
    }
    
    // En producción, enviar errores críticos a servicio de monitoreo
    if (environment.production && environment.monitoring?.enableErrorTracking) {
      this.sendToRemoteLogging('error', message, error);
    }
  }

  /**
   * Log de debug (solo desarrollo)
   */
  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  }

  /**
   * Log específico para CV operations
   */
  cvLog(operation: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.log(`[CV] ${operation}`, data || '');
    }
  }

  /**
   * Determinar si debe hacer log basado en configuración
   */
  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    // En producción, solo errores críticos
    if (environment.production) {
      return level === 'error' && environment.enableConsoleLogging;
    }

    // En desarrollo, según configuración
    const logLevel = environment.logLevel || 'info';
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(logLevel);
    const requestedLevelIndex = levels.indexOf(level);

    return requestedLevelIndex >= currentLevelIndex;
  }

  /**
   * Enviar logs críticos a servicio remoto (producción)
   */
  private sendToRemoteLogging(level: string, message: string, data?: any): void {
    // Implementar envío a servicio de monitoreo
    // Por ejemplo: Sentry, LogRocket, etc.
    try {
      // Placeholder para implementación futura
      if (environment.logEndpoint) {
        // fetch(environment.logEndpoint, { ... })
      }
    } catch (error) {
      // Silenciar errores de logging para evitar loops
    }
  }
}
