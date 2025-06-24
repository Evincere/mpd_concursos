import { Observable } from 'rxjs';
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
 * Puerto para el repositorio de usuarios
 * Define las operaciones que se pueden realizar con usuarios
 */
export interface UserRepositoryPort {
  /**
   * Observable que indica si hay una operación en curso
   */
  loading$: Observable<boolean>;
  /**
   * Obtiene usuarios con filtros y paginación
   * @param filters Filtros a aplicar
   */
  getUsers(filters?: UserFilter): Observable<PaginatedUsersResponse>;

  /**
   * Obtiene un usuario por su ID
   * @param userId ID del usuario
   */
  getUserById(userId: string): Observable<User>;

  /**
   * Crea un nuevo usuario
   * @param user Datos del usuario a crear
   */
  createUser(user: CreateUserRequest): Observable<User>;

  /**
   * Actualiza un usuario existente
   * @param user Datos del usuario a actualizar
   */
  updateUser(user: UpdateUserRequest): Observable<User>;

  /**
   * Cambia el estado de un usuario
   * @param statusChange Datos del cambio de estado
   */
  changeUserStatus(statusChange: UserStatusChangeRequest): Observable<User>;

  /**
   * Cambia los roles de un usuario
   * @param roleChange Datos del cambio de roles
   */
  changeUserRoles(roleChange: UserRoleChangeRequest): Observable<User>;

  /**
   * Restablece la contraseña de un usuario
   * @param resetRequest Datos de la solicitud de restablecimiento
   */
  resetPassword(resetRequest: ResetPasswordRequest): Observable<{ success: boolean, message: string }>;

  /**
   * Elimina un usuario
   * @param userId ID del usuario a eliminar
   */
  deleteUser(userId: string): Observable<{ success: boolean, message: string }>;

  /**
   * Obtiene el historial de auditoría de un usuario
   * @param userId ID del usuario
   */
  getUserAuditLogs(userId: string): Observable<UserAuditLog[]>;

  /**
   * Obtiene los roles disponibles
   */
  getAvailableRoles(): Observable<{ id: string, name: string, description: string }[]>;

  /**
   * Obtiene estadísticas de usuarios
   */
  getUserStats(): Observable<UserStats>;

  /**
   * Verifica si un nombre de usuario ya existe
   * @param username Nombre de usuario a verificar
   * @returns Observable con true si existe, false si no
   */
  checkUsernameExists(username: string): Observable<boolean>;

  /**
   * Verifica si un correo electrónico ya existe
   * @param email Correo electrónico a verificar
   * @returns Observable con true si existe, false si no
   */
  checkEmailExists(email: string): Observable<boolean>;

  /**
   * Verifica si un DNI ya existe
   * @param dni DNI a verificar
   * @returns Observable con true si existe, false si no
   */
  checkDniExists(dni: string): Observable<boolean>;

  /**
   * Actualiza el estado de un usuario
   * @param userId ID del usuario
   * @param status Nuevo estado del usuario
   */
  updateUserStatus(userId: string, status: UserStatus): Observable<User>;

  /**
   * Actualiza los roles de un usuario
   * @param userId ID del usuario
   * @param roles Nuevos roles del usuario
   */
  updateUserRoles(userId: string, roles: string[]): Observable<User>;

  /**
   * Invalida el caché del repositorio
   */
  invalidateCache(): void;
}
