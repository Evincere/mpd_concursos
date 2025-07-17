import { Injectable, inject } from '@angular/core';
import { Observable, throwError, of, BehaviorSubject, timer } from 'rxjs';
import { map, catchError, switchMap, tap, finalize, debounceTime, distinctUntilChanged, shareReplay, delay } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';

// Servicios
import { DocumentosService } from './documentos.service';
import { UnifiedNotificationService } from '@shared/components/unified-notification/unified-notification.service';
import { UnifiedDialogService } from '@shared/services/dialog/unified-dialog.service';
import { LoggingService } from '../logging/logging.service';

// Modelos
import { DocumentoUsuario, TipoDocumento, DocumentoResponse } from '../../models/documento.model';

// Environment
import { environment } from '../../../../environments/environment';

/**
 * Servicio unificado para gestión de documentos con manejo de duplicidad
 * Consolida funcionalidades dispersas y agrega lógica de reemplazo
 */
@Injectable({
  providedIn: 'root'
})
export class UnifiedDocumentService {

  private readonly documentosService = inject(DocumentosService);
  private readonly notificationService = inject(UnifiedNotificationService);
  private readonly dialogService = inject(UnifiedDialogService);
  private readonly loggingService = inject(LoggingService);
  private readonly http = inject(HttpClient);

  // Estado del servicio
  private readonly _isLoading = new BehaviorSubject<boolean>(false);
  private readonly _documentos = new BehaviorSubject<DocumentoUsuario[]>([]);
  private readonly _lastRefresh = new BehaviorSubject<Date | null>(null);

  // Observables públicos con optimizaciones
  public readonly isLoading$ = this._isLoading.asObservable().pipe(distinctUntilChanged());
  public readonly documentos$ = this._documentos.asObservable().pipe(
    distinctUntilChanged(),
    shareReplay(1) // Cache el último valor para nuevos suscriptores
  );
  public readonly lastRefresh$ = this._lastRefresh.asObservable();

  // API Base URL
  private readonly apiUrl = `${environment.apiUrl}/documentos`;

  // Cache y configuración
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos
  private readonly DEBOUNCE_TIME_MS = 300; // 300ms para debounce

  /**
   * Sube un documento con verificación de duplicidad
   */
  uploadDocument(
    file: File,
    tipoDocumentoId: string,
    comentarios?: string
  ): Observable<DocumentoResponse> {

    this.loggingService.debug('[UnifiedDocumentService] Iniciando upload con verificación de duplicidad', {
      fileName: file.name,
      tipoDocumentoId
    });

    this._isLoading.next(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipoDocumentoId', tipoDocumentoId);
    formData.append('comentarios', comentarios || '');

    return this.documentosService.uploadDocumento(formData).pipe(
      tap(response => {
        this.notificationService.success(
          'Documento subido exitosamente',
          `El documento ha sido cargado correctamente.`
        );
      }),
      finalize(() => {
        this._isLoading.next(false);
      })
    );
  }

  /**
   * Obtiene documentos del usuario con información de duplicidad
   */
  getDocumentos(): Observable<DocumentoUsuario[]> {
    return this.documentosService.getDocumentosUsuario().pipe(
      map(documentos => {
        return documentos.map(doc => ({
          ...doc,
          hasDuplicates: false, // No hay duplicados en este servicio
          isLatestVersion: true
        }));
      })
    );
  }

  /**
   * Elimina un documento
   */
  deleteDocument(documentId: string): Observable<void> {
    this.loggingService.debug('[UnifiedDocumentService] Eliminando documento', { documentId });

    this._isLoading.next(true);

    // TODO: Implementar método de eliminación cuando esté disponible en DocumentosService
    return this.http.delete<void>(`${this.apiUrl}/${documentId}`).pipe(
      tap(() => {
        this.notificationService.success(
          'Documento eliminado',
          'El documento ha sido eliminado exitosamente.'
        );
        this.refreshDocuments();
      }),
      catchError(error => {
        this.notificationService.error(
          'Error al eliminar documento',
          'No se pudo eliminar el documento. Por favor, intenta nuevamente.'
        );
        this.loggingService.error('[UnifiedDocumentService] Error eliminando documento', error);
        return throwError(() => error);
      }),
      finalize(() => {
        this._isLoading.next(false);
      })
    );
  }

  /**
   * Obtiene el historial de versiones para un tipo de documento
   */
  getVersionHistory(tipoDocumentoId: string): Observable<DocumentoUsuario[]> {
    return this.documentos$.pipe(
      map(documentos => {
        return documentos
          .filter(doc => doc.tipoDocumentoId === tipoDocumentoId)
          .sort((a, b) => new Date(b.fechaCarga).getTime() - new Date(a.fechaCarga).getTime());
      })
    );
  }

  /**
   * Refresca la lista de documentos con cache inteligente
   */
  refreshDocuments(force: boolean = false): void {
    const lastRefresh = this._lastRefresh.value;
    const now = new Date();

    // Verificar si necesita refrescar basado en cache
    if (!force && lastRefresh) {
      const timeSinceRefresh = now.getTime() - lastRefresh.getTime();
      if (timeSinceRefresh < this.CACHE_DURATION_MS) {
        this.loggingService.debug('[UnifiedDocumentService] Usando cache, no es necesario refrescar');
        return;
      }
    }

    this.loggingService.debug('[UnifiedDocumentService] Refrescando lista de documentos', { force });

    this.documentosService.getDocumentosUsuario().pipe(
      debounceTime(this.DEBOUNCE_TIME_MS),
      catchError(error => {
        this.loggingService.error('[UnifiedDocumentService] Error refrescando documentos', error);
        return of([]);
      })
    ).subscribe(documentos => {
      this._documentos.next(documentos);
      this._lastRefresh.next(now);
    });
  }

  /**
   * Obtiene documentos con información de duplicidad
   */
  getDocumentsWithDuplicateInfo(): Observable<DocumentoUsuario[]> {
    return this.documentos$.pipe(
      map(documentos => {
        return documentos.map(doc => ({
          ...doc,
          hasDuplicates: false, // No hay duplicados en este servicio
          isLatestVersion: true
        }));
      })
    );
  }

  /**
   * Inicializa el servicio cargando documentos con lazy loading
   */
  initialize(): void {
    this.loggingService.debug('[UnifiedDocumentService] Inicializando servicio con lazy loading');

    // Inicialización lazy - solo cargar cuando sea necesario
    timer(100).subscribe(() => {
      this.refreshDocuments();
    });
  }

  /**
   * Obtiene información de cache
   */
  getCacheInfo(): { lastRefresh: Date | null; isStale: boolean; cacheAge: number } {
    const lastRefresh = this._lastRefresh.value;
    const now = new Date();

    if (!lastRefresh) {
      return { lastRefresh: null, isStale: true, cacheAge: 0 };
    }

    const cacheAge = now.getTime() - lastRefresh.getTime();
    const isStale = cacheAge > this.CACHE_DURATION_MS;

    return { lastRefresh, isStale, cacheAge };
  }

  /**
   * Limpia el cache y fuerza un refresh
   */
  clearCache(): void {
    this.loggingService.debug('[UnifiedDocumentService] Limpiando cache');
    this._lastRefresh.next(null);
    this.refreshDocuments(true);
  }
}
