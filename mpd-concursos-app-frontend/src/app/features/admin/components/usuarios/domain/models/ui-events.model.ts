import { User, UserStatus } from './user.model';

/**
 * Interfaz para el evento de filtrado de usuarios
 */
export interface UserFilterEvent {
  /** Término de búsqueda */
  search?: string;
  /** Filtro por rol */
  role?: string;
  /** Filtro por estado */
  status?: UserStatus | string;
  /** Fecha de inicio */
  startDate?: Date | string;
  /** Fecha de fin */
  endDate?: Date | string;
  /** Campo por el que ordenar */
  sort?: string;
  /** Dirección de ordenamiento */
  direction?: 'asc' | 'desc';
  /** Timestamp para evitar caché */
  _t?: number;
}

/**
 * Interfaz para el evento de creación de usuario
 */
export interface UserCreateEvent {
  /** Nombre de usuario */
  username: string;
  /** Correo electrónico */
  email: string;
  /** Nombre */
  firstName: string;
  /** Apellido */
  lastName: string;
  /** DNI */
  dni: string;
  /** CUIT (opcional) */
  cuit?: string;
  /** Contraseña (opcional) */
  password?: string;
  /** Roles */
  roles: string[];
  /** Si el usuario está habilitado */
  enabled?: boolean;
  /** Si se debe enviar un correo de bienvenida */
  sendWelcomeEmail?: boolean;
  /** Teléfono (opcional) */
  telefono?: string;
  /** Dirección (opcional) */
  direccion?: string;
}

/**
 * Interfaz para el evento de actualización de usuario
 */
export interface UserUpdateEvent {
  /** ID del usuario */
  id: string;
  /** Correo electrónico */
  email?: string;
  /** Nombre */
  firstName?: string;
  /** Apellido */
  lastName?: string;
  /** DNI */
  dni?: string;
  /** CUIT (opcional) */
  cuit?: string;
  /** Roles */
  roles?: string[];
  /** Si el usuario está habilitado */
  enabled?: boolean;
  /** Teléfono (opcional) */
  telefono?: string;
  /** Dirección (opcional) */
  direccion?: string;
}

/**
 * Interfaz para el evento de cambio de estado de usuario
 */
export interface UserStatusChangeEvent {
  /** Usuario cuyo estado se cambiará */
  user: User;
  /** Nuevo estado */
  newStatus: UserStatus;
  /** Razón del cambio (opcional) */
  reason?: string;
  /** Fecha de expiración (para estados temporales) */
  expirationDate?: Date;
}

/**
 * Interfaz para el evento de cambio de roles de usuario
 */
export interface UserRoleChangeEvent {
  /** Usuario cuyos roles se cambiarán */
  user: User;
  /** Nuevos roles */
  newRoles: string[];
  /** Razón del cambio (opcional) */
  reason?: string;
}

/**
 * Interfaz para el evento de eliminación de usuario
 */
export interface UserDeleteEvent {
  /** Usuario a eliminar */
  user: User;
  /** Razón de la eliminación (opcional) */
  reason?: string;
}

/**
 * Interfaz para el evento de restablecimiento de contraseña
 */
export interface UserResetPasswordEvent {
  /** Usuario cuya contraseña se restablecerá */
  user: User;
  /** Si se debe enviar un correo electrónico */
  sendEmail: boolean;
  /** Nueva contraseña (opcional) */
  newPassword?: string;
}

/**
 * Interfaz para el evento de selección de usuario
 */
export interface UserSelectionEvent {
  /** Usuario seleccionado */
  user: User;
  /** Tipo de acción a realizar */
  action: 'view' | 'edit' | 'delete' | 'changeStatus' | 'changeRoles' | 'resetPassword';
}
