import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { JwtDto } from '../../dtos/jwt-dto';
import { LoginUser } from '../../models/login-user.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) { }

  // Método para iniciar sesión utilizando un objeto LoginUser
  public login(loginUser: LoginUser): Observable<JwtDto> {
    return this.http.post<JwtDto>(`${this.apiUrl}/login`, loginUser);
  }
}
