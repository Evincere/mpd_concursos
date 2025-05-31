/**
 * Interfaz base para la creación y actualización de usuarios
 * Esta interfaz contiene los campos comunes a todas las operaciones de usuario
 */
export interface BaseUserDTO {
  /** Nombre del usuario */
  firstName: string;
  /** Apellido del usuario */
  lastName: string;
  /** Número de documento del usuario */
  dni: string;
  /** CUIL/CUIT del usuario (sin guiones) */
  cuit?: string;
  /** Correo electrónico del usuario */
  email: string;
  /** Nombre de usuario */
  username: string;
  /** Teléfono del usuario */
  telefono?: string;
  /** Domicilio legal */
  legalAddress?: string;
  /** Domicilio real */
  residentialAddress?: string;
  /** País de residencia */
  country?: string;
  /** Provincia */
  province?: string;
  /** Municipio */
  municipality?: string;
  /** Fecha de nacimiento */
  birthDate?: Date;
}

/**
 * Interfaz para el registro público de usuarios
 * Extiende BaseUserDTO con campos específicos para el registro
 */
export interface UserRegisterDTO extends BaseUserDTO {
  /** Contraseña del usuario */
  password: string;
  /** Confirmación de contraseña */
  confirmPassword: string;
  /** Aceptación de términos y condiciones */
  termsAccepted: boolean;
  /**
   * Roles asignados al usuario (opcional)
   * En el registro público siempre se asigna ROLE_USER
   */
  roles?: string[] | Set<string>;
}

/**
 * Interfaz para la creación de usuarios por parte de un administrador
 * Extiende BaseUserDTO con campos específicos para la creación por admin
 */
export interface AdminCreateUserDTO extends BaseUserDTO {
  /** Contraseña del usuario (opcional, puede ser generada) */
  password?: string;
  /** Roles asignados al usuario */
  roles: string[];
  /** Estado del usuario */
  status?: UserStatus;
  /** Indica si la cuenta está habilitada */
  enabled?: boolean;
  /** Opción para enviar email de bienvenida */
  sendWelcomeEmail?: boolean;
}

/**
 * Interfaz para la actualización de usuarios
 * Extiende BaseUserDTO con campos específicos para la actualización
 */
export interface UserUpdateDTO extends Partial<BaseUserDTO> {
  /** Identificador único del usuario */
  id: string;
  /** Roles asignados al usuario */
  roles?: string[];
  /** Estado del usuario */
  status?: UserStatus;
  /** Indica si la cuenta está habilitada */
  enabled?: boolean;
}

/**
 * Estados posibles de un usuario
 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
  LOCKED = 'LOCKED',
  EXPIRED = 'EXPIRED'
}
