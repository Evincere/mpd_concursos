import { Injectable } from '@angular/core';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

import { UserProfile } from '@shared/interfaces/user/user-profile.interface';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  dni: string;
  cuit: string;
  roles: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'LOCKED' | 'EXPIRED';
  createdAt: string;
  lastLogin?: string;
  lastModified?: string;
  telefono?: string;
  direccion?: string;
  enabled?: boolean;
  locked?: boolean;
  expired?: boolean;
  accountStatus?: 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'EXPIRED';
  profile?: UserProfile;
}

export interface UserFilter {
  role?: string;
  status?: string;
  search?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  blockedUsers: number;
  byRole: Record<string, number>;
}

export interface UserStatusChange {
  userId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'LOCKED' | 'EXPIRED';
  reason?: string;
  expirationDate?: Date | string;
}

export interface UserRoleChange {
  userId: string;
  roles: string[];
  reason?: string;
}

export interface UserAuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  details: string;
  performedBy: string;
  performedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  dni: string;
  cuit?: string;
  birthDate?: Date;
  country?: string;
  province?: string;
  municipality?: string;
  legalAddress?: string;
  residentialAddress?: string;
  password?: string;
  roles: string[];
  enabled?: boolean;
  sendWelcomeEmail?: boolean;
  telefono?: string;
  direccion?: string;
}

export interface UpdateUserRequest {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  dni?: string;
  cuit?: string;
  birthDate?: Date;
  country?: string;
  province?: string;
  municipality?: string;
  legalAddress?: string;
  residentialAddress?: string;
  roles?: string[];
  enabled?: boolean;
  telefono?: string;
  direccion?: string;
}

export interface ResetPasswordRequest {
  userId: string;
  sendEmail: boolean;
  newPassword?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminUsersService {
  private apiUrl = `${environment.apiUrl}/admin/users`;



  // Mock data for development
  private mockUsers: AdminUser[] = Array.from({ length: 50 }, (_, i) => ({
    id: `${i + 1}`,
    username: `user${i + 1}`,
    email: `user${i + 1}@example.com`,
    firstName: `Nombre${i + 1}`,
    lastName: `Apellido${i + 1}`,
    dni: `${30000000 + i}`,
    cuit: `20${30000000 + i}0`,
    roles: i % 10 === 0 ? ['ROLE_ADMIN', 'ROLE_USER'] : ['ROLE_USER'],
    status: i % 15 === 0 ? 'BLOCKED' : (i % 5 === 0 ? 'INACTIVE' : 'ACTIVE'),
    createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    lastLogin: i % 3 === 0 ? new Date(Date.now() - Math.random() * 1000000000).toISOString() : undefined,
    telefono: i % 2 === 0 ? `261${4000000 + i}` : undefined,
    direccion: i % 2 === 0 ? `Calle ${i + 1}, Ciudad` : undefined
  }));



  /**
   * Get users with filters and pagination
   * @param filters Filters to apply
   */
  getUsers(filters?: UserFilter): Observable<{ users: AdminUser[], total: number }> {
    // In a real app, this would call the API
    // return this.http.get<{ users: AdminUser[], total: number }>(
    //   this.apiUrl,
    //   { params: this.buildParams(filters), headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error('Error fetching users:', error);
    //     return of({ users: [], total: 0 });
    //   })
    // );

    // Mock implementation
    let filteredUsers = [...this.mockUsers];

    if (filters) {
      if (filters.role) {
        filteredUsers = filteredUsers.filter(user => user.roles.includes(filters.role!));
      }

      if (filters.status) {
        filteredUsers = filteredUsers.filter(user => user.status === filters.status);
      }

      if (filters.search) {
        const search = filters.search.toLowerCase();
        filteredUsers = filteredUsers.filter(user =>
          user.username.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search) ||
          user.firstName.toLowerCase().includes(search) ||
          user.lastName.toLowerCase().includes(search) ||
          user.dni.includes(search)
        );
      }

      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        filteredUsers = filteredUsers.filter(user => new Date(user.createdAt) >= startDate);
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        filteredUsers = filteredUsers.filter(user => new Date(user.createdAt) <= endDate);
      }

      // Sort
      if (filters.sort) {
        filteredUsers.sort((a, b) => {
          const aValue = a[filters.sort! as keyof AdminUser];
          const bValue = b[filters.sort! as keyof AdminUser];

          if (aValue === undefined && bValue === undefined) return 0;
          if (aValue === undefined) return 1;
          if (bValue === undefined) return -1;

          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return filters.direction === 'desc'
              ? bValue.localeCompare(aValue)
              : aValue.localeCompare(bValue);
          }

          // Convertir a números para comparación numérica
          const aNum = typeof aValue === 'number' ? aValue : 0;
          const bNum = typeof bValue === 'number' ? bValue : 0;

          return filters.direction === 'desc' ? bNum - aNum : aNum - bNum;
        });
      }
    }

    // Pagination
    const page = filters?.page || 0;
    const size = filters?.size || 5; // Cambiado de 10 a 5 para coincidir con la configuración del paginador
    const start = page * size;
    const end = start + size;
    const paginatedUsers = filteredUsers.slice(start, end);

    return of({
      users: paginatedUsers,
      total: filteredUsers.length
    });
  }

  /**
   * Get user by ID
   * @param userId User ID
   */
  getUserById(userId: string): Observable<AdminUser> {
    // In a real app, this would call the API
    // return this.http.get<AdminUser>(
    //   `${this.apiUrl}/${userId}`,
    //   { headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error(`Error fetching user with ID ${userId}:`, error);
    //     return throwError(() => new Error('Error al obtener el usuario'));
    //   })
    // );

    // Mock implementation
    const user = this.mockUsers.find(u => u.id === userId);
    if (!user) {
      return throwError(() => new Error(`Usuario con ID ${userId} no encontrado`));
    }
    return of(user);
  }

  /**
   * Create a new user
   * @param user User data
   */
  createUser(user: CreateUserRequest): Observable<AdminUser> {
    // In a real app, this would call the API
    // return this.http.post<AdminUser>(
    //   this.apiUrl,
    //   user,
    //   { headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error('Error creating user:', error);
    //     return throwError(() => new Error('Error al crear el usuario'));
    //   })
    // );

    // Mock implementation
    const newId = (Math.max(...this.mockUsers.map(u => parseInt(u.id))) + 1).toString();
    const newUser: AdminUser = {
      id: newId,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      dni: user.dni,
      cuit: user.cuit || '',
      roles: user.roles,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      telefono: user.telefono,
      direccion: user.direccion
    };

    this.mockUsers.push(newUser);
    return of(newUser);
  }

  /**
   * Update an existing user
   * @param user User data to update
   */
  updateUser(user: UpdateUserRequest): Observable<AdminUser> {
    // In a real app, this would call the API
    // return this.http.put<AdminUser>(
    //   `${this.apiUrl}/${user.id}`,
    //   user,
    //   { headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error(`Error updating user with ID ${user.id}:`, error);
    //     return throwError(() => new Error('Error al actualizar el usuario'));
    //   })
    // );

    // Mock implementation
    const index = this.mockUsers.findIndex(u => u.id === user.id);
    if (index === -1) {
      return throwError(() => new Error(`Usuario con ID ${user.id} no encontrado`));
    }

    const updatedUser = {
      ...this.mockUsers[index],
      ...user,
      lastModified: new Date().toISOString()
    };

    this.mockUsers[index] = updatedUser;
    return of(updatedUser);
  }

  /**
   * Change user status
   * @param statusChange Status change data
   */
  changeUserStatus(statusChange: UserStatusChange): Observable<AdminUser> {
    // In a real app, this would call the API
    // return this.http.patch<AdminUser>(
    //   `${this.apiUrl}/${statusChange.userId}/status`,
    //   statusChange,
    //   { headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error(`Error changing status for user with ID ${statusChange.userId}:`, error);
    //     return throwError(() => new Error('Error al cambiar el estado del usuario'));
    //   })
    // );

    // Mock implementation
    const index = this.mockUsers.findIndex(u => u.id === statusChange.userId);
    if (index === -1) {
      return throwError(() => new Error(`Usuario con ID ${statusChange.userId} no encontrado`));
    }

    const updatedUser = {
      ...this.mockUsers[index],
      status: statusChange.status,
      lastModified: new Date().toISOString()
    };

    this.mockUsers[index] = updatedUser;
    return of(updatedUser);
  }

  /**
   * Change user roles
   * @param roleChange Role change data
   */
  changeUserRoles(roleChange: UserRoleChange): Observable<AdminUser> {
    // In a real app, this would call the API
    // return this.http.patch<AdminUser>(
    //   `${this.apiUrl}/${roleChange.userId}/roles`,
    //   roleChange,
    //   { headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error(`Error changing roles for user with ID ${roleChange.userId}:`, error);
    //     return throwError(() => new Error('Error al cambiar los roles del usuario'));
    //   })
    // );

    // Mock implementation
    const index = this.mockUsers.findIndex(u => u.id === roleChange.userId);
    if (index === -1) {
      return throwError(() => new Error(`Usuario con ID ${roleChange.userId} no encontrado`));
    }

    const updatedUser = {
      ...this.mockUsers[index],
      roles: roleChange.roles,
      lastModified: new Date().toISOString()
    };

    this.mockUsers[index] = updatedUser;
    return of(updatedUser);
  }

  /**
   * Reset user password
   * @param resetRequest Password reset request
   */
  resetPassword(resetRequest: ResetPasswordRequest): Observable<{ success: boolean, message: string }> {
    // In a real app, this would call the API
    // return this.http.post<{ success: boolean, message: string }>(
    //   `${this.apiUrl}/${resetRequest.userId}/reset-password`,
    //   resetRequest,
    //   { headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error(`Error resetting password for user with ID ${resetRequest.userId}:`, error);
    //     return throwError(() => new Error('Error al restablecer la contraseña'));
    //   })
    // );

    // Mock implementation
    const user = this.mockUsers.find(u => u.id === resetRequest.userId);
    if (!user) {
      return throwError(() => new Error(`Usuario con ID ${resetRequest.userId} no encontrado`));
    }

    return of({
      success: true,
      message: resetRequest.sendEmail
        ? 'Se ha enviado un correo con instrucciones para restablecer la contraseña'
        : 'La contraseña ha sido restablecida correctamente'
    });
  }

  /**
   * Delete user
   * @param userId User ID to delete
   */
  deleteUser(userId: string): Observable<{ success: boolean }> {
    // In a real app, this would call the API
    // return this.http.delete<{ success: boolean }>(
    //   `${this.apiUrl}/${userId}`,
    //   { headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error(`Error deleting user with ID ${userId}:`, error);
    //     return throwError(() => new Error('Error al eliminar el usuario'));
    //   })
    // );

    // Mock implementation
    const index = this.mockUsers.findIndex(u => u.id === userId);
    if (index === -1) {
      return throwError(() => new Error(`Usuario con ID ${userId} no encontrado`));
    }

    this.mockUsers.splice(index, 1);
    return of({ success: true });
  }

  /**
   * Verifica si un nombre de usuario ya existe
   * @param username Nombre de usuario a verificar
   * @returns Observable que emite true si existe, false si no
   */
  checkUsernameExists(username: string): Observable<boolean> {
    // En una aplicación real, esto llamaría a la API
    // return this.http.get<boolean>(
    //   `${this.apiUrl}/check-username/${username}`,
    //   { headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error(`Error verificando si el nombre de usuario ${username} existe:`, error);
    //     return of(false);
    //   })
    // );

    // Implementación simulada
    const exists = this.mockUsers.some(u => u.username.toLowerCase() === username.toLowerCase());
    return of(exists);
  }

  /**
   * Verifica si un correo electrónico ya existe
   * @param email Correo electrónico a verificar
   * @returns Observable que emite true si existe, false si no
   */
  checkEmailExists(email: string): Observable<boolean> {
    // En una aplicación real, esto llamaría a la API
    // return this.http.get<boolean>(
    //   `${this.apiUrl}/check-email/${email}`,
    //   { headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error(`Error verificando si el correo electrónico ${email} existe:`, error);
    //     return of(false);
    //   })
    // );

    // Implementación simulada
    const exists = this.mockUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
    return of(exists);
  }

  /**
   * Verifica si un DNI ya existe
   * @param dni DNI a verificar
   * @returns Observable que emite true si existe, false si no
   */
  checkDniExists(dni: string): Observable<boolean> {
    // En una aplicación real, esto llamaría a la API
    // return this.http.get<boolean>(
    //   `${this.apiUrl}/check-dni/${dni}`,
    //   { headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error(`Error verificando si el DNI ${dni} existe:`, error);
    //     return of(false);
    //   })
    // );

    // Implementación simulada
    const exists = this.mockUsers.some(u => u.dni === dni);
    return of(exists);
  }

  /**
   * Get user audit logs
   * @param userId User ID
   */
  getUserAuditLogs(userId: string): Observable<UserAuditLog[]> {
    // In a real app, this would call the API
    // return this.http.get<UserAuditLog[]>(
    //   `${this.apiUrl}/${userId}/audit-logs`,
    //   { headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error(`Error fetching audit logs for user with ID ${userId}:`, error);
    //     return throwError(() => new Error('Error al obtener el historial de auditoría'));
    //   })
    // );

    // Mock implementation
    const user = this.mockUsers.find(u => u.id === userId);
    if (!user) {
      return throwError(() => new Error(`Usuario con ID ${userId} no encontrado`));
    }

    // Generate mock audit logs
    const mockLogs: UserAuditLog[] = [
      {
        id: '1',
        userId: userId,
        username: user.username,
        action: 'LOGIN',
        details: 'Inicio de sesión exitoso',
        performedBy: user.username,
        performedAt: new Date(Date.now() - 86400000), // 1 day ago
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        id: '2',
        userId: userId,
        username: user.username,
        action: 'PROFILE_UPDATE',
        details: 'Actualización de perfil',
        performedBy: user.username,
        performedAt: new Date(Date.now() - 172800000), // 2 days ago
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        id: '3',
        userId: userId,
        username: user.username,
        action: 'PASSWORD_CHANGE',
        details: 'Cambio de contraseña',
        performedBy: user.username,
        performedAt: new Date(Date.now() - 259200000), // 3 days ago
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    ];

    return of(mockLogs);
  }

  /**
   * Get available roles
   */
  getAvailableRoles(): Observable<{ id: string, name: string, description: string }[]> {
    // In a real app, this would call the API
    // return this.http.get<{ id: string, name: string, description: string }[]>(
    //   `${this.apiUrl}/roles`,
    //   { headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error('Error fetching available roles:', error);
    //     return throwError(() => new Error('Error al obtener los roles disponibles'));
    //   })
    // );

    // Mock implementation
    const roles = [
      { id: 'ROLE_ADMIN', name: 'Administrador', description: 'Acceso completo al sistema' },
      { id: 'ROLE_USER', name: 'Usuario', description: 'Acceso básico al sistema' },
      { id: 'ROLE_MANAGER', name: 'Gestor', description: 'Gestión de concursos e inscripciones' },
      { id: 'ROLE_REVIEWER', name: 'Revisor', description: 'Revisión de documentos e inscripciones' }
    ];

    return of(roles);
  }

  /**
   * Get user statistics
   */
  getUserStats(): Observable<UserStats> {
    // In a real app, this would call the API
    // return this.http.get<UserStats>(
    //   `${this.apiUrl}/stats`,
    //   { headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error('Error fetching user stats:', error);
    //     return of({
    //       totalUsers: 0,
    //       activeUsers: 0,
    //       inactiveUsers: 0,
    //       blockedUsers: 0,
    //       byRole: {}
    //     });
    //   })
    // );

    // Mock implementation
    const stats: UserStats = {
      totalUsers: this.mockUsers.length,
      activeUsers: this.mockUsers.filter(u => u.status === 'ACTIVE').length,
      inactiveUsers: this.mockUsers.filter(u => u.status === 'INACTIVE').length,
      blockedUsers: this.mockUsers.filter(u => u.status === 'BLOCKED').length,
      byRole: {}
    };

    // Count by role
    this.mockUsers.forEach(user => {
      user.roles.forEach(role => {
        stats.byRole[role] = (stats.byRole[role] || 0) + 1;
      });
    });

    return of(stats);
  }

  private buildParams(filters?: UserFilter): HttpParams {
    let params = new HttpParams();

    if (!filters) return params;

    if (filters.role) params = params.set('role', filters.role);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.startDate) params = params.set('startDate', new Date(filters.startDate).toISOString());
    if (filters.endDate) params = params.set('endDate', new Date(filters.endDate).toISOString());
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
