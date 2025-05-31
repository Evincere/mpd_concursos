import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Servicios
import { ErrorHandlerService } from '../services/error/error-handler.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';

/**
 * Interceptor para manejar errores HTTP
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  /**
   * Constructor
   * @param errorHandler Servicio de manejo de errores
   * @param notificationService Servicio de notificaciones
   */
  constructor(
    private errorHandler: ErrorHandlerService,
    private notificationService: CustomNotificationService
  ) {}

  /**
   * Intercepta las peticiones HTTP para manejar errores
   * @param request Petición HTTP
   * @param next Manejador HTTP
   * @returns Observable de evento HTTP
   */
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Manejar el error con el servicio de errores
        const appError = this.errorHandler.handleHttpError(error);

        // Mostrar notificación de error
        this.showErrorNotification(appError.message);

        // Propagar el error
        return throwError(() => appError);
      })
    );
  }

  /**
   * Muestra una notificación de error
   * @param message Mensaje de error
   */
  private showErrorNotification(message: string): void {
    this.notificationService.error(message);
  }
}
