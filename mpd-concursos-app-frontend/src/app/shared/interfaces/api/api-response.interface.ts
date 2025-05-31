/**
 * Interfaz genérica para respuestas de la API
 */
export interface ApiResponse<T> {
  /** Datos de la respuesta */
  data: T;
  /** Mensaje de la respuesta */
  message?: string;
  /** Estado de la respuesta */
  status: 'success' | 'error';
  /** Código de la respuesta */
  code?: number;
  /** Errores de la respuesta */
  errors?: ApiError[];
}

/**
 * Interfaz para respuestas de la API con paginación
 */
export interface ApiPaginatedResponse<T> extends ApiResponse<T[]> {
  /** Metadatos de paginación */
  pagination: {
    /** Número total de elementos */
    totalItems: number;
    /** Número de página actual */
    currentPage: number;
    /** Tamaño de página */
    pageSize: number;
    /** Número total de páginas */
    totalPages: number;
    /** Indica si hay una página anterior */
    hasPreviousPage: boolean;
    /** Indica si hay una página siguiente */
    hasNextPage: boolean;
  };
}

/**
 * Interfaz para errores de la API
 */
export interface ApiError {
  /** Código del error */
  code: string;
  /** Mensaje del error */
  message: string;
  /** Campo relacionado con el error */
  field?: string;
}

/**
 * Interfaz para errores de validación
 */
export interface ValidationError {
  /** Campo con error */
  field: string;
  /** Mensaje de error */
  message: string;
  /** Valor actual */
  value?: any;
  /** Código de error */
  code?: string;
}
