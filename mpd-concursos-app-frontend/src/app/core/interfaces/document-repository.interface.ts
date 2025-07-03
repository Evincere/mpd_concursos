/**
 * Repository Pattern Interface para Documentos
 * 
 * @description Abstracción para acceso a datos de documentos siguiendo el principio DIP
 * @author Augment Agent
 * @date 2025-01-01
 * @version 1.0.0
 */

import { Observable } from 'rxjs';
import { DocumentoUsuario, TipoDocumento, DocumentoResponse } from '../models/documento.model';

/**
 * Interfaz para operaciones de lectura de documentos
 */
export interface DocumentReadRepository {
  /**
   * Obtiene todos los documentos del usuario actual
   * @param userId ID del usuario
   * @param forceReload Si debe forzar recarga desde el servidor
   */
  getDocumentsByUser(userId: string, forceReload?: boolean): Observable<DocumentoUsuario[]>;

  /**
   * Obtiene un documento específico por ID
   * @param documentId ID del documento
   */
  getDocumentById(documentId: string): Observable<DocumentoUsuario>;

  /**
   * Obtiene todos los tipos de documento disponibles
   * @param forceReload Si debe forzar recarga desde el servidor
   */
  getDocumentTypes(forceReload?: boolean): Observable<TipoDocumento[]>;

  /**
   * Obtiene un tipo de documento específico por ID
   * @param typeId ID del tipo de documento
   */
  getDocumentTypeById(typeId: string): Observable<TipoDocumento>;

  /**
   * Descarga el contenido de un documento
   * @param documentId ID del documento
   */
  downloadDocument(documentId: string): Observable<Blob>;
}

/**
 * Interfaz para operaciones de escritura de documentos
 */
export interface DocumentWriteRepository {
  /**
   * Sube un nuevo documento
   * @param formData Datos del formulario con archivo y metadatos
   */
  uploadDocument(formData: FormData): Observable<DocumentoResponse>;

  /**
   * Actualiza un documento existente
   * @param documentId ID del documento a actualizar
   * @param formData Nuevos datos del documento
   */
  updateDocument(documentId: string, formData: FormData): Observable<DocumentoResponse>;

  /**
   * Elimina un documento
   * @param documentId ID del documento a eliminar
   */
  deleteDocument(documentId: string): Observable<boolean>;

  /**
   * Valida un archivo antes de subirlo
   * @param file Archivo a validar
   */
  validateDocument(file: File): Observable<{ valid: boolean; errors: string[] }>;
}

/**
 * Interfaz completa del repositorio de documentos
 * Combina operaciones de lectura y escritura
 */
export interface DocumentRepository extends DocumentReadRepository, DocumentWriteRepository {
  /**
   * Limpia el cache del repositorio
   */
  clearCache(): void;

  /**
   * Verifica si hay datos en cache
   */
  hasCache(): boolean;

  /**
   * Obtiene estadísticas del cache
   */
  getCacheStats(): {
    documentsCount: number;
    typesCount: number;
    lastUpdate: Date | null;
  };
}

/**
 * Configuración del repositorio
 */
export interface DocumentRepositoryConfig {
  /**
   * URL base de la API
   */
  apiUrl: string;

  /**
   * Timeout del cache en milisegundos
   */
  cacheTimeout: number;

  /**
   * Tamaño máximo de archivo permitido en bytes
   */
  maxFileSize: number;

  /**
   * Tipos de archivo permitidos
   */
  allowedFileTypes: string[];

  /**
   * Habilitar logs de debug
   */
  enableDebugLogs: boolean;
}

/**
 * Token de inyección para el repositorio de documentos
 */
export const DOCUMENT_REPOSITORY_TOKEN = 'DOCUMENT_REPOSITORY_TOKEN';

/**
 * Token de inyección para la configuración del repositorio
 */
export const DOCUMENT_REPOSITORY_CONFIG_TOKEN = 'DOCUMENT_REPOSITORY_CONFIG_TOKEN';

/**
 * Resultado de operación del repositorio
 */
export interface RepositoryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

/**
 * Filtros para consultas de documentos
 */
export interface DocumentFilters {
  /**
   * Filtrar por tipo de documento
   */
  documentTypeId?: string;

  /**
   * Filtrar por estado
   */
  status?: string;

  /**
   * Filtrar por fecha de carga (desde)
   */
  uploadDateFrom?: Date;

  /**
   * Filtrar por fecha de carga (hasta)
   */
  uploadDateTo?: Date;

  /**
   * Filtrar solo documentos requeridos
   */
  requiredOnly?: boolean;

  /**
   * Búsqueda por texto en nombre de archivo
   */
  searchText?: string;
}

/**
 * Opciones de paginación
 */
export interface PaginationOptions {
  /**
   * Página actual (base 0)
   */
  page: number;

  /**
   * Tamaño de página
   */
  size: number;

  /**
   * Campo de ordenamiento
   */
  sortBy?: string;

  /**
   * Dirección de ordenamiento
   */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Resultado paginado
 */
export interface PaginatedResult<T> {
  /**
   * Elementos de la página actual
   */
  items: T[];

  /**
   * Número total de elementos
   */
  totalItems: number;

  /**
   * Número total de páginas
   */
  totalPages: number;

  /**
   * Página actual (base 0)
   */
  currentPage: number;

  /**
   * Tamaño de página
   */
  pageSize: number;

  /**
   * Indica si hay página siguiente
   */
  hasNext: boolean;

  /**
   * Indica si hay página anterior
   */
  hasPrevious: boolean;
}
