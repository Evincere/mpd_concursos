import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { UserActivityService } from '@core/services/audit/user-activity.service';
import { UserAction, ActivityCategory, ActivitySeverity } from '@shared/interfaces/audit/user-activity.interface';

/**
 * Interfaz para los datos personalizados del tracking
 */
interface TrackingCustomData {
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  requestSize: number;
  responseSize?: number;
  userAgent: string | null;
  contentType?: string | null;
  requestBody?: unknown;
  responseBody?: unknown;
  errorDetails?: {
    message: string;
    error: unknown;
    statusText: string;
  };
}

/**
 * Interceptor para tracking automático de actividades HTTP
 */
@Injectable()
export class ActivityTrackingInterceptor implements HttpInterceptor {

  // URLs que no deben ser trackeadas
  private readonly excludedUrls = [
    '/audit/activities',
    '/audit/statistics',
    '/health',
    '/ping',
    '/metrics'
  ];

  // Mapeo de métodos HTTP a acciones
  private readonly methodActionMap: Record<string, UserAction> = {
    'GET': 'READ',
    'POST': 'CREATE',
    'PUT': 'UPDATE',
    'PATCH': 'UPDATE',
    'DELETE': 'DELETE'
  };

  constructor(private activityService: UserActivityService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Verificar si la URL debe ser excluida
    if (this.shouldExcludeUrl(req.url)) {
      return next.handle(req);
    }

    const startTime = Date.now();
    const action = this.getActionFromRequest(req);
    const resource = this.getResourceFromUrl(req.url);
    const resourceId = this.getResourceIdFromUrl(req.url);

    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          const duration = Date.now() - startTime;
          this.trackSuccessfulRequest(req, event, action, resource, resourceId, duration);
        }
      }),
      catchError(error => {
        if (error instanceof HttpErrorResponse) {
          const duration = Date.now() - startTime;
          this.trackFailedRequest(req, error, action, resource, resourceId, duration);
        }
        throw error;
      })
    );
  }

  /**
   * Verifica si una URL debe ser excluida del tracking
   */
  private shouldExcludeUrl(url: string): boolean {
    return this.excludedUrls.some(excludedUrl => url.includes(excludedUrl));
  }

  /**
   * Obtiene la acción basada en el método HTTP y la URL
   */
  private getActionFromRequest(req: HttpRequest<unknown>): UserAction {
    const method = req.method.toUpperCase();
    const url = req.url.toLowerCase();

    // Mapeos específicos basados en la URL
    if (url.includes('/login')) return 'LOGIN';
    if (url.includes('/logout')) return 'LOGOUT';
    if (url.includes('/search')) return 'SEARCH';
    if (url.includes('/export')) return 'EXPORT_DATA';
    if (url.includes('/import')) return 'IMPORT_DATA';
    if (url.includes('/concursos') && method === 'GET') return 'CONCURSO_VIEW';
    if (url.includes('/concursos') && method === 'POST') return 'CONCURSO_CREATE';
    if (url.includes('/concursos') && (method === 'PUT' || method === 'PATCH')) return 'CONCURSO_UPDATE';
    if (url.includes('/concursos') && method === 'DELETE') return 'CONCURSO_DELETE';
    if (url.includes('/inscripciones') && method === 'POST') return 'INSCRIPTION_SUBMIT';
    if (url.includes('/inscripciones') && (method === 'PUT' || method === 'PATCH')) return 'INSCRIPTION_UPDATE';
    if (url.includes('/documentos') && method === 'POST') return 'DOCUMENT_UPLOAD';
    if (url.includes('/documentos') && method === 'DELETE') return 'DOCUMENT_DELETE';
    if (url.includes('/users') && method === 'POST') return 'USER_CREATE';
    if (url.includes('/users') && (method === 'PUT' || method === 'PATCH')) return 'USER_UPDATE';
    if (url.includes('/users') && method === 'DELETE') return 'USER_DELETE';
    if (url.includes('/roles') && url.includes('/assign')) return 'ROLE_ASSIGN';
    if (url.includes('/roles') && url.includes('/remove')) return 'ROLE_REMOVE';

    // Mapeo por defecto basado en método HTTP
    return this.methodActionMap[method] || 'READ' as UserAction;
  }

  /**
   * Extrae el nombre del recurso de la URL
   */
  private getResourceFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/').filter(segment => segment.length > 0);

      // Buscar segmentos que representen recursos
      const resourceSegments = pathSegments.filter(segment =>
        !segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) && // No UUIDs
        !segment.match(/^\d+$/) && // No números puros
        segment !== 'api' &&
        segment !== 'v1' &&
        segment !== 'v2'
      );

      return resourceSegments.length > 0 ? resourceSegments[0] : 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Extrae el ID del recurso de la URL
   */
  private getResourceIdFromUrl(url: string): string | undefined {
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/').filter(segment => segment.length > 0);

      // Buscar UUIDs o IDs numéricos
      return pathSegments.find(segment =>
        segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) || // UUID
        segment.match(/^\d+$/) // Número
      );
    } catch {
      return undefined;
    }
  }

  /**
   * Registra una petición exitosa
   */
  private trackSuccessfulRequest(
    req: HttpRequest<unknown>,
    response: HttpResponse<unknown>,
    action: UserAction,
    resource: string,
    resourceId: string | undefined,
    duration: number
  ): void {
    const customData: TrackingCustomData = {
      method: req.method,
      url: req.url,
      statusCode: response.status,
      duration,
      requestSize: this.getRequestSize(req),
      responseSize: this.getResponseSize(response),
      userAgent: req.headers.get('User-Agent'),
      contentType: response.headers.get('Content-Type')
    };

    const details = {
      description: `${req.method} ${resource} completed successfully`,
      category: this.getCategoryFromAction(action),
      severity: this.getSeverityFromAction(action),
      customData
    };

    // Agregar datos específicos según el tipo de operación
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      customData.requestBody = this.sanitizeRequestBody(req.body);
    }

    if (response.body && this.shouldIncludeResponseBody(action)) {
      customData.responseBody = this.sanitizeResponseBody(response.body);
    }

    this.activityService.trackActivity(
      action,
      resource,
      resourceId,
      details,
      true
    );
  }

  /**
   * Registra una petición fallida
   */
  private trackFailedRequest(
    req: HttpRequest<unknown>,
    error: HttpErrorResponse,
    action: UserAction,
    resource: string,
    resourceId: string | undefined,
    duration: number
  ): void {
    const customData: TrackingCustomData = {
      method: req.method,
      url: req.url,
      statusCode: error.status,
      duration,
      requestSize: this.getRequestSize(req),
      userAgent: req.headers.get('User-Agent'),
      errorDetails: {
        message: error.message,
        error: error.error,
        statusText: error.statusText
      }
    };

    const details = {
      description: `${req.method} ${resource} failed with error ${error.status}`,
      category: this.getCategoryFromAction(action),
      severity: 'HIGH' as const,
      customData
    };

    this.activityService.trackActivity(
      action,
      resource,
      resourceId,
      details,
      false,
      `HTTP ${error.status}: ${error.message}`
    );
  }

  /**
   * Obtiene la categoría basada en la acción
   */
  private getCategoryFromAction(action: UserAction): ActivityCategory {
    const categoryMap: Record<string, ActivityCategory> = {
      'LOGIN': 'AUTHENTICATION',
      'LOGOUT': 'AUTHENTICATION',
      'READ': 'USER_INTERACTION',
      'CREATE': 'DATA_MODIFICATION',
      'UPDATE': 'DATA_MODIFICATION',
      'DELETE': 'DATA_MODIFICATION',
      'SEARCH': 'USER_INTERACTION',
      'EXPORT_DATA': 'SYSTEM',
      'IMPORT_DATA': 'SYSTEM',
      'USER_CREATE': 'ADMINISTRATION',
      'USER_UPDATE': 'ADMINISTRATION',
      'USER_DELETE': 'ADMINISTRATION',
      'ROLE_ASSIGN': 'ADMINISTRATION',
      'ROLE_REMOVE': 'ADMINISTRATION',
      'CONCURSO_VIEW': 'USER_INTERACTION',
      'CONCURSO_CREATE': 'DATA_MODIFICATION',
      'CONCURSO_UPDATE': 'DATA_MODIFICATION',
      'CONCURSO_DELETE': 'DATA_MODIFICATION',
      'INSCRIPTION_SUBMIT': 'DATA_MODIFICATION',
      'INSCRIPTION_UPDATE': 'DATA_MODIFICATION',
      'DOCUMENT_UPLOAD': 'DATA_MODIFICATION',
      'DOCUMENT_DELETE': 'DATA_MODIFICATION'
    };

    return categoryMap[action] || 'USER_INTERACTION';
  }

  /**
   * Obtiene la severidad basada en la acción
   */
  private getSeverityFromAction(action: UserAction): ActivitySeverity {
    const severityMap: Record<string, ActivitySeverity> = {
      'DELETE': 'HIGH',
      'USER_DELETE': 'HIGH',
      'CONCURSO_DELETE': 'HIGH',
      'LOGIN': 'MEDIUM',
      'LOGOUT': 'MEDIUM',
      'CREATE': 'MEDIUM',
      'UPDATE': 'MEDIUM',
      'ROLE_ASSIGN': 'MEDIUM',
      'ROLE_REMOVE': 'MEDIUM',
      'CONCURSO_CREATE': 'MEDIUM',
      'CONCURSO_UPDATE': 'MEDIUM',
      'INSCRIPTION_SUBMIT': 'MEDIUM',
      'INSCRIPTION_UPDATE': 'LOW',
      'DOCUMENT_UPLOAD': 'LOW',
      'DOCUMENT_DELETE': 'MEDIUM'
    };

    return severityMap[action] || 'LOW';
  }

  /**
   * Calcula el tamaño de la petición
   */
  private getRequestSize(req: HttpRequest<unknown>): number {
    if (!req.body) return 0;

    try {
      return JSON.stringify(req.body).length;
    } catch {
      return 0;
    }
  }

  /**
   * Calcula el tamaño de la respuesta
   */
  private getResponseSize(response: HttpResponse<unknown>): number {
    if (!response.body) return 0;

    try {
      // Manejar Blobs de manera especial
      if (response.body instanceof Blob) {
        return response.body.size;
      }

      // Para otros tipos de respuesta, usar JSON.stringify
      return JSON.stringify(response.body).length;
    } catch {
      return 0;
    }
  }

  /**
   * Sanitiza un objeto removiendo campos sensibles
   */
  private sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...obj };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];

    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Sanitiza el cuerpo de la petición para logging
   */
  private sanitizeRequestBody(body: unknown): unknown {
    if (!body) return null;

    // Verificar si es un objeto antes de intentar clonarlo
    if (typeof body !== 'object') {
      return body;
    }

    return this.sanitizeObject(body as Record<string, unknown>);
  }

  /**
   * Sanitiza el cuerpo de la respuesta para logging
   */
  private sanitizeResponseBody(body: unknown): unknown {
    if (!body) return null;

    // Manejar Blobs de manera especial
    if (body instanceof Blob) {
      return {
        type: 'Blob',
        size: body.size,
        mimeType: body.type
      };
    }

    try {
      // Solo incluir respuestas pequeñas para evitar logs masivos
      const bodyStr = JSON.stringify(body);
      if (bodyStr.length > 1000) {
        return '[RESPONSE_TOO_LARGE]';
      }

      // Verificar si es un objeto antes de intentar clonarlo
      if (typeof body !== 'object') {
        return body;
      }

      return this.sanitizeObject(body as Record<string, unknown>);
    } catch {
      return '[RESPONSE_NOT_SERIALIZABLE]';
    }
  }

  /**
   * Determina si se debe incluir el cuerpo de la respuesta
   */
  private shouldIncludeResponseBody(action: UserAction): boolean {
    // Solo incluir para operaciones de lectura simples
    const includeActions: UserAction[] = ['READ', 'SEARCH'];
    return includeActions.includes(action);
  }
}
