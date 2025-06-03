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
    console.log('[AdminGuard] Verificando acceso administrativo...');

    const isAuthenticated = this.authService.isAuthenticated();
    const hasAdminRole = this.authService.hasRole('ROLE_ADMIN');

    console.log('[AdminGuard] Estado de autenticación:', isAuthenticated);
    console.log('[AdminGuard] Tiene rol de admin:', hasAdminRole);

    if (isAuthenticated && hasAdminRole) {
      console.log('[AdminGuard] Acceso concedido');
      return true;
    }

    if (!isAuthenticated) {
      console.log('[AdminGuard] Usuario no autenticado, redirigiendo a login');
      this.router.navigate(['/login']);
    } else {
      console.log('[AdminGuard] Usuario sin permisos de admin, redirigiendo a dashboard');
      this.router.navigate(['/dashboard']);
    }

    return false;
  }
}