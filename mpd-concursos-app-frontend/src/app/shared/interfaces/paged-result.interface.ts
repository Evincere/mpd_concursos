/**
 * Interfaz para resultados paginados
 * @template T Tipo de los elementos en el resultado
 */
export interface PagedResult<T> {
  /**
   * Contenido de la página
   */
  content: T[];

  /**
   * Número total de elementos
   */
  totalElements: number;

  /**
   * Número total de páginas
   */
  totalPages: number;

  /**
   * Tamaño de la página
   */
  size: number;

  /**
   * Número de página actual (0-based)
   */
  number: number;

  /**
   * Si es la primera página
   */
  first: boolean;

  /**
   * Si es la última página
   */
  last: boolean;

  /**
   * Si la página está vacía
   */
  empty: boolean;
}
