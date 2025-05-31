import { User, UserAuditLog, UserStats } from './user.model';

/**
 * Interfaz para la respuesta paginada de usuarios
 */
export interface PaginatedUsersResponse {
  /** Lista de usuarios */
  users: User[];
  /** Número total de usuarios que coinciden con los filtros */
  total: number;
  /** Número de página actual (0-based) */
  page?: number;
  /** Tamaño de página */
  size?: number;
  /** Si es la última página */
  last?: boolean;
  /** Número total de páginas */
  totalPages?: number;
}

/**
 * Interfaz para la respuesta de creación de usuario
 */
export interface CreateUserResponse {
  /** Usuario creado */
  user: User;
  /** Mensaje de éxito */
  message: string;
  /** Token temporal (si aplica) */
  temporaryToken?: string;
}

/**
 * Interfaz para la respuesta de actualización de usuario
 */
export interface UpdateUserResponse {
  /** Usuario actualizado */
  user: User;
  /** Mensaje de éxito */
  message: string;
}

/**
 * Interfaz para la respuesta de cambio de estado de usuario
 */
export interface UserStatusChangeResponse {
  /** ID del usuario */
  userId: string;
  /** Nombre de usuario */
  username: string;
  /** Nuevo estado */
  status: string;
  /** Mensaje de éxito */
  message: string;
}

/**
 * Interfaz para la respuesta de cambio de roles de usuario
 */
export interface UserRoleChangeResponse {
  /** ID del usuario */
  userId: string;
  /** Nombre de usuario */
  username: string;
  /** Nuevos roles */
  roles: string[];
  /** Mensaje de éxito */
  message: string;
}

/**
 * Interfaz para la respuesta de restablecimiento de contraseña
 */
export interface ResetPasswordResponse {
  /** ID del usuario */
  userId: string;
  /** Mensaje de éxito */
  message: string;
  /** Si se envió un correo electrónico */
  emailSent: boolean;
}

/**
 * Interfaz para la respuesta de eliminación de usuario
 */
export interface DeleteUserResponse {
  /** ID del usuario eliminado */
  userId: string;
  /** Mensaje de éxito */
  message: string;
}

/**
 * Interfaz para la respuesta de obtención de registros de auditoría
 */
export interface UserAuditLogsResponse {
  /** Registros de auditoría */
  logs: UserAuditLog[];
  /** Número total de registros */
  total: number;
}

/**
 * Interfaz para la respuesta de obtención de estadísticas de usuarios
 */
export interface UserStatsResponse {
  /** Estadísticas de usuarios */
  stats: UserStats;
}

/**
 * Interfaz para la respuesta de error de la API
 */
export interface ApiErrorResponse {
  /** Código de error */
  code: string;
  /** Mensaje de error */
  message: string;
  /** Detalles adicionales del error */
  details?: Record<string, string[]>;
  /** Timestamp del error */
  timestamp?: string;
  /** Ruta que generó el error */
  path?: string;
  /** Código de estado HTTP */
  status?: number;
}
