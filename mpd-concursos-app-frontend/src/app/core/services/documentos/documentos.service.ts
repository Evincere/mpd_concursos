import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEventType, HttpEvent } from '@angular/common/http';
import { Observable, throwError, Subject, forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DocumentoUsuario, TipoDocumento, DocumentoResponse } from '../../models/documento.model';
import { map, catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DocumentosService {
  // ✅ CORRECCIÓN CRÍTICA: Inyección real de HttpClient
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/documentos`;

  // Subject para notificar cuando se sube un nuevo documento
  private documentoActualizadoSource = new Subject<void>();
  documentoActualizado$ = this.documentoActualizadoSource.asObservable();

  // Cache de documentos
  private documentosCache: DocumentoUsuario[] = [];
  private tiposDocumentoCache: TipoDocumento[] = [];
  private ultimaActualizacion = 0;
  private ultimaActualizacionTipos = 0;
  private readonly CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutos

  constructor() {
    console.log('[DocumentosService] ✅ SERVICIO REAL INICIALIZADO');
    console.log('[DocumentosService] API URL:', this.apiUrl);
    console.log('[DocumentosService] HttpClient inyectado correctamente');
  }

  /**
   * Notifica a todos los subscriptores que se ha actualizado un documento
   */
  notificarDocumentoActualizado(): void {
    console.log('[DocumentosService] Notificando actualización de documentos');
    // Limpiar la caché para forzar una recarga
    this.documentosCache = [];
    this.ultimaActualizacion = 0;
    // Notificar a los suscriptores
    this.documentoActualizadoSource.next();
  }

  /**
   * Obtiene todos los documentos del usuario actual
   * @param forzarRecarga Si es true, ignora la caché y fuerza una recarga desde el servidor
   */
  getDocumentosUsuario(forzarRecarga = false): Observable<DocumentoUsuario[]> {
    console.log('[DocumentosService] ✅ Obteniendo documentos del usuario del backend real, forzarRecarga:', forzarRecarga);

    // Si tenemos documentos en caché y no ha pasado el tiempo de expiración, usarlos
    const ahora = Date.now();
    if (!forzarRecarga && this.documentosCache.length > 0 && (ahora - this.ultimaActualizacion < this.CACHE_TIMEOUT)) {
      console.log('[DocumentosService] Usando documentos en caché');
      return new Observable<DocumentoUsuario[]>(observer => {
        observer.next(this.documentosCache);
        observer.complete();
      });
    }

    // Si no hay caché o ha expirado, obtener del servidor
    console.log('[DocumentosService] ✅ Consultando documentos del usuario al backend real');
    return this.http.get<DocumentoUsuario[]>(`${this.apiUrl}/usuario`).pipe(
      map((documentos: DocumentoUsuario[]) => {
        console.log('[DocumentosService] ✅ Documentos obtenidos del backend:', documentos);
        this.documentosCache = documentos;
        this.ultimaActualizacion = Date.now();
        return documentos;
      }),
      catchError(error => {
        console.error('[DocumentosService] ❌ Error al obtener documentos del usuario:', error);
        // Retornar array vacío en caso de error para no romper la UI
        return new Observable<DocumentoUsuario[]>(observer => {
          observer.next([]);
          observer.complete();
        });
      })
    );
  }

  /**
   * Obtiene los tipos de documento disponibles
   * @param forzarRecarga Si es true, ignora la caché y fuerza una recarga desde el servidor
   */
  getTiposDocumento(forzarRecarga = false): Observable<TipoDocumento[]> {
    console.log('[DocumentosService] ✅ Obteniendo tipos de documento del backend real, forzarRecarga:', forzarRecarga);

    // Si tenemos tipos en caché y no ha pasado el tiempo de expiración, usarlos
    const ahora = Date.now();
    if (!forzarRecarga && this.tiposDocumentoCache.length > 0 && (ahora - this.ultimaActualizacionTipos < this.CACHE_TIMEOUT)) {
      console.log('[DocumentosService] Usando tipos de documento en caché');
      return new Observable<TipoDocumento[]>(observer => {
        observer.next(this.tiposDocumentoCache);
        observer.complete();
      });
    }

    // Si no hay caché o ha expirado, obtener del servidor
    console.log('[DocumentosService] ✅ Consultando tipos de documento al backend real');
    return this.http.get<TipoDocumento[]>(`${this.apiUrl}/tipos`).pipe(
      map((tipos: TipoDocumento[]) => {
        console.log('[DocumentosService] ✅ Tipos de documento obtenidos del backend:', tipos);
        this.tiposDocumentoCache = tipos;
        this.ultimaActualizacionTipos = Date.now();
        return tipos;
      }),
      catchError(error => {
        console.error('[DocumentosService] ❌ Error al obtener tipos de documento:', error);
        return throwError(() => new Error('No se pudieron cargar los tipos de documento'));
      })
    );
  }

  /**
   * Carga un nuevo documento
   * @param formData Datos del formulario con el archivo y metadatos
   */
  uploadDocumento(formData: FormData): Observable<DocumentoResponse> {
    console.log('[DocumentosService] ✅ Subiendo documento al backend real');

    // Validar que el FormData contiene los datos necesarios
    if (!formData.has('file')) {
      console.error('[DocumentosService] ❌ FormData no contiene archivo');
      return throwError(() => new Error('No se ha proporcionado un archivo para subir'));
    }

    // No configuramos el Content-Type porque el navegador lo establecerá automáticamente
    // con el boundary correcto para multipart/form-data
    return this.http.post<DocumentoResponse>(`${this.apiUrl}/upload`, formData).pipe(
      tap(response => {
        console.log('[DocumentosService] ✅ Documento subido correctamente al backend:', response);
        // Notificar la actualización
        this.notificarDocumentoActualizado();
      }),
      catchError(error => {
        console.error('[DocumentosService] ❌ Error al subir documento:', error);
        return throwError(() => new Error('Error al subir el documento: ' + (error.message || 'Error desconocido')));
      })
    );
  }

  /**
   * Carga un nuevo documento con seguimiento de progreso
   * @param formData Datos del formulario con el archivo y metadatos
   * @returns Observable con eventos de progreso y respuesta
   */
  uploadDocumentoConProgreso(formData: FormData): Observable<Record<string, unknown>> {
    console.log('[DocumentosService] ✅ Subiendo documento con progreso al backend real');

    // Validar que el FormData contiene los datos necesarios
    if (!formData.has('file')) {
      console.error('[DocumentosService] ❌ FormData no contiene archivo');
      return throwError(() => new Error('No se ha proporcionado un archivo para subir'));
    }

    return this.http.post(`${this.apiUrl}/upload`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map(event => {
        const eventObj = event as unknown as Record<string, unknown>;
        if (eventObj['type'] === HttpEventType.UploadProgress && 'total' in eventObj && eventObj['total']) {
          const progreso = Math.round(100 * (eventObj['loaded'] as number) / (eventObj['total'] as number));
          console.log(`[DocumentosService] Progreso de subida: ${progreso}%`);
          return { type: 'progreso', progreso };
        } else if (eventObj['type'] === HttpEventType.Response) {
          console.log('[DocumentosService] ✅ Documento subido correctamente con progreso:', eventObj['body']);
          // Notificar la actualización
          this.notificarDocumentoActualizado();
          return { type: 'completado', response: eventObj['body'] };
        }
        return { type: 'otro' };
      }),
      catchError(error => {
        console.error('[DocumentosService] ❌ Error al subir documento con progreso:', error);
        return throwError(() => new Error('Error al subir el documento: ' + (error.message || 'Error desconocido')));
      })
    );
  }

  /**
   * Carga múltiples documentos en paralelo
   * @param documentos Array de objetos con formData y callbacks de progreso
   * @returns Observable que emite cuando todos los documentos se han subido
   */
  uploadMultipleDocumentos(documentos: FormData[]): Observable<DocumentoResponse[]> {
    console.log('[DocumentosService] Subiendo múltiples documentos:', documentos.length);
    const uploads = documentos.map(formData =>
      this.uploadDocumento(formData)
    );

    return forkJoin(uploads).pipe(
      map(responses => {
        console.log('[DocumentosService] Todos los documentos subidos correctamente:', responses);
        // Notificar la actualización una vez más para asegurarnos
        this.notificarDocumentoActualizado();
        return responses;
      })
    );
  }

  /**
   * Encola múltiples documentos para su procesamiento en el backend
   * @param files Array de archivos a subir
   * @param tipoDocumentoIds Array de IDs de tipos de documento (en el mismo orden que los archivos)
   * @param comentarios Array de comentarios opcionales (en el mismo orden que los archivos)
   * @returns Observable con los IDs de las tareas en cola
   */
  enqueueMultipleDocumentos(files: File[], tipoDocumentoIds: string[], comentarios?: string[]): Observable<string[]> {
    console.log('[DocumentosService] ✅ Encolando múltiples documentos al backend real');

    const formData = new FormData();

    // Añadir archivos
    files.forEach(file => {
      formData.append('files', file);
    });

    // Añadir tipos de documento
    tipoDocumentoIds.forEach(tipoId => {
      formData.append('tipoDocumentoIds', tipoId);
    });

    // Añadir comentarios si existen
    if (comentarios && comentarios.length > 0) {
      comentarios.forEach(comentario => {
        formData.append('comentarios', comentario || '');
      });
    }

    return this.http.post<string[]>(`${this.apiUrl}/queue/enqueue-multiple`, formData).pipe(
      tap(queueIds => {
        console.log('[DocumentosService] ✅ Documentos encolados correctamente:', queueIds);
      }),
      catchError(error => {
        console.error('[DocumentosService] ❌ Error al encolar documentos:', error);
        return throwError(() => new Error('Error al encolar documentos para procesamiento'));
      })
    );
  }

  /**
   * Obtiene el estado de múltiples documentos en cola
   * @param queueIds Array de IDs de tareas en cola
   * @returns Observable con los estados de las tareas
   */
  getMultipleDocumentosStatus(queueIds: string[]): Observable<Record<string, unknown>[]> {
    console.log('[DocumentosService] ✅ Consultando estado de múltiples documentos al backend real');
    return this.http.post<Record<string, unknown>[]>(`${this.apiUrl}/queue/status-multiple`, queueIds).pipe(
      tap(statuses => {
        console.log('[DocumentosService] ✅ Estados obtenidos:', statuses);
      }),
      catchError(error => {
        console.error('[DocumentosService] ❌ Error al obtener estados de documentos:', error);
        return throwError(() => new Error('Error al consultar el estado de los documentos'));
      })
    );
  }

  /**
   * Obtiene el estado de un documento en cola
   * @param queueId ID de la tarea en cola
   * @returns Observable con el estado de la tarea
   */
  getDocumentoStatus(queueId: string): Observable<Record<string, unknown>> {
    console.log('[DocumentosService] ✅ Consultando estado de documento al backend real:', queueId);
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/queue/status/${queueId}`).pipe(
      tap(status => {
        console.log('[DocumentosService] ✅ Estado obtenido:', status);
      }),
      catchError(error => {
        console.error('[DocumentosService] ❌ Error al obtener estado del documento:', error);
        return throwError(() => new Error('Error al consultar el estado del documento'));
      })
    );
  }

  /**
   * Obtiene el archivo de un documento específico
   * @param documentoId ID del documento
   * @param reportProgress Si es true, reporta el progreso de la descarga
   */
  getDocumentoFile(documentoId: string, reportProgress = false): Observable<Blob | HttpEvent<Blob>> {
    console.log('[DocumentosService] ✅ Obteniendo archivo de documento del backend real:', documentoId);

    if (reportProgress) {
      // Con progreso, retorna eventos HTTP con responseType blob
      return this.http.get(`${this.apiUrl}/${documentoId}/file`, {
        reportProgress: true,
        observe: 'events',
        responseType: 'blob'
      }).pipe(
        catchError(error => {
          console.error('[DocumentosService] ❌ Error al obtener archivo de documento:', error);
          return throwError(() => new Error('Error al obtener el archivo del documento'));
        })
      );
    } else {
      // Sin progreso, retorna directamente el blob
      return this.http.get(`${this.apiUrl}/${documentoId}/file`, {
        responseType: 'blob'
      }).pipe(
        catchError(error => {
          console.error('[DocumentosService] ❌ Error al obtener archivo de documento:', error);
          return throwError(() => new Error('Error al obtener el archivo del documento'));
        })
      );
    }
  }

  /**
   * Obtiene la URL de un documento específico para visualización
   * @param documentoId ID del documento
   * @returns Promise con la URL del documento
   */
  async getDocumentoUrl(documentoId: string): Promise<string> {
    console.log('[DocumentosService] ✅ Obteniendo URL de documento del backend real:', documentoId);

    try {
      // ✅ CORRECCIÓN CRÍTICA: URL real del backend
      const url = `${this.apiUrl}/${documentoId}/view`;
      console.log('[DocumentosService] ✅ URL de documento generada:', url);
      return url;
    } catch (error) {
      console.error('[DocumentosService] ❌ Error al generar URL de documento:', error);
      throw new Error('Error al obtener la URL del documento');
    }
  }

  /**
   * Valida un documento antes de subirlo
   * @param file Archivo a validar
   */
  validateDocument(file: File): Observable<Record<string, unknown>> {
    console.log('[DocumentosService] ✅ Validando documento en backend real');
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<Record<string, unknown>>(`${this.apiUrl}/validate`, formData).pipe(
      tap(result => {
        console.log('[DocumentosService] ✅ Documento validado:', result);
      }),
      catchError(error => {
        console.error('[DocumentosService] ❌ Error al validar documento:', error);
        return throwError(() => new Error('Error al validar el documento'));
      })
    );
  }

  /**
   * Elimina un documento
   * @param documentoId ID del documento a eliminar
   */
  deleteDocumento(documentoId: string): Observable<Record<string, unknown>> {
    console.log('[DocumentosService] ✅ Eliminando documento del backend real:', documentoId);
    return this.http.delete<Record<string, unknown>>(`${this.apiUrl}/${documentoId}`).pipe(
      tap(result => {
        console.log('[DocumentosService] ✅ Documento eliminado correctamente');
        this.notificarDocumentoActualizado();
      }),
      catchError(error => {
        console.error('[DocumentosService] ❌ Error al eliminar documento:', error);
        return throwError(() => new Error('Error al eliminar el documento'));
      })
    );
  }

  /**
   * Actualiza un documento existente
   * @param documentoId ID del documento a actualizar
   * @param formData Nuevos datos del documento
   */
  updateDocumento(documentoId: string, formData: FormData): Observable<DocumentoResponse> {
    console.log('[DocumentosService] ✅ Actualizando documento en backend real:', documentoId);
    const headers = new HttpHeaders({
      'Accept': 'application/json'
    });
    return this.http.put<DocumentoResponse>(`${this.apiUrl}/${documentoId}`, formData, { headers }).pipe(
      tap(result => {
        console.log('[DocumentosService] ✅ Documento actualizado correctamente:', result);
        this.notificarDocumentoActualizado();
      }),
      catchError(error => {
        console.error('[DocumentosService] ❌ Error al actualizar documento:', error);
        return throwError(() => new Error('Error al actualizar el documento'));
      })
    );
  }

  /**
   * Sube un certificado para una experiencia laboral
   * @param file Archivo a subir
   * @param experienciaId ID de la experiencia
   * @returns Observable con la respuesta del servidor
   */
  subirDocumentoExperiencia(file: File, experienciaId: string | number): Observable<Record<string, unknown>> {
    console.log(`Intentando subir documento para experiencia ID ${experienciaId} usando DocumentosService`);

    if (!file) {
      console.error('No se ha proporcionado un archivo para subir');
      return throwError(() => new Error('No se ha proporcionado un archivo para subir'));
    }

    // Validar el ID de la experiencia
    if (!experienciaId) {
      console.error('ID de experiencia no válido:', experienciaId);
      return throwError(() => new Error('ID de experiencia no válido o null'));
    }

    // Validar archivo: tamaño máximo 5MB y tipo PDF
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      console.error(`El archivo excede el tamaño máximo de 5MB: ${file.size} bytes`);
      return throwError(() => new Error(`El archivo excede el tamaño máximo permitido (5MB)`));
    }

    if (file.type !== 'application/pdf') {
      console.error(`Tipo de archivo no permitido: ${file.type}. Solo se permiten archivos PDF.`);
      return throwError(() => new Error(`Solo se permiten archivos PDF`));
    }

    // Preparar FormData con el archivo
    const formData = new FormData();
    formData.append('file', file);

    // Usar el nuevo endpoint implementado en el backend
    const endpoint = `${environment.apiUrl}/experiencias/${experienciaId}/documento`;
    console.log(`Intentando subir documento al endpoint: ${endpoint}`);

    return this.http.post(endpoint, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map(event => {
        const eventObj = event as unknown as Record<string, unknown>;
        if (eventObj['type'] === HttpEventType.UploadProgress && 'total' in eventObj && eventObj['total']) {
          const progreso = Math.round(100 * (eventObj['loaded'] as number) / (eventObj['total'] as number));
          return { type: 'progreso', progreso };
        } else if (eventObj['type'] === HttpEventType.Response) {
          console.log('Documento subido correctamente', eventObj['body']);
          return { type: 'completado', response: eventObj['body'] };
        }
        return { type: 'otro' };
      }),
      catchError(error => {
        console.error(`Error al subir documento al endpoint ${endpoint}:`, error);

        // Si falla, intentamos con el endpoint genérico como fallback
        console.log('Intentando con endpoint alternativo de documentos genéricos...');

        const formDataGenerico = new FormData();
        formDataGenerico.append('file', file);
        // No enviamos tipoDocumentoId que cause error por no ser un UUID válido
        // En su lugar, usamos un UUID predefinido para documentos de experiencia laboral desde el backend
        // formDataGenerico.append('tipoDocumentoId', 'CERTIFICADO_LABORAL');

        // Asegurémonos de que experienciaId sea un UUID válido
        if (typeof experienciaId === 'string' && experienciaId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          formDataGenerico.append('referenciaId', experienciaId.toString());
          formDataGenerico.append('tipoReferencia', 'EXPERIENCIA');
        } else {
          console.error('ID de experiencia no válido para el endpoint alternativo');
          return throwError(() => new Error('ID de experiencia no válido'));
        }

        return this.http.post(`${this.apiUrl}/upload`, formDataGenerico, {
          reportProgress: true,
          observe: 'events'
        }).pipe(
          map(event => {
            const eventObj = event as unknown as Record<string, unknown>;
            if (eventObj['type'] === HttpEventType.UploadProgress && 'total' in eventObj && eventObj['total']) {
              const progreso = Math.round(100 * (eventObj['loaded'] as number) / (eventObj['total'] as number));
              return { type: 'progreso', progreso };
            } else if (eventObj['type'] === HttpEventType.Response) {
              console.log('Documento subido correctamente usando endpoint alternativo', eventObj['body']);
              return { type: 'completado', response: eventObj['body'] };
            }
            return { type: 'otro' };
          }),
          catchError(secondError => {
            console.error('Error en todos los intentos de subida de documento:', secondError);
            return throwError(() => new Error('No se pudo subir el documento. El servicio podría no estar disponible.'));
          })
        );
      })
    );
  }
}
