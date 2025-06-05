import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

// Servicios
import { ErrorHandlerService } from '../services/error/error-handler.service';
import { UnifiedNotificationService } from '@shared/components/unified-notification/unified-notification.service';
import { ErrorType } from '../services/error/error-handler.service';

/**
 * Interceptor funcional para manejar errores HTTP
 * @param req Petición HTTP
 * @param next Manejador HTTP
 * @returns Observable de evento HTTP
 */
export const ErrorInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const errorHandler = inject(ErrorHandlerService);
  const notificationService = inject(UnifiedNotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Endpoints que deben mantener HttpErrorResponse original para manejo específico
      const preserveOriginalErrorEndpoints = ['/inscriptions/', '/inscripciones/'];
      const shouldPreserveOriginal = preserveOriginalErrorEndpoints.some(endpoint => req.url.includes(endpoint));

      if (shouldPreserveOriginal) {
        // Para endpoints de inscripciones, mantener el error original y manejar notificaciones selectivamente
        if (error.status >= 500) {
          // Solo mostrar notificación para errores críticos del servidor
          notificationService.error('Error del servidor en inscripciones. Por favor, intente nuevamente.');
        } else if (error.status === 404) {
          // Log informativo para errores 404 esperados
          console.log(`ℹ️ [ErrorInterceptor] Recurso no encontrado (esperado): ${req.method} ${req.url}`);
        } else if (error.status === 403) {
          // Notificación específica para errores de autorización en inscripciones
          notificationService.error('No tiene permisos para realizar esta acción en inscripciones.');
        }

        // Siempre propagar HttpErrorResponse original para inscripciones
        return throwError(() => error);
      }

      // Para otros endpoints, procesar errores normalmente con AppError
      const appError = errorHandler.handleHttpError(error);

      // Mostrar notificación de error solo si no es un error de autorización (403)
      // ya que estos errores se manejan con diálogos específicos
      if (appError.type !== ErrorType.AUTHORIZATION ||
          (error.status !== 403 && !error.url?.includes('/auth/login'))) {
        notificationService.error(appError.message);
      }

      // Propagar el AppError para otros endpoints
      return throwError(() => appError);
    })
  );
};
