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

  constructor(private loginService: LoginService, private tokenService: TokenService) {
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

  // Método para manejar el inicio de sesión
  public handleLogin(loginUser: LoginUser): Observable<JwtDto> {
    return this.loginService.login(loginUser).pipe(
      tap(jwtDto => {
        if (jwtDto) {
          this.tokenService.saveToken(jwtDto);
          this.loadUserInfo(); // Cargar la información del usuario después del login
        } else {
          throw new Error('Respuesta vacía');
        }
      })
    );
  }

  // Método para cerrar sesión
  public logout(): void {
    this.tokenService.removeToken();
    localStorage.removeItem('userProfileImage');
    this.userInfoSignal.set({
      username: '',
      cuit: '',
      profileImage: ''
    });
  }

  // Método para verificar si el usuario está autenticado
  public isAuthenticated(): boolean {
    const isAuth = this.tokenService.getToken() !== null;
    console.log('[AuthService] isAuthenticated:', isAuth);
    return isAuth;
  }

  // Método para obtener el ID del usuario actual
  public getCurrentUserId(): string | null {
    const token = this.tokenService.getToken();
    if (!token) {
      console.warn('No hay token disponible');
      return null;
    }

    try {
      const decodedToken: any = this.tokenService.decodeToken(token);
      const userId = decodedToken?.userId;
      
      if (!userId) {
        console.warn('No se encontró userId en el token');
        return null;
      }

      return userId;
    } catch (error) {
      console.error('Error al obtener el ID del usuario:', error);
      return null;
    }
  }

  // Método para obtener el usuario autenticado
  public getUser(): User | null {
    return this.tokenService.getUser();
  }

  // Método para verificar si el usuario tiene un rol específico
  public hasRole(role: string): boolean {
    console.log('[AuthService] Verificando rol:', role);
    
    const token = this.tokenService.getToken();
    console.log('[AuthService] Token presente:', !!token);
    
    const authorities = this.tokenService.getAuthorities();
    console.log('[AuthService] Authorities:', authorities);
    
    const hasRole = authorities.some(authorityObj => {
      console.log('[AuthService] Comparando:', { 
        expected: role, 
        actual: authorityObj.authority,
        matches: authorityObj.authority === role
      });
      return authorityObj.authority === role;
    });
    
    console.log('[AuthService] Usuario tiene el rol?', hasRole);
    return hasRole;
  }

  public getCuit(): string | null {
    return this.tokenService.getCuit();
  }

  // Método para obtener la información del usuario
  public getUserInfo(): UserInfo {
    return this.userInfo();
  }

  // Método para actualizar la imagen de perfil
  public updateProfileImage(imageUrl: string): void {
    try {
      console.log('Actualizando imagen de perfil:', imageUrl);
      
      if (imageUrl) {
        localStorage.setItem('userProfileImage', imageUrl);
      } else {
        localStorage.removeItem('userProfileImage');
      }

      this.userInfoSignal.update(current => ({
        ...current,
        profileImage: imageUrl
      }));
    } catch (error) {
      console.error('Error al actualizar la imagen de perfil:', error);
    }
  }

  updateUserInfo(userInfo: Partial<UserInfo>): void {
    const currentInfo = this.userInfoSignal();
    this.userInfoSignal.set({
      ...currentInfo,
      ...userInfo
    });
  }

  // Método para cargar la información inicial del usuario
  private loadUserInfo(): void {
    try {
      const user = this.getUser();
      const storedImage = localStorage.getItem('userProfileImage');
      console.log('Cargando información del usuario:', { user, storedImage });

      if (user) {
        // Intentar cargar la imagen del token primero
        const decodedToken: any = this.tokenService.decodeToken(this.tokenService.getToken() || '');
        const profileImage = decodedToken?.profileImage || storedImage || '';

        this.userInfoSignal.set({
          username: user.username || '',
          cuit: user.cuit || '',
          profileImage
        });

        // Si hay una imagen en el token pero no en localStorage, guardarla
        if (decodedToken?.profileImage && !storedImage) {
          localStorage.setItem('userProfileImage', decodedToken.profileImage);
        }
      }
    } catch (error) {
      console.error('Error al cargar la información del usuario:', error);
    }
  }
}
