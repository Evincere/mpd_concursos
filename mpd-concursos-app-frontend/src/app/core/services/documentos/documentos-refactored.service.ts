/**
 * DocumentosService Refactorizado
 * 
 * @description Servicio principal de documentos usando arquitectura modular y servicios especializados
 * @author Augment Agent
 * @date 2025-01-01
 * @version 2.0.0
 */

import { Injectable, inject } from '@angular/core';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, tap, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

// Servicios especializados
import { DocumentRepositoryService } from './document-repository.service';
import { DocumentCacheService } from './document-cache.service';
import { DocumentUploadService, UploadResult, MultipleUploadState } from './document-upload.service';
import { DocumentValidationService, ValidationResult } from './document-validation.service';

// Modelos
import { DocumentoUsuario, TipoDocumento, DocumentoResponse } from '../../models/documento.model';

// Servicios auxiliares
import { TempDocumentCacheService } from '../cv/temp-document-cache.service';

/**
 * Configuración del servicio
 */
interface DocumentosServiceConfig {
  enableNotifications: boolean;
  notificationDebounceTime: number;
  enableDebugLogs: boolean;
  autoInvalidateCache: boolean;
}

/**
 * Estado del servicio de documentos
 */
export interface DocumentosServiceState {
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  lastUpdate: Date | null;
  documentsCount: number;
  typesCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentosRefactoredService {
  
  // Inyección de servicios especializados
  private readonly repository = inject(DocumentRepositoryService);
  private readonly cacheService = inject(DocumentCacheService);
  private readonly uploadService = inject(DocumentUploadService);
  private readonly validationService = inject(DocumentValidationService);
  private readonly tempDocumentCache = inject(TempDocumentCacheService);

  // Configuración
  private readonly config: DocumentosServiceConfig = {
    enableNotifications: true,
    notificationDebounceTime: 3000,
    enableDebugLogs: true,
    autoInvalidateCache: true
  };

  // Subjects para notificaciones
  private documentoActualizadoSource = new Subject<number>();
  private serviceStateSource = new Subject<DocumentosServiceState>();

  // Observables públicos
  public readonly documentoActualizado$ = this.documentoActualizadoSource.asObservable().pipe(
    debounceTime(this.config.notificationDebounceTime),
    distinctUntilChanged()
  );

  public readonly serviceState$ = this.serviceStateSource.asObservable();

  // Estado interno
  private currentState: DocumentosServiceState = {
    isLoading: false,
    hasError: false,
    lastUpdate: null,
    documentsCount: 0,
    typesCount: 0
  };

  constructor() {
    this.log('DocumentosRefactoredService inicializado');
    this.initializeService();
  }

  // ==================== OPERACIONES PRINCIPALES ====================

  /**
   * Obtiene todos los documentos del usuario actual
   * @param forzarRecarga Si debe forzar recarga desde el servidor
   */
  getDocumentosUsuario(forzarRecarga = false): Observable<DocumentoUsuario[]> {
    this.log(`Obteniendo documentos del usuario, forzarRecarga: ${forzarRecarga}`);
    
    this.updateState({ isLoading: true, hasError: false });

    // TODO: Obtener userId del contexto de autenticación
    const userId = 'current-user';

    return this.repository.getDocumentsByUser(userId, forzarRecarga).pipe(
      tap(documentos => {
        this.log(`Documentos obtenidos: ${documentos.length}`);
        this.updateState({
          isLoading: false,
          hasError: false,
          lastUpdate: new Date(),
          documentsCount: documentos.length
        });
      }),
      tap(() => {
        if (this.config.enableNotifications) {
          this.notificarDocumentoActualizado();
        }
      })
    );
  }

  /**
   * Obtiene todos los tipos de documento disponibles
   * @param forzarRecarga Si debe forzar recarga desde el servidor
   */
  getTiposDocumento(forzarRecarga = false): Observable<TipoDocumento[]> {
    this.log(`Obteniendo tipos de documento, forzarRecarga: ${forzarRecarga}`);

    this.updateState({ isLoading: true, hasError: false });

    return this.repository.getDocumentTypes(forzarRecarga).pipe(
      tap(tipos => {
        this.log(`Tipos de documento obtenidos: ${tipos.length}`);
        this.updateState({
          isLoading: false,
          hasError: false,
          lastUpdate: new Date(),
          typesCount: tipos.length
        });
      })
    );
  }

  /**
   * Sube un documento individual
   * @param file Archivo a subir
   * @param tipoDocumentoId ID del tipo de documento
   * @param comentarios Comentarios opcionales
   */
  subirDocumento(
    file: File, 
    tipoDocumentoId: string, 
    comentarios?: string
  ): Observable<UploadResult> {
    
    this.log(`Subiendo documento: ${file.name}`);

    const metadata = {
      tipoDocumentoId,
      comentarios: comentarios || ''
    };

    return this.uploadService.uploadDocument(file, metadata).pipe(
      tap(result => {
        if (result.success) {
          this.log(`Documento subido exitosamente: ${result.documentId}`);
          if (this.config.autoInvalidateCache) {
            this.invalidarCache();
          }
          if (this.config.enableNotifications) {
            this.notificarDocumentoActualizado();
          }
        } else {
          this.log(`Error subiendo documento: ${result.error}`);
        }
      })
    );
  }

  /**
   * Sube múltiples documentos
   * @param files Array de archivos con sus metadatos
   */
  subirMultiplesDocumentos(
    files: Array<{ file: File; tipoDocumentoId: string; comentarios?: string }>
  ): Observable<MultipleUploadState> {
    
    this.log(`Subiendo múltiples documentos: ${files.length} archivos`);

    const filesWithMetadata = files.map(item => ({
      file: item.file,
      metadata: {
        tipoDocumentoId: item.tipoDocumentoId,
        comentarios: item.comentarios || ''
      }
    }));

    return this.uploadService.uploadMultipleDocuments(filesWithMetadata).pipe(
      tap(state => {
        if (state.status === 'completed') {
          this.log(`Upload múltiple completado: ${state.completedFiles}/${state.totalFiles} exitosos`);
          if (this.config.autoInvalidateCache) {
            this.invalidarCache();
          }
          if (this.config.enableNotifications) {
            this.notificarDocumentoActualizado();
          }
        }
      })
    );
  }

  /**
   * Elimina un documento
   * @param documentoId ID del documento a eliminar
   */
  eliminarDocumento(documentoId: string): Observable<boolean> {
    this.log(`Eliminando documento: ${documentoId}`);

    return this.repository.deleteDocument(documentoId).pipe(
      tap(success => {
        if (success) {
          this.log(`Documento eliminado exitosamente: ${documentoId}`);
          if (this.config.autoInvalidateCache) {
            this.invalidarCache();
          }
          if (this.config.enableNotifications) {
            this.notificarDocumentoActualizado();
          }
        }
      })
    );
  }

  /**
   * Descarga un documento
   * @param documentoId ID del documento a descargar
   */
  descargarDocumento(documentoId: string): Observable<Blob> {
    this.log(`Descargando documento: ${documentoId}`);
    return this.repository.downloadDocument(documentoId);
  }

  /**
   * Valida un archivo antes del upload
   * @param file Archivo a validar
   * @param tipoDocumento Tipo de documento
   */
  validarArchivo(file: File, tipoDocumento: TipoDocumento): Observable<ValidationResult> {
    this.log(`Validando archivo: ${file.name} para tipo: ${tipoDocumento.nombre}`);

    return this.getDocumentosUsuario().pipe(
      switchMap(documentosExistentes => {
        const context = {
          documentType: tipoDocumento,
          existingDocuments: documentosExistentes,
          userRole: 'user', // TODO: Obtener del contexto de autenticación
          isUpdate: false
        };

        return this.validationService.validateFile(file, context);
      })
    );
  }

  // ==================== OPERACIONES DE CACHE ====================

  /**
   * Invalida todo el cache
   */
  invalidarCache(): void {
    this.log('Invalidando cache');
    this.cacheService.clearAll();
  }

  /**
   * Obtiene estadísticas del cache
   */
  getEstadisticasCache(): Observable<any> {
    const cacheStats = this.cacheService.getStats();
    const repositoryStats = this.repository.getCacheStats();

    return combineLatest([
      this.getDocumentosUsuario(),
      this.getTiposDocumento()
    ]).pipe(
      map(([documentos, tipos]) => ({
        cache: cacheStats,
        repository: repositoryStats,
        current: {
          documentos: documentos.length,
          tipos: tipos.length
        }
      }))
    );
  }

  // ==================== OPERACIONES DE ESTADO ====================

  /**
   * Obtiene el estado actual del servicio
   */
  getCurrentState(): DocumentosServiceState {
    return { ...this.currentState };
  }

  /**
   * Verifica si el servicio está cargando
   */
  isLoading(): boolean {
    return this.currentState.isLoading;
  }

  /**
   * Verifica si hay errores
   */
  hasError(): boolean {
    return this.currentState.hasError;
  }

  // ==================== COMPATIBILIDAD CON SERVICIO ANTERIOR ====================

  /**
   * Notifica a los suscriptores que un documento ha sido actualizado
   * Mantiene compatibilidad con el servicio anterior
   */
  notificarDocumentoActualizado(): void {
    const timestamp = Date.now();
    this.log(`Notificando actualización de documento: ${timestamp}`);
    this.documentoActualizadoSource.next(timestamp);
  }

  /**
   * Obtiene un documento por ID
   * Mantiene compatibilidad con el servicio anterior
   */
  getDocumentoPorId(documentoId: string): Observable<DocumentoUsuario> {
    return this.repository.getDocumentById(documentoId);
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Inicializa el servicio
   */
  private initializeService(): void {
    // Suscribirse a eventos de upload
    this.uploadService.uploadCompleted$.subscribe(result => {
      this.log(`Upload completado: ${result.success ? 'éxito' : 'error'}`);
    });

    // Suscribirse a cambios de cache
    this.cacheService.cacheUpdated$.subscribe(event => {
      this.log(`Cache actualizado: ${event}`);
    });

    // Emitir estado inicial
    this.serviceStateSource.next(this.currentState);
  }

  /**
   * Actualiza el estado del servicio
   */
  private updateState(partialState: Partial<DocumentosServiceState>): void {
    this.currentState = { ...this.currentState, ...partialState };
    this.serviceStateSource.next(this.currentState);
  }

  /**
   * Log de debug
   */
  private log(message: string): void {
    if (this.config.enableDebugLogs) {
      console.log(`[DocumentosRefactoredService] ${message}`);
    }
  }
}
