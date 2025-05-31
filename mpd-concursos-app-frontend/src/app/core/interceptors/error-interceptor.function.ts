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
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';
import { ErrorType } from '../services/error/error-handler.service';

/**
 * Interceptor funcional para manejar errores HTTP
 * @param req Petición HTTP
 * @param next Manejador HTTP
 * @returns Observable de evento HTTP
 */
export const ErrorInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const errorHandler = inject(ErrorHandlerService);
  const notificationService = inject(CustomNotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Manejar el error con el servicio de errores
      const appError = errorHandler.handleHttpError(error);

      // Mostrar notificación de error solo si no es un error de autorización (403)
      // ya que estos errores se manejan con diálogos específicos
      if (appError.type !== ErrorType.AUTHORIZATION ||
          (error.status !== 403 && !error.url?.includes('/auth/login'))) {
        notificationService.error(appError.message);
      }

      // Propagar el error
      return throwError(() => appError);
    })
  );
};
