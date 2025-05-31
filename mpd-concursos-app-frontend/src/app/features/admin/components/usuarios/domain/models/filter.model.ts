import { UserStatus } from './user.model';

/**
 * Interfaz para los filtros de usuario en la tabla
 */
export interface UserFilterParams {
  /** Término de búsqueda (nombre, apellido, email, dni) */
  search?: string;
  /** Filtro por rol */
  role?: string;
  /** Filtro por estado */
  status?: UserStatus | string;
  /** Fecha de inicio para filtrar por fecha de creación */
  startDate?: Date;
  /** Fecha de fin para filtrar por fecha de creación */
  endDate?: Date;
  /** Campo por el que ordenar */
  sort?: string;
  /** Dirección de ordenamiento */
  direction?: 'asc' | 'desc';
}

/**
 * Interfaz para los parámetros de paginación
 */
export interface PaginationParams {
  /** Número de página actual (0-based) */
  page: number;
  /** Tamaño de página */
  size: number;
  /** Número total de elementos */
  totalItems?: number;
}

/**
 * Interfaz para el evento de cambio de página
 */
export interface PageChangeEvent {
  /** Índice de la página (0-based) */
  pageIndex: number;
  /** Tamaño de la página */
  pageSize: number;
  /** Número total de elementos */
  length?: number;
}

/**
 * Interfaz para el evento de cambio de ordenamiento
 */
export interface SortChangeEvent {
  /** Propiedad por la que ordenar */
  property: string;
  /** Dirección de ordenamiento */
  direction: 'asc' | 'desc' | '';
}

/**
 * Interfaz para la configuración de columnas de la tabla
 */
export interface TableColumnConfig {
  /** Propiedad del objeto que se mostrará en la columna */
  property: string;
  /** Texto del encabezado de la columna */
  header: string;
  /** Si la columna permite ordenamiento */
  sortable?: boolean;
  /** Ancho de la columna (px, %, etc.) */
  width?: string;
  /** Clases CSS adicionales para la columna */
  classes?: string;
  /** Si la columna debe ocultarse en dispositivos móviles */
  hideOnMobile?: boolean;
  /** Si la columna debe ocultarse en dispositivos tablet */
  hideOnTablet?: boolean;
}

/**
 * Interfaz para la configuración de la tabla
 */
export interface TableConfig {
  /** Columnas de la tabla */
  columns: TableColumnConfig[];
  /** Si la tabla debe mostrar paginación */
  paginated?: boolean;
  /** Tamaño de página predeterminado */
  pageSize?: number;
  /** Opciones de tamaño de página */
  pageSizeOptions?: number[];
  /** Si las filas son clickeables */
  rowClickable?: boolean;
  /** Mensaje a mostrar cuando no hay datos */
  emptyMessage?: string;
  /** Clases CSS adicionales para la tabla */
  tableClass?: string;
  /** Clases CSS adicionales para el encabezado */
  headerClass?: string;
  /** Clases CSS adicionales para las filas */
  rowClass?: string;
  /** Clases CSS adicionales para las celdas */
  cellClass?: string;
}
