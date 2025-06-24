import { Inject, Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { Observable, tap } from 'rxjs';
import { UserRepositoryPort } from '../ports/user-repository.port';
import { USER_REPOSITORY_TOKEN } from '../../infrastructure/providers/user-service.provider';
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
} from '../../domain/models/user.model';

/**
 * Servicio para la gestión de usuarios
 * Coordina las operaciones entre los casos de uso y el repositorio
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  /**
   * Observable que indica si hay una operación en curso
   */
  public loading$: Observable<boolean>;

  constructor(
    @Inject(USER_REPOSITORY_TOKEN) private userRepository: UserRepositoryPort
  ) {
    this.loading$ = this.userRepository.loading$;
  }

  /**
   * Obtiene usuarios con filtros y paginación
   * @param filters Filtros a aplicar
   */
  getUsers(filters?: UserFilter): Observable<PaginatedUsersResponse> {
    return this.userRepository.getUsers(filters);
  }

  /**
   * Obtiene un usuario por su ID
   * @param userId ID del usuario
   */
  getUserById(userId: string): Observable<User> {
    return this.userRepository.getUserById(userId);
  }

  /**
   * Crea un nuevo usuario
   * @param user Datos del usuario a crear
   */
  createUser(user: CreateUserRequest): Observable<User> {
    return this.userRepository.createUser(user).pipe(
      tap(() => {
        // Refrescar la lista de usuarios después de crear uno nuevo
        this.userRepository.getUsers();
      })
    );
  }

  /**
   * Actualiza un usuario existente
   * @param user Datos del usuario a actualizar
   */
  updateUser(user: UpdateUserRequest): Observable<User> {
    return this.userRepository.updateUser(user).pipe(
      tap(() => {
        // Refrescar la lista de usuarios después de actualizar uno
        this.userRepository.getUsers();
      })
    );
  }

  /**
   * Cambia el estado de un usuario
   * @param statusChange Datos del cambio de estado
   */
  changeUserStatus(statusChange: UserStatusChangeRequest): Observable<User> {
    return this.userRepository.changeUserStatus(statusChange).pipe(
      tap(() => {
        // Refrescar la lista de usuarios después de cambiar el estado
        this.userRepository.getUsers();
      })
    );
  }

  /**
   * Cambia los roles de un usuario
   * @param roleChange Datos del cambio de roles
   */
  changeUserRoles(roleChange: UserRoleChangeRequest): Observable<User> {
    return this.userRepository.changeUserRoles(roleChange).pipe(
      tap(() => {
        // Refrescar la lista de usuarios después de cambiar los roles
        this.userRepository.getUsers();
      })
    );
  }

  /**
   * Restablece la contraseña de un usuario
   * @param resetRequest Datos de la solicitud de restablecimiento
   */
  resetPassword(resetRequest: ResetPasswordRequest): Observable<{ success: boolean, message: string }> {
    return this.userRepository.resetPassword(resetRequest);
  }

  /**
   * Elimina un usuario
   * @param userId ID del usuario a eliminar
   */
  deleteUser(userId: string): Observable<{ success: boolean, message: string }> {
    return this.userRepository.deleteUser(userId).pipe(
      tap(() => {
        // Refrescar la lista de usuarios después de eliminar uno
        this.userRepository.getUsers();
      })
    );
  }

  /**
   * Obtiene el historial de auditoría de un usuario
   * @param userId ID del usuario
   */
  getUserAuditLogs(userId: string): Observable<UserAuditLog[]> {
    return this.userRepository.getUserAuditLogs(userId);
  }

  /**
   * Obtiene los roles disponibles
   */
  getAvailableRoles(): Observable<{ id: string, name: string, description: string }[]> {
    return this.userRepository.getAvailableRoles();
  }

  /**
   * Obtiene estadísticas de usuarios
   */
  getUserStats(): Observable<UserStats> {
    return this.userRepository.getUserStats();
  }

  /**
   * Verifica si un nombre de usuario ya existe
   * @param username Nombre de usuario a verificar
   */
  checkUsernameExists(username: string): Observable<boolean> {
    return this.userRepository.checkUsernameExists(username);
  }

  /**
   * Verifica si un correo electrónico ya existe
   * @param email Correo electrónico a verificar
   */
  checkEmailExists(email: string): Observable<boolean> {
    return this.userRepository.checkEmailExists(email);
  }

  /**
   * Verifica si un DNI ya existe
   * @param dni DNI a verificar
   */
  checkDniExists(dni: string): Observable<boolean> {
    return this.userRepository.checkDniExists(dni);
  }

  updateUserStatus(userId: string, status: UserStatus): Observable<User> {
    return this.userRepository.updateUserStatus(userId, status);
  }

  updateUserRoles(userId: string, roles: string[]): Observable<User> {
    return this.userRepository.updateUserRoles(userId, roles);
  }
}
