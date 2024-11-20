import { Injectable } from '@angular/core';
import { JwtDto } from '../../dtos/jwt-dto';
import { User } from '../../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private tokenKey: string = 'auth_token';
  private usernameKey: string = 'auth_username';
  private authoritiesKey: string = 'auth_authorities';
  private cuit: string = 'auth_cuit';

  constructor() { }

  // Método para guardar el token en sessionStorage
  public saveToken(jwtDto: JwtDto): void {
    this.setSessionItem(this.tokenKey, jwtDto.token);
    this.setSessionItem(this.usernameKey, jwtDto.username);
    this.setSessionItem(this.authoritiesKey, JSON.stringify(jwtDto.authorities));
    this.setSessionItem(this.cuit, jwtDto.cuit);
  }

  private setSessionItem(key: string, value: any): void {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    sessionStorage.setItem(key, stringValue);
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

  public getCuit(): string | null {
    const cuit = this.getSessionItem(this.cuit);
    return cuit ? cuit : null;
  }

  // Método para eliminar el token y los datos de usuario de sessionStorage
  public removeToken(): void {
    this.removeSessionItem(this.tokenKey);
    this.removeSessionItem(this.usernameKey);
    this.removeSessionItem(this.authoritiesKey);
    this.removeSessionItem(this.cuit);
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
    const cuit = this.getCuit();

    if (token && username && cuit) {
      const jwtDto = new JwtDto(token, "", username, authorities, cuit);
      return new User(username, '', '', '', '', undefined, '', jwtDto);
    }
    return null;
  }

}
