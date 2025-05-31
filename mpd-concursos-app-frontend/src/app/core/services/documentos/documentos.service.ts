import { Injectable } from '@angular/core';
import { HttpHeaders, HttpEventType } from  '@angular/common/http';
import { Observable, throwError, Subject, forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DocumentoUsuario, TipoDocumento, DocumentoResponse } from '../../models/documento.model';
import { map, catchError } from  'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DocumentosService {
  private apiUrl = `${environment.apiUrl}/documentos`;

  // Subject para notificar cuando se sube un nuevo documento
  private documentoActualizadoSource = new Subject<void>();
  documentoActualizado$ = this.documentoActualizadoSource.asObservable();

  // Cache de documentos
  private documentosCache: DocumentoUsuario[] = [];
  private tiposDocumentoCache: TipoDocumento[] = [];
  private ultimaActualizacion = 0;
  private readonly CACHE_TIMEOUT = 30000; // 30 segundos
  private http: {
    get: (url: string, options?: Record<string, unknown>) => Observable<unknown>;
    post: (url: string, body: unknown, options?: Record<string, unknown>) => Observable<unknown>;
    put: (url: string, body: unknown, options?: Record<string, unknown>) => Observable<unknown>;
    delete: (url: string, options?: Record<string, unknown>) => Observable<unknown>;
  };

  constructor() {
    // En una implementación real, se inyectaría HttpClient
    this.http = {
      get: (url: string, options?: Record<string, unknown>) => {
        console.log(`GET simulado a ${url}`, options);
        return new Observable(observer => {
          observer.next([]);
          observer.complete();
        });
      },
      post: (url: string, body: unknown, options?: Record<string, unknown>) => {
        console.log(`POST simulado a ${url}`, body, options);
        return new Observable(observer => {
          observer.next({});
          observer.complete();
        });
      },
      put: (url: string, body: unknown, options?: Record<string, unknown>) => {
        console.log(`PUT simulado a ${url}`, body, options);
        return new Observable(observer => {
          observer.next({});
          observer.complete();
        });
      },
      delete: (url: string, options?: Record<string, unknown>) => {
        console.log(`DELETE simulado a ${url}`, options);
        return new Observable(observer => {
          observer.next({});
          observer.complete();
        });
      }
    };
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
    console.log('[DocumentosService] Obteniendo documentos del usuario, forzarRecarga:', forzarRecarga);

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
    console.log('[DocumentosService] Obteniendo documentos del servidor');
    return this.http.get(`${this.apiUrl}/usuario`).pipe(
      map((documentos: unknown) => {
        console.log('[DocumentosService] Documentos obtenidos del servidor:', documentos);
        const documentosArray = documentos as DocumentoUsuario[];
        this.documentosCache = documentosArray;
        this.ultimaActualizacion = Date.now();
        return documentosArray;
      })
    );
  }

  /**
   * Obtiene los tipos de documento disponibles
   * @param forzarRecarga Si es true, ignora la caché y fuerza una recarga desde el servidor
   */
  getTiposDocumento(forzarRecarga = false): Observable<TipoDocumento[]> {
    console.log('[DocumentosService] Obteniendo tipos de documento, forzarRecarga:', forzarRecarga);

    // Si tenemos tipos en caché y no ha pasado el tiempo de expiración, usarlos
    const ahora = Date.now();
    if (!forzarRecarga && this.tiposDocumentoCache.length > 0 && (ahora - this.ultimaActualizacion < this.CACHE_TIMEOUT)) {
      console.log('[DocumentosService] Usando tipos de documento en caché');
      return new Observable<TipoDocumento[]>(observer => {
        observer.next(this.tiposDocumentoCache);
        observer.complete();
      });
    }

    // Si no hay caché o ha expirado, obtener del servidor
    console.log('[DocumentosService] Obteniendo tipos de documento del servidor');
    return this.http.get(`${this.apiUrl}/tipos`).pipe(
      map((tipos: unknown) => {
        console.log('[DocumentosService] Tipos de documento obtenidos del servidor:', tipos);
        const tiposArray = tipos as TipoDocumento[];
        this.tiposDocumentoCache = tiposArray;
        return tiposArray;
      })
    );
  }

  /**
   * Carga un nuevo documento
   * @param formData Datos del formulario con el archivo y metadatos
   */
  uploadDocumento(formData: FormData): Observable<DocumentoResponse> {
    console.log('[DocumentosService] Subiendo documento');
    // No configuramos el Content-Type porque el navegador lo establecerá automáticamente
    // con el boundary correcto para multipart/form-data
    return this.http.post(`${this.apiUrl}/upload`, formData).pipe(
      map((response: unknown) => {
        console.log('[DocumentosService] Documento subido correctamente:', response);
        // Notificar la actualización
        this.notificarDocumentoActualizado();
        return response as DocumentoResponse;
      })
    );
  }

  /**
   * Carga un nuevo documento con seguimiento de progreso
   * @param formData Datos del formulario con el archivo y metadatos
   * @returns Observable con eventos de progreso y respuesta
   */
  uploadDocumentoConProgreso(formData: FormData): Observable<Record<string, unknown>> {
    console.log('[DocumentosService] Subiendo documento con progreso');
    return this.http.post(`${this.apiUrl}/upload`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map(event => {
        const eventObj = event as Record<string, unknown>;
        if (eventObj['type'] === HttpEventType.UploadProgress && 'total' in eventObj && eventObj['total']) {
          const progreso = Math.round(100 * (eventObj['loaded'] as number) / (eventObj['total'] as number));
          return { type: 'progreso', progreso };
        } else if (eventObj['type'] === HttpEventType.Response) {
          console.log('[DocumentosService] Documento subido correctamente con progreso:', eventObj['body']);
          // Notificar la actualización
          this.notificarDocumentoActualizado();
          return { type: 'completado', response: eventObj['body'] };
        }
        return { type: 'otro' };
      }),
      catchError(error => {
        console.error('[DocumentosService] Error al subir documento:', error);
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

    return this.http.post(`${this.apiUrl}/queue/enqueue-multiple`, formData) as Observable<string[]>;
  }

  /**
   * Obtiene el estado de múltiples documentos en cola
   * @param queueIds Array de IDs de tareas en cola
   * @returns Observable con los estados de las tareas
   */
  getMultipleDocumentosStatus(queueIds: string[]): Observable<Record<string, unknown>[]> {
    return this.http.post(`${this.apiUrl}/queue/status-multiple`, queueIds) as Observable<Record<string, unknown>[]>;
  }

  /**
   * Obtiene el estado de un documento en cola
   * @param queueId ID de la tarea en cola
   * @returns Observable con el estado de la tarea
   */
  getDocumentoStatus(queueId: string): Observable<Record<string, unknown>> {
    return this.http.get(`${this.apiUrl}/queue/status/${queueId}`) as Observable<Record<string, unknown>>;
  }

  /**
   * Obtiene el archivo de un documento específico
   * @param documentoId ID del documento
   * @param reportProgress Si es true, reporta el progreso de la descarga
   */
  getDocumentoFile(documentoId: string, reportProgress = false): Observable<Blob | Record<string, unknown>> {
    const options: Record<string, unknown> = {
      responseType: 'blob'
    };

    if (reportProgress) {
      options['reportProgress'] = true;
      options['observe'] = 'events';
    }

    return this.http.get(`${this.apiUrl}/${documentoId}/file`, options) as Observable<Blob | Record<string, unknown>>;
  }

  /**
   * Obtiene la URL de un documento específico para visualización
   * @param documentoId ID del documento
   * @returns Promise con la URL del documento
   */
  async getDocumentoUrl(documentoId: string): Promise<string> {
    // En una implementación real, esto haría una llamada al backend
    // Por ahora, simulamos una URL para desarrollo
    console.log(`Obteniendo URL para documento ${documentoId}`);

    // Simular una URL de documento
    return Promise.resolve(`${this.apiUrl}/${documentoId}/view`);
  }

  /**
   * Valida un documento antes de subirlo
   * @param file Archivo a validar
   */
  validateDocument(file: File): Observable<Record<string, unknown>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/validate`, formData) as Observable<Record<string, unknown>>;
  }

  /**
   * Elimina un documento
   * @param documentoId ID del documento a eliminar
   */
  deleteDocumento(documentoId: string): Observable<Record<string, unknown>> {
    return this.http.delete(`${this.apiUrl}/${documentoId}`) as Observable<Record<string, unknown>>;
  }

  /**
   * Actualiza un documento existente
   * @param documentoId ID del documento a actualizar
   * @param formData Nuevos datos del documento
   */
  updateDocumento(documentoId: string, formData: FormData): Observable<DocumentoResponse> {
    const headers = new HttpHeaders({
      'Accept': 'application/json'
    });
    return this.http.put(`${this.apiUrl}/${documentoId}`, formData, { headers }) as Observable<DocumentoResponse>;
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
        const eventObj = event as Record<string, unknown>;
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
            const eventObj = event as Record<string, unknown>;
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
