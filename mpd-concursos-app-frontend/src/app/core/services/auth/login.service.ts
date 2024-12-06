import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, tap, throwError, map } from 'rxjs';
import { JwtDto } from '../../dtos/jwt-dto';
import { LoginUser } from '../../models/login-user.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) { }

  public login(loginUser: LoginUser): Observable<JwtDto> {
    if (!loginUser.isValid()) {
      return throwError(() => new Error('Credenciales inválidas'));
    }

    const payload = {
      username: loginUser.username,
      password: loginUser.password
    };

    console.log('[LoginService] Intentando login con:', { 
      username: loginUser.username,
      passwordLength: loginUser.password?.length,
      apiUrl: `${this.apiUrl}/login`
    });
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });

    return this.http.post<JwtDto>(`${this.apiUrl}/login`, payload, {
      headers,
      observe: 'response',
      withCredentials: false
    }).pipe(
      tap(response => {
        console.log('[LoginService] Login exitoso. Response:', {
          status: response.status,
          headers: {
            'content-type': response.headers.get('content-type'),
            'authorization': response.headers.has('authorization')
          }
        });
      }),
      map(response => {
        if (!response.body) {
          throw new Error('Respuesta vacía del servidor');
        }
        const token = response.headers.get('authorization');
        if (token) {
          response.body.token = token.replace('Bearer ', '');
        }
        return response.body;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('[LoginService] Error en login:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          message: error.message
        });

        if (error.error?.error) {
          return throwError(() => new Error(error.error.error));
        }

        if (error.status === 0) {
          return throwError(() => new Error('No se pudo conectar con el servidor'));
        }
        if (error.status === 401) {
          return throwError(() => new Error('Credenciales incorrectas'));
        }
        if (error.status === 404) {
          return throwError(() => new Error('Usuario no encontrado'));
        }
        
        return throwError(() => new Error('Error al intentar iniciar sesión'));
      })
    );
  }
}
