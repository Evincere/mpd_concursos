import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '@core/services/auth/auth.service';
import { LoggingService } from '@core/services/logging/logging.service'; // Import LoggingService
import { NotificationService } from '@shared/services/notification.service'; // Assuming NotificationService path

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router,
    private loggingService: LoggingService, // Inject LoggingService
    private notificationService: NotificationService // Inject NotificationService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const expectedRoles = route.data['roles'] as string[];
    this.loggingService.info(`[RoleGuard] Attempting to activate route: ${state.url}`, { expectedRoles }, 'AuthGuard');

    // 1. Check if user is authenticated
    if (this.authService.isAuthenticated()) {
      this.loggingService.debug(`[RoleGuard] User is authenticated.`, undefined, 'AuthGuard');

      // 2. Check if specific roles are required for the route
      if (expectedRoles && expectedRoles.length > 0) {
        this.loggingService.debug(`[RoleGuard] Route requires roles: ${expectedRoles.join(', ')}`, undefined, 'AuthGuard');

        // 3. Verify if the user has any of the required roles
        const hasRequiredRole = expectedRoles.some(role => this.authService.hasRole(role));

        if (hasRequiredRole) {
          this.loggingService.info(`[RoleGuard] User has required role. Access granted for route: ${state.url}`, undefined, 'AuthGuard');
          return true; // User has at least one of the required roles, access granted
        } else {
          // User is authenticated but does not have the required role(s)
          this.loggingService.warn(`[RoleGuard] User authenticated but lacks required roles: ${expectedRoles.join(', ')}. Redirecting to /unauthorized.`, undefined, 'AuthGuard');
          this.notificationService.warning('No tiene permisos para acceder a esta sección.');
          return this.router.createUrlTree(['/unauthorized']); // Redirect to an unauthorized page
        }
      } else {
        // No specific roles are required for the route, so authenticated users can access
        this.loggingService.info(`[RoleGuard] No specific roles required for route: ${state.url}. Access granted.`, undefined, 'AuthGuard');
        return true;
      }
    } else {
      // User is not authenticated
      this.loggingService.warn(`[RoleGuard] User not authenticated. Redirecting to /login.`, undefined, 'AuthGuard');
      this.notificationService.error('Debe iniciar sesión para acceder a esta página.');
      return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } }); // Redirect to login, preserving original URL
    }
  }
}
