import { HttpInterceptorFn, HttpRequest, HttpEvent, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/auth/token.service';
import { tap, catchError, switchMap, EMPTY, Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const TOKEN_PREFIX = 'Bearer ';
export const HEADER_STRING = 'Authorization';

export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const authService = inject(AuthService);
  
  console.log(`[AuthInterceptor] URL: ${request.url}`);
  console.log(`[AuthInterceptor] Método: ${request.method}`);

  // Omitir interceptor para solicitudes de login y refresh token
  if (request.url.includes('/login') || request.url.includes('/refresh-token')) {
    console.log('[AuthInterceptor] Omitiendo interceptor para:', request.url);
    return next(request);
  }

  const token = tokenService.getToken();
  console.log(`[AuthInterceptor] Token actual: ${token ? 'presente' : 'ausente'}`);

  if (!token) {
    console.warn('[AuthInterceptor] No hay token disponible');
    authService.logout();
    router.navigate(['/login']);
    return EMPTY;
  }

  // Verificar si el token está expirado antes de hacer la solicitud
  if (tokenService.isTokenExpired()) {
    console.log('[AuthInterceptor] Token expirado, intentando refresh');
    
    return tokenService.refreshToken().pipe(
      switchMap((newToken) => {
        console.log('[AuthInterceptor] Token refrescado exitosamente');
        return next(
          request.clone({
            setHeaders: {
              [HEADER_STRING]: `${TOKEN_PREFIX}${newToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          })
        );
      }),
      catchError((error) => {
        console.error('[AuthInterceptor] Error al refrescar token:', error);
        authService.logout();
        router.navigate(['/login']);
        return EMPTY;
      })
    );
  }

  // Si el token es válido, agregar a la solicitud
  const clonedRequest = request.clone({
    setHeaders: {
      [HEADER_STRING]: `${TOKEN_PREFIX}${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  console.log('[AuthInterceptor] Headers configurados:', clonedRequest.headers.keys());

  return next(clonedRequest).pipe(
    tap({
      error: (error: HttpErrorResponse) => {
        console.error('[AuthInterceptor] Error en la solicitud:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
          error: error.error
        });

        if (error.status === 401) {
          console.error('[AuthInterceptor] Error de autenticación');
          if (error.error && error.error.message) {
            console.error('[AuthInterceptor] Mensaje del servidor:', error.error.message);
          }
          tokenService.handleExpiredToken();
        }
      }
    }),
    catchError(error => {
      if (error.status === 401) {
        return EMPTY;
      }
      return throwError(() => error);
    })
  );
};