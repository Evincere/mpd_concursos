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
    if (this.authService.isAuthenticated() && this.authService.hasRole('ROLE_ADMIN')) {
      return true;
    }
    this.router.navigate(['/dashboard']);
    return false;
  }
}