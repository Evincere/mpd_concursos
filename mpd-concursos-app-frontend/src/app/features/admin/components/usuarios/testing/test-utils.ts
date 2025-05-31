import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { UserRepositoryPort } from '../application/ports/user-repository.port';
import {
  User,
  UserFilter,
  PaginatedUsersResponse,
  CreateUserRequest,
  UpdateUserRequest,
  UserStatusChangeRequest,
  UserRoleChangeRequest,
  ResetPasswordRequest,
  UserAuditLog,
  UserStats,
  UserStatus
} from '../domain/models/user.model';

/**
 * Usuarios de prueba para usar en los tests
 */
export const mockUsers: User[] = [
  {
    id: '1',
    username: 'jperez',
    email: 'juan.perez@example.com',
    firstName: 'Juan',
    lastName: 'Pérez',
    dni: '12345678',
    cuit: '20123456789',
    roles: ['ROLE_ADMIN', 'ROLE_USER'],
    status: UserStatus.ACTIVE,
    createdAt: new Date('2023-01-15T00:00:00'),
    lastLogin: new Date('2023-06-10T14:30:00'),
    enabled: true,
    telefono: '123456789',
    direccion: 'Calle Principal 123'
  },
  {
    id: '2',
    username: 'mgomez',
    email: 'maria.gomez@example.com',
    firstName: 'María',
    lastName: 'Gómez',
    dni: '87654321',
    cuit: '27876543210',
    roles: ['ROLE_USER'],
    status: UserStatus.ACTIVE,
    createdAt: new Date('2023-02-20T00:00:00'),
    lastLogin: new Date('2023-06-15T10:45:00'),
    enabled: true,
    telefono: '987654321',
    direccion: 'Avenida Central 456'
  },
  {
    id: '3',
    username: 'crodriguez',
    email: 'carlos.rodriguez@example.com',
    firstName: 'Carlos',
    lastName: 'Rodríguez',
    dni: '23456789',
    cuit: '20234567890',
    roles: ['ROLE_USER'],
    status: UserStatus.INACTIVE,
    createdAt: new Date('2023-03-10T00:00:00'),
    lastLogin: null,
    enabled: false,
    telefono: '456789123',
    direccion: 'Plaza Mayor 789'
  }
];

/**
 * Roles de prueba para usar en los tests
 */
export const mockRoles = [
  { id: 'ROLE_ADMIN', name: 'Administrador', description: 'Acceso completo al sistema' },
  { id: 'ROLE_USER', name: 'Usuario', description: 'Acceso básico al sistema' },
  { id: 'ROLE_EVALUATOR', name: 'Evaluador', description: 'Puede evaluar postulaciones' }
];

/**
 * Implementación mock del repositorio de usuarios para pruebas
 */
@Injectable()
export class MockUserRepository implements UserRepositoryPort {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private users: User[] = [...mockUsers];

  getUsers(filters?: UserFilter): Observable<PaginatedUsersResponse> {
    this.loadingSubject.next(true);

    let filteredUsers = [...this.users];

    // Aplicar filtros si existen
    if (filters) {
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filteredUsers = filteredUsers.filter(user =>
          user.username.toLowerCase().includes(search) ||
          user.firstName.toLowerCase().includes(search) ||
          user.lastName.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search) ||
          user.dni.includes(search)
        );
      }

      if (filters.role) {
        filteredUsers = filteredUsers.filter(user =>
          user.roles.includes(filters.role as string)
        );
      }

      if (filters.status) {
        filteredUsers = filteredUsers.filter(user =>
          user.status === filters.status
        );
      }
    }

    const total = filteredUsers.length;

    // Aplicar paginación
    if (filters?.page !== undefined && filters?.size !== undefined) {
      const start = filters.page * filters.size;
      const end = start + filters.size;
      filteredUsers = filteredUsers.slice(start, end);
    }

    setTimeout(() => {
      this.loadingSubject.next(false);
    }, 500);

    return of({
      users: filteredUsers,
      total,
      page: filters?.page || 0,
      size: filters?.size || filteredUsers.length,
      last: true,
      totalPages: 1
    });
  }

  getUserById(userId: string): Observable<User> {
    this.loadingSubject.next(true);

    const user = this.users.find(u => u.id === userId);

    setTimeout(() => {
      this.loadingSubject.next(false);
    }, 500);

    if (user) {
      return of(user);
    }

    throw new Error(`Usuario con ID ${userId} no encontrado`);
  }

  createUser(user: CreateUserRequest): Observable<User> {
    this.loadingSubject.next(true);

    const newUser: User = {
      id: (this.users.length + 1).toString(),
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      dni: user.dni,
      cuit: user.cuit || '',
      roles: user.roles,
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
      lastLogin: null,
      enabled: user.enabled !== false,
      telefono: user.telefono || '',
      direccion: user.direccion || ''
    };

    this.users.push(newUser);

    setTimeout(() => {
      this.loadingSubject.next(false);
    }, 500);

    return of(newUser);
  }

  updateUser(user: UpdateUserRequest): Observable<User> {
    this.loadingSubject.next(true);

    const index = this.users.findIndex(u => u.id === user.id);

    if (index === -1) {
      throw new Error(`Usuario con ID ${user.id} no encontrado`);
    }

    const updatedUser = {
      ...this.users[index],
      ...user,
      lastModified: new Date()
    };

    this.users[index] = updatedUser;

    setTimeout(() => {
      this.loadingSubject.next(false);
    }, 500);

    return of(updatedUser);
  }

  changeUserStatus(statusChange: UserStatusChangeRequest): Observable<User> {
    this.loadingSubject.next(true);

    const index = this.users.findIndex(u => u.id === statusChange.userId);

    if (index === -1) {
      throw new Error(`Usuario con ID ${statusChange.userId} no encontrado`);
    }

    const updatedUser = {
      ...this.users[index],
      status: statusChange.status,
      enabled: statusChange.status === UserStatus.ACTIVE,
      lastModified: new Date()
    };

    this.users[index] = updatedUser;

    setTimeout(() => {
      this.loadingSubject.next(false);
    }, 500);

    return of(updatedUser);
  }

  changeUserRoles(roleChange: UserRoleChangeRequest): Observable<User> {
    this.loadingSubject.next(true);

    const index = this.users.findIndex(u => u.id === roleChange.userId);

    if (index === -1) {
      throw new Error(`Usuario con ID ${roleChange.userId} no encontrado`);
    }

    const updatedUser = {
      ...this.users[index],
      roles: roleChange.roles,
      lastModified: new Date()
    };

    this.users[index] = updatedUser;

    setTimeout(() => {
      this.loadingSubject.next(false);
    }, 500);

    return of(updatedUser);
  }

  resetPassword(resetRequest: ResetPasswordRequest): Observable<{ success: boolean, message: string }> {
    this.loadingSubject.next(true);

    const index = this.users.findIndex(u => u.id === resetRequest.userId);

    if (index === -1) {
      throw new Error(`Usuario con ID ${resetRequest.userId} no encontrado`);
    }

    setTimeout(() => {
      this.loadingSubject.next(false);
    }, 500);

    return of({
      success: true,
      message: 'Contraseña restablecida correctamente'
    });
  }

  deleteUser(userId: string): Observable<{ success: boolean, message: string }> {
    this.loadingSubject.next(true);

    const index = this.users.findIndex(u => u.id === userId);

    if (index === -1) {
      throw new Error(`Usuario con ID ${userId} no encontrado`);
    }

    this.users.splice(index, 1);

    setTimeout(() => {
      this.loadingSubject.next(false);
    }, 500);

    return of({
      success: true,
      message: 'Usuario eliminado correctamente'
    });
  }

  getUserAuditLogs(userId: string): Observable<UserAuditLog[]> {
    this.loadingSubject.next(true);

    const mockLogs: UserAuditLog[] = [
      {
        id: '1',
        userId,
        username: 'jperez',
        action: 'LOGIN',
        details: 'Inicio de sesión exitoso',
        timestamp: new Date('2023-06-10T14:30:00'),
        ipAddress: '192.168.1.1',
        performedBy: 'system'
      },
      {
        id: '2',
        userId,
        username: 'jperez',
        action: 'PROFILE_UPDATE',
        details: 'Actualización de perfil',
        timestamp: new Date('2023-06-12T10:15:00'),
        ipAddress: '192.168.1.1',
        performedBy: userId
      }
    ];

    setTimeout(() => {
      this.loadingSubject.next(false);
    }, 500);

    return of(mockLogs);
  }

  getAvailableRoles(): Observable<{ id: string, name: string, description: string }[]> {
    this.loadingSubject.next(true);

    setTimeout(() => {
      this.loadingSubject.next(false);
    }, 500);

    return of(mockRoles);
  }

  getUserStats(): Observable<UserStats> {
    this.loadingSubject.next(true);

    const mockStats: UserStats = {
      totalUsers: this.users.length,
      activeUsers: this.users.filter(u => u.status === UserStatus.ACTIVE).length,
      inactiveUsers: this.users.filter(u => u.status === UserStatus.INACTIVE).length,
      blockedUsers: this.users.filter(u => u.status === UserStatus.BLOCKED).length,
      adminUsers: this.users.filter(u => u.roles.includes('ROLE_ADMIN')).length,
      regularUsers: this.users.filter(u => u.roles.includes('ROLE_USER')).length,
      newUsersLastMonth: 2,
      activeUsersLastMonth: 3
    };

    setTimeout(() => {
      this.loadingSubject.next(false);
    }, 500);

    return of(mockStats);
  }

  checkUsernameExists(username: string): Observable<boolean> {
    return of(this.users.some(u => u.username === username));
  }

  checkEmailExists(email: string): Observable<boolean> {
    return of(this.users.some(u => u.email === email));
  }

  checkDniExists(dni: string): Observable<boolean> {
    return of(this.users.some(u => u.dni === dni));
  }
}
