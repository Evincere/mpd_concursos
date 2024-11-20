import { Injectable } from "@angular/core";
import { AuthService } from "../core/services/auth/auth.service";
import { Router } from "@angular/router";

@Injectable({
    providedIn: 'root'
  })
  export class AdminGuard {
    constructor(private authService: AuthService, private router: Router) {}
  
    canActivate(): boolean {
      if (this.authService.isAdmin()) {
        return true;
      }
      this.router.navigate(['/dashboard']);
      return false;
    }
  }