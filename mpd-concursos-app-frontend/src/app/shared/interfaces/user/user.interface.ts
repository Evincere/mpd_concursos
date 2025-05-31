/**
 * Interfaz que define la estructura de un usuario en el sistema
 */
export interface User {
  /** Identificador único del usuario */
  id?: number;
  /** Nombre del usuario */
  nombre: string;
  /** Apellido del usuario */
  apellido: string;
  /** Número de documento del usuario */
  dni: string;
  /** Correo electrónico del usuario */
  email: string;
  /** Roles asignados al usuario */
  roles: string[];
  /** Estado actual del usuario */
  estado: UserStatus;
  /** Fecha de registro del usuario */
  fechaRegistro?: Date;
  /** Fecha del último acceso del usuario */
  ultimoAcceso?: Date | null;
  /** Número de teléfono del usuario */
  telefono?: string;
  /** Dirección del usuario */
  direccion?: string;
  /** Centro de vida del usuario */
  centroDeVida?: Address;
}

/**
 * Estados posibles de un usuario
 */
export type UserStatus = 'activo' | 'inactivo' | 'bloqueado';

/**
 * Interfaz para la creación de un nuevo usuario
 */
export interface UserCreateDTO {
  /** Nombre del usuario */
  nombre: string;
  /** Apellido del usuario */
  apellido: string;
  /** Número de documento del usuario */
  dni: string;
  /** Correo electrónico del usuario */
  email: string;
  /** Contraseña del usuario */
  password: string;
  /** Roles asignados al usuario */
  roles: string[];
  /** Número de teléfono del usuario */
  telefono?: string;
  /** Dirección del usuario */
  direccion?: string;
}

/**
 * Interfaz para la actualización de un usuario existente
 */
export interface UserUpdateDTO {
  /** Identificador único del usuario */
  id: number;
  /** Nombre del usuario */
  nombre?: string;
  /** Apellido del usuario */
  apellido?: string;
  /** Número de documento del usuario */
  dni?: string;
  /** Correo electrónico del usuario */
  email?: string;
  /** Roles asignados al usuario */
  roles?: string[];
  /** Estado del usuario */
  estado?: UserStatus;
  /** Número de teléfono del usuario */
  telefono?: string;
  /** Dirección del usuario */
  direccion?: string;
}

/**
 * Interfaz para la respuesta de listado de usuarios con paginación
 */
export interface UserListResponse {
  /** Lista de usuarios */
  items: User[];
  /** Número total de usuarios */
  totalItems: number;
  /** Número de página actual */
  page: number;
  /** Tamaño de página */
  pageSize: number;
}

/**
 * Interfaz para los parámetros de filtrado de usuarios
 */
export interface UserFilterParams {
  /** Término de búsqueda general */
  search?: string;
  /** Estado del usuario */
  estado?: UserStatus;
  /** Rol del usuario */
  rol?: string;
  /** Número de página */
  page?: number;
  /** Tamaño de página */
  pageSize?: number;
  /** Campo por el que ordenar */
  sortBy?: string;
  /** Dirección de ordenamiento (asc o desc) */
  sortDirection?: 'asc' | 'desc';
  /** Fecha desde para filtrar por fecha de registro */
  fechaDesde?: Date | string;
  /** Fecha hasta para filtrar por fecha de registro */
  fechaHasta?: Date | string;
  /** Fecha desde para filtrar por último acceso */
  ultimoAccesoDesde?: Date | string;
  /** Fecha hasta para filtrar por último acceso */
  ultimoAccesoHasta?: Date | string;
}

/**
 * Interfaz para la dirección
 */
export interface Address {
  /** Calle */
  calle: string;
  /** Número */
  numero: string;
  /** Piso */
  piso?: string;
  /** Departamento */
  departamento?: string;
  /** Código postal */
  codigoPostal: string;
  /** Localidad */
  localidad: string;
  /** Provincia */
  provincia: string;
  /** País */
  pais: string;
  /** Coordenadas geográficas */
  coordenadas?: {
    latitud: number;
    longitud: number;
  };
}
