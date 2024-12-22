import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/auth/token.service';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const token = tokenService.getToken();
  const isApiUrl = req.url.startsWith('http://localhost:8080/api');

  console.log('[AuthInterceptor] Procesando request:', {
    url: req.url,
    method: req.method,
    hasToken: !!token,
    isApiUrl
  });

  if (!isApiUrl) {
    return next(req);
  }

  let authReq = req;
  if (token) {
    console.log('[AuthInterceptor] Agregando token al request');
    authReq = req.clone({
      headers: req.headers
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json'),
      withCredentials: true
    });
  } else {
    console.log('[AuthInterceptor] No hay token disponible');
    authReq = req.clone({
      headers: req.headers
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json'),
      withCredentials: true
    });
  }

  console.log('[AuthInterceptor] Headers de la petición:', {
    headers: authReq.headers.keys(),
    authorization: authReq.headers.get('Authorization')
  });

  return next(authReq).pipe(
    catchError((error: any) => {
      if (error.status === 401) {
        console.log('[AuthInterceptor] Error 401 - Unauthorized');
        tokenService.removeToken();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};