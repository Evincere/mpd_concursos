import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { environment } from '../../../../environments/environment';

/**
 * Interfaz para los roles del sistema
 */
export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Interfaz para los permisos del sistema
 */
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  isSystem: boolean;
}

/**
 * Interfaz para la asignación de roles a usuarios
 */
export interface UserRole {
  userId: string;
  username: string;
  fullName: string;
  email: string;
  roles: string[];
}

/**
 * Interfaz para la respuesta paginada de roles
 */
export interface RolesResponse {
  roles: Role[];
  total: number;
  page: number;
  size: number;
}

/**
 * Interfaz para la respuesta paginada de permisos
 */
export interface PermissionsResponse {
  permissions: Permission[];
  total: number;
  page: number;
  size: number;
}

/**
 * Interfaz para la respuesta paginada de usuarios con roles
 */
export interface UserRolesResponse {
  users: UserRole[];
  total: number;
  page: number;
  size: number;
}

/**
 * Interfaz para los filtros de roles
 */
export interface RoleFilter {
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

/**
 * Interfaz para los filtros de permisos
 */
export interface PermissionFilter {
  search?: string;
  category?: string;
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

/**
 * Interfaz para los filtros de usuarios con roles
 */
export interface UserRoleFilter {
  search?: string;
  role?: string;
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class RolesPermissionsService {
  private apiUrl = `${environment.apiUrl}/admin`;
  private http: HttpClient;

  constructor(
    private loggingService: LoggingService
  ) {
    // En una implementación real, se inyectaría HttpClient
    this.http = {
      get: <T>(_url: string, _options?: unknown): Observable<T> => {
        return of({} as T);
      },
      post: <T>(_url: string, _body: unknown): Observable<T> => {
        return of({} as T);
      },
      put: <T>(_url: string, _body: unknown): Observable<T> => {
        return of({} as T);
      },
      delete: <T>(_url: string): Observable<T> => {
        return of({} as T);
      }
    } as HttpClient;
  }



  /**
   * Obtiene todos los roles del sistema
   * @param filter Filtros para la búsqueda
   * @returns Observable con la respuesta paginada de roles
   */
  getRoles(filter?: RoleFilter): Observable<RolesResponse> {
    // En una implementación real, esto sería una llamada a la API
    // return this.http.get<RolesResponse>(`${this.apiUrl}/roles`, { params: this.buildParams(filter) });

    // Implementación mock para desarrollo
    return of(this.getMockRoles(filter));
  }

  /**
   * Obtiene un rol por su ID
   * @param roleId ID del rol
   * @returns Observable con el rol
   */
  getRole(roleId: string): Observable<Role> {
    // En una implementación real, esto sería una llamada a la API
    // return this.http.get<Role>(`${this.apiUrl}/roles/${roleId}`);

    // Implementación mock para desarrollo
    const mockRoles = this.getMockRoles().roles;
    const role = mockRoles.find(r => r.id === roleId);

    if (!role) {
      return of({
        id: '',
        name: '',
        description: '',
        isSystem: false,
        permissions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return of(role);
  }

  /**
   * Crea un nuevo rol
   * @param role Rol a crear
   * @returns Observable con el rol creado
   */
  createRole(role: Partial<Role>): Observable<Role> {
    // En una implementación real, esto sería una llamada a la API
    // return this.http.post<Role>(`${this.apiUrl}/roles`, role);

    // Implementación mock para desarrollo
    const newRole: Role = {
      id: this.generateId(),
      name: role.name || '',
      description: role.description || '',
      isSystem: false,
      permissions: role.permissions || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return of(newRole);
  }

  /**
   * Actualiza un rol existente
   * @param roleId ID del rol a actualizar
   * @param role Datos actualizados del rol
   * @returns Observable con el rol actualizado
   */
  updateRole(roleId: string, role: Partial<Role>): Observable<Role> {
    // En una implementación real, esto sería una llamada a la API
    // return this.http.put<Role>(`${this.apiUrl}/roles/${roleId}`, role);

    // Implementación mock para desarrollo
    const mockRoles = this.getMockRoles().roles;
    const existingRole = mockRoles.find(r => r.id === roleId);

    if (!existingRole) {
      throw new Error(`Role with ID ${roleId} not found`);
    }

    const updatedRole: Role = {
      ...existingRole,
      name: role.name || existingRole.name,
      description: role.description || existingRole.description,
      permissions: role.permissions || existingRole.permissions,
      updatedAt: new Date().toISOString()
    };

    return of(updatedRole);
  }

  /**
   * Elimina un rol
   * @param roleId ID del rol a eliminar
   * @returns Observable con la respuesta vacía
   */
  deleteRole(_roleId: string): Observable<void> {
    // En una implementación real, esto sería una llamada a la API
    // return this.http.delete<void>(`${this.apiUrl}/roles/${roleId}`);

    // Implementación mock para desarrollo
    return of(undefined);
  }

  /**
   * Obtiene todos los permisos del sistema
   * @param filter Filtros para la búsqueda
   * @returns Observable con la respuesta paginada de permisos
   */
  getPermissions(filter?: PermissionFilter): Observable<PermissionsResponse> {
    // En una implementación real, esto sería una llamada a la API
    // return this.http.get<PermissionsResponse>(`${this.apiUrl}/permissions`, { params: this.buildParams(filter) });

    // Implementación mock para desarrollo
    return of(this.getMockPermissions(filter));
  }

  /**
   * Obtiene las categorías de permisos
   * @returns Observable con las categorías de permisos
   */
  getPermissionCategories(): Observable<string[]> {
    // En una implementación real, esto sería una llamada a la API
    // return this.http.get<string[]>(`${this.apiUrl}/permissions/categories`);

    // Implementación mock para desarrollo
    return of(['users', 'contests', 'inscriptions', 'documents', 'reports', 'system']);
  }

  /**
   * Obtiene los usuarios con sus roles asignados
   * @param filter Filtros para la búsqueda
   * @returns Observable con la respuesta paginada de usuarios con roles
   */
  getUserRoles(filter?: UserRoleFilter): Observable<UserRolesResponse> {
    // En una implementación real, esto sería una llamada a la API
    // return this.http.get<UserRolesResponse>(`${this.apiUrl}/user-roles`, { params: this.buildParams(filter) });

    // Implementación mock para desarrollo
    return of(this.getMockUserRoles(filter));
  }

  /**
   * Actualiza los roles de un usuario
   * @param userId ID del usuario
   * @param roles Roles a asignar
   * @returns Observable con el usuario actualizado
   */
  updateUserRoles(userId: string, roles: string[]): Observable<UserRole> {
    // En una implementación real, esto sería una llamada a la API
    // return this.http.put<UserRole>(`${this.apiUrl}/users/${userId}/roles`, { roles });

    // Implementación mock para desarrollo
    const mockUsers = this.getMockUserRoles().users;
    const user = mockUsers.find(u => u.userId === userId);

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const updatedUser: UserRole = {
      ...user,
      roles
    };

    return of(updatedUser);
  }

  /**
   * Construye los parámetros para las peticiones HTTP
   * @param filter Filtros para la búsqueda
   * @returns HttpParams con los filtros
   */
  private buildParams(filter?: Record<string, unknown>): HttpParams {
    let params = new HttpParams();

    if (filter) {
      Object.keys(filter).forEach(key => {
        const value = filter[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }

    return params;
  }

  /**
   * Genera un ID único
   * @returns ID único
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Genera datos mock para los roles
   * @param filter Filtros para la búsqueda
   * @returns Respuesta paginada de roles
   */
  private getMockRoles(filter?: RoleFilter): RolesResponse {
    const roles: Role[] = [
      {
        id: '1',
        name: 'ROLE_ADMIN',
        description: 'Administrador del sistema con acceso completo',
        isSystem: true,
        permissions: ['*'],
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: 'ROLE_USER',
        description: 'Usuario estándar con acceso limitado',
        isSystem: true,
        permissions: [
          'contests.view',
          'inscriptions.create',
          'inscriptions.view_own',
          'documents.upload',
          'documents.view_own',
          'profile.edit_own'
        ],
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      },
      {
        id: '3',
        name: 'ROLE_EVALUATOR',
        description: 'Evaluador de postulaciones',
        isSystem: false,
        permissions: [
          'contests.view',
          'inscriptions.view',
          'inscriptions.evaluate',
          'documents.view',
          'reports.view'
        ],
        createdAt: '2023-02-15T00:00:00Z',
        updatedAt: '2023-02-15T00:00:00Z'
      },
      {
        id: '4',
        name: 'ROLE_SUPERVISOR',
        description: 'Supervisor de concursos',
        isSystem: false,
        permissions: [
          'contests.view',
          'contests.create',
          'contests.edit',
          'inscriptions.view',
          'inscriptions.approve',
          'documents.view',
          'reports.view',
          'reports.create'
        ],
        createdAt: '2023-03-10T00:00:00Z',
        updatedAt: '2023-03-10T00:00:00Z'
      }
    ];

    // Aplicar filtros si existen
    let filteredRoles = [...roles];

    if (filter?.search) {
      const search = filter.search.toLowerCase();
      filteredRoles = filteredRoles.filter(role =>
        role.name.toLowerCase().includes(search) ||
        role.description.toLowerCase().includes(search)
      );
    }

    // Ordenar
    const sortField = filter?.sort || 'name';
    const sortDirection = filter?.direction || 'asc';

    filteredRoles.sort((a, b) => {
      const aValue = a[sortField] as string | number;
      const bValue = b[sortField] as string | number;

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // Paginar
    const page = filter?.page || 0;
    const size = filter?.size || 10;
    const start = page * size;
    const end = start + size;
    const paginatedRoles = filteredRoles.slice(start, end);

    return {
      roles: paginatedRoles,
      total: filteredRoles.length,
      page,
      size
    };
  }

  /**
   * Genera datos mock para los permisos
   * @param filter Filtros para la búsqueda
   * @returns Respuesta paginada de permisos
   */
  private getMockPermissions(filter?: PermissionFilter): PermissionsResponse {
    const permissions: Permission[] = [
      // Permisos de usuarios
      {
        id: '1',
        name: 'users.view',
        description: 'Ver usuarios',
        category: 'users',
        isSystem: true
      },
      {
        id: '2',
        name: 'users.create',
        description: 'Crear usuarios',
        category: 'users',
        isSystem: true
      },
      {
        id: '3',
        name: 'users.edit',
        description: 'Editar usuarios',
        category: 'users',
        isSystem: true
      },
      {
        id: '4',
        name: 'users.delete',
        description: 'Eliminar usuarios',
        category: 'users',
        isSystem: true
      },

      // Permisos de concursos
      {
        id: '5',
        name: 'contests.view',
        description: 'Ver concursos',
        category: 'contests',
        isSystem: true
      },
      {
        id: '6',
        name: 'contests.create',
        description: 'Crear concursos',
        category: 'contests',
        isSystem: true
      },
      {
        id: '7',
        name: 'contests.edit',
        description: 'Editar concursos',
        category: 'contests',
        isSystem: true
      },
      {
        id: '8',
        name: 'contests.delete',
        description: 'Eliminar concursos',
        category: 'contests',
        isSystem: true
      },
      {
        id: '9',
        name: 'contests.publish',
        description: 'Publicar concursos',
        category: 'contests',
        isSystem: true
      },

      // Permisos de inscripciones
      {
        id: '10',
        name: 'inscriptions.view',
        description: 'Ver inscripciones',
        category: 'inscriptions',
        isSystem: true
      },
      {
        id: '11',
        name: 'inscriptions.create',
        description: 'Crear inscripciones',
        category: 'inscriptions',
        isSystem: true
      },
      {
        id: '12',
        name: 'inscriptions.edit',
        description: 'Editar inscripciones',
        category: 'inscriptions',
        isSystem: true
      },
      {
        id: '13',
        name: 'inscriptions.delete',
        description: 'Eliminar inscripciones',
        category: 'inscriptions',
        isSystem: true
      },
      {
        id: '14',
        name: 'inscriptions.approve',
        description: 'Aprobar inscripciones',
        category: 'inscriptions',
        isSystem: true
      },
      {
        id: '15',
        name: 'inscriptions.reject',
        description: 'Rechazar inscripciones',
        category: 'inscriptions',
        isSystem: true
      },
      {
        id: '16',
        name: 'inscriptions.view_own',
        description: 'Ver inscripciones propias',
        category: 'inscriptions',
        isSystem: true
      },
      {
        id: '17',
        name: 'inscriptions.evaluate',
        description: 'Evaluar inscripciones',
        category: 'inscriptions',
        isSystem: true
      },

      // Permisos de documentos
      {
        id: '18',
        name: 'documents.view',
        description: 'Ver documentos',
        category: 'documents',
        isSystem: true
      },
      {
        id: '19',
        name: 'documents.upload',
        description: 'Subir documentos',
        category: 'documents',
        isSystem: true
      },
      {
        id: '20',
        name: 'documents.delete',
        description: 'Eliminar documentos',
        category: 'documents',
        isSystem: true
      },
      {
        id: '21',
        name: 'documents.approve',
        description: 'Aprobar documentos',
        category: 'documents',
        isSystem: true
      },
      {
        id: '22',
        name: 'documents.reject',
        description: 'Rechazar documentos',
        category: 'documents',
        isSystem: true
      },
      {
        id: '23',
        name: 'documents.view_own',
        description: 'Ver documentos propios',
        category: 'documents',
        isSystem: true
      },

      // Permisos de reportes
      {
        id: '24',
        name: 'reports.view',
        description: 'Ver reportes',
        category: 'reports',
        isSystem: true
      },
      {
        id: '25',
        name: 'reports.create',
        description: 'Crear reportes',
        category: 'reports',
        isSystem: true
      },
      {
        id: '26',
        name: 'reports.export',
        description: 'Exportar reportes',
        category: 'reports',
        isSystem: true
      },

      // Permisos de sistema
      {
        id: '27',
        name: 'system.config',
        description: 'Configurar sistema',
        category: 'system',
        isSystem: true
      },
      {
        id: '28',
        name: 'system.backup',
        description: 'Gestionar copias de seguridad',
        category: 'system',
        isSystem: true
      },
      {
        id: '29',
        name: 'system.logs',
        description: 'Ver logs del sistema',
        category: 'system',
        isSystem: true
      },
      {
        id: '30',
        name: 'system.roles',
        description: 'Gestionar roles y permisos',
        category: 'system',
        isSystem: true
      }
    ];

    // Aplicar filtros si existen
    let filteredPermissions = [...permissions];

    if (filter?.search) {
      const search = filter.search.toLowerCase();
      filteredPermissions = filteredPermissions.filter(permission =>
        permission.name.toLowerCase().includes(search) ||
        permission.description.toLowerCase().includes(search)
      );
    }

    if (filter?.category) {
      filteredPermissions = filteredPermissions.filter(permission =>
        permission.category === filter.category
      );
    }

    // Ordenar
    const sortField = filter?.sort || 'name';
    const sortDirection = filter?.direction || 'asc';

    filteredPermissions.sort((a, b) => {
      const aValue = a[sortField] as string | number;
      const bValue = b[sortField] as string | number;

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // Paginar
    const page = filter?.page || 0;
    const size = filter?.size || 10;
    const start = page * size;
    const end = start + size;
    const paginatedPermissions = filteredPermissions.slice(start, end);

    return {
      permissions: paginatedPermissions,
      total: filteredPermissions.length,
      page,
      size
    };
  }

  /**
   * Genera datos mock para los usuarios con roles
   * @param filter Filtros para la búsqueda
   * @returns Respuesta paginada de usuarios con roles
   */
  private getMockUserRoles(filter?: UserRoleFilter): UserRolesResponse {
    const users: UserRole[] = [
      {
        userId: '1',
        username: 'admin',
        fullName: 'Administrador del Sistema',
        email: 'admin@example.com',
        roles: ['ROLE_ADMIN']
      },
      {
        userId: '2',
        username: 'usuario1',
        fullName: 'Usuario Uno',
        email: 'usuario1@example.com',
        roles: ['ROLE_USER']
      },
      {
        userId: '3',
        username: 'usuario2',
        fullName: 'Usuario Dos',
        email: 'usuario2@example.com',
        roles: ['ROLE_USER']
      },
      {
        userId: '4',
        username: 'evaluador1',
        fullName: 'Evaluador Uno',
        email: 'evaluador1@example.com',
        roles: ['ROLE_EVALUATOR']
      },
      {
        userId: '5',
        username: 'evaluador2',
        fullName: 'Evaluador Dos',
        email: 'evaluador2@example.com',
        roles: ['ROLE_EVALUATOR']
      },
      {
        userId: '6',
        username: 'supervisor1',
        fullName: 'Supervisor Uno',
        email: 'supervisor1@example.com',
        roles: ['ROLE_SUPERVISOR']
      },
      {
        userId: '7',
        username: 'multirol',
        fullName: 'Usuario Multi Rol',
        email: 'multirol@example.com',
        roles: ['ROLE_USER', 'ROLE_EVALUATOR']
      }
    ];

    // Aplicar filtros si existen
    let filteredUsers = [...users];

    if (filter?.search) {
      const search = filter.search.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.username.toLowerCase().includes(search) ||
        user.fullName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
      );
    }

    if (filter?.role) {
      filteredUsers = filteredUsers.filter(user =>
        user.roles.includes(filter.role)
      );
    }

    // Ordenar
    const sortField = filter?.sort || 'username';
    const sortDirection = filter?.direction || 'asc';

    filteredUsers.sort((a, b) => {
      const aValue = a[sortField] as string | number;
      const bValue = b[sortField] as string | number;

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // Paginar
    const page = filter?.page || 0;
    const size = filter?.size || 10;
    const start = page * size;
    const end = start + size;
    const paginatedUsers = filteredUsers.slice(start, end);

    return {
      users: paginatedUsers,
      total: filteredUsers.length,
      page,
      size
    };
  }
}
