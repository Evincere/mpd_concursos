import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../core/services/auth/auth.service';

@Injectable({
    providedIn: 'root'
})
export class RoleGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        console.log("route ", route)
        const expectedRole = route.data['role'];
        console.log(expectedRole)
        if (this.authService.isAuthenticated() && this.authService.hasRole(expectedRole)) {
            return true;
        } else {
            this.router.navigate(['/login']);
            return false;
        }
    }
} 