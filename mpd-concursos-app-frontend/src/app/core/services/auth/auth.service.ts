import { Injectable, signal, computed, effect } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { LoginUser } from '../../models/login-user.model';
import { TokenService } from './token.service';
import { LoginService } from './login.service';
import { User } from '../../models/user.model';
import { JwtDto } from '../../dtos/jwt-dto';

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
        if (jwtDto) {
          console.log('[AuthService] Login exitoso, guardando token');
          this.tokenService.saveToken(jwtDto);
          this.loadUserInfo();
        } else {
          console.error('[AuthService] Respuesta de login vacía');
          throw new Error('Respuesta vacía del servidor');
        }
      })
    );
  }

  public logout(): void {
    console.log('[AuthService] Cerrando sesión');
    this.tokenService.removeToken();
    localStorage.removeItem('userProfileImage');
    this.userInfoSignal.set({
      username: '',
      cuit: '',
      profileImage: ''
    });
  }

  public isAuthenticated(): boolean {
    const token = this.tokenService.getToken();
    const isAuth = token !== null;
    console.log('[AuthService] isAuthenticated:', isAuth);
    return isAuth;
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

  public getCurrentUserId(): string | null {
    const user = this.tokenService.getUser();
    if (!user) {
      console.warn('[AuthService] No hay usuario autenticado');
      return null;
    }
    return user.id;
  }

  public getToken(): string | null {
    return this.tokenService.getToken();
  }

  private loadUserInfo(): void {
    console.log('[AuthService] Cargando información del usuario');
    const username = this.tokenService.getUsername();
    const cuit = this.tokenService.getCuit();

    if (username && cuit) {
      this.userInfoSignal.set({
        username,
        cuit,
        profileImage: localStorage.getItem('userProfileImage') || ''
      });
      console.log('[AuthService] Información del usuario cargada:', { username, cuit });
    } else {
      console.warn('[AuthService] No se pudo cargar la información del usuario');
    }
  }

  public updateProfileImage(imageUrl: string): void {
    this.userInfoSignal.update(current => ({
      ...current,
      profileImage: imageUrl
    }));
  }
}
