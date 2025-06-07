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
import { UserAction } from '@shared/interfaces/audit/user-activity.interface';

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

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
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
  private getActionFromRequest(req: HttpRequest<any>): UserAction {
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
      const idSegment = pathSegments.find(segment => 
        segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) || // UUID
        segment.match(/^\d+$/) // Número
      );

      return idSegment;
    } catch {
      return undefined;
    }
  }

  /**
   * Registra una petición exitosa
   */
  private trackSuccessfulRequest(
    req: HttpRequest<any>,
    response: HttpResponse<any>,
    action: UserAction,
    resource: string,
    resourceId: string | undefined,
    duration: number
  ): void {
    const details = {
      description: `${req.method} ${resource} completed successfully`,
      category: this.getCategoryFromAction(action),
      severity: this.getSeverityFromAction(action),
      customData: {
        method: req.method,
        url: req.url,
        statusCode: response.status,
        duration,
        requestSize: this.getRequestSize(req),
        responseSize: this.getResponseSize(response),
        userAgent: req.headers.get('User-Agent'),
        contentType: response.headers.get('Content-Type')
      }
    };

    // Agregar datos específicos según el tipo de operación
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      details.customData.requestBody = this.sanitizeRequestBody(req.body);
    }

    if (response.body && this.shouldIncludeResponseBody(action)) {
      details.customData.responseBody = this.sanitizeResponseBody(response.body);
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
    req: HttpRequest<any>,
    error: HttpErrorResponse,
    action: UserAction,
    resource: string,
    resourceId: string | undefined,
    duration: number
  ): void {
    const details = {
      description: `${req.method} ${resource} failed with error ${error.status}`,
      category: this.getCategoryFromAction(action),
      severity: 'HIGH' as const,
      customData: {
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
      }
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
  private getCategoryFromAction(action: UserAction): any {
    const categoryMap: Record<string, string> = {
      'LOGIN': 'AUTHENTICATION',
      'LOGOUT': 'AUTHENTICATION',
      'READ': 'DATA_MODIFICATION',
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
      'ROLE_REMOVE': 'ADMINISTRATION'
    };

    return categoryMap[action] || 'USER_INTERACTION';
  }

  /**
   * Obtiene la severidad basada en la acción
   */
  private getSeverityFromAction(action: UserAction): any {
    const severityMap: Record<string, string> = {
      'DELETE': 'HIGH',
      'USER_DELETE': 'HIGH',
      'CONCURSO_DELETE': 'HIGH',
      'LOGIN': 'MEDIUM',
      'LOGOUT': 'MEDIUM',
      'CREATE': 'MEDIUM',
      'UPDATE': 'MEDIUM',
      'ROLE_ASSIGN': 'MEDIUM',
      'ROLE_REMOVE': 'MEDIUM'
    };

    return severityMap[action] || 'LOW';
  }

  /**
   * Calcula el tamaño de la petición
   */
  private getRequestSize(req: HttpRequest<any>): number {
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
  private getResponseSize(response: HttpResponse<any>): number {
    if (!response.body) return 0;
    
    try {
      return JSON.stringify(response.body).length;
    } catch {
      return 0;
    }
  }

  /**
   * Sanitiza el cuerpo de la petición para logging
   */
  private sanitizeRequestBody(body: any): any {
    if (!body) return null;

    const sanitized = { ...body };
    
    // Remover campos sensibles
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Sanitiza el cuerpo de la respuesta para logging
   */
  private sanitizeResponseBody(body: any): any {
    if (!body) return null;

    // Solo incluir respuestas pequeñas para evitar logs masivos
    const bodyStr = JSON.stringify(body);
    if (bodyStr.length > 1000) {
      return '[RESPONSE_TOO_LARGE]';
    }

    const sanitized = { ...body };
    
    // Remover campos sensibles
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
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
