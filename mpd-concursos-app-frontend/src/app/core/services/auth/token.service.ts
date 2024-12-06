import { Injectable } from '@angular/core';
import { JwtDto } from '../../dtos/jwt-dto';
import { User } from '../../models/user.model';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, tap, map, catchError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private TOKEN_KEY = 'auth-token';
  private USER_KEY = 'auth-user';
  private REFRESH_TOKEN_KEY = 'auth-refresh-token';
  private USERNAME_KEY = 'auth-username';
  private AUTHORITIES_KEY = 'auth-authorities';
  private CUIT_KEY = 'auth-cuit';
  private readonly apiUrl = 'http://localhost:8080/api';  // URL de tu backend

  constructor(private http: HttpClient, private router: Router) { }

  public saveToken(jwtDto: JwtDto): void {
    console.log('[TokenService] Guardando token y datos de usuario');
    
    // Guardar token
    window.sessionStorage.removeItem(this.TOKEN_KEY);
    window.sessionStorage.setItem(this.TOKEN_KEY, jwtDto.token);
    console.log('[TokenService] Token guardado');
    
    // Extraer y guardar usuario
    const user = this.extractUserFromToken(jwtDto.token);
    if (user) {
      this.saveUser(user);
      console.log('[TokenService] Usuario extraído y guardado:', user);
    } else {
      console.warn('[TokenService] No se pudo extraer usuario del token');
    }

    // Guardar datos adicionales
    window.sessionStorage.setItem(this.USERNAME_KEY, jwtDto.username);
    window.sessionStorage.setItem(this.AUTHORITIES_KEY, JSON.stringify(jwtDto.authorities));
    window.sessionStorage.setItem(this.CUIT_KEY, jwtDto.cuit);
    
    console.log('[TokenService] Datos guardados:', {
      username: jwtDto.username,
      authorities: jwtDto.authorities,
      cuit: jwtDto.cuit
    });

    if ('refreshToken' in jwtDto) {
      this.saveRefreshToken((jwtDto as any).refreshToken);
      console.log('[TokenService] Refresh token guardado');
    }
  }

  public getToken(): string | null {
    return window.sessionStorage.getItem(this.TOKEN_KEY);
  }

  public removeToken(): void {
    window.sessionStorage.removeItem(this.TOKEN_KEY);
    window.sessionStorage.removeItem(this.USERNAME_KEY);
    window.sessionStorage.removeItem(this.AUTHORITIES_KEY);
    window.sessionStorage.removeItem(this.CUIT_KEY);
  }

  public decodeToken(token: string): any {
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error('Error decodificando el token:', error);
      return null;
    }
  }

  public saveUser(user: User): void {
    window.sessionStorage.removeItem(this.USER_KEY);
    window.sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  public getUser(): User | null {
    const user = window.sessionStorage.getItem(this.USER_KEY);
    if (user) {
      return JSON.parse(user);
    }
    return null;
  }

  public getAuthorities(): any[] {
    console.log('[TokenService] Obteniendo autoridades...');
    const token = this.getToken();
    
    if (!token) {
      console.warn('[TokenService] No hay token disponible');
      return [];
    }

    const decodedToken = this.decodeToken(token);
    console.log('[TokenService] Token decodificado:', {
      hasAuthorities: !!decodedToken?.authorities,
      authorities: decodedToken?.authorities
    });
    
    // Intentar obtener autoridades del token primero
    if (decodedToken?.authorities) {
      return decodedToken.authorities;
    }
    
    // Si no hay en el token, intentar obtener del sessionStorage
    const storedAuthorities = window.sessionStorage.getItem(this.AUTHORITIES_KEY);
    if (storedAuthorities) {
      const authorities = JSON.parse(storedAuthorities);
      console.log('[TokenService] Autoridades desde sessionStorage:', authorities);
      return authorities;
    }
    
    console.warn('[TokenService] No se encontraron autoridades');
    return [];
  }

  public getCuit(): string | null {
    const token = this.getToken();
    if (!token) return null;

    const decodedToken = this.decodeToken(token);
    return decodedToken?.cuit || null;
  }

  public getUsername(): string | null {
    return window.sessionStorage.getItem(this.USERNAME_KEY);
  }

  public isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired();
  }

  public isTokenExpired(): boolean {
    const token = this.getToken();
    
    if (!token) {
      console.log('[TokenService] No hay token');
      return true;
    }

    try {
      const decodedToken = this.decodeToken(token);
      console.log('[TokenService] Token decodificado:', decodedToken);
      
      if (!decodedToken || !decodedToken.exp) {
        console.error('[TokenService] Token inválido o sin fecha de expiración');
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      // Agregar un margen de 30 segundos para evitar problemas de sincronización
      const margin = 30;
      const isExpired = (decodedToken.exp - margin) < currentTime;

      console.log('[TokenService] Verificación de expiración:', {
        currentTime,
        expirationTime: decodedToken.exp,
        margin,
        isExpired
      });

      return isExpired;
    } catch (error) {
      console.error('[TokenService] Error al verificar expiración del token:', error);
      return true;
    }
  }

  public refreshToken(): Observable<string> {
    console.log('[TokenService] Intentando refrescar token');
    
    const refreshToken = this.getRefreshToken();
    const currentToken = this.getToken();
    
    if (!refreshToken || !currentToken) {
      console.error('[TokenService] No se encontró refresh token o token actual');
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<JwtDto>(`${this.apiUrl}/auth/refresh-token`, { 
      refreshToken,
      token: currentToken
    }).pipe(
      map(response => {
        console.log('[TokenService] Respuesta de refresh token:', response);
        
        if (!response || !response.token) {
          throw new Error('Respuesta de refresh token inválida');
        }
        
        // Guardar el nuevo token y datos asociados
        this.saveToken(response);
        
        // Si hay un nuevo refresh token, guardarlo también
        if ('refreshToken' in response) {
          this.saveRefreshToken((response as any).refreshToken);
        }

        return response.token;
      }),
      catchError(error => {
        console.error('[TokenService] Error al refrescar token:', error);
        this.handleExpiredToken();
        return throwError(() => error);
      })
    );
  }

  private getRefreshToken(): string | null {
    return window.sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private saveRefreshToken(refreshToken: string): void {
    window.sessionStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  private removeRefreshToken(): void {
    window.sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  private extractUserFromToken(token: string): User | null {
    try {
      const decodedToken = this.decodeToken(token);
      if (!decodedToken) return null;

      return new User({
        id: decodedToken.userId || decodedToken.sub,
        username: decodedToken.sub,
        cuit: decodedToken.cuit
      });
    } catch (error) {
      console.error('Error extrayendo usuario del token:', error);
      return null;
    }
  }

  public handleExpiredToken(): void {
    console.log('[TokenService] Manejando token expirado');
    this.removeToken();
    this.removeRefreshToken();
    this.router.navigate(['/login']);
  }
}
