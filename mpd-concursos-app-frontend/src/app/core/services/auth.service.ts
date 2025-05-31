import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from  'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { jwtDecode } from 'jwt-decode';

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: {
    id: string;
    username: string;
    roles: string[];
    email?: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  dni: string;
  cuit?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'auth_token';
  private refreshTokenKey = 'refresh_token';
  private userKey = 'user_data';
  private http: HttpClient;

  constructor(httpClient: HttpClient) {
    this.http = httpClient;
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(error => {
          console.error('Error en login:', error);
          return throwError(() => new Error(error.error?.message || 'Error en la autenticación'));
        })
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData)
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(error => {
          console.error('Error en registro:', error);
          return throwError(() => new Error(error.error?.message || 'Error en el registro'));
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No hay refresh token disponible'));
    }

    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh-token`, { refreshToken })
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(error => {
          console.error('Error al refrescar token:', error);
          this.logout();
          return throwError(() => new Error('Sesión expirada. Por favor, inicie sesión nuevamente.'));
        })
      );
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    try {
      const decodedToken: Record<string, unknown> = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return (decodedToken['exp'] as number) > currentTime;
    } catch (error) {
      console.error('Error al decodificar token:', error);
      return false;
    }
  }

  hasRole(role: string): boolean {
    if (!this.isAuthenticated()) {
      return false;
    }

    const userData = this.getUserData();
    const roles = userData ? (userData['roles'] as string[] | undefined) : undefined;
    return roles?.includes(role) || false;
  }

  getCurrentUserId(): string | null {
    const userData = this.getUserData();
    return userData ? (userData['id'] as string) || null : null;
  }

  getUserData(): Record<string, unknown> | null {
    const userDataStr = localStorage.getItem(this.userKey);
    if (!userDataStr) {
      return null;
    }

    try {
      return JSON.parse(userDataStr);
    } catch (error) {
      console.error('Error al parsear datos de usuario:', error);
      return null;
    }
  }

  private getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  private handleAuthResponse(response: unknown): void {
    const authResponse = response as AuthResponse;
    if (authResponse.token) {
      localStorage.setItem(this.tokenKey, authResponse.token);

      if (authResponse.refreshToken) {
        localStorage.setItem(this.refreshTokenKey, authResponse.refreshToken);
      }

      if (authResponse.user) {
        localStorage.setItem(this.userKey, JSON.stringify(authResponse.user));
      } else {
        // Si no viene el usuario en la respuesta, intentar extraerlo del token
        try {
          const decodedToken: Record<string, unknown> = jwtDecode(authResponse.token);
          const userData = {
            id: decodedToken['sub'] as string,
            username: (decodedToken['username'] as string) || (decodedToken['sub'] as string),
            roles: (decodedToken['roles'] as string[]) || []
          };
          localStorage.setItem(this.userKey, JSON.stringify(userData));
        } catch (error) {
          console.error('Error al decodificar token para extraer datos de usuario:', error);
        }
      }
    }
  }
}
