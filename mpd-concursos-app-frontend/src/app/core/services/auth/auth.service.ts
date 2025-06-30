import { Injectable, signal, computed, effect } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { LoginUser } from '../../models/login-user.model';
import { TokenService } from './token.service';
import { LoginService } from './login.service';
import { LoggingService } from '../logging/logging.service';

import { JwtDto } from '../../dtos/jwt-dto';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../../environments/environment';

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
    private tokenService: TokenService,
    private loggingService: LoggingService
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
    // ✅ SEGURIDAD: Login con logging seguro
    this.loggingService.info('[AuthService] Iniciando proceso de login', { username: loginUser.username }, 'AuthService');

    return this.loginService.login(loginUser).pipe(
      tap((jwtDto: JwtDto) => {
        if (jwtDto && jwtDto.token) {
          this.tokenService.saveToken(jwtDto);
          const decodedToken = this.tokenService.decodeToken(jwtDto.token);
          if (decodedToken) {
            this.loadUserInfo();
            // ✅ SEGURIDAD: Log exitoso sin exponer token
            this.loggingService.info('[AuthService] Login exitoso', { username: loginUser.username }, 'AuthService');
          } else {
            // ✅ SEGURIDAD: Error sin exponer información del token
            this.loggingService.error('[AuthService] No se pudo decodificar el token de autenticación', undefined, 'AuthService');
            this.logout();
            throw new Error('Token inválido');
          }
        } else {
          // ✅ SEGURIDAD: Error sin exponer detalles de la respuesta
          this.loggingService.error('[AuthService] Respuesta de login inválida del servidor', undefined, 'AuthService');
          throw new Error('Respuesta inválida del servidor');
        }
      })
    );
  }

  public logout(): void {
    // ✅ SEGURIDAD: Logout con logging seguro
    this.loggingService.info('[AuthService] Usuario cerrando sesión', undefined, 'AuthService');
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

      // Cargar imagen de perfil desde el servidor para sincronizar
      setTimeout(() => this.loadProfileImageFromServer(), 100);
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

  /**
   * Carga la imagen de perfil desde el servidor
   * Se llama después de cargar la información básica del usuario
   */
  public loadProfileImageFromServer(): void {
    const username = this.userInfo().username;
    console.log('[AuthService] Intentando cargar imagen de perfil para usuario:', username);

    if (!username) {
      console.warn('[AuthService] No hay username disponible para cargar imagen de perfil');
      return;
    }

    // Usar fetch para evitar dependencias circulares con ProfileService
    const token = this.tokenService.getToken();
    if (!token) {
      console.warn('[AuthService] No hay token disponible para cargar imagen de perfil');
      return;
    }

    console.log('[AuthService] Realizando petición a:', `${environment.apiUrl}/users/profile`);

    fetch(`${environment.apiUrl}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      console.log('[AuthService] Respuesta del servidor:', response.status, response.statusText);
      if (response.ok) {
        return response.json();
      }
      throw new Error(`Error al cargar perfil: ${response.status} ${response.statusText}`);
    })
    .then(profile => {
      if (profile && profile.profileImageUrl) {
        console.log('[AuthService] Imagen de perfil cargada desde servidor:', profile.profileImageUrl);
        this.updateProfileImage(profile.profileImageUrl);
      }
    })
    .catch(error => {
      console.warn('[AuthService] No se pudo cargar la imagen de perfil desde el servidor:', error);
    });
  }
}
