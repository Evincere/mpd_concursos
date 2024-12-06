import { HttpInterceptorFn, HttpRequest, HttpEvent, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/auth/token.service';
import { tap, catchError, switchMap, EMPTY, Observable, throwError, of } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const TOKEN_PREFIX = 'Bearer ';
export const HEADER_STRING = 'Authorization';

// Rutas públicas que no requieren token
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh-token'
];

export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const authService = inject(AuthService);

  console.debug('[AuthInterceptor] Processing request:', request.url);

  // Verificar si la ruta actual está en la lista de rutas públicas
  const isPublicRoute = PUBLIC_ROUTES.some(route => request.url.includes(route));
  if (isPublicRoute) {
    console.debug('[AuthInterceptor] Public URL detected, skipping token');
    return next(request);
  }

  // Agregamos el token a la solicitud
  const token = tokenService.getToken();
  if (token) {
    request = request.clone({
      headers: request.headers.set(HEADER_STRING, `${TOKEN_PREFIX}${token}`)
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      console.debug('[AuthInterceptor] Error intercepted:', error.status, error.message);

      if (error.status === 401) {
        console.debug('[AuthInterceptor] 401 error detected, checking token status');

        // Si el token está expirado, intentamos refrescarlo
        if (tokenService.isTokenExpired()) {
          console.debug('[AuthInterceptor] Token expired, attempting refresh');
          return tokenService.refreshToken().pipe(
            switchMap((newToken) => {
              if (!newToken) {
                throw new Error('No se pudo obtener un nuevo token');
              }
              // Crear una nueva solicitud con el token actualizado
              const clonedRequest = request.clone({
                headers: request.headers.set(HEADER_STRING, `${TOKEN_PREFIX}${newToken}`)
              });
              return next(clonedRequest);
            }),
            catchError((refreshError) => {
              console.error('[AuthInterceptor] Error al refrescar token:', refreshError);
              authService.logout();
              router.navigate(['/login']);
              return EMPTY;
            })
          );
        } else {
          console.debug('[AuthInterceptor] Token not expired but got 401, redirecting to login');
          authService.logout();
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};