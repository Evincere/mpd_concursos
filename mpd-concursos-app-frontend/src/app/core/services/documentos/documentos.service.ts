import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEventType, HttpEvent } from '@angular/common/http';
import { Observable, throwError, Subject, forkJoin, of } from 'rxjs'; // Import 'of' for returning observables
import { environment } from '../../../../environments/environment';
import { DocumentoUsuario, TipoDocumento, DocumentoResponse } from '../../models/documento.model';
import { map, catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DocumentosService {
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
    this.ultimaActualizacion = 0; // Initialize to 0 so it fetches on first load
    // No need to call this.documentoActualizadoSource.next() here, as it's meant for updates.
  }

  /**
   * Notifica a los suscriptores que un documento ha sido actualizado (subido, eliminado, reemplazado).
   */
  notificarDocumentoActualizado(): void {
    this.documentoActualizadoSource.next();
  }

  /**
   * Obtiene todos los documentos del usuario actual
   * @param forzarRecarga Si es true, ignora la caché y fuerza una recarga desde el servidor
   */
  getDocumentosUsuario(forzarRecarga = false): Observable<DocumentoUsuario[]> {
    const ahora = Date.now();
    if (!forzarRecarga && this.documentosCache.length > 0 && (ahora - this.ultimaActualizacion < this.CACHE_TIMEOUT)) {
      // Retornar de la caché
      return of(this.documentosCache); // Use 'of' to return an observable from a value
    }

    // Si no hay caché o ha expirado, obtener del servidor
    // Usar el endpoint correcto: /api/documentos/usuario
    console.log('[DocumentosService] 🔍 Solicitando documentos del usuario desde:', `${this.apiUrl}/usuario`);
    return this.http.get<DocumentoUsuario[]>(`${this.apiUrl}/usuario`).pipe(
      tap(documentos => {
        console.log('[DocumentosService] ✅ Respuesta del backend:', documentos);
        console.log('[DocumentosService] 📊 Cantidad de documentos recibidos:', documentos.length);
        if (documentos.length > 0) {
          console.log('[DocumentosService] 📄 Primer documento:', documentos[0]);
        }
        this.documentosCache = documentos;
        this.ultimaActualizacion = Date.now();
      }),
      catchError(error => {
        console.error('[DocumentosService] ❌ Error al obtener documentos del usuario:', error);

        // Si es un error de autenticación (401), no lanzar error adicional
        // El interceptor ya maneja la redirección al login
        if (error.status === 401) {
          return of([]); // Retornar array vacío para evitar errores en cascada
        }

        // Retornar array vacío en caso de error para no romper la UI
        return of([]); // Return an observable of an empty array
      })
    );
  }

  /**
   * Obtiene los tipos de documento disponibles
   * @param forzarRecarga Si es true, ignora la caché y fuerza una recarga desde el servidor
   */
  getTiposDocumento(forzarRecarga = false): Observable<TipoDocumento[]> {
    const ahora = Date.now();
    if (!forzarRecarga && this.tiposDocumentoCache.length > 0 && (ahora - this.ultimaActualizacionTipos < this.CACHE_TIMEOUT)) {
      // Retornar de la caché
      return of(this.tiposDocumentoCache); // Use 'of' to return an observable from a value
    }

    // Si no hay caché o ha expirado, obtener del servidor
    return this.http.get<TipoDocumento[]>(`${this.apiUrl}/tipos`).pipe(
      tap(tipos => {
        this.tiposDocumentoCache = tipos;
        this.ultimaActualizacionTipos = Date.now();
      }),
      catchError(error => {
        console.error('[DocumentosService] ❌ Error al obtener tipos de documento:', error);

        // Si es un error de autenticación (401), no lanzar error adicional
        // El interceptor ya maneja la redirección al login
        if (error.status === 401) {
          return of([]); // Retornar array vacío para evitar errores en cascada
        }

        return throwError(() => new Error('No se pudieron cargar los tipos de documento'));
      })
    );
  }

  /**
   * Carga un nuevo documento
   * @param formData Datos del formulario con el archivo y metadatos
   */
  uploadDocumento(formData: FormData): Observable<DocumentoResponse> {
    if (!formData.get('file')) {
      return throwError(() => new Error('No se ha proporcionado un archivo para subir'));
    }

    // No configuramos el Content-Type porque el navegador lo establecerá automáticamente
    // con el boundary correcto para multipart/form-data
    return this.http.post<DocumentoResponse>(`${this.apiUrl}/upload`, formData).pipe(
      tap(response => {
        this.notificarDocumentoActualizado(); // Notify listeners on success
      }),
      catchError(error => {
        console.error('[DocumentosService] ❌ Error al subir documento:', error);

        // CRITICAL FIX: Manejo mejorado de errores específicos
        let errorMessage = 'Error al subir el documento';

        if (error.status === 400) {
          // Error de validación del documento
          if (error.error && error.error.mensaje) {
            errorMessage = error.error.mensaje;
          } else {
            errorMessage = 'El documento no cumple con los requisitos de validación';
          }
        } else if (error.status === 401) {
          errorMessage = 'Su sesión ha expirado. Por favor, inicie sesión nuevamente';
        } else if (error.status === 413) {
          errorMessage = 'El archivo es demasiado grande. El tamaño máximo permitido es 10MB';
        } else if (error.status === 415) {
          errorMessage = 'Tipo de archivo no permitido. Solo se permiten archivos PDF';
        } else if (error.status === 500) {
          if (error.error && error.error.mensaje) {
            errorMessage = error.error.mensaje;
          } else {
            errorMessage = 'Error interno del servidor. Por favor, intente nuevamente más tarde';
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Carga un nuevo documento con seguimiento de progreso
   * @param formData Datos del formulario con el archivo y metadatos
   * @returns Observable con eventos de progreso y respuesta
   */
  uploadDocumentoConProgreso(formData: FormData): Observable<Record<string, unknown>> {
    if (!formData.get('file')) {
      return throwError(() => new Error('No se ha proporcionado un archivo para subir'));
    }

    return this.http.post(`${this.apiUrl}/upload`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map(event => {
        const eventObj = event as unknown as HttpEvent<any>; // Cast to HttpEvent<any> for type safety
        if (eventObj.type === HttpEventType.UploadProgress) {
          const progressEvent = eventObj as any; // Cast to 'any' to access loaded/total directly
          const progreso = Math.round(100 * progressEvent.loaded / progressEvent.total);
          return { type: 'progreso', loaded: progressEvent.loaded, total: progressEvent.total, progreso };
        } else if (eventObj.type === HttpEventType.Response) {
          this.notificarDocumentoActualizado(); // Notify listeners on successful response
          return { type: 'completado', response: eventObj.body };
        }
        return { type: 'otro' }; // For other HttpEventType types
      }),
      catchError(error => {
        console.error('[DocumentosService] ❌ Error al subir documento con progreso:', error);
        return throwError(() => new Error('Error al subir el documento: ' + (error.message || 'Error desconocido')));
      })
    );
  }

  /**
   * Carga múltiples documentos en paralelo
   * @param documentsData Array de objetos con formData para cada documento
   * @returns Observable que emite cuando todos los documentos se han subido
   */
  uploadMultipleDocumentos(documentsData: FormData[]): Observable<DocumentoResponse[]> {
    const uploads: Observable<DocumentoResponse>[] = documentsData.map(formData =>
      this.uploadDocumento(formData).pipe(
        catchError(error => {
          console.error('[DocumentosService] ❌ Error al subir un documento en carga múltiple:', error);
          // Return an observable that emits a proper DocumentoResponse structure
          return of({
            id: '',
            mensaje: 'Error en la subida individual: ' + (error.message || 'Unknown error'),
            documento: {
              id: '',
              tipoDocumentoId: '',
              nombreArchivo: '',
              fechaCarga: new Date(),
              estado: 'pendiente' as const,
              usuarioId: ''
            }
          } as DocumentoResponse);
        })
      )
    );

    return forkJoin(uploads).pipe(
      tap(() => {
        this.notificarDocumentoActualizado(); // Notify listeners after all uploads are attempted
      }),
      map(responses => {
        return responses;
      }),
      catchError(error => {
        console.error('[DocumentosService] ❌ Error al procesar carga múltiple:', error);
        return throwError(() => new Error('Error al procesar la carga múltiple de documentos'));
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
    if (!files || files.length === 0) {
      return throwError(() => new Error('No se han proporcionado archivos para encolar'));
    }

    if (files.length !== tipoDocumentoIds.length || (comentarios && files.length !== comentarios.length)) {
      return throwError(() => new Error('El número de archivos, tipos de documento o comentarios no coincide.'));
    }

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    tipoDocumentoIds.forEach(tipoId => formData.append('tipoDocumentoIds', tipoId));
    if (comentarios) {
      comentarios.forEach(comentario => formData.append('comentarios', comentario || ''));
    }

    return this.http.post<string[]>(`${this.apiUrl}/queue/enqueue-multiple`, formData).pipe(
      tap(queueIds => {
        this.notificarDocumentoActualizado(); // Potentially notify, depending on backend's queue completion
      }),
      catchError(error => {
        console.error('[DocumentosService] ❌ Error al encolar documentos para procesamiento:', error);
        return throwError(() => new Error('Error al encolar documentos para procesamiento: ' + (error.message || 'Error desconocido')));
      })
    );
  }

  /**
   * Obtiene el estado de múltiples documentos en cola
   * @param queueIds Array de IDs de tareas en cola
   * @returns Observable con los estados de las tareas
   */
  getMultipleDocumentosStatus(queueIds: string[]): Observable<Record<string, unknown>[]> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    // CRITICAL FIX: Corregir endpoint para múltiples estados
    return this.http.post<Record<string, unknown>[]>(`${this.apiUrl}/queue/status-multiple`, queueIds, { headers }).pipe(
      catchError(error => {
        console.error('[DocumentosService] ❌ Error al consultar el estado de los documentos:', error);

        // CRITICAL FIX: Manejo mejorado de errores para el sistema de cola
        if (error.status === 404) {
          // Si el endpoint no existe, retornar array vacío
          console.warn('[DocumentosService] Sistema de cola no disponible, usando fallback');
          return of([]);
        }

        if (error.status === 401 || error.status === 403) {
          // Error de autenticación/autorización - retornar array vacío
          // El interceptor ya maneja la redirección
          console.warn('[DocumentosService] Error de autenticación en consulta de estado');
          return of([]);
        }

        if (error.status === 500) {
          // Error interno del servidor - retornar array vacío para evitar cascada de errores
          console.warn('[DocumentosService] Error interno del servidor en consulta de estado');
          return of([]);
        }

        // Para otros errores, retornar array vacío en lugar de lanzar error
        console.warn('[DocumentosService] Error desconocido en consulta de estado, usando fallback');
        return of([]);
      })
    );
  }

  /**
   * Obtiene el estado de un documento en cola
   * @param queueId ID de la tarea en cola
   * @returns Observable con el estado de la tarea
   */
  getDocumentoStatus(queueId: string): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/queue/status/${queueId}`).pipe(
      catchError(error => {
        console.error('[DocumentosService] ❌ Error al consultar el estado del documento:', error);
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
    if (!documentoId) {
      return throwError(() => new Error('ID de documento no proporcionado para obtener el archivo.'));
    }

    if (reportProgress) {
      return this.http.get(`${this.apiUrl}/${documentoId}/file`, {
        reportProgress: true,
        observe: 'events',
        responseType: 'blob'
      }).pipe(
        catchError(error => {
          console.error('[DocumentosService] ❌ Error al obtener el archivo del documento con progreso:', error);
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
    if (!documentoId) {
      throw new Error('ID de documento no proporcionado para obtener la URL.');
    }
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        this.getDocumentoFile(documentoId).subscribe({
          next: (result) => {
            if (result instanceof Blob) {
              resolve(result);
            } else {
              reject(new Error('La respuesta del servidor no fue un Blob válido.'));
            }
          },
          error: (error) => reject(error)
        });
      });
      return URL.createObjectURL(blob);
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
    if (!file) {
      return throwError(() => new Error('No se ha proporcionado un archivo para validar.'));
    }
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<Record<string, unknown>>(`${this.apiUrl}/validate`, formData).pipe(
      tap(result => {
        // Validation logic here
      }),
      catchError(error => {
        console.error('[DocumentosService] ❌ Error al validar el documento:', error);
        return throwError(() => new Error('Error al validar el documento'));
      })
    );
  }

  /**
   * Elimina un documento
   * @param documentoId ID del documento a eliminar
   */
  deleteDocumento(documentoId: string): Observable<Record<string, unknown>> {
    if (!documentoId) {
      return throwError(() => new Error('ID de documento no proporcionado para eliminar.'));
    }
    return this.http.delete<Record<string, unknown>>(`${this.apiUrl}/${documentoId}`).pipe(
      tap(() => {
        this.notificarDocumentoActualizado(); // Notify listeners on successful deletion
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
   * @param formData Nuevos datos del documento (incluyendo el archivo si se reemplaza)
   */
  updateDocumento(documentoId: string, formData: FormData): Observable<DocumentoResponse> {
    if (!documentoId) {
      return throwError(() => new Error('ID de documento no proporcionado para actualizar.'));
    }
    // Note: HttpHeaders are usually not needed for FormData as browser sets Content-Type.
    // If you explicitly need headers (e.g., for authorization), add them.
    return this.http.put<DocumentoResponse>(`${this.apiUrl}/${documentoId}`, formData).pipe(
      tap(result => {
        this.notificarDocumentoActualizado(); // Notify listeners on successful update
      }),
      catchError(error => {
        console.error('[DocumentosService] ❌ Error al actualizar documento:', error);
        return throwError(() => new Error('Error al actualizar el documento'));
      })
    );
  }

  /**
   * Sube un certificado para una experiencia laboral o documento genérico
   * con seguimiento de progreso.
   * @param file Archivo a subir
   * @param experienciaId ID de la experiencia (opcional, para endpoint específico)
   * @returns Observable con eventos de progreso y respuesta
   */
  subirDocumentoExperiencia(file: File, experienciaId?: string | number): Observable<Record<string, unknown>> {
    if (!file) {
      return throwError(() => new Error('No se ha proporcionado un archivo para subir'));
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

    const formData = new FormData();
    formData.append('file', file);

    let primaryEndpointObs: Observable<HttpEvent<any>>;
    let endpoint = `${environment.apiUrl}/experiencias/${experienciaId}/documento`;

    // Try specific endpoint first if experienciaId is provided and valid UUID
    if (typeof experienciaId === 'string' && experienciaId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      primaryEndpointObs = this.http.post(endpoint, formData, {
        reportProgress: true,
        observe: 'events'
      });
    } else {
      // If no valid experienciaId for specific endpoint, directly use generic one.
      primaryEndpointObs = throwError(() => new Error('ID de experiencia no válido para el endpoint específico. Intentando fallback.'));
    }

    return primaryEndpointObs.pipe(
      map(event => {
        const eventObj = event as HttpEvent<any>;
        if (eventObj.type === HttpEventType.UploadProgress) {
          const progressEvent = eventObj as any;
          const progreso = Math.round(100 * progressEvent.loaded / progressEvent.total);
          return { type: 'progreso', progreso };
        } else if (eventObj.type === HttpEventType.Response) {
          this.notificarDocumentoActualizado(); // Notify on successful upload to specific endpoint
          return { type: 'success', response: eventObj.body };
        }
        return { type: 'otro' };
      }),
      catchError(firstError => {
        console.warn(`[DocumentosService] Falló la subida al endpoint específico (${endpoint}). Intentando endpoint genérico.`, firstError);

        const fallbackFormData = new FormData();
        fallbackFormData.append('file', file);

        // Append 'referenciaId' and 'tipoReferencia' only if experienciaId is a valid UUID
        // and for the generic upload endpoint
        if (typeof experienciaId === 'string' && experienciaId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            fallbackFormData.append('referenciaId', experienciaId.toString());
            fallbackFormData.append('tipoReferencia', 'EXPERIENCIA'); // Or other relevant type
            fallbackFormData.append('tipoDocumentoId', 'CERTIFICADO_EXPERIENCIA_LABORAL'); // Use a predefined ID for this type if necessary
        } else {
             // If no valid experience ID, just upload as a generic document
             fallbackFormData.append('tipoDocumentoId', 'DOCUMENTO_GENERICO');
        }

        return this.http.post(`${this.apiUrl}/upload`, fallbackFormData, {
          reportProgress: true,
          observe: 'events'
        }).pipe(
          map(event => {
            const eventObj = event as HttpEvent<any>;
            if (eventObj.type === HttpEventType.UploadProgress) {
              const progressEvent = eventObj as any;
              const progreso = Math.round(100 * progressEvent.loaded / progressEvent.total);
              return { type: 'progreso', progreso };
            } else if (eventObj.type === HttpEventType.Response) {
              this.notificarDocumentoActualizado(); // Notify on successful upload to generic endpoint
              return { type: 'success', response: eventObj.body };
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
