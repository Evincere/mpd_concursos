import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { map, catchError, tap, shareReplay } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { 
  Role, 
  Permission, 
  UserRole, 
  RoleStatistics, 
  PermissionValidation,
  RoleTemplate,
  RoleRequest,
  UserEffectivePermissions,
  RoleConfiguration,
  RoleAudit,
  PermissionMatrix
} from '@shared/interfaces/roles/role.interface';

/**
 * Servicio para gestión de roles y permisos
 */
@Injectable({
  providedIn: 'root'
})
export class RoleManagementService {

  private readonly apiUrl = `${environment.apiUrl}/roles`;
  private readonly permissionsUrl = `${environment.apiUrl}/permissions`;

  // Estados internos
  private rolesSubject = new BehaviorSubject<Role[]>([]);
  private permissionsSubject = new BehaviorSubject<Permission[]>([]);
  private userRolesSubject = new BehaviorSubject<UserRole[]>([]);
  private configurationSubject = new BehaviorSubject<RoleConfiguration | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  // Observables públicos
  public roles$ = this.rolesSubject.asObservable();
  public permissions$ = this.permissionsSubject.asObservable();
  public userRoles$ = this.userRolesSubject.asObservable();
  public configuration$ = this.configurationSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  // Cache para permisos efectivos
  private effectivePermissionsCache = new Map<string, UserEffectivePermissions>();

  constructor(private http: HttpClient) {
    this.loadInitialData();
  }

  /**
   * Carga los datos iniciales
   */
  private loadInitialData(): void {
    this.loadRoles();
    this.loadPermissions();
    this.loadConfiguration();
  }

  // ==================== GESTIÓN DE ROLES ====================

  /**
   * Obtiene todos los roles
   */
  loadRoles(): Observable<Role[]> {
    this.loadingSubject.next(true);
    
    return this.http.get<Role[]>(`${this.apiUrl}`).pipe(
      tap(roles => {
        this.rolesSubject.next(roles);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        console.error('Error loading roles:', error);
        this.loadingSubject.next(false);
        return of([]);
      }),
      shareReplay(1)
    );
  }

  /**
   * Obtiene un rol por ID
   */
  getRoleById(roleId: string): Observable<Role | null> {
    return this.http.get<Role>(`${this.apiUrl}/${roleId}`).pipe(
      catchError(error => {
        console.error('Error loading role:', error);
        return of(null);
      })
    );
  }

  /**
   * Crea un nuevo rol
   */
  createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Observable<Role> {
    return this.http.post<Role>(`${this.apiUrl}`, role).pipe(
      tap(newRole => {
        const currentRoles = this.rolesSubject.value;
        this.rolesSubject.next([...currentRoles, newRole]);
      }),
      catchError(error => {
        console.error('Error creating role:', error);
        throw error;
      })
    );
  }

  /**
   * Actualiza un rol existente
   */
  updateRole(roleId: string, updates: Partial<Role>): Observable<Role> {
    return this.http.put<Role>(`${this.apiUrl}/${roleId}`, updates).pipe(
      tap(updatedRole => {
        const currentRoles = this.rolesSubject.value;
        const index = currentRoles.findIndex(r => r.id === roleId);
        if (index !== -1) {
          currentRoles[index] = updatedRole;
          this.rolesSubject.next([...currentRoles]);
        }
      }),
      catchError(error => {
        console.error('Error updating role:', error);
        throw error;
      })
    );
  }

  /**
   * Elimina un rol
   */
  deleteRole(roleId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${roleId}`).pipe(
      tap(() => {
        const currentRoles = this.rolesSubject.value;
        const filteredRoles = currentRoles.filter(r => r.id !== roleId);
        this.rolesSubject.next(filteredRoles);
      }),
      catchError(error => {
        console.error('Error deleting role:', error);
        throw error;
      })
    );
  }

  /**
   * Activa/desactiva un rol
   */
  toggleRoleStatus(roleId: string, isActive: boolean): Observable<Role> {
    return this.updateRole(roleId, { isActive });
  }

  // ==================== GESTIÓN DE PERMISOS ====================

  /**
   * Obtiene todos los permisos
   */
  loadPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.permissionsUrl}`).pipe(
      tap(permissions => {
        this.permissionsSubject.next(permissions);
      }),
      catchError(error => {
        console.error('Error loading permissions:', error);
        return of([]);
      }),
      shareReplay(1)
    );
  }

  /**
   * Obtiene permisos agrupados por módulo
   */
  getPermissionsByModule(): Observable<Map<string, Permission[]>> {
    return this.permissions$.pipe(
      map(permissions => {
        const grouped = new Map<string, Permission[]>();
        permissions.forEach(permission => {
          const module = permission.module;
          if (!grouped.has(module)) {
            grouped.set(module, []);
          }
          grouped.get(module)!.push(permission);
        });
        return grouped;
      })
    );
  }

  /**
   * Asigna permisos a un rol
   */
  assignPermissionsToRole(roleId: string, permissionIds: string[]): Observable<Role> {
    return this.http.post<Role>(`${this.apiUrl}/${roleId}/permissions`, { permissionIds }).pipe(
      tap(updatedRole => {
        const currentRoles = this.rolesSubject.value;
        const index = currentRoles.findIndex(r => r.id === roleId);
        if (index !== -1) {
          currentRoles[index] = updatedRole;
          this.rolesSubject.next([...currentRoles]);
        }
      }),
      catchError(error => {
        console.error('Error assigning permissions to role:', error);
        throw error;
      })
    );
  }

  /**
   * Remueve permisos de un rol
   */
  removePermissionsFromRole(roleId: string, permissionIds: string[]): Observable<Role> {
    return this.http.delete<Role>(`${this.apiUrl}/${roleId}/permissions`, {
      body: { permissionIds }
    }).pipe(
      tap(updatedRole => {
        const currentRoles = this.rolesSubject.value;
        const index = currentRoles.findIndex(r => r.id === roleId);
        if (index !== -1) {
          currentRoles[index] = updatedRole;
          this.rolesSubject.next([...currentRoles]);
        }
      }),
      catchError(error => {
        console.error('Error removing permissions from role:', error);
        throw error;
      })
    );
  }

  // ==================== GESTIÓN DE ROLES DE USUARIO ====================

  /**
   * Obtiene roles de un usuario
   */
  getUserRoles(userId: string): Observable<UserRole[]> {
    return this.http.get<UserRole[]>(`${this.apiUrl}/users/${userId}/roles`).pipe(
      catchError(error => {
        console.error('Error loading user roles:', error);
        return of([]);
      })
    );
  }

  /**
   * Asigna un rol a un usuario
   */
  assignRoleToUser(userId: string, roleId: string, context?: any): Observable<UserRole> {
    const payload = { roleId, context };
    return this.http.post<UserRole>(`${this.apiUrl}/users/${userId}/roles`, payload).pipe(
      tap(userRole => {
        const currentUserRoles = this.userRolesSubject.value;
        this.userRolesSubject.next([...currentUserRoles, userRole]);
        // Limpiar cache de permisos efectivos
        this.effectivePermissionsCache.delete(userId);
      }),
      catchError(error => {
        console.error('Error assigning role to user:', error);
        throw error;
      })
    );
  }

  /**
   * Remueve un rol de un usuario
   */
  removeRoleFromUser(userId: string, roleId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${userId}/roles/${roleId}`).pipe(
      tap(() => {
        const currentUserRoles = this.userRolesSubject.value;
        const filteredUserRoles = currentUserRoles.filter(
          ur => !(ur.userId === userId && ur.roleId === roleId)
        );
        this.userRolesSubject.next(filteredUserRoles);
        // Limpiar cache de permisos efectivos
        this.effectivePermissionsCache.delete(userId);
      }),
      catchError(error => {
        console.error('Error removing role from user:', error);
        throw error;
      })
    );
  }

  // ==================== VALIDACIÓN DE PERMISOS ====================

  /**
   * Verifica si un usuario tiene un permiso específico
   */
  hasPermission(userId: string, permissionId: string, context?: any): Observable<PermissionValidation> {
    const params = new HttpParams()
      .set('permissionId', permissionId)
      .set('context', context ? JSON.stringify(context) : '');

    return this.http.get<PermissionValidation>(`${this.apiUrl}/users/${userId}/permissions/validate`, { params }).pipe(
      catchError(error => {
        console.error('Error validating permission:', error);
        return of({
          hasPermission: false,
          reason: 'Error validating permission',
          requiredPermissions: [permissionId],
          userPermissions: [],
          missingPermissions: [permissionId]
        });
      })
    );
  }

  /**
   * Obtiene los permisos efectivos de un usuario
   */
  getUserEffectivePermissions(userId: string, useCache: boolean = true): Observable<UserEffectivePermissions> {
    // Verificar cache
    if (useCache && this.effectivePermissionsCache.has(userId)) {
      return of(this.effectivePermissionsCache.get(userId)!);
    }

    return this.http.get<UserEffectivePermissions>(`${this.apiUrl}/users/${userId}/permissions/effective`).pipe(
      tap(permissions => {
        this.effectivePermissionsCache.set(userId, permissions);
      }),
      catchError(error => {
        console.error('Error loading effective permissions:', error);
        throw error;
      })
    );
  }

  // ==================== ESTADÍSTICAS Y REPORTES ====================

  /**
   * Obtiene estadísticas de roles
   */
  getRoleStatistics(): Observable<RoleStatistics> {
    return this.http.get<RoleStatistics>(`${this.apiUrl}/statistics`).pipe(
      catchError(error => {
        console.error('Error loading role statistics:', error);
        throw error;
      })
    );
  }

  /**
   * Obtiene la matriz de permisos
   */
  getPermissionMatrix(): Observable<PermissionMatrix[]> {
    return this.http.get<PermissionMatrix[]>(`${this.permissionsUrl}/matrix`).pipe(
      catchError(error => {
        console.error('Error loading permission matrix:', error);
        return of([]);
      })
    );
  }

  // ==================== CONFIGURACIÓN ====================

  /**
   * Obtiene la configuración de roles
   */
  loadConfiguration(): Observable<RoleConfiguration> {
    return this.http.get<RoleConfiguration>(`${this.apiUrl}/configuration`).pipe(
      tap(config => {
        this.configurationSubject.next(config);
      }),
      catchError(error => {
        console.error('Error loading role configuration:', error);
        return of({
          allowRoleInheritance: true,
          allowMultipleRoles: true,
          requireApprovalForRoleChanges: false,
          maxRolesPerUser: 5,
          defaultRole: 'USER',
          guestRole: 'GUEST',
          systemRoles: ['SUPER_ADMIN', 'ADMIN'],
          roleHierarchy: []
        });
      })
    );
  }

  /**
   * Actualiza la configuración de roles
   */
  updateConfiguration(config: Partial<RoleConfiguration>): Observable<RoleConfiguration> {
    return this.http.put<RoleConfiguration>(`${this.apiUrl}/configuration`, config).pipe(
      tap(updatedConfig => {
        this.configurationSubject.next(updatedConfig);
      }),
      catchError(error => {
        console.error('Error updating role configuration:', error);
        throw error;
      })
    );
  }

  // ==================== UTILIDADES ====================

  /**
   * Limpia el cache de permisos efectivos
   */
  clearPermissionsCache(userId?: string): void {
    if (userId) {
      this.effectivePermissionsCache.delete(userId);
    } else {
      this.effectivePermissionsCache.clear();
    }
  }

  /**
   * Obtiene roles filtrados por criterios
   */
  getFilteredRoles(filters: {
    type?: string;
    level?: string;
    isActive?: boolean;
    search?: string;
  }): Observable<Role[]> {
    return this.roles$.pipe(
      map(roles => {
        return roles.filter(role => {
          if (filters.type && role.type !== filters.type) return false;
          if (filters.level && role.level !== filters.level) return false;
          if (filters.isActive !== undefined && role.isActive !== filters.isActive) return false;
          if (filters.search) {
            const search = filters.search.toLowerCase();
            return role.name.toLowerCase().includes(search) || 
                   role.description.toLowerCase().includes(search);
          }
          return true;
        });
      })
    );
  }

  /**
   * Obtiene el estado actual de roles
   */
  getCurrentRoles(): Role[] {
    return this.rolesSubject.value;
  }

  /**
   * Obtiene el estado actual de permisos
   */
  getCurrentPermissions(): Permission[] {
    return this.permissionsSubject.value;
  }

  // ==================== PLANTILLAS Y SOLICITUDES ====================

  /**
   * Obtiene plantillas de roles
   */
  getRoleTemplates(): Observable<RoleTemplate[]> {
    return this.http.get<RoleTemplate[]>(`${this.apiUrl}/templates`).pipe(
      catchError(error => {
        console.error('Error loading role templates:', error);
        return of([]);
      })
    );
  }

  /**
   * Crea un rol desde una plantilla
   */
  createRoleFromTemplate(templateId: string, roleName: string, roleDescription: string): Observable<Role> {
    const payload = { templateId, name: roleName, description: roleDescription };
    return this.http.post<Role>(`${this.apiUrl}/from-template`, payload).pipe(
      tap(newRole => {
        const currentRoles = this.rolesSubject.value;
        this.rolesSubject.next([...currentRoles, newRole]);
      }),
      catchError(error => {
        console.error('Error creating role from template:', error);
        throw error;
      })
    );
  }

  /**
   * Obtiene solicitudes de roles pendientes
   */
  getRoleRequests(status?: string): Observable<RoleRequest[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<RoleRequest[]>(`${this.apiUrl}/requests`, { params }).pipe(
      catchError(error => {
        console.error('Error loading role requests:', error);
        return of([]);
      })
    );
  }

  /**
   * Aprueba o rechaza una solicitud de rol
   */
  reviewRoleRequest(requestId: string, approved: boolean, notes?: string): Observable<RoleRequest> {
    const payload = { approved, notes };
    return this.http.put<RoleRequest>(`${this.apiUrl}/requests/${requestId}/review`, payload).pipe(
      catchError(error => {
        console.error('Error reviewing role request:', error);
        throw error;
      })
    );
  }

  // ==================== AUDITORÍA ====================

  /**
   * Obtiene el historial de auditoría de roles
   */
  getRoleAuditHistory(filters?: {
    userId?: string;
    roleId?: string;
    action?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Observable<RoleAudit[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.userId) params = params.set('userId', filters.userId);
      if (filters.roleId) params = params.set('roleId', filters.roleId);
      if (filters.action) params = params.set('action', filters.action);
      if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom.toISOString());
      if (filters.dateTo) params = params.set('dateTo', filters.dateTo.toISOString());
    }

    return this.http.get<RoleAudit[]>(`${this.apiUrl}/audit`, { params }).pipe(
      catchError(error => {
        console.error('Error loading role audit history:', error);
        return of([]);
      })
    );
  }
}
