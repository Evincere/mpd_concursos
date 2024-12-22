import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { JwtDto } from '../../dtos/jwt-dto';
import { LoginUser } from '../../models/login-user.model';
import { environment } from '../../../../environments/environment';
import { TokenService } from './token.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private router: Router
  ) { }

  public login(loginUser: LoginUser): Observable<JwtDto> {
    if (!loginUser.isValid()) {
      console.error('[LoginService] Credenciales inválidas');
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
    
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    return this.http.post<JwtDto>(`${this.apiUrl}/login`, payload, {
      headers,
      withCredentials: true
    }).pipe(
      tap(response => {
        console.log('[LoginService] Respuesta del servidor:', response);
        
        if (!response || !response.token) {
          console.error('[LoginService] Respuesta inválida del servidor');
          throw new Error('Respuesta inválida del servidor');
        }

        this.tokenService.saveToken(response);
        console.log('[LoginService] Token guardado exitosamente');
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('[LoginService] Error en login:', error);
        if (error.status === 401) {
          return throwError(() => new Error('Credenciales incorrectas'));
        }
        return throwError(() => new Error('Error en el servidor'));
      })
    );
  }

  public logout(): void {
    this.tokenService.removeToken();
    this.router.navigate(['/login']);
  }
}
