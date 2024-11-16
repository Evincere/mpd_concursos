import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { JwtDto } from '../../models/jwt-dto';
import { LoginUser } from '../../models/login-user';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private apiUrl = 'http://localhost:8080/auth'; 

  constructor(private http: HttpClient) { }

  // Método para iniciar sesión utilizando un objeto LoginUser
  public login(loginUser: LoginUser): Observable<JwtDto> {
    return this.http.post<JwtDto>(`${this.apiUrl}/login`, loginUser);
  }
}
