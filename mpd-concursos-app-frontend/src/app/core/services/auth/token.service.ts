import { Injectable } from '@angular/core';
import { JwtDto } from '../../dtos/jwt-dto';
import { User } from '../../models/user.model';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private tokenKey: string = 'auth_token';
  private usernameKey: string = 'auth_username';
  private authoritiesKey: string = 'auth_authorities';
  private cuit: string = 'auth_cuit';
  private refreshTokenKey: string = 'auth_refresh_token';
  private readonly apiUrl = 'http://localhost:8080/api';  // URL de tu backend

  constructor(private http: HttpClient, private router: Router) { }

  // Método para guardar el token en sessionStorage
  public saveToken(jwtDto: JwtDto): void {
    console.log('Guardando token:', jwtDto);
    
    if (!jwtDto || !jwtDto.token) {
      console.error('Token inválido o vacío');
      return;
    }

    try {
      // Decodificar el token para verificar su estructura
      const payload = this.decodeToken(jwtDto.token);
      
      console.log('Payload del token:', payload);
      console.log('Tiempo de expiración:', new Date(payload.exp * 1000).toLocaleString());
      
      // Guardar todos los datos del token
      this.setSessionItem(this.tokenKey, jwtDto.token);
      this.setSessionItem(this.usernameKey, jwtDto.username);
      this.setSessionItem(this.authoritiesKey, JSON.stringify(jwtDto.authorities));
      this.setSessionItem(this.cuit, jwtDto.cuit);

      // Guardar el refresh token si está presente
      if ('refreshToken' in jwtDto) {
        this.saveRefreshToken((jwtDto as any).refreshToken);
      }

      console.log('Elementos guardados en sessionStorage:', {
        token: !!this.getSessionItem(this.tokenKey),
        username: this.getSessionItem(this.usernameKey),
        authorities: this.getSessionItem(this.authoritiesKey),
        cuit: this.getSessionItem(this.cuit),
        refreshToken: !!this.getRefreshToken()
      });
    } catch (error) {
      console.error('Error al guardar el token:', error);
    }
  }

  private setSessionItem(key: string, value: any): void {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    sessionStorage.setItem(key, stringValue);
  }

  private getSessionItem(key: string): string | null {
    return sessionStorage.getItem(key);
  }

  private removeSessionItem(key: string): void {
    sessionStorage.removeItem(key);
  }

  // Método para obtener el token de sessionStorage
  public getToken(): string | null {
    const token = this.getSessionItem(this.tokenKey);
    if (!token) {
      console.warn('No se encontró token en sessionStorage');
      return null;
    }
    return token;
  }

  // Método para obtener el username de sessionStorage
  public getUsername(): string | null {
    return this.getSessionItem(this.usernameKey);
  }

  // Método para obtener las authorities de sessionStorage
  public getAuthorities(): { authority: string }[] {
    const authorities = this.getSessionItem(this.authoritiesKey);
    return authorities ? JSON.parse(authorities) : [];
  }

  public getCuit(): string | null {
    const cuit = this.getSessionItem(this.cuit);
    return cuit ? cuit : null;
  }

  // Método para eliminar el token y los datos de usuario de sessionStorage
  public removeToken(): void {
    this.removeSessionItem(this.tokenKey);
    this.removeSessionItem(this.usernameKey);
    this.removeSessionItem(this.authoritiesKey);
    this.removeSessionItem(this.cuit);
  }

  // Método para verificar si el usuario está autenticado
  public isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired();
  }

  // Método para obtener el usuario autenticado
  public getUser(): User | null {
    const token = this.getToken();
    const username = this.getUsername();
    const authorities = this.getAuthorities();
    const cuit = this.getCuit();

    if (token && username && cuit) {
      const jwtDto = new JwtDto(token, "", username, authorities, cuit);
      return new User(username, '', '', '', '', undefined, '', jwtDto);
    }
    return null;
  }

  // Método para manejar token expirado
  public handleExpiredToken(): void {
    console.log('Token expirado. Cerrando sesión.');
    
    // Limpiar tokens
    this.removeToken();
    this.removeRefreshToken();
    
    // Redirigir al login
    this.router.navigate(['/login']);
  }

  // Método para verificar si el token está expirado
  public isTokenExpired(): boolean {
    const token = this.getToken();
    
    if (!token) {
      console.log('No hay token');
      return true;
    }

    try {
      const payload = this.decodeToken(token);
      const currentTime = Math.floor(Date.now() / 1000);

      if (!payload || !payload.exp) {
        console.error('Token inválido o sin fecha de expiración');
        return true;
      }

      console.log('Payload del token:', payload);
      console.log('Tiempo actual:', currentTime);
      console.log('Tiempo de expiración:', payload.exp);

      // Agregar un margen de 5 segundos para evitar problemas de sincronización
      const isExpired = (payload.exp - 5) < currentTime;
      console.log('Token expirado:', isExpired);

      return isExpired;
    } catch (error) {
      console.error('Error al verificar expiración del token:', error);
      return true;
    }
  }

  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(window.atob(base64));
    } catch (error) {
      console.error('Error al decodificar token:', error);
      throw error;
    }
  }

  // Método para refrescar el token
  public refreshToken(): Observable<string> {
    console.log('Intentando refrescar token');
    
    const refreshToken = this.getRefreshToken();
    const currentToken = this.getToken();
    
    if (!refreshToken) {
      console.error('No se encontró refresh token');
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<JwtDto>(`${this.apiUrl}/auth/refresh-token`, { 
      refreshToken,
      token: currentToken // Enviar también el token actual por si el backend lo necesita
    }).pipe(
      tap(response => {
        console.log('Respuesta de refresh token:', response);
        
        if (!response || !response.token) {
          throw new Error('Respuesta de refresh token inválida');
        }
        
        // Guardar el nuevo token
        this.saveToken(response);
        
        // Guardar el refresh token si viene en la respuesta
        if ('refreshToken' in response) {
          this.saveRefreshToken((response as any).refreshToken);
        }
      }),
      map(response => response.token),
      catchError(error => {
        console.error('Error al refrescar token:', error);
        this.handleExpiredToken();
        return throwError(() => error);
      })
    );
  }

  private getRefreshToken(): string | null {
    return this.getSessionItem(this.refreshTokenKey);
  }

  private saveRefreshToken(refreshToken: string): void {
    this.setSessionItem(this.refreshTokenKey, refreshToken);
  }

  private removeRefreshToken(): void {
    this.removeSessionItem(this.refreshTokenKey);
  }
}
