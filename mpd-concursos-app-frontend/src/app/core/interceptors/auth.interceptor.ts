import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/auth/token.service';
import { tap } from 'rxjs';

export const TOKEN_PREFIX = 'Bearer ';
export const HEADER_STRING = 'Authorization';

export const AuthInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const tokenService = inject(TokenService);
  const token = tokenService.getToken();
  
  if (token) {
    console.log('Token encontrado:', token);
    request = request.clone({
      setHeaders: {
        [HEADER_STRING]: `${TOKEN_PREFIX}${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      withCredentials: true
    });
    console.log('Headers configurados:', request.headers.keys());
  } else {
    console.warn('No se encontró token');
  }

  return next(request).pipe(
    tap({
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          console.error('Error 401:', error);
        }
      }
    })
  );
};