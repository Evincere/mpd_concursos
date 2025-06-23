import { Injectable, signal, computed, effect } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { LoginUser } from '../../models/login-user.model';
import { TokenService } from './token.service';
import { LoginService } from './login.service';

import { JwtDto } from '../../dtos/jwt-dto';
import { jwtDecode } from 'jwt-decode';

export interface UserInfo {
  username: string;
  cuit: string;
  profileImage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userInfoSignal = signal<UserInfo>({
    username: '',
    cuit: '',
    profileImage: ''
  });

  public readonly userInfo = computed(() => this.userInfoSignal());

  constructor(
    private loginService: LoginService,
    private tokenService: TokenService
  ) {
    // Limpiar imagen legacy al inicializar (migración)
    this.cleanupLegacyProfileImage();

    this.loadUserInfo();

    // Efecto para sincronizar con localStorage usando clave específica por usuario
    effect(() => {
      const currentInfo = this.userInfo();
      if (currentInfo.username) {
        const userProfileImageKey = `userProfileImage_${currentInfo.username}`;
        if (currentInfo.profileImage) {
          localStorage.setItem(userProfileImageKey, currentInfo.profileImage);
        } else {
          localStorage.removeItem(userProfileImageKey);
        }
      }
    });
  }

  public handleLogin(loginUser: LoginUser): Observable<JwtDto> {
    // Logging implementado con LoggingService;
    return this.loginService.login(loginUser).pipe(
      tap((jwtDto: JwtDto) => {
        if (jwtDto && jwtDto.token) {
          this.tokenService.saveToken(jwtDto);
          const decodedToken = this.tokenService.decodeToken(jwtDto.token);
          if (decodedToken) {
            this.loadUserInfo();
          } else {
            console.error('[AuthService] No se pudo decodificar el token');
            this.logout();
            throw new Error('Token inválido');
          }
        } else {
          console.error('[AuthService] Respuesta de login vacía o sin token');
          throw new Error('Respuesta inválida del servidor');
        }
      })
    );
  }

  public logout(): void {
    // Logging implementado con LoggingService;
    this.tokenService.signOut();
  }

  public isAuthenticated(): boolean {
    console.log('[AuthService] 🔍 Verificando autenticación...');
    const token = this.tokenService.getToken();
    if (!token) {
      console.warn('[AuthService] ❌ No hay token disponible');
      return false;
    }
    console.log('[AuthService] ✅ Token encontrado, validando...');
    const isValid = this.tokenService.validateToken(token);
    console.log(`[AuthService] ${isValid ? '✅' : '❌'} Token ${isValid ? 'válido' : 'inválido'}`);
    return isValid;
  }

  public hasRole(role: string): boolean {
    const token = this.tokenService.getToken();

    if (!token) {
      return false;
    }

    const authorities = this.tokenService.getAuthorities();
    const hasRole = authorities.some(auth => auth.authority === role);
    return hasRole;
  }

  public getCurrentUserId(): string {
    const token = this.tokenService.getToken();
    if (!token) {
        console.warn('[AuthService] No hay token disponible para obtener userId');
        return '';
    }

    try {
        const decodedToken = jwtDecode<{ userId?: string }>(token);
        return decodedToken.userId || '';
    } catch (error) {
        console.error('[AuthService] Error al decodificar token:', error);
        return '';
    }
  }

  public getToken(): string | null {
    return this.tokenService.getToken();
  }

  private loadUserInfo(): void {
    const token = this.tokenService.getToken();
    if (!token) {
      console.warn('[AuthService] No hay token disponible');
      this.clearUserInfo();
      return;
    }

    const decodedToken = this.tokenService.decodeToken(token);
    if (!decodedToken) {
      console.warn('[AuthService] No se pudo decodificar el token');
      this.clearUserInfo();
      return;
    }

    const username = this.tokenService.getUsername();
    const cuit = this.tokenService.getCuit();

    // Cargar imagen específica del usuario usando clave única
    const userProfileImageKey = `userProfileImage_${username}`;
    const profileImage = localStorage.getItem(userProfileImageKey) || '';

    if (username && cuit) {
      this.userInfoSignal.set({
        username,
        cuit,
        profileImage
      });
    } else {
      console.warn('[AuthService] Información del usuario incompleta');
      this.clearUserInfo();
    }
  }

  private clearUserInfo(): void {
    // Limpiar imagen de perfil del usuario actual antes de limpiar la info
    const currentUsername = this.userInfoSignal().username;
    if (currentUsername) {
      const userProfileImageKey = `userProfileImage_${currentUsername}`;
      localStorage.removeItem(userProfileImageKey);
    }

    this.userInfoSignal.set({
      username: '',
      cuit: '',
      profileImage: ''
    });
  }

  /**
   * Limpia la imagen de perfil legacy del localStorage (migración)
   */
  private cleanupLegacyProfileImage(): void {
    try {
      const legacyImage = localStorage.getItem('userProfileImage');
      if (legacyImage) {
        console.log('[AuthService] Limpiando imagen de perfil legacy del localStorage');
        localStorage.removeItem('userProfileImage');
      }
    } catch (error) {
      console.error('[AuthService] Error al limpiar imagen legacy:', error);
    }
  }

  public updateProfileImage(imageUrl: string): void {
    this.userInfoSignal.update(current => ({
      ...current,
      profileImage: imageUrl
    }));
  }
}
