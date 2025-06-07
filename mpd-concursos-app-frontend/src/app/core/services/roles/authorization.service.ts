import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, combineLatest } from 'rxjs';
import { map, switchMap, catchError, tap, shareReplay } from 'rxjs/operators';
import { AuthService } from '@core/services/auth.service';
import { RoleManagementService } from './role-management.service';
import { 
  Permission, 
  Role, 
  UserEffectivePermissions, 
  PermissionValidation,
  PermissionAction
} from '@shared/interfaces/roles/role.interface';

/**
 * Contexto de autorización para permisos contextuales
 */
export interface AuthorizationContext {
  resource?: string;
  resourceId?: string;
  department?: string;
  project?: string;
  location?: string;
  [key: string]: any;
}

/**
 * Resultado de verificación de autorización
 */
export interface AuthorizationResult {
  authorized: boolean;
  reason?: string;
  requiredPermissions: string[];
  userPermissions: string[];
  missingPermissions: string[];
  context?: AuthorizationContext;
}

/**
 * Servicio de autorización para control de acceso basado en roles
 */
@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {

  private currentUserPermissionsSubject = new BehaviorSubject<UserEffectivePermissions | null>(null);
  private authorizationCacheSubject = new BehaviorSubject<Map<string, AuthorizationResult>>(new Map());

  public currentUserPermissions$ = this.currentUserPermissionsSubject.asObservable();
  public authorizationCache$ = this.authorizationCacheSubject.asObservable();

  // Cache de autorizaciones para evitar consultas repetidas
  private authorizationCache = new Map<string, AuthorizationResult>();
  private cacheExpiration = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  constructor(
    private authService: AuthService,
    private roleManagementService: RoleManagementService
  ) {
    this.initializeUserPermissions();
  }

  /**
   * Inicializa los permisos del usuario actual
   */
  private initializeUserPermissions(): void {
    this.authService.currentUser$.pipe(
      switchMap(user => {
        if (user?.id) {
          return this.roleManagementService.getUserEffectivePermissions(user.id);
        }
        return of(null);
      }),
      tap(permissions => {
        this.currentUserPermissionsSubject.next(permissions);
        // Limpiar cache cuando cambian los permisos
        this.clearAuthorizationCache();
      })
    ).subscribe();
  }

  // ==================== VERIFICACIÓN DE PERMISOS ====================

  /**
   * Verifica si el usuario actual tiene un permiso específico
   */
  hasPermission(
    permission: string | Permission, 
    context?: AuthorizationContext
  ): Observable<boolean> {
    return this.checkAuthorization(permission, context).pipe(
      map(result => result.authorized)
    );
  }

  /**
   * Verifica si el usuario actual tiene todos los permisos especificados
   */
  hasAllPermissions(
    permissions: (string | Permission)[], 
    context?: AuthorizationContext
  ): Observable<boolean> {
    const checks = permissions.map(permission => 
      this.checkAuthorization(permission, context)
    );

    return combineLatest(checks).pipe(
      map(results => results.every(result => result.authorized))
    );
  }

  /**
   * Verifica si el usuario actual tiene al menos uno de los permisos especificados
   */
  hasAnyPermission(
    permissions: (string | Permission)[], 
    context?: AuthorizationContext
  ): Observable<boolean> {
    const checks = permissions.map(permission => 
      this.checkAuthorization(permission, context)
    );

    return combineLatest(checks).pipe(
      map(results => results.some(result => result.authorized))
    );
  }

  /**
   * Verifica autorización completa con detalles
   */
  checkAuthorization(
    permission: string | Permission, 
    context?: AuthorizationContext
  ): Observable<AuthorizationResult> {
    const permissionId = typeof permission === 'string' ? permission : permission.id;
    const cacheKey = this.generateCacheKey(permissionId, context);

    // Verificar cache
    if (this.isCacheValid(cacheKey)) {
      return of(this.authorizationCache.get(cacheKey)!);
    }

    return this.currentUserPermissions$.pipe(
      switchMap(userPermissions => {
        if (!userPermissions) {
          const result: AuthorizationResult = {
            authorized: false,
            reason: 'User permissions not loaded',
            requiredPermissions: [permissionId],
            userPermissions: [],
            missingPermissions: [permissionId],
            context
          };
          this.cacheResult(cacheKey, result);
          return of(result);
        }

        return this.evaluatePermission(userPermissions, permission, context).pipe(
          tap(result => this.cacheResult(cacheKey, result))
        );
      }),
      catchError(error => {
        console.error('Error checking authorization:', error);
        const result: AuthorizationResult = {
          authorized: false,
          reason: 'Authorization check failed',
          requiredPermissions: [permissionId],
          userPermissions: [],
          missingPermissions: [permissionId],
          context
        };
        return of(result);
      }),
      shareReplay(1)
    );
  }

  /**
   * Evalúa un permiso específico contra los permisos del usuario
   */
  private evaluatePermission(
    userPermissions: UserEffectivePermissions,
    permission: string | Permission,
    context?: AuthorizationContext
  ): Observable<AuthorizationResult> {
    const permissionId = typeof permission === 'string' ? permission : permission.id;
    const permissionObj = typeof permission === 'string' 
      ? userPermissions.permissions.find(p => p.id === permission)
      : permission;

    // Verificar si el usuario tiene el permiso
    const hasDirectPermission = userPermissions.permissions.some(p => p.id === permissionId);
    const hasInheritedPermission = userPermissions.inheritedPermissions.some(p => p.id === permissionId);
    const isDenied = userPermissions.deniedPermissions.some(p => p.id === permissionId);

    // Si está explícitamente denegado
    if (isDenied) {
      return of({
        authorized: false,
        reason: 'Permission explicitly denied',
        requiredPermissions: [permissionId],
        userPermissions: userPermissions.permissions.map(p => p.id),
        missingPermissions: [permissionId],
        context
      });
    }

    // Si tiene el permiso (directo o heredado)
    if (hasDirectPermission || hasInheritedPermission) {
      // Verificar condiciones contextuales si existen
      if (permissionObj?.conditions && context) {
        return this.evaluatePermissionConditions(permissionObj, context).pipe(
          map(conditionsValid => ({
            authorized: conditionsValid,
            reason: conditionsValid ? undefined : 'Permission conditions not met',
            requiredPermissions: [permissionId],
            userPermissions: userPermissions.permissions.map(p => p.id),
            missingPermissions: conditionsValid ? [] : [permissionId],
            context
          }))
        );
      }

      return of({
        authorized: true,
        requiredPermissions: [permissionId],
        userPermissions: userPermissions.permissions.map(p => p.id),
        missingPermissions: [],
        context
      });
    }

    // No tiene el permiso
    return of({
      authorized: false,
      reason: 'Permission not granted',
      requiredPermissions: [permissionId],
      userPermissions: userPermissions.permissions.map(p => p.id),
      missingPermissions: [permissionId],
      context
    });
  }

  /**
   * Evalúa las condiciones contextuales de un permiso
   */
  private evaluatePermissionConditions(
    permission: Permission,
    context: AuthorizationContext
  ): Observable<boolean> {
    if (!permission.conditions || permission.conditions.length === 0) {
      return of(true);
    }

    // Evaluar todas las condiciones
    const conditionResults = permission.conditions.map(condition => {
      const contextValue = context[condition.field];
      
      switch (condition.operator) {
        case 'EQUALS':
          return contextValue === condition.value;
        case 'NOT_EQUALS':
          return contextValue !== condition.value;
        case 'IN':
          return Array.isArray(condition.value) && condition.value.includes(contextValue);
        case 'NOT_IN':
          return Array.isArray(condition.value) && !condition.value.includes(contextValue);
        case 'GREATER_THAN':
          return contextValue > condition.value;
        case 'LESS_THAN':
          return contextValue < condition.value;
        case 'CONTAINS':
          return typeof contextValue === 'string' && contextValue.includes(condition.value);
        default:
          return false;
      }
    });

    // Todas las condiciones deben ser verdaderas (AND lógico)
    return of(conditionResults.every(result => result));
  }

  // ==================== VERIFICACIONES DE ROLES ====================

  /**
   * Verifica si el usuario actual tiene un rol específico
   */
  hasRole(roleId: string): Observable<boolean> {
    return this.currentUserPermissions$.pipe(
      map(permissions => {
        if (!permissions) return false;
        return permissions.roles.some(role => role.id === roleId);
      })
    );
  }

  /**
   * Verifica si el usuario actual tiene alguno de los roles especificados
   */
  hasAnyRole(roleIds: string[]): Observable<boolean> {
    return this.currentUserPermissions$.pipe(
      map(permissions => {
        if (!permissions) return false;
        return permissions.roles.some(role => roleIds.includes(role.id));
      })
    );
  }

  /**
   * Verifica si el usuario actual tiene un nivel de rol específico o superior
   */
  hasRoleLevel(level: string): Observable<boolean> {
    return this.currentUserPermissions$.pipe(
      map(permissions => {
        if (!permissions) return false;
        // Implementar lógica de jerarquía de roles
        const hierarchy = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR', 'USER', 'GUEST'];
        const requiredIndex = hierarchy.indexOf(level);
        
        return permissions.roles.some(role => {
          const userLevelIndex = hierarchy.indexOf(role.level);
          return userLevelIndex <= requiredIndex; // Menor índice = mayor nivel
        });
      })
    );
  }

  // ==================== GESTIÓN DE CACHE ====================

  /**
   * Genera una clave de cache para autorización
   */
  private generateCacheKey(permissionId: string, context?: AuthorizationContext): string {
    const contextStr = context ? JSON.stringify(context) : '';
    return `${permissionId}:${contextStr}`;
  }

  /**
   * Verifica si un resultado en cache es válido
   */
  private isCacheValid(cacheKey: string): boolean {
    if (!this.authorizationCache.has(cacheKey)) {
      return false;
    }

    const expiration = this.cacheExpiration.get(cacheKey);
    if (!expiration || Date.now() > expiration) {
      this.authorizationCache.delete(cacheKey);
      this.cacheExpiration.delete(cacheKey);
      return false;
    }

    return true;
  }

  /**
   * Almacena un resultado en cache
   */
  private cacheResult(cacheKey: string, result: AuthorizationResult): void {
    this.authorizationCache.set(cacheKey, result);
    this.cacheExpiration.set(cacheKey, Date.now() + this.CACHE_DURATION);
    this.authorizationCacheSubject.next(new Map(this.authorizationCache));
  }

  /**
   * Limpia el cache de autorización
   */
  clearAuthorizationCache(): void {
    this.authorizationCache.clear();
    this.cacheExpiration.clear();
    this.authorizationCacheSubject.next(new Map());
  }

  // ==================== UTILIDADES ====================

  /**
   * Obtiene los permisos actuales del usuario
   */
  getCurrentUserPermissions(): UserEffectivePermissions | null {
    return this.currentUserPermissionsSubject.value;
  }

  /**
   * Refresca los permisos del usuario actual
   */
  refreshUserPermissions(): Observable<UserEffectivePermissions | null> {
    return this.authService.currentUser$.pipe(
      switchMap(user => {
        if (user?.id) {
          return this.roleManagementService.getUserEffectivePermissions(user.id, false);
        }
        return of(null);
      }),
      tap(permissions => {
        this.currentUserPermissionsSubject.next(permissions);
        this.clearAuthorizationCache();
      })
    );
  }

  /**
   * Verifica múltiples permisos de forma eficiente
   */
  checkMultiplePermissions(
    permissions: { permission: string | Permission; context?: AuthorizationContext }[]
  ): Observable<Map<string, AuthorizationResult>> {
    const checks = permissions.map(({ permission, context }) => {
      const permissionId = typeof permission === 'string' ? permission : permission.id;
      return this.checkAuthorization(permission, context).pipe(
        map(result => ({ permissionId, result }))
      );
    });

    return combineLatest(checks).pipe(
      map(results => {
        const resultMap = new Map<string, AuthorizationResult>();
        results.forEach(({ permissionId, result }) => {
          resultMap.set(permissionId, result);
        });
        return resultMap;
      })
    );
  }
}
