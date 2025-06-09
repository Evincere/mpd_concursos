import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

/**
 * Niveles de logging disponibles
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

/**
 * Interfaz para una entrada de log
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  data?: any;
  source?: string;
  userId?: string;
  sessionId?: string;
}

/**
 * Servicio centralizado de logging
 * Reemplaza logging básico con un sistema más robusto
 */
@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  private currentLogLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogEntries = 1000;
  private sessionId: string;

  constructor() {
    // Configurar nivel de log según el entorno
    this.currentLogLevel = environment.production ? LogLevel.WARN : LogLevel.DEBUG;
    this.sessionId = this.generateSessionId();
    
    // En desarrollo, mantener algunos logs en consola
    if (!environment.production) {
      this.setupConsoleLogging();
    }
  }

  /**
   * Log de debug (solo en desarrollo)
   */
  debug(message: string, data?: any, source?: string): void {
    this.log(LogLevel.DEBUG, message, data, source);
  }

  /**
   * Log de información
   */
  info(message: string, data?: any, source?: string): void {
    this.log(LogLevel.INFO, message, data, source);
  }

  /**
   * Log de advertencia
   */
  warn(message: string, data?: any, source?: string): void {
    this.log(LogLevel.WARN, message, data, source);
  }

  /**
   * Log de error
   */
  error(message: string, data?: any, source?: string): void {
    this.log(LogLevel.ERROR, message, data, source);
  }

  /**
   * Log crítico (equivalente a error pero con énfasis)
   */
  critical(message: string, data?: any, source?: string): void {
    this.log(LogLevel.ERROR, message, data, source);
  }

  /**
   * Método principal de logging
   */
  private log(level: LogLevel, message: string, data?: any, source?: string): void {
    // Verificar si el nivel actual permite este log
    if (level < this.currentLogLevel) {
      return;
    }

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      data,
      source,
      sessionId: this.sessionId,
      userId: this.getCurrentUserId()
    };

    // Agregar a la cola de logs
    this.addLogEntry(logEntry);

    // En desarrollo, también mostrar en consola
    if (!environment.production) {
      this.logToConsole(logEntry);
    }

    // En producción, enviar logs críticos al servidor
    if (environment.production && level >= LogLevel.ERROR) {
      this.sendLogToServer(logEntry);
    }
  }

  /**
   * Agrega una entrada de log a la cola
   */
  private addLogEntry(logEntry: LogEntry): void {
    this.logs.push(logEntry);

    // Mantener solo los últimos N logs
    if (this.logs.length > this.maxLogEntries) {
      this.logs.shift();
    }
  }

  /**
   * Muestra el log en consola (solo desarrollo)
   */
  private logToConsole(logEntry: LogEntry): void {
    const timestamp = logEntry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${LogLevel[logEntry.level]}]`;
    const source = logEntry.source ? ` [${logEntry.source}]` : '';
    const message = `${prefix}${source} ${logEntry.message}`;

    switch (logEntry.level) {
      case LogLevel.DEBUG:
        console.debug(message, logEntry.data);
        break;
      case LogLevel.INFO:
        console.info(message, logEntry.data);
        break;
      case LogLevel.WARN:
        console.warn(message, logEntry.data);
        break;
      case LogLevel.ERROR:
        console.error(message, logEntry.data);
        break;
    }
  }

  /**
   * Envía logs críticos al servidor
   */
  private async sendLogToServer(logEntry: LogEntry): Promise<void> {
    try {
      // TODO: Implementar envío al servidor de logs
      // await this.http.post('/api/logs', logEntry).toPromise();
    } catch (error) {
      // Evitar loops infinitos de logging - usar console.error solo para errores críticos del sistema de logging
      if (!environment.production) {
        console.error('Failed to send log to server:', error);
      }
    }
  }

  /**
   * Obtiene el ID del usuario actual
   */
  private getCurrentUserId(): string | undefined {
    try {
      // TODO: Obtener del servicio de autenticación
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Genera un ID único para la sesión
   */
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Configura logging en consola para desarrollo
   */
  private setupConsoleLogging(): void {
    // Interceptar errores no manejados
    window.addEventListener('error', (event) => {
      this.error('Unhandled error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      }, 'window.error');
    });

    // Interceptar promesas rechazadas
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        reason: event.reason
      }, 'window.unhandledrejection');
    });
  }

  /**
   * Obtiene todos los logs almacenados
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Obtiene logs filtrados por nivel
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Limpia todos los logs almacenados
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Establece el nivel de logging
   */
  setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
  }

  /**
   * Obtiene el nivel de logging actual
   */
  getLogLevel(): LogLevel {
    return this.currentLogLevel;
  }

  /**
   * Exporta logs como JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Método de conveniencia para logging de performance
   */
  performance(operation: string, startTime: number, data?: any): void {
    const duration = performance.now() - startTime;
    this.debug(`Performance: ${operation} took ${duration.toFixed(2)}ms`, {
      operation,
      duration,
      ...data
    }, 'performance');
  }

  /**
   * Método de conveniencia para logging de API calls
   */
  apiCall(method: string, url: string, status: number, duration: number, data?: any): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.DEBUG;
    this.log(level, `API ${method} ${url} - ${status} (${duration}ms)`, {
      method,
      url,
      status,
      duration,
      ...data
    }, 'api');
  }

  /**
   * Método de conveniencia para logging de navegación
   */
  navigation(from: string, to: string, data?: any): void {
    this.debug(`Navigation: ${from} -> ${to}`, {
      from,
      to,
      ...data
    }, 'navigation');
  }
}
