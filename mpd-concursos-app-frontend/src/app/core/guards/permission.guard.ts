import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  CanActivateChild, 
  CanLoad, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  Route, 
  UrlSegment,
  Router
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { AuthorizationService, AuthorizationContext } from '@core/services/roles/authorization.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';

/**
 * Configuración de permisos para rutas
 */
export interface RoutePermissionConfig {
  permissions: string | string[];
  operator?: 'all' | 'any';
  context?: AuthorizationContext;
  redirectTo?: string;
  showNotification?: boolean;
  notificationMessage?: string;
}

/**
 * Guard para proteger rutas basado en permisos
 */
@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate, CanActivateChild, CanLoad {

  constructor(
    private authorizationService: AuthorizationService,
    private router: Router,
    private notificationService: CustomNotificationService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkPermissions(route, state.url);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkPermissions(childRoute, state.url);
  }

  canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> {
    const url = segments.map(segment => segment.path).join('/');
    return this.checkPermissions(route, url);
  }

  private checkPermissions(
    route: ActivatedRouteSnapshot | Route,
    url: string
  ): Observable<boolean> {
    const permissionConfig = this.getPermissionConfig(route);
    
    if (!permissionConfig) {
      // Si no hay configuración de permisos, permitir acceso
      return of(true);
    }

    const permissions = Array.isArray(permissionConfig.permissions) 
      ? permissionConfig.permissions 
      : [permissionConfig.permissions];

    const operator = permissionConfig.operator || 'all';
    const context = this.buildContext(route, permissionConfig.context);

    // Verificar permisos
    const checkMethod = operator === 'any'
      ? this.authorizationService.hasAnyPermission(permissions, context)
      : this.authorizationService.hasAllPermissions(permissions, context);

    return checkMethod.pipe(
      tap(hasPermission => {
        if (!hasPermission) {
          this.handleUnauthorizedAccess(permissionConfig, url);
        }
      }),
      catchError(error => {
        console.error('Error checking permissions for route:', error);
        this.handleUnauthorizedAccess(permissionConfig, url);
        return of(false);
      })
    );
  }

  private getPermissionConfig(route: ActivatedRouteSnapshot | Route): RoutePermissionConfig | null {
    // Buscar configuración en data de la ruta
    const data = 'data' in route ? route.data : route.data;
    
    if (data?.['permissions']) {
      return {
        permissions: data['permissions'],
        operator: data['permissionOperator'] || 'all',
        context: data['permissionContext'],
        redirectTo: data['redirectTo'],
        showNotification: data['showNotification'] !== false,
        notificationMessage: data['notificationMessage']
      };
    }

    // Buscar en configuración específica de permisos
    if (data?.['permissionConfig']) {
      return data['permissionConfig'] as RoutePermissionConfig;
    }

    return null;
  }

  private buildContext(
    route: ActivatedRouteSnapshot | Route,
    baseContext?: AuthorizationContext
  ): AuthorizationContext | undefined {
    const context: AuthorizationContext = { ...baseContext };

    // Agregar parámetros de ruta al contexto
    if ('params' in route && route.params) {
      Object.keys(route.params).forEach(key => {
        context[key] = route.params[key];
      });
    }

    // Agregar query parameters al contexto
    if ('queryParams' in route && route.queryParams) {
      Object.keys(route.queryParams).forEach(key => {
        context[`query_${key}`] = route.queryParams[key];
      });
    }

    return Object.keys(context).length > 0 ? context : undefined;
  }

  private handleUnauthorizedAccess(
    config: RoutePermissionConfig,
    attemptedUrl: string
  ): void {
    // Mostrar notificación si está habilitada
    if (config.showNotification !== false) {
      const message = config.notificationMessage || 
        'No tienes permisos para acceder a esta sección';
      this.notificationService.showError(message);
    }

    // Redirigir si se especifica una ruta
    if (config.redirectTo) {
      this.router.navigate([config.redirectTo]);
    } else {
      // Redirigir a página de acceso denegado o dashboard
      this.router.navigate(['/access-denied'], {
        queryParams: { returnUrl: attemptedUrl }
      });
    }
  }
}

/**
 * Guard específico para roles
 */
@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate, CanActivateChild, CanLoad {

  constructor(
    private authorizationService: AuthorizationService,
    private router: Router,
    private notificationService: CustomNotificationService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkRoles(route, state.url);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkRoles(childRoute, state.url);
  }

  canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> {
    const url = segments.map(segment => segment.path).join('/');
    return this.checkRoles(route, url);
  }

  private checkRoles(
    route: ActivatedRouteSnapshot | Route,
    url: string
  ): Observable<boolean> {
    const data = 'data' in route ? route.data : route.data;
    const requiredRoles = data?.['roles'];
    
    if (!requiredRoles) {
      return of(true);
    }

    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const operator = data?.['roleOperator'] || 'any';

    const checkMethod = operator === 'all'
      ? this.checkAllRoles(roles)
      : this.authorizationService.hasAnyRole(roles);

    return checkMethod.pipe(
      tap(hasRole => {
        if (!hasRole) {
          this.handleUnauthorizedAccess(data, url);
        }
      }),
      catchError(error => {
        console.error('Error checking roles for route:', error);
        this.handleUnauthorizedAccess(data, url);
        return of(false);
      })
    );
  }

  private checkAllRoles(roles: string[]): Observable<boolean> {
    return this.authorizationService.currentUserPermissions$.pipe(
      map(permissions => {
        if (!permissions) return false;
        return roles.every(roleId => 
          permissions.roles.some(role => role.id === roleId)
        );
      })
    );
  }

  private handleUnauthorizedAccess(data: any, attemptedUrl: string): void {
    const message = data?.['notificationMessage'] || 
      'No tienes el rol necesario para acceder a esta sección';
    
    if (data?.['showNotification'] !== false) {
      this.notificationService.showError(message);
    }

    if (data?.['redirectTo']) {
      this.router.navigate([data['redirectTo']]);
    } else {
      this.router.navigate(['/access-denied'], {
        queryParams: { returnUrl: attemptedUrl }
      });
    }
  }
}

/**
 * Guard para nivel de rol
 */
@Injectable({
  providedIn: 'root'
})
export class RoleLevelGuard implements CanActivate, CanActivateChild, CanLoad {

  constructor(
    private authorizationService: AuthorizationService,
    private router: Router,
    private notificationService: CustomNotificationService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkRoleLevel(route, state.url);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkRoleLevel(childRoute, state.url);
  }

  canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> {
    const url = segments.map(segment => segment.path).join('/');
    return this.checkRoleLevel(route, url);
  }

  private checkRoleLevel(
    route: ActivatedRouteSnapshot | Route,
    url: string
  ): Observable<boolean> {
    const data = 'data' in route ? route.data : route.data;
    const requiredLevel = data?.['roleLevel'];
    
    if (!requiredLevel) {
      return of(true);
    }

    return this.authorizationService.hasRoleLevel(requiredLevel).pipe(
      tap(hasLevel => {
        if (!hasLevel) {
          this.handleUnauthorizedAccess(data, url);
        }
      }),
      catchError(error => {
        console.error('Error checking role level for route:', error);
        this.handleUnauthorizedAccess(data, url);
        return of(false);
      })
    );
  }

  private handleUnauthorizedAccess(data: any, attemptedUrl: string): void {
    const message = data?.['notificationMessage'] || 
      'No tienes el nivel de acceso necesario para esta sección';
    
    if (data?.['showNotification'] !== false) {
      this.notificationService.showError(message);
    }

    if (data?.['redirectTo']) {
      this.router.navigate([data['redirectTo']]);
    } else {
      this.router.navigate(['/access-denied'], {
        queryParams: { returnUrl: attemptedUrl }
      });
    }
  }
}
