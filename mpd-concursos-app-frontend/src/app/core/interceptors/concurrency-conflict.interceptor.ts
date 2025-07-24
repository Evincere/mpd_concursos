import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { UnifiedNotificationService } from '@shared/components/unified-notification/unified-notification.service';
import { LoggingService } from '@core/services/logging/logging.service';

/**
 * Interceptor funcional especializado para manejar conflictos de concurrencia (HTTP 409)
 *
 * Características:
 * - Detecta headers específicos de conflictos de concurrencia
 * - Maneja diferentes tipos de conflictos (documentos, inscripciones, notificaciones)
 * - Implementa retry automático cuando es apropiado
 * - Notifica al usuario con mensajes claros
 * - Emite eventos para recarga de datos
 */
export const concurrencyConflictInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(UnifiedNotificationService);
  const loggingService = inject(LoggingService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Solo manejar errores de concurrencia
      if (isConcurrencyConflict(error)) {
        return handleConcurrencyConflict(error, req, next, notificationService, loggingService);
      }

      // Para otros errores, continuar con el manejo normal
      return throwError(() => error);
    })
  );
};

/**
 * Determina si el error es un conflicto de concurrencia
 */
function isConcurrencyConflict(error: HttpErrorResponse): boolean {
  return error.status === 409 &&
         error.headers.has('X-Concurrency-Conflict') &&
         error.headers.get('X-Concurrency-Conflict') === 'true';
}

/**
 * Maneja conflictos de concurrencia específicos
 */
function handleConcurrencyConflict(
  error: HttpErrorResponse,
  originalRequest: any,
  next: any,
  notificationService: UnifiedNotificationService,
  loggingService: LoggingService
): Observable<HttpEvent<any>> {

  const conflictType = error.headers.get('X-Conflict-Type') || 'GENERIC_CONCURRENCY_CONFLICT';
  const retryAfter = parseInt(error.headers.get('X-Retry-After') || '0', 10);

  loggingService.warn('🔒 [ConcurrencyInterceptor] Conflicto de concurrencia detectado', {
    conflictType,
    url: originalRequest.url,
    method: originalRequest.method,
    retryAfter
  });

  // Manejar según el tipo de conflicto
  switch (conflictType) {
    case 'DOCUMENT_CONCURRENCY_CONFLICT':
      return handleDocumentConflict(error, notificationService);

    case 'INSCRIPTION_CONCURRENCY_CONFLICT':
      return handleInscriptionConflict(error, notificationService);

    case 'NOTIFICATION_CONCURRENCY_CONFLICT':
      return handleNotificationConflict(error, originalRequest, next, retryAfter, loggingService);

    case 'OPERATION_LOCK_ACTIVE':
      return handleOperationLock(error, originalRequest, next, retryAfter, notificationService, loggingService);

    default:
      return handleGenericConflict(error, notificationService);
  }
}

/**
 * Maneja conflictos específicos de documentos
 */
function handleDocumentConflict(
  error: HttpErrorResponse,
  notificationService: UnifiedNotificationService
): Observable<HttpEvent<any>> {

  notificationService.info(
    'El documento fue modificado por otra operación. Se actualizará la lista automáticamente.',
    'Documento actualizado',
    { duration: 5000 }
  );

  // Emitir evento para recarga de documentos
  emitDocumentReloadEvent();

  // No reintentar automáticamente para conflictos de documentos
  // El usuario debe ver el estado actualizado
  return throwError(() => error);
}

/**
 * Maneja conflictos de inscripciones
 */
function handleInscriptionConflict(
  error: HttpErrorResponse,
  notificationService: UnifiedNotificationService
): Observable<HttpEvent<any>> {

  notificationService.warning(
    'La inscripción fue actualizada por otra operación. Por favor, recargue la página.',
    'Inscripción modificada',
    { duration: 7000 }
  );

  // Emitir evento para recarga de inscripciones
  emitInscriptionReloadEvent();

  return throwError(() => error);
}

/**
 * Maneja conflictos de notificaciones (retry automático)
 */
function handleNotificationConflict(
  error: HttpErrorResponse,
  originalRequest: any,
  next: any,
  retryAfter: number,
  loggingService: LoggingService
): Observable<HttpEvent<any>> {

  loggingService.info('🔄 [ConcurrencyInterceptor] Reintentando operación de notificación automáticamente');

  // Para notificaciones, reintentar automáticamente después del delay
  if (retryAfter > 0) {
    return timer(retryAfter * 1000).pipe(
      switchMap(() => next(originalRequest))
    ) as Observable<HttpEvent<any>>;
  }

  return next(originalRequest) as Observable<HttpEvent<any>>;
}

/**
 * Maneja locks de operación activos
 */
function handleOperationLock(
  error: HttpErrorResponse,
  originalRequest: any,
  next: any,
  retryAfter: number,
  notificationService: UnifiedNotificationService,
  loggingService: LoggingService
): Observable<HttpEvent<any>> {

  notificationService.info(
    'Hay una operación en curso. Por favor, espere un momento.',
    'Operación en progreso',
    { duration: 3000 }
  );

  // Reintentar después del tiempo sugerido
  if (retryAfter > 0) {
    loggingService.info(`🔄 [ConcurrencyInterceptor] Reintentando después de ${retryAfter} segundos`);

    return timer(retryAfter * 1000).pipe(
      switchMap(() => next(originalRequest))
    ) as Observable<HttpEvent<any>>;
  }

  return throwError(() => error);
}

/**
 * Maneja conflictos genéricos
 */
function handleGenericConflict(
  error: HttpErrorResponse,
  notificationService: UnifiedNotificationService
): Observable<HttpEvent<any>> {

  notificationService.warning(
    'El recurso fue modificado por otra operación. Por favor, recargue la página.',
    'Conflicto de concurrencia',
    { duration: 5000 }
  );

  return throwError(() => error);
}

/**
 * Emite evento para recarga de documentos
 */
function emitDocumentReloadEvent(): void {
  // Usar el sistema de eventos del navegador para comunicación entre componentes
  window.dispatchEvent(new CustomEvent('document-reload-required', {
    detail: {
      timestamp: Date.now(),
      reason: 'concurrency-conflict'
    }
  }));
}

/**
 * Emite evento para recarga de inscripciones
 */
function emitInscriptionReloadEvent(): void {
  window.dispatchEvent(new CustomEvent('inscription-reload-required', {
    detail: {
      timestamp: Date.now(),
      reason: 'concurrency-conflict'
    }
  }));
}
