import { Injectable, signal, computed, effect } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { LoginUser } from '../../models/login-user.model';
import { TokenService } from './token.service';
import { LoginService } from './login.service';
import { User } from '../../models/user.model';
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
    profileImage: localStorage.getItem('userProfileImage') || ''
  });

  public readonly userInfo = computed(() => this.userInfoSignal());

  constructor(
    private loginService: LoginService, 
    private tokenService: TokenService
  ) {
    this.loadUserInfo();
    
    // Efecto para sincronizar con localStorage
    effect(() => {
      const currentInfo = this.userInfo();
      if (currentInfo.profileImage) {
        localStorage.setItem('userProfileImage', currentInfo.profileImage);
      } else {
        localStorage.removeItem('userProfileImage');
      }
    });
  }

  public handleLogin(loginUser: LoginUser): Observable<JwtDto> {
    console.log('[AuthService] Iniciando login para usuario:', loginUser.username);
    return this.loginService.login(loginUser).pipe(
      tap(jwtDto => {
        if (jwtDto && jwtDto.token) {
          console.log('[AuthService] Login exitoso, guardando token');
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
    console.log('[AuthService] Cerrando sesión');
    this.userInfoSignal.set({
      username: '',
      cuit: '',
      profileImage: ''
    });
    this.tokenService.signOut();
  }

  public isAuthenticated(): boolean {
    const token = this.tokenService.getToken();
    if (!token) {
      console.warn('[AuthService] No hay token disponible');
      return false;
    }
    return this.tokenService.validateToken(token);
  }

  public hasRole(role: string): boolean {
    console.log('[AuthService] Verificando rol:', role);
    const token = this.tokenService.getToken();
    
    if (!token) {
      console.log('[AuthService] Token no presente');
      return false;
    }

    const authorities = this.tokenService.getAuthorities();
    const hasRole = authorities.some(auth => auth.authority === role);
    console.log('[AuthService] Roles del usuario:', authorities);
    console.log('[AuthService] ¿Tiene el rol?', hasRole);
    
    return hasRole;
  }

  public getCurrentUserId(): string {
    const token = this.tokenService.getToken();
    if (!token) {
        console.log('[AuthService] No hay token disponible');
        return '';
    }
    
    try {
        const decodedToken = jwtDecode(token) as any;
        console.log('[AuthService] Token decodificado:', decodedToken);
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
    const profileImage = localStorage.getItem('userProfileImage') || '';

    if (username && cuit) {
      console.log('[AuthService] Cargando información del usuario:', { username, cuit });
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
    this.userInfoSignal.set({
      username: '',
      cuit: '',
      profileImage: ''
    });
  }

  public updateProfileImage(imageUrl: string): void {
    this.userInfoSignal.update(current => ({
      ...current,
      profileImage: imageUrl
    }));
  }
}
