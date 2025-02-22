import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { TokenService } from './token.service';
import { environment } from '@env/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly PUBLIC_ENDPOINTS = [
    '/auth/login',
    '/auth/refresh',
    '/activity-logs'  // Agregamos este endpoint como público
  ];

  constructor(
    private tokenService: TokenService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const isApiUrl = request.url.startsWith(environment.apiUrl);
    const isPublicEndpoint = this.PUBLIC_ENDPOINTS.some(endpoint =>
      request.url.includes(endpoint)
    );

    // No interceptamos si no es una URL de la API o es un endpoint público
    if (!isApiUrl || isPublicEndpoint) {
      return next.handle(request);
    }

    const token = this.tokenService.getToken();
    if (token) {
      request = this.addToken(request, token);
    } else {
      // Solo redirigimos si no es un endpoint público y se requiere token
      if (!isPublicEndpoint) {
        this.router.navigate(['/login']);
        return throwError(() => new Error('No hay token de autenticación válido'));
      }
    }

    return next.handle(request).pipe(
      catchError(error => {
        if (error.status === 401) {
          this.tokenService.signOut();
          this.router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}
