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
      const preserveOriginalErrorEndpoints = ['/inscriptions/', '/inscripciones/', '/postulaciones/'];
      const shouldPreserveOriginal = preserveOriginalErrorEndpoints.some(endpoint => req.url.includes(endpoint));

      // CRITICAL FIX: Endpoints que no deben mostrar notificaciones automáticas para listas vacías
      const silentEndpoints = ['/documentos/queue/', '/documents/queue/', '/postulaciones/', '/notifications/'];
      const isSilentEndpoint = silentEndpoints.some(endpoint => req.url.includes(endpoint));

      if (isSilentEndpoint) {
        // Para endpoints silenciosos, no mostrar notificaciones automáticas
        // Los componentes manejan los errores específicamente
        if (error.status === 404 && req.url.includes('/postulaciones/')) {
          // 404 en postulaciones es normal para usuarios sin postulaciones
          console.info(`[ErrorInterceptor] No hay postulaciones para el usuario (404) - comportamiento normal`);
        } else {
          console.warn(`[ErrorInterceptor] Error en endpoint silencioso: ${error.status} - ${req.url}`);
        }
        return throwError(() => error);
      }

      if (shouldPreserveOriginal) {
        // Para endpoints específicos, mantener el error original y suprimir notificaciones automáticas
        if (error.status >= 500) {
          // Lista de endpoints que NO deben mostrar notificaciones automáticas
          const silentEndpoints = [
            '/api/users/profile',
            '/api/v1/notifications',
            '/api/inscriptions/user/'
          ];

          const shouldShowNotification = !silentEndpoints.some(endpoint => req.url.includes(endpoint));

          if (shouldShowNotification) {
            // Solo mostrar notificación para errores críticos del servidor, pero evitar spam
            const errorKey = `${req.method}_${req.url}_${error.status}`;
            const lastErrorTime = (window as any).lastErrorNotifications?.[errorKey] || 0;
            const now = Date.now();

            // Solo mostrar notificación si han pasado al menos 10 segundos desde la última notificación del mismo error
            if (now - lastErrorTime > 10000) {
              notificationService.error('Error del servidor. Por favor, intente nuevamente.');

              // Guardar timestamp de la notificación
              if (!(window as any).lastErrorNotifications) {
                (window as any).lastErrorNotifications = {};
              }
              (window as any).lastErrorNotifications[errorKey] = now;
            }
          }
        } else if (error.status === 404) {
          // Log informativo para errores 404 esperados - no mostrar notificación para usuarios nuevos sin postulaciones
          console.info(`ℹ️ [ErrorInterceptor] Recurso no encontrado (esperado para usuarios nuevos): ${req.method} ${req.url}`);
        } else if (error.status === 403) {
          // Notificación específica para errores de autorización en inscripciones
          notificationService.error('No tiene permisos para realizar esta acción.');
        }

        // Siempre propagar HttpErrorResponse original para inscripciones
        return throwError(() => error);
      }

      // CRITICAL FIX: Agregar endpoint de registro a endpoints silenciosos para evitar notificaciones automáticas
      const authEndpoints = ['/auth/register', '/auth/login'];
      const isAuthEndpoint = authEndpoints.some(endpoint => req.url.includes(endpoint));

      if (isAuthEndpoint) {
        // Para endpoints de autenticación, no mostrar notificaciones automáticas
        // Los componentes manejan los errores específicamente con HttpErrorDisplayComponent
        console.info(`[ErrorInterceptor] Error en endpoint de autenticación: ${error.status} - ${req.url} - Manejado por componente específico`);
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
