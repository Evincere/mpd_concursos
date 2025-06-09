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
        // Logging implementado con LoggingService;

        // Obtener el mensaje de error del servidor si está disponible
        const serverErrorMessage = error.error?.message || '';

        if (error.status === 401) {
          return throwError(() => new Error('Credenciales incorrectas'));
        } else if (error.status === 403) {
          // Manejar errores específicos de estado de cuenta
          if (error.error?.error === 'Cuenta bloqueada') {
            // Mostrar diálogo específico para cuenta bloqueada
            // this.errorDialogService.showBlockedAccountError();
            return throwError(() => new Error(`Su cuenta ha sido bloqueada. Por favor, contacte al administrador para más información.`));
          } else if (error.error?.error === 'Cuenta inactiva') {
            return throwError(() => new Error(`Su cuenta está inactiva. Por favor, contacte al administrador para activarla.`));
          } else if (error.error?.error === 'Cuenta expirada') {
            return throwError(() => new Error(`Su cuenta ha expirado. Por favor, contacte al administrador para renovarla.`));
          } else {
            // Si es un error 403 genérico, asumimos que es una cuenta bloqueada
            // this.errorDialogService.showBlockedAccountError();
            return throwError(() => new Error('No tiene permisos para realizar esta acción. Su cuenta podría estar bloqueada.'));
          }
        }

        return throwError(() => new Error(serverErrorMessage || 'Error en el servidor. Intente nuevamente más tarde.'));
      })
    );
  }

  public logout(): void {
    this.tokenService.signOut();
    this.router.navigate(['/login']);
  }
}
