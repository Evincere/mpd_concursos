import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { LoginUser } from '../../models/login-user.model';
import { TokenService } from './token.service';
import { LoginService } from './login.service';
import { User } from '../../models/user.model';
import { JwtDto } from '../../dtos/jwt-dto';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private loginService: LoginService, private tokenService: TokenService) { }

  // Método para manejar el inicio de sesión
  public handleLogin(loginUser: LoginUser): Observable<JwtDto> {
    return this.loginService.login(loginUser).pipe(
      tap(jwtDto => {
        if (jwtDto) {
          this.tokenService.saveToken(jwtDto);
        } else {
          throw new Error('Respuesta vacía');
        }
      })
    );
  }

  // Método para cerrar sesión
  public logout(): void {
    this.tokenService.removeToken();
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

  public getUserInfo(): { username: string, cuit: string } {
    return {
      username: this.getUser()?.username || '',
      cuit: this.getCuit() || ''
    };
  }
}
