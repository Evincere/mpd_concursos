/**
 * Enumeración de estados de usuario
 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
  LOCKED = 'LOCKED',
  EXPIRED = 'EXPIRED'
}

/**
 * Interfaz para la educación del usuario
 */
export interface Educacion {
  /** Identificador único */
  id?: string;
  /** Título obtenido */
  titulo: string;
  /** Institución educativa */
  institucion: string;
  /** Fecha de inicio */
  fechaInicio: Date;
  /** Fecha de finalización (opcional) */
  fechaFin?: Date;
  /** Descripción adicional */
  descripcion?: string;
}

/**
 * Interfaz para la experiencia laboral del usuario
 */
export interface Experiencia {
  /** Identificador único */
  id?: string;
  /** Puesto o cargo */
  puesto: string;
  /** Empresa o institución */
  empresa: string;
  /** Fecha de inicio */
  fechaInicio: Date;
  /** Fecha de finalización (opcional) */
  fechaFin?: Date;
  /** Descripción adicional */
  descripcion?: string;
}

/**
 * Interfaz para las habilidades del usuario
 */
export interface Habilidad {
  /** Identificador único */
  id?: string;
  /** Nombre de la habilidad */
  nombre: string;
  /** Nivel de la habilidad (opcional) */
  nivel?: string;
}

/**
 * Interfaz para el modelo de usuario
 */
export interface User {
  /** Identificador único */
  id: string;
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
  /** Fecha de nacimiento */
  birthDate?: Date;
  /** País de residencia */
  country?: string;
  /** Provincia */
  province?: string;
  /** Municipio */
  municipality?: string;
  /** Domicilio legal */
  legalAddress?: string;
  /** Domicilio real */
  residentialAddress?: string;
  /** Roles asignados */
  roles: string[];
  /** Estado del usuario */
  status: UserStatus;
  /** Fecha de creación */
  createdAt: Date;
  /** Último inicio de sesión (opcional) */
  lastLogin?: Date;
  /** Última modificación (opcional) */
  lastModified?: Date;
  /** Teléfono (opcional) */
  telefono?: string;
  /** Dirección (opcional) */
  direccion?: string;
  /** Si el usuario está habilitado */
  enabled: boolean;
  /** Educación (opcional) */
  educacion?: Educacion[];
  /** Experiencias laborales (opcional) */
  experiencias?: Experiencia[];
  /** Habilidades (opcional) */
  habilidades?: Habilidad[];
}

/**
 * Interfaz para los filtros de usuario
 */
export interface UserFilter {
  /** Término de búsqueda */
  search?: string;
  /** Filtro por rol */
  role?: string;
  /** Filtro por estado */
  status?: UserStatus | string;
  /** Fecha de inicio para filtrar por fecha de creación */
  startDate?: Date | string;
  /** Fecha de fin para filtrar por fecha de creación */
  endDate?: Date | string;
  /** Página actual (0-based) */
  page?: number;
  /** Tamaño de página */
  size?: number;
  /** Campo por el que ordenar */
  sort?: string;
  /** Dirección de ordenamiento */
  direction?: 'asc' | 'desc';
  /** Timestamp para evitar caché */
  _t?: number;
}

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
 * Interfaz para la solicitud de creación de usuario
 */
export interface CreateUserRequest {
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
  /** Fecha de nacimiento */
  birthDate?: Date;
  /** País de residencia */
  country?: string;
  /** Provincia */
  province?: string;
  /** Municipio */
  municipality?: string;
  /** Domicilio legal */
  legalAddress?: string;
  /** Domicilio real */
  residentialAddress?: string;
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
 * Interfaz para la solicitud de actualización de usuario
 */
export interface UpdateUserRequest {
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
  /** Fecha de nacimiento */
  birthDate?: Date;
  /** País de residencia */
  country?: string;
  /** Provincia */
  province?: string;
  /** Municipio */
  municipality?: string;
  /** Domicilio legal */
  legalAddress?: string;
  /** Domicilio real */
  residentialAddress?: string;
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
 * Interfaz para la solicitud de cambio de estado de usuario
 */
export interface UserStatusChangeRequest {
  /** ID del usuario */
  userId: string;
  /** Nuevo estado */
  status: UserStatus;
  /** Razón del cambio (opcional) */
  reason?: string;
  /** Fecha de expiración (para estados temporales) */
  expirationDate?: Date;
}

/**
 * Interfaz para la solicitud de cambio de roles de usuario
 */
export interface UserRoleChangeRequest {
  /** ID del usuario */
  userId: string;
  /** Nuevos roles */
  roles: string[];
  /** Razón del cambio (opcional) */
  reason?: string;
}

/**
 * Interfaz para la solicitud de restablecimiento de contraseña
 */
export interface ResetPasswordRequest {
  /** ID del usuario */
  userId: string;
  /** Nueva contraseña (opcional) */
  newPassword?: string;
  /** Si se debe generar una contraseña aleatoria */
  generateRandom?: boolean;
  /** Si se debe enviar un correo electrónico */
  sendEmail?: boolean;
}

/**
 * Interfaz para el registro de auditoría de usuario
 */
export interface UserAuditLog {
  /** Identificador único */
  id: string;
  /** ID del usuario */
  userId: string;
  /** Nombre de usuario */
  username: string;
  /** Acción realizada */
  action: string;
  /** Detalles de la acción */
  details: string;
  /** Fecha y hora de la acción */
  timestamp: Date;
  /** IP desde la que se realizó la acción */
  ipAddress?: string;
  /** Usuario que realizó la acción */
  performedBy?: string;
}

/**
 * Interfaz para las estadísticas de usuarios
 */
export interface UserStats {
  /** Total de usuarios */
  totalUsers: number;
  /** Usuarios activos */
  activeUsers: number;
  /** Usuarios inactivos */
  inactiveUsers: number;
  /** Usuarios bloqueados */
  blockedUsers: number;
  /** Usuarios con rol de administrador */
  adminUsers: number;
  /** Usuarios con rol de usuario */
  regularUsers: number;
  /** Usuarios nuevos en el último mes */
  newUsersLastMonth: number;
  /** Usuarios activos en el último mes */
  activeUsersLastMonth: number;
}
