/**
 * Interceptor HTTP para APIs del Sistema CV
 * 
 * @description Maneja autenticación, headers, errores y logging para APIs del CV
 * @author Augment Agent
 * @date 2025-06-21
 * @version 1.0.0
 */

import { Injectable, inject } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpErrorResponse,
  HttpResponse
} from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry, tap, finalize } from 'rxjs/operators';

import { CvNotificationService } from '@core/services/cv/cv-notification.service';
import { LoadingService } from '@core/services/loading.service';
import { AuthService } from '@core/services/auth.service';

/**
 * Configuración del interceptor
 */
interface InterceptorConfig {
  enableLogging: boolean;
  enableRetry: boolean;
  maxRetries: number;
  retryDelay: number;
  enableLoadingIndicator: boolean;
  enableErrorNotifications: boolean;
  enableRequestId: boolean;
}

@Injectable()
export class CvApiInterceptor implements HttpInterceptor {
  // ===== SERVICIOS INYECTADOS =====
  private readonly notificationService = inject(CvNotificationService);
  private readonly loadingService = inject(LoadingService);
  private readonly authService = inject(AuthService);

  // ===== CONFIGURACIÓN =====
  private readonly config: InterceptorConfig = {
    enableLogging: true,
    enableRetry: true,
    maxRetries: 3,
    retryDelay: 1000,
    enableLoadingIndicator: true,
    enableErrorNotifications: true,
    enableRequestId: true
  };

  // ===== CONTADORES =====
  private activeRequests = 0;
  private requestCounter = 0;

  /**
   * Intercepta las peticiones HTTP
   */
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Solo interceptar peticiones a APIs del CV
    if (!this.isCvApiRequest(req)) {
      return next.handle(req);
    }

    // Incrementar contador de peticiones activas
    this.activeRequests++;
    this.requestCounter++;

    // Mostrar loading si está habilitado
    if (this.config.enableLoadingIndicator && this.activeRequests === 1) {
      this.loadingService.show();
    }

    // Preparar petición
    const modifiedReq = this.prepareRequest(req);

    // Log de petición
    if (this.config.enableLogging) {
      this.logRequest(modifiedReq);
    }

    const startTime = Date.now();

    return next.handle(modifiedReq).pipe(
      // Reintentos si está habilitado
      retry({
        count: this.shouldRetry(modifiedReq) ? this.config.maxRetries : 0,
        delay: (error, retryCount) => {
          if (this.shouldRetryError(error)) {
            const delay = this.config.retryDelay * Math.pow(2, retryCount - 1); // Exponential backoff
            return timer(delay);
          }
          throw error;
        }
      }),

      // Log de respuesta exitosa
      tap(event => {
        if (event instanceof HttpResponse) {
          const duration = Date.now() - startTime;
          if (this.config.enableLogging) {
            this.logResponse(modifiedReq, event, duration);
          }
        }
      }),

      // Manejo de errores
      catchError(error => {
        const duration = Date.now() - startTime;
        return this.handleError(modifiedReq, error, duration);
      }),

      // Limpieza final
      finalize(() => {
        this.activeRequests--;
        
        // Ocultar loading si no hay más peticiones activas
        if (this.config.enableLoadingIndicator && this.activeRequests === 0) {
          this.loadingService.hide();
        }
      })
    );
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Verifica si es una petición a API del CV
   */
  private isCvApiRequest(req: HttpRequest<any>): boolean {
    return req.url.includes('/api/cv/') || 
           req.url.includes('/cv/') ||
           req.headers.has('X-CV-API');
  }

  /**
   * Prepara la petición agregando headers necesarios
   */
  private prepareRequest(req: HttpRequest<any>): HttpRequest<any> {
    let headers = req.headers;

    // Agregar token de autenticación
    const token = this.authService.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    // Agregar headers estándar
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('Accept', 'application/json');
    headers = headers.set('X-Requested-With', 'XMLHttpRequest');

    // Agregar ID de petición único
    if (this.config.enableRequestId) {
      const requestId = this.generateRequestId();
      headers = headers.set('X-Request-ID', requestId);
    }

    // Agregar timestamp
    headers = headers.set('X-Timestamp', new Date().toISOString());

    // Agregar información del cliente
    headers = headers.set('X-Client-Version', '1.0.0');
    headers = headers.set('X-User-Agent', navigator.userAgent);

    // Agregar headers específicos del CV
    headers = headers.set('X-CV-API', 'true');
    headers = headers.set('X-CV-Version', '1.0.0');

    return req.clone({ headers });
  }

  /**
   * Determina si se debe reintentar la petición
   */
  private shouldRetry(req: HttpRequest<any>): boolean {
    if (!this.config.enableRetry) return false;

    // Solo reintentar peticiones GET y algunas POST específicas
    const retryableMethods = ['GET', 'HEAD'];
    const isRetryableMethod = retryableMethods.includes(req.method);
    
    // Permitir reintentos en operaciones de búsqueda
    const isSearchRequest = req.url.includes('/search') || req.url.includes('/suggestions');
    
    return isRetryableMethod || isSearchRequest;
  }

  /**
   * Determina si se debe reintentar basado en el error
   */
  private shouldRetryError(error: any): boolean {
    if (!(error instanceof HttpErrorResponse)) return false;

    // Reintentar en errores de red o servidor temporal
    const retryableStatuses = [0, 408, 429, 500, 502, 503, 504];
    return retryableStatuses.includes(error.status);
  }

  /**
   * Maneja errores de peticiones
   */
  private handleError(
    req: HttpRequest<any>, 
    error: HttpErrorResponse, 
    duration: number
  ): Observable<never> {
    // Log del error
    if (this.config.enableLogging) {
      this.logError(req, error, duration);
    }

    // Determinar tipo de error y mensaje
    const errorInfo = this.categorizeError(error);

    // Mostrar notificación si está habilitado
    if (this.config.enableErrorNotifications && errorInfo.showNotification) {
      this.showErrorNotification(errorInfo);
    }

    // Manejar errores específicos
    this.handleSpecificErrors(error);

    return throwError(() => error);
  }

  /**
   * Categoriza el error y determina el mensaje apropiado
   */
  private categorizeError(error: HttpErrorResponse): {
    type: string;
    message: string;
    showNotification: boolean;
    severity: 'error' | 'warning' | 'info';
  } {
    if (error.error instanceof ErrorEvent) {
      // Error del cliente/red
      return {
        type: 'network',
        message: 'Error de conexión. Verifica tu conexión a internet.',
        showNotification: true,
        severity: 'error'
      };
    }

    // Errores del servidor
    switch (error.status) {
      case 0:
        return {
          type: 'network',
          message: 'No se pudo conectar al servidor. Verifica tu conexión.',
          showNotification: true,
          severity: 'error'
        };

      case 400:
        return {
          type: 'validation',
          message: 'Datos inválidos en la solicitud.',
          showNotification: false, // Manejado por validación de formularios
          severity: 'warning'
        };

      case 401:
        return {
          type: 'authentication',
          message: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
          showNotification: true,
          severity: 'warning'
        };

      case 403:
        return {
          type: 'authorization',
          message: 'No tienes permisos para realizar esta acción.',
          showNotification: true,
          severity: 'warning'
        };

      case 404:
        return {
          type: 'not_found',
          message: 'El recurso solicitado no fue encontrado.',
          showNotification: true,
          severity: 'info'
        };

      case 409:
        return {
          type: 'conflict',
          message: 'Conflicto de datos. Los datos han sido modificados por otro usuario.',
          showNotification: true,
          severity: 'warning'
        };

      case 422:
        return {
          type: 'validation',
          message: 'Los datos enviados no son válidos.',
          showNotification: false,
          severity: 'warning'
        };

      case 429:
        return {
          type: 'rate_limit',
          message: 'Demasiadas solicitudes. Intenta nuevamente en unos momentos.',
          showNotification: true,
          severity: 'warning'
        };

      case 500:
        return {
          type: 'server_error',
          message: 'Error interno del servidor. Intenta nuevamente más tarde.',
          showNotification: true,
          severity: 'error'
        };

      case 502:
      case 503:
      case 504:
        return {
          type: 'server_unavailable',
          message: 'Servidor temporalmente no disponible. Intenta nuevamente.',
          showNotification: true,
          severity: 'warning'
        };

      default:
        return {
          type: 'unknown',
          message: `Error inesperado (${error.status}). Contacta al soporte técnico.`,
          showNotification: true,
          severity: 'error'
        };
    }
  }

  /**
   * Muestra notificación de error
   */
  private showErrorNotification(errorInfo: {
    message: string;
    severity: 'error' | 'warning' | 'info';
  }): void {
    switch (errorInfo.severity) {
      case 'error':
        this.notificationService.showError(errorInfo.message);
        break;
      case 'warning':
        this.notificationService.showWarning(errorInfo.message);
        break;
      case 'info':
        this.notificationService.showInfo(errorInfo.message);
        break;
    }
  }

  /**
   * Maneja errores específicos
   */
  private handleSpecificErrors(error: HttpErrorResponse): void {
    switch (error.status) {
      case 401:
        // Redirigir a login o refrescar token
        this.authService.logout();
        break;

      case 403:
        // Log del intento de acceso no autorizado
        console.warn('Unauthorized access attempt:', error.url);
        break;

      case 409:
        // Manejar conflictos de concurrencia
        this.handleConcurrencyConflict(error);
        break;
    }
  }

  /**
   * Maneja conflictos de concurrencia
   */
  private handleConcurrencyConflict(error: HttpErrorResponse): void {
    // Emitir evento para que los componentes puedan manejar el conflicto
    const event = new CustomEvent('cv-concurrency-conflict', {
      detail: {
        url: error.url,
        error: error.error
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Log de petición
   */
  private logRequest(req: HttpRequest<any>): void {
    const requestId = req.headers.get('X-Request-ID');
    console.group(`🚀 CV API Request [${requestId}]`);
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', this.sanitizeHeaders(req.headers));
    if (req.body) {
      console.log('Body:', req.body);
    }
    console.groupEnd();
  }

  /**
   * Log de respuesta exitosa
   */
  private logResponse(
    req: HttpRequest<any>, 
    res: HttpResponse<any>, 
    duration: number
  ): void {
    const requestId = req.headers.get('X-Request-ID');
    console.group(`✅ CV API Response [${requestId}] - ${duration}ms`);
    console.log('Status:', res.status);
    console.log('Headers:', this.sanitizeHeaders(res.headers));
    if (res.body) {
      console.log('Body:', res.body);
    }
    console.groupEnd();
  }

  /**
   * Log de error
   */
  private logError(
    req: HttpRequest<any>, 
    error: HttpErrorResponse, 
    duration: number
  ): void {
    const requestId = req.headers.get('X-Request-ID');
    console.group(`❌ CV API Error [${requestId}] - ${duration}ms`);
    console.error('Status:', error.status);
    console.error('Message:', error.message);
    console.error('URL:', error.url);
    if (error.error) {
      console.error('Error Body:', error.error);
    }
    console.groupEnd();
  }

  /**
   * Sanitiza headers para logging (oculta información sensible)
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized: any = {};
    const sensitiveHeaders = ['authorization', 'x-api-key', 'cookie'];

    if (headers.keys) {
      headers.keys().forEach((key: string) => {
        const lowerKey = key.toLowerCase();
        if (sensitiveHeaders.includes(lowerKey)) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = headers.get(key);
        }
      });
    }

    return sanitized;
  }

  /**
   * Genera ID único para la petición
   */
  private generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    const counter = this.requestCounter.toString(36);
    return `cv-${timestamp}-${random}-${counter}`;
  }
}
