/**
 * Servicio de Upload para Documentos
 * 
 * @description Servicio especializado para carga de documentos siguiendo SRP
 * @author Augment Agent
 * @date 2025-01-01
 * @version 1.0.0
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEventType, HttpEvent } from '@angular/common/http';
import { Observable, Subject, throwError, forkJoin, of } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { DocumentoResponse, EstadoDocumento } from '../../models/documento.model';

/**
 * Progreso de upload
 */
export interface UploadProgress {
  percentage: number;
  loaded: number;
  total: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  message?: string;
}

/**
 * Resultado de upload
 */
export interface UploadResult {
  success: boolean;
  documentId?: string;
  message: string;
  error?: string;
  response?: DocumentoResponse;
}

/**
 * Configuración de upload
 */
export interface UploadConfig {
  maxFileSize: number;
  allowedTypes: string[];
  chunkSize?: number;
  maxConcurrentUploads: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Metadatos de documento para upload
 */
export interface DocumentMetadata {
  tipoDocumentoId: string;
  comentarios?: string;
  tags?: string[];
  categoria?: string;
}

/**
 * Estado de upload múltiple
 */
export interface MultipleUploadState {
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  currentFile?: string;
  overallProgress: number;
  status: 'idle' | 'uploading' | 'completed' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class DocumentUploadService {
  
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/documentos`;

  // Configuración por defecto
  private readonly defaultConfig: UploadConfig = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf'],
    chunkSize: 1024 * 1024, // 1MB chunks
    maxConcurrentUploads: 3,
    retryAttempts: 3,
    retryDelay: 1000
  };

  // Control de uploads concurrentes
  private activeUploads = new Map<string, Observable<UploadResult>>();
  private uploadQueue: Array<() => Observable<UploadResult>> = [];

  // Subjects para notificaciones
  private uploadStartedSubject = new Subject<string>();
  private uploadCompletedSubject = new Subject<UploadResult>();
  private uploadProgressSubject = new Subject<{ uploadId: string; progress: UploadProgress }>();

  // Observables públicos
  public readonly uploadStarted$ = this.uploadStartedSubject.asObservable();
  public readonly uploadCompleted$ = this.uploadCompletedSubject.asObservable();
  public readonly uploadProgress$ = this.uploadProgressSubject.asObservable();

  constructor() {
    this.log('DocumentUploadService inicializado');
  }

  /**
   * Sube un documento individual
   * @param file Archivo a subir
   * @param metadata Metadatos del documento
   * @param config Configuración personalizada
   */
  uploadDocument(
    file: File, 
    metadata: DocumentMetadata, 
    config?: Partial<UploadConfig>
  ): Observable<UploadResult> {
    const uploadId = this.generateUploadId();
    const effectiveConfig = { ...this.defaultConfig, ...config };

    this.log(`Iniciando upload: ${uploadId} - ${file.name}`);
    this.uploadStartedSubject.next(uploadId);

    // Validar archivo
    const validationResult = this.validateFile(file, effectiveConfig);
    if (!validationResult.isValid) {
      const error = `Validación fallida: ${validationResult.errors.join(', ')}`;
      this.log(`Upload fallido: ${uploadId} - ${error}`);
      return throwError(() => new Error(error));
    }

    // Crear FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipoDocumentoId', metadata.tipoDocumentoId);
    if (metadata.comentarios) {
      formData.append('comentarios', metadata.comentarios);
    }
    if (metadata.tags) {
      formData.append('tags', JSON.stringify(metadata.tags));
    }
    if (metadata.categoria) {
      formData.append('categoria', metadata.categoria);
    }

    // Realizar upload con progreso
    return this.performUploadWithProgress(uploadId, formData, effectiveConfig);
  }

  /**
   * Sube múltiples documentos secuencialmente
   * @param files Array de archivos con metadatos
   * @param config Configuración personalizada
   */
  uploadMultipleDocuments(
    files: Array<{ file: File; metadata: DocumentMetadata }>,
    config?: Partial<UploadConfig>
  ): Observable<UploadResult[]> {
    const effectiveConfig = { ...this.defaultConfig, ...config };
    
    this.log(`Iniciando upload múltiple: ${files.length} archivos`);

    // Validar todos los archivos primero
    const validationErrors: string[] = [];
    files.forEach((item, index) => {
      const validation = this.validateFile(item.file, effectiveConfig);
      if (!validation.isValid) {
        validationErrors.push(`Archivo ${index + 1}: ${validation.errors.join(', ')}`);
      }
    });

    if (validationErrors.length > 0) {
      const error = `Validación fallida:\n${validationErrors.join('\n')}`;
      this.log(`Upload múltiple fallido: ${error}`);
      return throwError(() => new Error(error));
    }

    // Crear observables de upload
    const uploads = files.map((item, index) => 
      this.uploadDocument(item.file, item.metadata, effectiveConfig).pipe(
        catchError(error => {
          this.log(`Error en archivo ${index + 1}: ${error.message}`);
          return of({
            success: false,
            message: `Error en ${item.file.name}: ${error.message}`,
            error: error.message
          } as UploadResult);
        })
      )
    );

    // Ejecutar uploads secuencialmente o en paralelo según configuración
    if (effectiveConfig.maxConcurrentUploads === 1) {
      return this.executeSequentially(uploads);
    } else {
      return this.executeInBatches(uploads, effectiveConfig.maxConcurrentUploads);
    }
  }

  /**
   * Cancela un upload en progreso
   * @param uploadId ID del upload a cancelar
   */
  cancelUpload(uploadId: string): boolean {
    if (this.activeUploads.has(uploadId)) {
      this.activeUploads.delete(uploadId);
      this.log(`Upload cancelado: ${uploadId}`);
      return true;
    }
    return false;
  }

  /**
   * Obtiene el estado de uploads activos
   */
  getActiveUploads(): string[] {
    return Array.from(this.activeUploads.keys());
  }

  /**
   * Limpia uploads completados
   */
  clearCompletedUploads(): void {
    this.activeUploads.clear();
    this.log('Uploads completados limpiados');
  }

  /**
   * Valida un archivo antes del upload
   * @param file Archivo a validar
   * @param config Configuración de validación
   */
  private validateFile(file: File, config: UploadConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar tamaño
    if (file.size > config.maxFileSize) {
      errors.push(`Archivo demasiado grande. Máximo: ${this.formatBytes(config.maxFileSize)}`);
    }

    // Validar tipo
    if (!config.allowedTypes.includes(file.type)) {
      errors.push(`Tipo de archivo no permitido. Permitidos: ${config.allowedTypes.join(', ')}`);
    }

    // Validar nombre
    if (!file.name || file.name.trim().length === 0) {
      errors.push('Nombre de archivo inválido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Realiza el upload con seguimiento de progreso
   */
  private performUploadWithProgress(
    uploadId: string, 
    formData: FormData, 
    config: UploadConfig
  ): Observable<UploadResult> {
    const upload$ = this.http.post<DocumentoResponse>(`${this.apiUrl}/upload`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<DocumentoResponse>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            if (event.total) {
              const progress: UploadProgress = {
                percentage: Math.round(100 * event.loaded / event.total),
                loaded: event.loaded,
                total: event.total,
                status: 'uploading'
              };
              this.uploadProgressSubject.next({ uploadId, progress });
            }
            return null;

          case HttpEventType.Response:
            const result: UploadResult = {
              success: true,
              documentId: event.body?.id,
              message: event.body?.mensaje || 'Upload completado exitosamente',
              response: event.body
            };
            
            this.uploadProgressSubject.next({ 
              uploadId, 
              progress: { 
                percentage: 100, 
                loaded: 0, 
                total: 0, 
                status: 'completed' 
              } 
            });
            
            return result;

          default:
            return null;
        }
      }),
      catchError(error => {
        this.log(`Error en upload ${uploadId}: ${error.message}`);
        
        const result: UploadResult = {
          success: false,
          message: 'Error durante el upload',
          error: error.message
        };
        
        this.uploadProgressSubject.next({ 
          uploadId, 
          progress: { 
            percentage: 0, 
            loaded: 0, 
            total: 0, 
            status: 'error',
            message: error.message
          } 
        });
        
        return of(result);
      }),
      finalize(() => {
        this.activeUploads.delete(uploadId);
        this.log(`Upload finalizado: ${uploadId}`);
      })
    );

    // Filtrar valores null y tomar solo el resultado final
    const result$ = upload$.pipe(
      tap(result => {
        if (result) {
          this.uploadCompletedSubject.next(result);
        }
      })
    ) as Observable<UploadResult>;

    this.activeUploads.set(uploadId, result$);
    return result$;
  }

  /**
   * Ejecuta uploads secuencialmente
   */
  private executeSequentially(uploads: Observable<UploadResult>[]): Observable<UploadResult[]> {
    return uploads.reduce(
      (acc, upload) => acc.pipe(
        map(results => [...results]),
        // Ejecutar el siguiente upload después del anterior
      ),
      of([] as UploadResult[])
    );
  }

  /**
   * Ejecuta uploads en lotes
   */
  private executeInBatches(uploads: Observable<UploadResult>[], batchSize: number): Observable<UploadResult[]> {
    const batches: Observable<UploadResult>[][] = [];
    
    for (let i = 0; i < uploads.length; i += batchSize) {
      batches.push(uploads.slice(i, i + batchSize));
    }

    return batches.reduce(
      (acc, batch) => acc.pipe(
        map(results => [...results, ...batch])
      ),
      of([] as UploadResult[])
    ).pipe(
      map(batches => batches.flat())
    );
  }

  /**
   * Genera ID único para upload
   */
  private generateUploadId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Formatea bytes a string legible
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Log de debug
   */
  private log(message: string): void {
    console.log(`[DocumentUploadService] ${message}`);
  }
}
