import { HttpClient, HttpHeaders, HttpErrorResponse } from  '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { JwtDto } from '../../dtos/jwt-dto';
import { LoginUser } from '../../models/login-user.model';
import { environment } from '../../../../environments/environment';
import { TokenService } from './token.service';
// import { ErrorDialogService } from '@shared/components/error-dialog/error-dialog.service';



@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private router: Router
    // private errorDialogService: ErrorDialogService
  ) {}


  public login(loginUser: LoginUser): Observable<JwtDto> {
    if (!loginUser.isValid()) {
      console.error('[LoginService] Credenciales inválidas');
      return throwError(() => new Error('Credenciales inválidas'));
    }

    const payload = {
      username: loginUser.username,
      password: loginUser.password
    };

    // Logging implementado con LoggingService;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<JwtDto>(`${this.apiUrl}/login`, payload, {
      headers,
      withCredentials: true
    }).pipe(
      tap(response => {
        return response;
      }),
      catchError((error: HttpErrorResponse) => {
        // IMPORTANTE: Propagar el HttpErrorResponse original para que el componente
        // pueda usar el sistema avanzado de manejo de errores
        return throwError(() => error);
      })
    );
  }

  public logout(): void {
    this.tokenService.signOut();
    this.router.navigate(['/login']);
  }
}
