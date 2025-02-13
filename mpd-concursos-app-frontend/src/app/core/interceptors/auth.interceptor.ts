import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/auth/token.service';
import { Router } from '@angular/router';
import { catchError, tap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);
  const token = tokenService.getToken();
  const isApiUrl = req.url.startsWith(environment.apiUrl);

  // Logging detallado del token
  console.log('[AuthInterceptor] Estado del token:', {
    tokenPresent: !!token,
    isApiUrl,
    endpoint: req.url.replace(environment.apiUrl, '')
  });

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
    console.log('[AuthInterceptor] Token válido, agregando a la petición:', {
      url: req.url,
      method: req.method,
      headers: req.headers.keys()
    });
    const authReq = req.clone({
      headers: req.headers
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json'),
      withCredentials: true
    });

    return next(authReq).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse) {
          if (error.status === 401) {
            console.log('[AuthInterceptor] Error 401, sesión expirada');
            snackBar.open('Su sesión ha expirado. Por favor, vuelva a iniciar sesión.', 'Cerrar', {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
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
  console.log('[AuthInterceptor] Token no válido o ausente, redirigiendo a login');
  snackBar.open('Debe iniciar sesión para acceder a esta funcionalidad.', 'Cerrar', {
    duration: 5000,
    horizontalPosition: 'center',
    verticalPosition: 'top',
    panelClass: ['warning-snackbar']
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
