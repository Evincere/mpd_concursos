import { HttpInterceptorFn, HttpRequest, HttpEvent, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/auth/token.service';
import { tap, catchError, switchMap, EMPTY, Observable, throwError } from 'rxjs';
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
  
  console.log(`[AuthInterceptor] URL: ${request.url}`);
  console.log(`[AuthInterceptor] Método: ${request.method}`);

  // Verificar si la ruta actual está en la lista de rutas públicas
  const isPublicRoute = PUBLIC_ROUTES.some(route => request.url.endsWith(route));
  if (isPublicRoute) {
    console.log('[AuthInterceptor] Omitiendo interceptor para ruta pública:', request.url);
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
        // Crear una nueva solicitud con el token actualizado
        const clonedRequest = request.clone({
          headers: request.headers.set(HEADER_STRING, `${TOKEN_PREFIX}${newToken}`)
        });
        return next(clonedRequest);
      }),
      catchError((error) => {
        console.error('[AuthInterceptor] Error al refrescar token:', error);
        authService.logout();
        router.navigate(['/login']);
        return EMPTY;
      })
    );
  }

  // Clonar la solicitud y agregar el token
  const clonedRequest = request.clone({
    headers: request.headers.set(HEADER_STRING, `${TOKEN_PREFIX}${token}`)
  });

  return next(clonedRequest).pipe(
    tap({
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse) {
          if (error.status === 401) {
            console.log('[AuthInterceptor] Error 401, redirigiendo al login');
            authService.logout();
            router.navigate(['/login']);
          }
        }
      }
    })
  );
};