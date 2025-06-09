import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "@core/services/auth/auth.service";

@Injectable({
  providedIn: 'root'
})
export class AdminGuard {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    // Verificar si el usuario está autenticado
    const isAuthenticated = this.authService.isAuthenticated();

    if (!isAuthenticated) {
      this.router.navigate(['/login']);
      return false;
    }

    // Verificar si el usuario tiene rol de administrador
    const hasAdminRole = this.authService.hasRole('ROLE_ADMIN');

    if (!hasAdminRole) {
      this.router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  }
}