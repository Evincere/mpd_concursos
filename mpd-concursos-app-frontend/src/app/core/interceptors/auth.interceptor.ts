import { HttpInterceptorFn, HttpErrorResponse } from  '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/auth/token.service';
import { Router } from '@angular/router';
import { catchError } from  'rxjs/operators';
import { throwError } from  'rxjs';
import { environment } from '../../../environments/environment';
import { UnifiedNotificationService } from '@shared/components/unified-notification/unified-notification.service';

// Variable global para evitar múltiples notificaciones de sesión expirada
let sessionExpiredNotificationShown = false;

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const notificationService = inject(UnifiedNotificationService);
  const token = tokenService.getToken();
  const isApiUrl = req.url.startsWith(environment.apiUrl);

  // Logging detallado del token
  // TODO: Implement proper logging - console.debug('[AuthInterceptor] Estado del token:', {
  //   tokenPresent: !!token,
  //   isApiUrl,
  //   endpoint: req.url.replace(environment.apiUrl, '')
  // });

  // No interceptamos peticiones que no van a nuestra API
  if (!isApiUrl) {
    return next(req);
  }

  // Si es una petición de login o registro, no agregamos el token
  if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
    const authReq = req.clone({
      headers: req.headers
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json'),
      withCredentials: true
    });
    return next(authReq);
  }

  // Validar el token antes de usarlo
  if (token && tokenService.validateToken(token)) {
    // TODO: Implement proper logging - console.debug('[AuthInterceptor] Token válido, agregando a la petición:', {
    //   url: req.url,
    //   method: req.method,
    //   headers: req.headers.keys()
    // });

    // No sobreescribir el Content-Type para peticiones de subida de archivos (FormData)
    let headers = req.headers.set('Authorization', `Bearer ${token}`);

    // Solo agregar Content-Type si no es una subida de archivo
    // (las subidas de archivos son detectadas por la URL o por el tipo de contenido)
    if (!req.url.includes('/upload') && !(req.body instanceof FormData)) {
      headers = headers
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json');
    }

    const authReq = req.clone({
      headers: headers,
      withCredentials: true
    });

    return next(authReq).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse) {
          if (error.status === 401) {
            // TODO: Implement proper logging - console.error('[AuthInterceptor] Error 401, sesión expirada');

            // CRITICAL FIX: Solo mostrar notificación una vez para evitar spam
            if (!sessionExpiredNotificationShown) {
              sessionExpiredNotificationShown = true;
              notificationService.error('Su sesión ha expirado. Por favor, vuelva a iniciar sesión.', 'Sesión Expirada', {
                duration: 5000,
                position: 'top-center'
              });

              // Resetear la bandera después de un tiempo para permitir futuras notificaciones
              setTimeout(() => {
                sessionExpiredNotificationShown = false;
              }, 6000);
            }

            tokenService.signOut();
            router.navigate(['/login'], {
              queryParams: {
                returnUrl: router.url,
                reason: 'session_expired'
              }
            });
          }
        }
        return throwError(() => error);
      })
    );
  }

  // Si no hay token o no es válido, redirigimos al login
  // TODO: Implement proper logging - console.debug('[AuthInterceptor] Token no válido o ausente, redirigiendo a login');
  notificationService.warning('Debe iniciar sesión para acceder a esta funcionalidad.', 'Acceso Requerido', {
    duration: 5000,
    position: 'top-center'
  });
  tokenService.signOut();
  router.navigate(['/login'], {
    queryParams: {
      returnUrl: router.url,
      reason: 'invalid_token'
    }
  });
  return throwError(() => new Error('No hay token de autenticación válido'));
};
