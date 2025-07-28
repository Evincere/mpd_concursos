import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, Observable, throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { DocumentosService } from './documentos.service';
import { LoggingService } from '../logging/logging.service';
import { DocumentoUsuario, DocumentoReplaceResponse, TipoDocumento } from '../../models/documento.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentManagerService {
  private readonly LOG_TAG = 'DocumentManager';

  // Observables principales
  private documentosSubject = new BehaviorSubject<DocumentoUsuario[]>([]);
  public documentos$ = this.documentosSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  // Eventos específicos
  private documentoSubidoSubject = new Subject<DocumentoUsuario>();
  public documentoSubido$ = this.documentoSubidoSubject.asObservable();

  private documentoEliminadoSubject = new Subject<string>();
  public documentoEliminado$ = this.documentoEliminadoSubject.asObservable();

  // Cache inteligente
  private cache: Map<string, DocumentoUsuario[]> = new Map();
  private lastCacheUpdate: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  constructor(
    private documentosService: DocumentosService,
    private loggingService: LoggingService
  ) {
    // ✅ CRITICAL FIX: Suscribirse a actualizaciones del DocumentosService
    // para que el DocumentManager se actualice cuando otros componentes suban documentos
    this.documentosService.documentoActualizado$.subscribe(() => {
      this.loggingService.log(this.LOG_TAG, '📢 Actualización de documento detectada - recargando datos');
      this.cargarDocumentos(true); // Forzar recarga cuando se detecte una actualización
    });

    this.cargarDocumentos();
  }

  cargarDocumentos(forzarRecarga = false): void {
    const ahora = Date.now();
    const cacheKey = 'documentos_usuario';

    if (!forzarRecarga && this.cache.has(cacheKey) && (ahora - this.lastCacheUpdate < this.CACHE_DURATION)) {
      const cachedDocs = this.cache.get(cacheKey);
      if (cachedDocs) {
        this.documentosSubject.next(cachedDocs);
        this.loggingService.log(this.LOG_TAG, 'Documentos cargados desde cache');
        return;
      }
    }

    this.loadingSubject.next(true);
    this.loggingService.log(this.LOG_TAG, 'Cargando documentos desde el servidor...');

    this.documentosService.getDocumentosUsuario(forzarRecarga).subscribe({
      next: (documentos) => {
        this.cache.set(cacheKey, documentos);
        this.lastCacheUpdate = ahora;
        this.documentosSubject.next(documentos);
        this.loggingService.log(this.LOG_TAG, 'Documentos cargados exitosamente');
        this.loadingSubject.next(false);
      },
      error: (error) => {
        this.loggingService.error(this.LOG_TAG, 'Error al cargar documentos', error);
        this.loadingSubject.next(false);
      }
    });
  }

  subirDocumento(formData: FormData): void {
    this.loadingSubject.next(true);
    this.loggingService.log(this.LOG_TAG, 'Subiendo documento...');

    this.documentosService.uploadDocumento(formData).subscribe({
      next: (response) => {
        this.loggingService.log(this.LOG_TAG, 'Documento subido exitosamente');
        this.documentoSubidoSubject.next(response.documento);
        this.cargarDocumentos(true); // Forzar recarga para obtener la lista actualizada
      },
      error: (error) => {
        this.loggingService.error(this.LOG_TAG, 'Error al subir documento', error);
        this.loadingSubject.next(false);
      }
    });
  }

  eliminarDocumento(documentoId: string): void {
    this.loadingSubject.next(true);
    this.loggingService.log(this.LOG_TAG, `Eliminando documento ${documentoId}...`);

    this.documentosService.deleteDocumento(documentoId).subscribe({
      next: (success) => {
        if (success) {
          this.loggingService.log(this.LOG_TAG, 'Documento eliminado exitosamente');
          this.documentoEliminadoSubject.next(documentoId);
          this.cargarDocumentos(true); // Forzar recarga
        } else {
          this.loggingService.warn(this.LOG_TAG, 'La eliminación del documento no tuvo éxito');
          this.loadingSubject.next(false);
        }
      },
      error: (error) => {
        this.loggingService.error(this.LOG_TAG, 'Error al eliminar documento', error);
        this.loadingSubject.next(false);
      }
    });
  }

  replaceDocumento(documentoId: string, file: File, comentarios?: string, forceReplace = false): Observable<DocumentoReplaceResponse> {
    this.loadingSubject.next(true);
    this.loggingService.log(this.LOG_TAG, `Reemplazando documento ${documentoId}...`);

    return this.documentosService.replaceDocumento(documentoId, file, comentarios, forceReplace).pipe(
      tap((response) => {
        this.loggingService.log(this.LOG_TAG, 'Documento reemplazado exitosamente');
        this.documentoSubidoSubject.next(response.newDocument!);
        this.cargarDocumentos(true); // Forzar recarga
      }),
      catchError((error) => {
        this.loggingService.error(this.LOG_TAG, 'Error al reemplazar documento', error);
        this.loadingSubject.next(false);
        return throwError(() => error);
      }),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }

  checkReplaceDocumento(documentoId: string, file: File, comentarios?: string): Observable<DocumentoReplaceResponse> {
    return this.documentosService.checkReplaceDocumento(documentoId, file, comentarios);
  }

  /**
   * ✅ CRITICAL FIX: Obtiene los tipos de documentos disponibles
   * Método agregado para soportar el patrón Observer en DocumentosEmbebidosComponent
   */
  getTiposDocumento(forzarRecarga = false): Observable<TipoDocumento[]> {
    this.loggingService.log(this.LOG_TAG, `Obteniendo tipos de documento (forzarRecarga: ${forzarRecarga})`);

    return this.documentosService.getTiposDocumento(forzarRecarga).pipe(
      tap(tipos => {
        this.loggingService.log(this.LOG_TAG, `Tipos de documento obtenidos: ${tipos.length}`);
      }),
      catchError(error => {
        this.loggingService.error(this.LOG_TAG, 'Error al obtener tipos de documento', error);
        return throwError(() => error);
      })
    );
  }
}
