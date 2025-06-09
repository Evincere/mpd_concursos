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
    const token = this.tokenService.getToken();
    if (!token) {
      console.warn('[AuthService] No hay token disponible');
      return false;
    }
    return this.tokenService.validateToken(token);
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
    const profileImage = localStorage.getItem('userProfileImage') || '';

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
