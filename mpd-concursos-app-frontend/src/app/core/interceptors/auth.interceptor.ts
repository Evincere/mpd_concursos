import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/auth/token.service';
import { Router } from '@angular/router';
import { catchError, tap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const token = tokenService.getToken();
  const isApiUrl = req.url.startsWith(environment.apiUrl);

  // Logging detallado del token
  const tokenInfo = token ? tokenService.decodeToken(token) : null;
  console.log('[AuthInterceptor] Detalles completos del token:', {
    tokenPresent: !!token,
    tokenDecoded: tokenInfo ? {
      sub: tokenInfo.sub,
      exp: tokenInfo.exp ? new Date(tokenInfo.exp * 1000).toISOString() : 'N/A',
      roles: tokenInfo.roles,
      authorities: tokenInfo.authorities,
      userId: tokenInfo.userId || tokenInfo.sub
    } : 'No decodificado'
  });

  console.log('[AuthInterceptor] Procesando request:', {
    url: req.url,
    method: req.method,
    hasToken: !!token,
    isApiUrl,
    apiBase: environment.apiUrl,
    currentPath: router.url
  });

  // No interceptamos peticiones que no van a nuestra API
  if (!isApiUrl) {
    console.log('[AuthInterceptor] Ignorando petición no-API:', req.url);
    return next(req);
  }

  // Si es una petición de login o registro, no agregamos el token
  if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
    console.log('[AuthInterceptor] Petición de autenticación, no requiere token');
    const authReq = req.clone({
      headers: req.headers
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json'),
      withCredentials: true
    });
    return next(authReq);
  }

  // Para todas las demás peticiones a la API, verificamos el token
  if (!token) {
    console.warn('[AuthInterceptor] No hay token disponible para petición protegida', {
      url: req.url,
      method: req.method
    });
    router.navigate(['/login'], { 
      queryParams: { 
        returnUrl: router.url,
        reason: 'no_token'
      }
    });
    return throwError(() => new Error('No hay token de autenticación'));
  }

  // Verificar si el token es válido
  if (!tokenService.validateToken(token)) {
    console.warn('[AuthInterceptor] Token inválido o expirado', {
      url: req.url,
      method: req.method
    });
    tokenService.removeToken();
    router.navigate(['/login'], { 
      queryParams: { 
        returnUrl: router.url,
        reason: 'invalid_token'
      }
    });
    return throwError(() => new Error('Token inválido o expirado'));
  }

  // Clonar la petición y agregar los headers de autenticación
  const authReq = req.clone({
    headers: req.headers
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json'),
    withCredentials: true
  });

  console.log('[AuthInterceptor] Headers de la petición:', {
    headers: Object.fromEntries(authReq.headers.keys().map(key => [key, authReq.headers.get(key)])),
    authorization: authReq.headers.get('Authorization')?.substring(0, 20) + '...'
  });

  // Procesar la petición y manejar errores
  return next(authReq).pipe(
    tap(response => {
      if (response instanceof HttpResponse) {
        console.log('[AuthInterceptor] Respuesta exitosa:', {
          url: req.url,
          status: response.status,
          headers: Object.fromEntries(response.headers.keys().map(key => [key, response.headers.get(key)]))
        });
      }
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('[AuthInterceptor] Error en la petición:', {
        url: error.url,
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        headers: Object.fromEntries(error.headers.keys().map(key => [key, error.headers.get(key)])),
        body: error.error,
        token: token?.substring(0, 20) + '...'
      });

      // Verificar si el error es específicamente 401
      if (error.status === 401) {
        console.warn('[AuthInterceptor] Error 401 - Unauthorized', {
          originalUrl: req.url,
          errorUrl: error.url,
          errorBody: error.error,
          tokenInfo: tokenInfo
        });
        
        // Intentar refrescar el token o forzar logout
        tokenService.removeToken();
        router.navigate(['/login'], { 
          queryParams: { 
            returnUrl: router.url,
            reason: 'unauthorized'
          }
        });
        
        return throwError(() => new Error('Sesión expirada o no autorizada'));
      }

      if (error.status === 403) {
        console.warn('[AuthInterceptor] Error 403 - Forbidden');
        return throwError(() => new Error('No tiene permisos para realizar esta acción'));
      }

      return throwError(() => error);
    })
  );
};