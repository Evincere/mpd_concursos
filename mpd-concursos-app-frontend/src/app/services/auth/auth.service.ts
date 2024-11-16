import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { LoginUser } from '../../models/login-user';
import { TokenService } from './token.service';
import { LoginService } from './login.service';
import { User } from '../../models/user';
import { JwtDto } from '../../models/jwt-dto';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private loginService: LoginService, private tokenService: TokenService) { }

  // Método para manejar el inicio de sesión
  public handleLogin(loginUser: LoginUser): Observable<JwtDto> {
    return this.loginService.login(loginUser).pipe(
      tap({
        next: jwtDto => {
          if (jwtDto) {
            this.tokenService.saveToken(jwtDto);
          } else {
            throw new Error('Respuesta vacía');
          }
        },
        error: err => {
          console.error('Error en el inicio de sesión', err);
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
    return this.tokenService.isAuthenticated();
  }

  // Método para obtener el usuario autenticado
  public getUser(): User | null {
    return this.tokenService.getUser();
  }

  // Método para verificar si el usuario tiene un rol específico
  public hasRole(role: string): boolean {
    const authorities = this.tokenService.getAuthorities();
    // Verificar si alguna autoridad tiene el rol especificado
    for (const authorityObj of authorities) {
      console.log(authorityObj);
      
      return authorities.some(authorityObj => authorityObj.authority === role);
    }

    return false;
  }
}
