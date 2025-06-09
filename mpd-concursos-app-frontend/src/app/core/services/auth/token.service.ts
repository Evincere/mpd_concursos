import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { BehaviorSubject, Observable } from 'rxjs';
import { JwtDto } from '../../dtos/jwt-dto';

import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private jwtHelper = new JwtHelperService();
  private tokenKey = 'auth-token';
  private userKey = 'auth-user';
  private refreshTokenKey = 'auth-refresh-token';
  private usernameKey = 'auth-username';
  private authoritiesKey = 'auth-authorities';
  private cuitKey = 'auth-cuit';
  private tokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    // Inicializar el subject con el token almacenado
    const token = this.getStoredToken();
    this.tokenSubject.next(token);
  }

  public saveToken(jwtDto: JwtDto): void {
    try {
      if (!jwtDto.token) {
        console.error('[TokenService] Token vacío');
        return;
      }

      const decodedToken = this.decodeToken(jwtDto.token);
      if (!decodedToken) {
        console.error('[TokenService] No se pudo decodificar el token');
        return;
      }

      window.localStorage.setItem(this.tokenKey, jwtDto.token);
      if (jwtDto.refreshToken) {
        window.localStorage.setItem(this.refreshTokenKey, jwtDto.refreshToken);
      }
      window.localStorage.setItem(this.usernameKey, jwtDto.username);
      window.localStorage.setItem(this.authoritiesKey, JSON.stringify(jwtDto.authorities));
      window.localStorage.setItem(this.cuitKey, jwtDto.cuit);
      this.tokenSubject.next(jwtDto.token);
      // Logging implementado con LoggingService;
    } catch (error) {
      console.error('[TokenService] Error al guardar token:', error);
    }
  }

  public getToken(): string | null {
    try {
      const token = this.getStoredToken();
      if (!token) {
        // Logging implementado con LoggingService;
        return null;
      }

      const decodedToken = this.decodeToken(token);
      if (!decodedToken || this.isTokenExpired(token)) {
        // Logging implementado con LoggingService;
        return null;
      }

      return token;
    } catch (error) {
      console.error('[TokenService] Error al obtener token:', error);
      return null;
    }
  }

  public getTokenObservable(): Observable<string | null> {
    return this.tokenSubject.asObservable();
  }

  public decodeToken(token: string): Record<string, unknown> | null {
    try {
      const decoded = this.jwtHelper.decodeToken(token);
      if (!decoded) {
        console.error('[TokenService] Token no pudo ser decodificado');
        return null;
      }
      return decoded;
    } catch (error) {
      console.error('[TokenService] Error al decodificar token:', error);
      return null;
    }
  }

  public getUser(): Record<string, unknown> | null {
    try {
      const user = window.localStorage.getItem(this.userKey);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('[TokenService] Error al obtener usuario:', error);
      return null;
    }
  }

  public saveUser(user: Record<string, unknown>): void {
    try {
      window.localStorage.setItem(this.userKey, JSON.stringify(user));
      // Logging implementado con LoggingService;
    } catch (error) {
      console.error('[TokenService] Error al guardar usuario:', error);
    }
  }

  public signOut(): void {
    try {
      window.localStorage.removeItem(this.tokenKey);
      window.localStorage.removeItem(this.userKey);
      window.localStorage.removeItem(this.refreshTokenKey);
      window.localStorage.removeItem(this.usernameKey);
      window.localStorage.removeItem(this.authoritiesKey);
      window.localStorage.removeItem(this.cuitKey);
      this.tokenSubject.next(null);
      // Logging implementado con LoggingService;
    } catch (error) {
      console.error('[TokenService] Error al cerrar sesión:', error);
    }
  }

  public getAuthorities(): { authority: string }[] {
    try {
      const authoritiesStr = window.localStorage.getItem(this.authoritiesKey);
      return authoritiesStr ? JSON.parse(authoritiesStr) : [];
    } catch (error) {
      console.error('[TokenService] Error al obtener autoridades:', error);
      return [];
    }
  }

  public getCuit(): string | null {
    try {
      return window.localStorage.getItem(this.cuitKey);
    } catch (error) {
      console.error('[TokenService] Error al obtener cuit:', error);
      return null;
    }
  }

  public getUsername(): string | null {
    try {
      return window.localStorage.getItem(this.usernameKey);
    } catch (error) {
      console.error('[TokenService] Error al obtener username:', error);
      return null;
    }
  }

  private getStoredToken(): string | null {
    try {
      return window.localStorage.getItem(this.tokenKey);
    } catch (error) {
      console.error('[TokenService] Error al obtener token almacenado:', error);
      return null;
    }
  }

  public isTokenExpired(token: string): boolean {
    try {
      return this.jwtHelper.isTokenExpired(token);
    } catch (error) {
      console.error('[TokenService] Error al verificar expiración del token:', error);
      return true; // Si hay error, consideramos el token como expirado
    }
  }

  public validateToken(token: string): boolean {
    try {
      const isExpired = this.jwtHelper.isTokenExpired(token);

      // Logging implementado con LoggingService;

      return !isExpired;
    } catch (error) {
      console.error('[TokenService] Error validando token:', error);
      return false;
    }
  }

  public getUserId(): string | null {
    try {
      const token = this.getToken();
      if (!token) {
        // Logging implementado con LoggingService;
        return null;
      }

      const decodedToken = this.decodeToken(token);
      if (!decodedToken) {
        // Logging implementado con LoggingService;
        return null;
      }

      // Obtener el userId del token
      const userId = decodedToken['userId'] as string | undefined;
      if (!userId) {
        // Logging implementado con LoggingService;
        return null;
      }

      return userId;
    } catch (error) {
      console.error('[TokenService] Error al obtener userId:', error);
      return null;
    }
  }
}
