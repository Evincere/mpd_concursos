import { Injectable } from '@angular/core';
import { JwtDto } from '../../models/jwt-dto';
import { User } from '../../models/user';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private tokenKey: string = 'auth_token';
  private usernameKey: string = 'auth_username';
  private authoritiesKey: string = 'auth_authorities';

  constructor() {}

  // Método para guardar el token en sessionStorage
  public saveToken(jwtDto: JwtDto): void {
    this.setSessionItem(this.tokenKey, jwtDto.token);
    this.setSessionItem(this.usernameKey, jwtDto.username);
    this.setSessionItem(this.authoritiesKey, JSON.stringify(jwtDto.authorities));
}

  private setSessionItem(key: string, value: string): void {
    sessionStorage.setItem(key, value);
  }

  private getSessionItem(key: string): string | null {
    return sessionStorage.getItem(key);
  }

  private removeSessionItem(key: string): void {
    sessionStorage.removeItem(key);
  }


  // Método para obtener el token de sessionStorage
  public getToken(): string | null {
    return this.getSessionItem(this.tokenKey);
}

  // Método para obtener el username de sessionStorage
  public getUsername(): string | null {
    return this.getSessionItem(this.usernameKey);
}

  // Método para obtener las authorities de sessionStorage
  public getAuthorities(): { authority: string }[] {
    const authorities = this.getSessionItem(this.authoritiesKey);
    return authorities ? JSON.parse(authorities) : [];
}

  // Método para eliminar el token y los datos de usuario de sessionStorage
  public removeToken(): void {
    this.removeSessionItem(this.tokenKey);
    this.removeSessionItem(this.usernameKey);
    this.removeSessionItem(this.authoritiesKey);
}

  // Método para verificar si el usuario está autenticado
  public isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  // Método para obtener el usuario autenticado
  public getUser(): User | null {
    const token = this.getToken();
    const username = this.getUsername();
    const authorities = this.getAuthorities();

    if (token && username) {
      const jwtDto = new JwtDto(token, "Bearer", username, authorities);
      return new User(username, '', '', '', '', undefined, '', jwtDto);
    }
    return null;
  }

}
