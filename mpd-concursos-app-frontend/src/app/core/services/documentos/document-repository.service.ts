/**
 * Implementación del Repository Pattern para Documentos
 * 
 * @description Implementación concreta del DocumentRepository siguiendo DIP
 * @author Augment Agent
 * @date 2025-01-01
 * @version 1.0.0
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

import { 
  DocumentRepository, 
  DocumentRepositoryConfig,
  RepositoryResult,
  DocumentFilters,
  PaginationOptions,
  PaginatedResult
} from '../../interfaces/document-repository.interface';

import { DocumentoUsuario, TipoDocumento, DocumentoResponse } from '../../models/documento.model';
import { DocumentCacheService } from './document-cache.service';
import { DocumentValidationService } from './document-validation.service';

@Injectable({
  providedIn: 'root'
})
export class DocumentRepositoryService implements DocumentRepository {
  
  private readonly http = inject(HttpClient);
  private readonly cacheService = inject(DocumentCacheService);
  private readonly validationService = inject(DocumentValidationService);
  
  private readonly config: DocumentRepositoryConfig = {
    apiUrl: `${environment.apiUrl}/documentos`,
    cacheTimeout: 5 * 60 * 1000, // 5 minutos
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['application/pdf'],
    enableDebugLogs: true
  };

  constructor() {
    this.log('DocumentRepositoryService inicializado');
  }

  // ==================== OPERACIONES DE LECTURA ====================

  /**
   * Obtiene todos los documentos del usuario actual
   */
  getDocumentsByUser(userId: string, forceReload = false): Observable<DocumentoUsuario[]> {
    this.log(`Obteniendo documentos para usuario: ${userId} (forceReload: ${forceReload})`);

    // Intentar obtener del cache primero
    if (!forceReload) {
      const cached = this.cacheService.getDocuments(userId, this.config.cacheTimeout);
      if (cached) {
        this.log(`Documentos obtenidos del cache para usuario: ${userId}`);
        return cached;
      }
    }

    // Obtener del servidor
    return this.http.get<DocumentoUsuario[]>(`${this.config.apiUrl}/usuario`).pipe(
      tap(documentos => {
        this.log(`Documentos obtenidos del servidor: ${documentos.length} elementos`);
        // Almacenar en cache
        this.cacheService.setDocuments(userId, documentos, this.config.cacheTimeout);
      }),
      catchError(error => this.handleError('getDocumentsByUser', error))
    );
  }

  /**
   * Obtiene un documento específico por ID
   */
  getDocumentById(documentId: string): Observable<DocumentoUsuario> {
    this.log(`Obteniendo documento por ID: ${documentId}`);
    
    return this.http.get<DocumentoUsuario>(`${this.config.apiUrl}/${documentId}`).pipe(
      tap(documento => {
        this.log(`Documento obtenido: ${documento.nombreArchivo}`);
      }),
      catchError(error => this.handleError('getDocumentById', error))
    );
  }

  /**
   * Obtiene todos los tipos de documento disponibles
   */
  getDocumentTypes(forceReload = false): Observable<TipoDocumento[]> {
    this.log(`Obteniendo tipos de documento (forceReload: ${forceReload})`);

    // Intentar obtener del cache primero
    if (!forceReload) {
      const cached = this.cacheService.getDocumentTypes('default', this.config.cacheTimeout);
      if (cached) {
        this.log('Tipos de documento obtenidos del cache');
        return cached;
      }
    }

    // Obtener del servidor
    return this.http.get<TipoDocumento[]>(`${this.config.apiUrl}/tipos`).pipe(
      tap(tipos => {
        this.log(`Tipos de documento obtenidos del servidor: ${tipos.length} elementos`);
        // Almacenar en cache
        this.cacheService.setDocumentTypes('default', tipos, this.config.cacheTimeout);
      }),
      catchError(error => this.handleError('getDocumentTypes', error))
    );
  }

  /**
   * Obtiene un tipo de documento específico por ID
   */
  getDocumentTypeById(typeId: string): Observable<TipoDocumento> {
    this.log(`Obteniendo tipo de documento por ID: ${typeId}`);
    
    return this.http.get<TipoDocumento>(`${this.config.apiUrl}/tipos/${typeId}`).pipe(
      tap(tipo => {
        this.log(`Tipo de documento obtenido: ${tipo.nombre}`);
      }),
      catchError(error => this.handleError('getDocumentTypeById', error))
    );
  }

  /**
   * Descarga el contenido de un documento
   */
  downloadDocument(documentId: string): Observable<Blob> {
    this.log(`Descargando documento: ${documentId}`);
    
    return this.http.get(`${this.config.apiUrl}/${documentId}/download`, {
      responseType: 'blob'
    }).pipe(
      tap(blob => {
        this.log(`Documento descargado: ${blob.size} bytes`);
      }),
      catchError(error => this.handleError('downloadDocument', error))
    );
  }

  // ==================== OPERACIONES DE ESCRITURA ====================

  /**
   * Sube un nuevo documento
   */
  uploadDocument(formData: FormData): Observable<DocumentoResponse> {
    this.log('Subiendo nuevo documento');
    
    return this.http.post<DocumentoResponse>(`${this.config.apiUrl}/upload`, formData).pipe(
      tap(response => {
        this.log(`Documento subido exitosamente: ${response.id}`);
        // Invalidar cache para forzar recarga
        this.invalidateUserDocumentsCache();
      }),
      catchError(error => this.handleError('uploadDocument', error))
    );
  }

  /**
   * Actualiza un documento existente
   */
  updateDocument(documentId: string, formData: FormData): Observable<DocumentoResponse> {
    this.log(`Actualizando documento: ${documentId}`);
    
    return this.http.put<DocumentoResponse>(`${this.config.apiUrl}/${documentId}`, formData).pipe(
      tap(response => {
        this.log(`Documento actualizado exitosamente: ${response.id}`);
        // Invalidar cache para forzar recarga
        this.invalidateUserDocumentsCache();
      }),
      catchError(error => this.handleError('updateDocument', error))
    );
  }

  /**
   * Elimina un documento
   */
  deleteDocument(documentId: string): Observable<boolean> {
    this.log(`Eliminando documento: ${documentId}`);
    
    return this.http.delete(`${this.config.apiUrl}/${documentId}`).pipe(
      map(() => {
        this.log(`Documento eliminado exitosamente: ${documentId}`);
        // Invalidar cache para forzar recarga
        this.invalidateUserDocumentsCache();
        return true;
      }),
      catchError(error => {
        this.handleError('deleteDocument', error);
        return of(false);
      })
    );
  }

  /**
   * Valida un archivo antes de subirlo
   */
  validateDocument(file: File): Observable<{ valid: boolean; errors: string[] }> {
    this.log(`Validando archivo: ${file.name}`);
    
    // Usar el servicio de validación
    return this.validationService.validateFile(file, {
      documentType: { id: '', nombre: '', codigo: '', requerido: false, descripcion: '' }, // Tipo genérico
      existingDocuments: [],
      userRole: 'user',
      isUpdate: false
    }).pipe(
      map(result => ({
        valid: result.isValid,
        errors: result.errors.map(error => error.message)
      })),
      catchError(error => {
        this.log(`Error durante validación: ${error.message}`);
        return of({
          valid: false,
          errors: ['Error durante la validación del archivo']
        });
      })
    );
  }

  // ==================== OPERACIONES DE CACHE ====================

  /**
   * Limpia el cache del repositorio
   */
  clearCache(): void {
    this.log('Limpiando cache del repositorio');
    this.cacheService.clearAll();
  }

  /**
   * Verifica si hay datos en cache
   */
  hasCache(): boolean {
    return this.cacheService.hasCache();
  }

  /**
   * Obtiene estadísticas del cache
   */
  getCacheStats(): {
    documentsCount: number;
    typesCount: number;
    lastUpdate: Date | null;
  } {
    const stats = this.cacheService.getStats();
    return {
      documentsCount: stats.documentsCount,
      typesCount: stats.typesCount,
      lastUpdate: stats.lastDocumentUpdate || stats.lastTypeUpdate
    };
  }

  // ==================== OPERACIONES AVANZADAS ====================

  /**
   * Busca documentos con filtros
   */
  searchDocuments(
    userId: string, 
    filters: DocumentFilters, 
    pagination?: PaginationOptions
  ): Observable<PaginatedResult<DocumentoUsuario>> {
    
    this.log(`Buscando documentos con filtros para usuario: ${userId}`);
    
    const params = this.buildSearchParams(filters, pagination);
    
    return this.http.get<PaginatedResult<DocumentoUsuario>>(
      `${this.config.apiUrl}/search`, 
      { params }
    ).pipe(
      tap(result => {
        this.log(`Búsqueda completada: ${result.totalItems} documentos encontrados`);
      }),
      catchError(error => this.handleError('searchDocuments', error))
    );
  }

  /**
   * Obtiene documentos por estado
   */
  getDocumentsByStatus(userId: string, status: string): Observable<DocumentoUsuario[]> {
    this.log(`Obteniendo documentos por estado: ${status} para usuario: ${userId}`);
    
    return this.getDocumentsByUser(userId).pipe(
      map(documentos => documentos.filter(doc => doc.estado === status)),
      tap(filtered => {
        this.log(`Documentos filtrados por estado ${status}: ${filtered.length} elementos`);
      })
    );
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Invalida cache de documentos de usuario
   */
  private invalidateUserDocumentsCache(): void {
    // TODO: Obtener userId actual del contexto de autenticación
    this.cacheService.invalidateDocuments('current-user');
  }

  /**
   * Construye parámetros de búsqueda
   */
  private buildSearchParams(filters: DocumentFilters, pagination?: PaginationOptions): any {
    const params: any = {};

    if (filters.documentTypeId) params.documentTypeId = filters.documentTypeId;
    if (filters.status) params.status = filters.status;
    if (filters.uploadDateFrom) params.uploadDateFrom = filters.uploadDateFrom.toISOString();
    if (filters.uploadDateTo) params.uploadDateTo = filters.uploadDateTo.toISOString();
    if (filters.requiredOnly !== undefined) params.requiredOnly = filters.requiredOnly.toString();
    if (filters.searchText) params.searchText = filters.searchText;

    if (pagination) {
      params.page = pagination.page.toString();
      params.size = pagination.size.toString();
      if (pagination.sortBy) params.sortBy = pagination.sortBy;
      if (pagination.sortDirection) params.sortDirection = pagination.sortDirection;
    }

    return params;
  }

  /**
   * Maneja errores HTTP
   */
  private handleError(operation: string, error: HttpErrorResponse): Observable<never> {
    const errorMessage = error.error?.message || error.message || 'Error desconocido';
    this.log(`Error en ${operation}: ${errorMessage}`);
    
    // TODO: Enviar error a servicio de logging centralizado
    
    return throwError(() => new Error(`${operation} falló: ${errorMessage}`));
  }

  /**
   * Log de debug
   */
  private log(message: string): void {
    if (this.config.enableDebugLogs) {
      console.log(`[DocumentRepositoryService] ${message}`);
    }
  }
}
