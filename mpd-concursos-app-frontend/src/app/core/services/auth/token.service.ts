import { Injectable } from '@angular/core';
import { JwtDto } from '../../dtos/jwt-dto';
import { User } from '../../models/user.model';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
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

  constructor(private http: HttpClient, private router: Router) {}

  public saveToken(jwtDto: JwtDto): void {
    try {
      console.log('[TokenService] Guardando token y datos de usuario');

      // Guardar token
      if (jwtDto.token) {
        localStorage.setItem(this.TOKEN_KEY, jwtDto.token);
        console.log('[TokenService] Token guardado exitosamente');
      }

      // Guardar datos adicionales
      if (jwtDto.username) {
        localStorage.setItem(this.USERNAME_KEY, jwtDto.username);
      }
      if (jwtDto.authorities) {
        localStorage.setItem(this.AUTHORITIES_KEY, JSON.stringify(jwtDto.authorities));
      }
      if (jwtDto.cuit) {
        localStorage.setItem(this.CUIT_KEY, jwtDto.cuit);
      }

      console.log('[TokenService] Datos adicionales guardados');

      // Extraer y guardar usuario
      const decodedToken = this.decodeToken(jwtDto.token);
      if (decodedToken) {
        const user = this.extractUserFromToken(jwtDto.token);
        if (user) {
          this.saveUser(user);
          console.log('[TokenService] Usuario extraído y guardado:', user);
        }
      }

      console.log('[TokenService] Datos guardados:', {
        username: jwtDto.username,
        authorities: jwtDto.authorities,
        cuit: jwtDto.cuit
      });
    } catch (error) {
      console.error('[TokenService] Error guardando el token:', error);
    }
  }

  public getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    console.log('[TokenService] Intentando obtener token:', token ? 'presente' : 'ausente');
    
    if (!token) {
      console.warn('[TokenService] No token found in localStorage');
      return null;
    }

    try {
      // Verificar si el token está expirado
      const decodedToken = this.decodeToken(token);
      if (!decodedToken) {
        console.warn('[TokenService] Token could not be decoded');
        this.removeToken();
        return null;
      }
      
      if (this.isTokenExpired(decodedToken)) {
        console.warn('[TokenService] Token is expired');
        this.removeToken();
        return null;
      }

      console.log('[TokenService] Token válido encontrado');
      return token;
    } catch (error) {
      console.error('[TokenService] Error validando token:', error);
      this.removeToken();
      return null;
    }
  }

  public removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USERNAME_KEY);
    localStorage.removeItem(this.AUTHORITIES_KEY);
    localStorage.removeItem(this.CUIT_KEY);
  }

  public getAuthorities(): any[] {
    console.log('[TokenService] Obteniendo autoridades...');
    const token = this.getToken();
    
    if (token) {
      const decodedToken = this.decodeToken(token);
      console.log('[TokenService] Token decodificado:', {
        hasAuthorities: !!decodedToken?.authorities,
        authorities: decodedToken?.authorities
      });

      if (decodedToken?.authorities) {
        return decodedToken.authorities;
      }
    }

    // Si no hay autoridades en el token, intentar obtenerlas del localStorage
    const authoritiesStr = localStorage.getItem(this.AUTHORITIES_KEY);
    const authorities = authoritiesStr ? JSON.parse(authoritiesStr) : [];
    console.log('[TokenService] Autoridades desde localStorage:', authorities);
    return authorities;
  }

  public getCuit(): string | null {
    return localStorage.getItem(this.CUIT_KEY);
  }

  public getUsername(): string | null {
    return localStorage.getItem(this.USERNAME_KEY);
  }

  public decodeToken(token: string): any {
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error('[TokenService] Error decodificando token:', error);
      return null;
    }
  }

  public getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('[TokenService] Error parsing user from storage:', error);
      return null;
    }
  }

  public validateToken(token: string): boolean {
    try {
      const decodedToken = this.decodeToken(token);
      if (!decodedToken) {
        console.warn('[TokenService] Token inválido o no puede ser decodificado');
        return false;
      }

      if (this.isTokenExpired(decodedToken)) {
        console.warn('[TokenService] Token expirado');
        return false;
      }

      return true;
    } catch (error) {
      console.error('[TokenService] Error validando token:', error);
      return false;
    }
  }

  public isTokenExpired(decodedToken: any): boolean {
    if (!decodedToken?.exp) {
      console.warn('[TokenService] Token no tiene fecha de expiración');
      return true;
    }

    const expiry = decodedToken.exp * 1000; // Convertir a milisegundos
    const now = Date.now();
    const isExpired = now >= expiry;

    if (isExpired) {
      console.warn('[TokenService] Token expirado en:', new Date(expiry));
    }

    return isExpired;
  }

  private saveUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private extractUserFromToken(token: string): User | null {
    try {
      const decodedToken = this.decodeToken(token);
      if (!decodedToken) return null;

      return User.fromToken({
        userId: decodedToken.userId,
        sub: decodedToken.sub,
        cuit: decodedToken.cuit,
        authorities: decodedToken.roles?.map((role: any) => ({ authority: role })) || []
      });

    } catch (error) {
      console.error('[TokenService] Error extracting user from token:', error);
      return null;
    }
  }
}
