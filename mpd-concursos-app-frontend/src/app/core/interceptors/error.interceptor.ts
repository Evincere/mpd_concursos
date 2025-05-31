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
import { ApiErrorService } from '@core/services/error/api-error.service';

/**
 * Interceptor para manejar errores HTTP
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private apiErrorService: ApiErrorService) {}

  /**
   * Intercepta las solicitudes HTTP y maneja los errores
   * @param request Solicitud HTTP
   * @param next Manejador HTTP
   * @returns Observable con la respuesta HTTP
   */
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Ignorar errores de cancelación
        if (error.name === 'CanceledError') {
          return throwError(() => error);
        }
        
        // Manejar errores de autenticación (401)
        if (error.status === 401) {
          // Redirigir a la página de inicio de sesión si no es una solicitud de inicio de sesión
          if (!request.url.includes('/auth/login')) {
            // Aquí se podría implementar la lógica para redirigir al usuario a la página de inicio de sesión
            // o mostrar un diálogo de inicio de sesión
          }
        }
        
        // Manejar errores de autorización (403)
        if (error.status === 403) {
          // Aquí se podría implementar la lógica para redirigir al usuario a una página de acceso denegado
          // o mostrar un mensaje de error
        }
        
        // Manejar errores de servidor (500, 503, etc.)
        if (error.status >= 500) {
          // Aquí se podría implementar la lógica para mostrar un mensaje de error genérico
          // o redirigir al usuario a una página de error
        }
        
        // Delegar el manejo del error al servicio de errores
        return this.apiErrorService.handleError(error);
      })
    );
  }
}
