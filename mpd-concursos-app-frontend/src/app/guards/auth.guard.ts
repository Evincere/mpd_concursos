import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '@core/services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    console.log('[AuthGuard] 🔍 Verificando acceso...');
    const isAuthenticated = this.authService.isAuthenticated();

    if (isAuthenticated) {
      console.log('[AuthGuard] ✅ Usuario autenticado, permitiendo acceso');
      return true;
    } else {
      console.log('[AuthGuard] ❌ Usuario no autenticado, redirigiendo a login');
      this.router.navigate(['/login']);
      return false;
    }
  }
}