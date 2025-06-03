import { Injectable } from '@angular/core';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

/**
 * Servicio consolidado para gestión de roles y permisos
 * Unifica AdminRolesService y RolesPermissionsService para eliminar duplicaciones
 * Implementa patrones del sistema glassmorphism design system
 */


export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: string;
  updatedAt?: string;
  userCount?: number;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: 'READ' | 'WRITE' | 'DELETE' | 'ADMIN';
  isSystem: boolean;
}

export interface RoleFilter {
  search?: string;
  isSystem?: boolean;
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  permissions: string[]; // IDs de permisos
}

export interface UpdateRoleRequest {
  id: string;
  name?: string;
  description?: string;
  permissions?: string[]; // IDs de permisos
}

export interface RoleAuditLog {
  id: string;
  roleId: string;
  roleName: string;
  action: string;
  details: string;
  performedBy: string;
  performedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AdminRolesService {
  private apiUrl = `${environment.apiUrl}/admin/roles`;



  // Mock data for development
  private mockRoles: Role[] = [
    {
      id: 'ROLE_ADMIN',
      name: 'Administrador',
      description: 'Acceso completo al sistema',
      permissions: [
        { id: 'PERM_USER_READ', name: 'Ver usuarios', description: 'Ver información de usuarios', module: 'users', action: 'READ', isSystem: true },
        { id: 'PERM_USER_WRITE', name: 'Editar usuarios', description: 'Crear y editar usuarios', module: 'users', action: 'WRITE', isSystem: true },
        { id: 'PERM_USER_DELETE', name: 'Eliminar usuarios', description: 'Eliminar usuarios', module: 'users', action: 'DELETE', isSystem: true },
        { id: 'PERM_ROLE_ADMIN', name: 'Administrar roles', description: 'Administrar roles y permisos', module: 'roles', action: 'ADMIN', isSystem: true },
        { id: 'PERM_CONTEST_ADMIN', name: 'Administrar concursos', description: 'Administrar concursos', module: 'contests', action: 'ADMIN', isSystem: true },
        { id: 'PERM_INSCRIPTION_ADMIN', name: 'Administrar inscripciones', description: 'Administrar inscripciones', module: 'inscriptions', action: 'ADMIN', isSystem: true }
      ],
      isSystem: true,
      createdAt: '2023-01-01T00:00:00Z',
      userCount: 5
    },
    {
      id: 'ROLE_USER',
      name: 'Usuario',
      description: 'Acceso básico al sistema',
      permissions: [
        { id: 'PERM_PROFILE_READ', name: 'Ver perfil', description: 'Ver perfil propio', module: 'profile', action: 'READ', isSystem: true },
        { id: 'PERM_PROFILE_WRITE', name: 'Editar perfil', description: 'Editar perfil propio', module: 'profile', action: 'WRITE', isSystem: true },
        { id: 'PERM_CONTEST_READ', name: 'Ver concursos', description: 'Ver concursos disponibles', module: 'contests', action: 'READ', isSystem: true },
        { id: 'PERM_INSCRIPTION_READ', name: 'Ver inscripciones', description: 'Ver inscripciones propias', module: 'inscriptions', action: 'READ', isSystem: true },
        { id: 'PERM_INSCRIPTION_WRITE', name: 'Crear inscripciones', description: 'Crear y editar inscripciones propias', module: 'inscriptions', action: 'WRITE', isSystem: true }
      ],
      isSystem: true,
      createdAt: '2023-01-01T00:00:00Z',
      userCount: 45
    },
    {
      id: 'ROLE_MANAGER',
      name: 'Gestor',
      description: 'Gestión de concursos e inscripciones',
      permissions: [
        { id: 'PERM_CONTEST_READ', name: 'Ver concursos', description: 'Ver concursos disponibles', module: 'contests', action: 'READ', isSystem: true },
        { id: 'PERM_CONTEST_WRITE', name: 'Editar concursos', description: 'Crear y editar concursos', module: 'contests', action: 'WRITE', isSystem: true },
        { id: 'PERM_INSCRIPTION_READ', name: 'Ver inscripciones', description: 'Ver inscripciones', module: 'inscriptions', action: 'READ', isSystem: true },
        { id: 'PERM_INSCRIPTION_WRITE', name: 'Editar inscripciones', description: 'Editar inscripciones', module: 'inscriptions', action: 'WRITE', isSystem: true }
      ],
      isSystem: true,
      createdAt: '2023-01-01T00:00:00Z',
      userCount: 10
    },
    {
      id: 'ROLE_REVIEWER',
      name: 'Revisor',
      description: 'Revisión de documentos e inscripciones',
      permissions: [
        { id: 'PERM_INSCRIPTION_READ', name: 'Ver inscripciones', description: 'Ver inscripciones', module: 'inscriptions', action: 'READ', isSystem: true },
        { id: 'PERM_DOCUMENT_READ', name: 'Ver documentos', description: 'Ver documentos de inscripciones', module: 'documents', action: 'READ', isSystem: true },
        { id: 'PERM_DOCUMENT_WRITE', name: 'Validar documentos', description: 'Validar documentos de inscripciones', module: 'documents', action: 'WRITE', isSystem: true }
      ],
      isSystem: true,
      createdAt: '2023-01-01T00:00:00Z',
      userCount: 8
    },
    {
      id: 'ROLE_CUSTOM',
      name: 'Rol Personalizado',
      description: 'Rol personalizado de ejemplo',
      permissions: [
        { id: 'PERM_CONTEST_READ', name: 'Ver concursos', description: 'Ver concursos disponibles', module: 'contests', action: 'READ', isSystem: true },
        { id: 'PERM_INSCRIPTION_READ', name: 'Ver inscripciones', description: 'Ver inscripciones', module: 'inscriptions', action: 'READ', isSystem: true }
      ],
      isSystem: false,
      createdAt: '2023-06-15T10:30:00Z',
      updatedAt: '2023-06-20T14:45:00Z',
      userCount: 3
    }
  ];

  private mockPermissions: Permission[] = [
    { id: 'PERM_USER_READ', name: 'Ver usuarios', description: 'Ver información de usuarios', module: 'users', action: 'READ', isSystem: true },
    { id: 'PERM_USER_WRITE', name: 'Editar usuarios', description: 'Crear y editar usuarios', module: 'users', action: 'WRITE', isSystem: true },
    { id: 'PERM_USER_DELETE', name: 'Eliminar usuarios', description: 'Eliminar usuarios', module: 'users', action: 'DELETE', isSystem: true },
    { id: 'PERM_ROLE_READ', name: 'Ver roles', description: 'Ver roles y permisos', module: 'roles', action: 'READ', isSystem: true },
    { id: 'PERM_ROLE_WRITE', name: 'Editar roles', description: 'Crear y editar roles', module: 'roles', action: 'WRITE', isSystem: true },
    { id: 'PERM_ROLE_DELETE', name: 'Eliminar roles', description: 'Eliminar roles', module: 'roles', action: 'DELETE', isSystem: true },
    { id: 'PERM_ROLE_ADMIN', name: 'Administrar roles', description: 'Administrar roles y permisos', module: 'roles', action: 'ADMIN', isSystem: true },
    { id: 'PERM_PROFILE_READ', name: 'Ver perfil', description: 'Ver perfil propio', module: 'profile', action: 'READ', isSystem: true },
    { id: 'PERM_PROFILE_WRITE', name: 'Editar perfil', description: 'Editar perfil propio', module: 'profile', action: 'WRITE', isSystem: true },
    { id: 'PERM_CONTEST_READ', name: 'Ver concursos', description: 'Ver concursos disponibles', module: 'contests', action: 'READ', isSystem: true },
    { id: 'PERM_CONTEST_WRITE', name: 'Editar concursos', description: 'Crear y editar concursos', module: 'contests', action: 'WRITE', isSystem: true },
    { id: 'PERM_CONTEST_DELETE', name: 'Eliminar concursos', description: 'Eliminar concursos', module: 'contests', action: 'DELETE', isSystem: true },
    { id: 'PERM_CONTEST_ADMIN', name: 'Administrar concursos', description: 'Administrar concursos', module: 'contests', action: 'ADMIN', isSystem: true },
    { id: 'PERM_INSCRIPTION_READ', name: 'Ver inscripciones', description: 'Ver inscripciones', module: 'inscriptions', action: 'READ', isSystem: true },
    { id: 'PERM_INSCRIPTION_WRITE', name: 'Editar inscripciones', description: 'Editar inscripciones', module: 'inscriptions', action: 'WRITE', isSystem: true },
    { id: 'PERM_INSCRIPTION_DELETE', name: 'Eliminar inscripciones', description: 'Eliminar inscripciones', module: 'inscriptions', action: 'DELETE', isSystem: true },
    { id: 'PERM_INSCRIPTION_ADMIN', name: 'Administrar inscripciones', description: 'Administrar inscripciones', module: 'inscriptions', action: 'ADMIN', isSystem: true },
    { id: 'PERM_DOCUMENT_READ', name: 'Ver documentos', description: 'Ver documentos de inscripciones', module: 'documents', action: 'READ', isSystem: true },
    { id: 'PERM_DOCUMENT_WRITE', name: 'Validar documentos', description: 'Validar documentos de inscripciones', module: 'documents', action: 'WRITE', isSystem: true },
    { id: 'PERM_DOCUMENT_DELETE', name: 'Eliminar documentos', description: 'Eliminar documentos', module: 'documents', action: 'DELETE', isSystem: true },
    { id: 'PERM_DOCUMENT_ADMIN', name: 'Administrar documentos', description: 'Administrar documentos', module: 'documents', action: 'ADMIN', isSystem: true },
    { id: 'PERM_SYSTEM_CONFIG', name: 'Configuración del sistema', description: 'Acceder a la configuración del sistema', module: 'system', action: 'ADMIN', isSystem: true }
  ];



  /**
   * Get roles with filters and pagination
   * @param filters Filters to apply
   */
  getRoles(filters?: RoleFilter): Observable<{ roles: Role[], total: number }> {
    // In a real app, this would call the API
    // return this.http.get<{ roles: Role[], total: number }>(
    //   this.apiUrl,
    //   { params: this.buildParams(filters), headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error('Error fetching roles:', error);
    //     return of({ roles: [], total: 0 });
    //   })
    // );

    // Mock implementation
    let filteredRoles = [...this.mockRoles];

    if (filters) {
      if (filters.isSystem !== undefined) {
        filteredRoles = filteredRoles.filter(role => role.isSystem === filters.isSystem);
      }

      if (filters.search) {
        const search = filters.search.toLowerCase();
        filteredRoles = filteredRoles.filter(role =>
          role.name.toLowerCase().includes(search) ||
          role.description.toLowerCase().includes(search)
        );
      }

      // Sort
      if (filters.sort) {
        filteredRoles.sort((a: unknown, b: unknown) => {
          const aObj = a as Record<string, unknown>;
          const bObj = b as Record<string, unknown>;
          const aValue = aObj[filters.sort!];
          const bValue = bObj[filters.sort!];

          if (aValue === undefined && bValue === undefined) return 0;
          if (aValue === undefined) return 1;
          if (bValue === undefined) return -1;

          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return filters.direction === 'desc'
              ? bValue.localeCompare(aValue)
              : aValue.localeCompare(bValue);
          }

          // Verificar que los valores son números antes de realizar operaciones aritméticas
          const numA = typeof aValue === 'number' ? aValue : 0;
          const numB = typeof bValue === 'number' ? bValue : 0;
          return filters.direction === 'desc' ? numB - numA : numA - numB;
        });
      }
    }

    // Pagination
    const page = filters?.page || 0;
    const size = filters?.size || 10;
    const start = page * size;
    const end = start + size;
    const paginatedRoles = filteredRoles.slice(start, end);

    return of({
      roles: paginatedRoles,
      total: filteredRoles.length
    });
  }

  /**
   * Get role by ID
   * @param roleId Role ID
   */
  getRoleById(roleId: string): Observable<Role> {
    // In a real app, this would call the API
    // return this.http.get<Role>(
    //   `${this.apiUrl}/${roleId}`,
    //   { headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error(`Error fetching role with ID ${roleId}:`, error);
    //     return throwError(() => new Error('Error al obtener el rol'));
    //   })
    // );

    // Mock implementation
    const role = this.mockRoles.find(r => r.id === roleId);
    if (!role) {
      return throwError(() => new Error(`Rol con ID ${roleId} no encontrado`));
    }
    return of(role);
  }

  /**
   * Create a new role
   * @param role Role data
   */
  createRole(role: CreateRoleRequest): Observable<Role> {
    // In a real app, this would call the API
    // return this.http.post<Role>(
    //   this.apiUrl,
    //   role,
    //   { headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error('Error creating role:', error);
    //     return throwError(() => new Error('Error al crear el rol'));
    //   })
    // );

    // Mock implementation
    const newId = `ROLE_${role.name.toUpperCase().replace(/\s+/g, '_')}`;

    // Get permissions by IDs
    const permissions = this.mockPermissions.filter(p => role.permissions.includes(p.id));

    const newRole: Role = {
      id: newId,
      name: role.name,
      description: role.description,
      permissions: permissions,
      isSystem: false,
      createdAt: new Date().toISOString(),
      userCount: 0
    };

    this.mockRoles.push(newRole);
    return of(newRole);
  }

  /**
   * Update an existing role
   * @param role Role data to update
   */
  updateRole(role: UpdateRoleRequest): Observable<Role> {
    // In a real app, this would call the API
    // return this.http.put<Role>(
    //   `${this.apiUrl}/${role.id}`,
    //   role,
    //   { headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error(`Error updating role with ID ${role.id}:`, error);
    //     return throwError(() => new Error('Error al actualizar el rol'));
    //   })
    // );

    // Mock implementation
    const index = this.mockRoles.findIndex(r => r.id === role.id);
    if (index === -1) {
      return throwError(() => new Error(`Rol con ID ${role.id} no encontrado`));
    }

    // Check if it's a system role
    if (this.mockRoles[index].isSystem) {
      return throwError(() => new Error('No se pueden modificar roles del sistema'));
    }

    // Get permissions by IDs if provided
    let permissions = this.mockRoles[index].permissions;
    if (role.permissions) {
      permissions = this.mockPermissions.filter(p => role.permissions!.includes(p.id));
    }

    const updatedRole: Role = {
      ...this.mockRoles[index],
      name: role.name || this.mockRoles[index].name,
      description: role.description || this.mockRoles[index].description,
      permissions: permissions,
      updatedAt: new Date().toISOString()
    };

    this.mockRoles[index] = updatedRole;
    return of(updatedRole);
  }

  /**
   * Delete a role
   * @param roleId Role ID to delete
   */
  deleteRole(roleId: string): Observable<{ success: boolean }> {
    // In a real app, this would call the API
    // return this.http.delete<{ success: boolean }>(
    //   `${this.apiUrl}/${roleId}`,
    //   { headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error(`Error deleting role with ID ${roleId}:`, error);
    //     return throwError(() => new Error('Error al eliminar el rol'));
    //   })
    // );

    // Mock implementation
    const index = this.mockRoles.findIndex(r => r.id === roleId);
    if (index === -1) {
      return throwError(() => new Error(`Rol con ID ${roleId} no encontrado`));
    }

    // Check if it's a system role
    if (this.mockRoles[index].isSystem) {
      return throwError(() => new Error('No se pueden eliminar roles del sistema'));
    }

    // Check if role has users
    if (this.mockRoles[index].userCount && this.mockRoles[index].userCount > 0) {
      return throwError(() => new Error('No se puede eliminar un rol que tiene usuarios asignados'));
    }

    this.mockRoles.splice(index, 1);
    return of({ success: true });
  }

  /**
   * Get all available permissions
   */
  getPermissions(): Observable<Permission[]> {
    // In a real app, this would call the API
    // return this.http.get<Permission[]>(
    //   `${this.apiUrl}/permissions`,
    //   { headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error('Error fetching permissions:', error);
    //     return throwError(() => new Error('Error al obtener los permisos'));
    //   })
    // );

    // Mock implementation
    return of([...this.mockPermissions]);
  }

  /**
   * Get role audit logs
   * @param roleId Role ID
   */
  getRoleAuditLogs(roleId: string): Observable<RoleAuditLog[]> {
    // In a real app, this would call the API
    // return this.http.get<RoleAuditLog[]>(
    //   `${this.apiUrl}/${roleId}/audit-logs`,
    //   { headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error(`Error fetching audit logs for role with ID ${roleId}:`, error);
    //     return throwError(() => new Error('Error al obtener el historial de auditoría'));
    //   })
    // );

    // Mock implementation
    const role = this.mockRoles.find(r => r.id === roleId);
    if (!role) {
      return throwError(() => new Error(`Rol con ID ${roleId} no encontrado`));
    }

    // Generate mock audit logs
    const mockLogs: RoleAuditLog[] = [
      {
        id: '1',
        roleId: roleId,
        roleName: role.name,
        action: 'CREATE',
        details: 'Creación del rol',
        performedBy: 'admin',
        performedAt: new Date(role.createdAt)
      }
    ];

    if (role.updatedAt) {
      mockLogs.push({
        id: '2',
        roleId: roleId,
        roleName: role.name,
        action: 'UPDATE',
        details: 'Actualización del rol',
        performedBy: 'admin',
        performedAt: new Date(role.updatedAt)
      });
    }

    return of(mockLogs);
  }

  private buildParams(filters?: RoleFilter): HttpParams {
    let params = new HttpParams();

    if (!filters) return params;

    if (filters.search) params = params.set('search', filters.search);
    if (filters.isSystem !== undefined) params = params.set('isSystem', filters.isSystem.toString());
    if (filters.page !== undefined) params = params.set('page', filters.page.toString());
    if (filters.size) params = params.set('size', filters.size.toString());
    if (filters.sort) params = params.set('sort', filters.sort);
    if (filters.direction) params = params.set('direction', filters.direction);

    return params;
  }

  private getHeaders(): HttpHeaders {
    // En una implementación real, obtendríamos el token del servicio
    const token = 'mock-token';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
}
