import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEventType, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, throwError, Subject, forkJoin, of, BehaviorSubject } from 'rxjs'; // Import 'of' for returning observables
import { environment } from '../../../../environments/environment';
import { DocumentoUsuario, TipoDocumento, DocumentoResponse, EstadoDocumento, EstadoColaDocumento, EstadoProcesamiento, DocumentoReplaceResponse, DocumentoSummary } from '../../models/documento.model';
import { map, catchError, tap, debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { TempDocumentCacheService } from '../cv/temp-document-cache.service';

@Injectable({
  providedIn: 'root'
})
export class DocumentosService {
  private readonly http = inject(HttpClient);
  private readonly tempDocumentCache = inject(TempDocumentCacheService);
  private readonly apiUrl = `${environment.apiUrl}/documentos`;

  // Subject para notificar cuando se sube un nuevo documento
  private documentoActualizadoSource = new Subject<number>();
  documentoActualizado$ = this.documentoActualizadoSource.asObservable().pipe(
    debounceTime(3000), // CRITICAL FIX: Aumentar debounce para evitar emisiones múltiples
    distinctUntilChanged() // Solo emitir si realmente cambió (ahora funciona con timestamp)
  );

  // Cache de documentos
  private documentosCache: DocumentoUsuario[] = [];
  private tiposDocumentoCache: TipoDocumento[] = [];
  private ultimaActualizacion = 0;
  private ultimaActualizacionTipos = 0;
  private readonly CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutos

  // CRITICAL FIX: Control de notificaciones para evitar bucles
  private ultimaNotificacion = 0;
  private readonly MIN_INTERVALO_NOTIFICACION = 5000; // 5 segundos mínimo entre notificaciones

  // CRITICAL FIX: Control de concurrencia para evitar condiciones de carrera
  private loadingMutex = false;
  private pendingRequest: Observable<DocumentoUsuario[]> | null = null;

  // CRITICAL FIX: State management para operaciones de documentos
  private operationInProgress = new BehaviorSubject<boolean>(false);
  public operationInProgress$ = this.operationInProgress.asObservable();

  constructor() {
    this.ultimaActualizacion = 0; // Initialize to 0 so it fetches on first load
    // No need to call this.documentoActualizadoSource.next() here, as it's meant for updates.
  }

  /**
   * Establece el estado de una operación de documento en curso.
   * @param state `true` si una operación está en progreso, `false` en caso contrario.
   */
  setOperationInProgress(state: boolean): void {
    this.operationInProgress.next(state);
  }

  /**
   * Verifica si hay una operación de documento en progreso.
   * @returns `true` si una operación está en progreso.
   */
  isOperationInProgress(): boolean {
    return this.operationInProgress.getValue();
  }

  /**
   * Notifica a los suscriptores que un documento ha sido actualizado (subido, eliminado, reemplazado).
   * CRITICAL FIX: Implementa throttling para evitar notificaciones excesivas
   */
  notificarDocumentoActualizado(): void {
    const ahora = Date.now();

    // CRITICAL FIX: Evitar notificaciones muy frecuentes
    if (ahora - this.ultimaNotificacion < this.MIN_INTERVALO_NOTIFICACION) {
      console.log('[DocumentosService] ⏳ Notificación ignorada - muy frecuente (throttling activo)');
      return;
    }

    console.log('[DocumentosService] 📢 Notificando actualización de documento...');
    this.ultimaNotificacion = ahora;
    this.documentoActualizadoSource.next(ahora);
  }

  /**
   * Obtiene todos los documentos del usuario actual
   * @param forzarRecarga Si es true, ignora la caché y fuerza una recarga desde el servidor
   */
  getDocumentosUsuario(forzarRecarga = false): Observable<DocumentoUsuario[]> {
    const ahora = Date.now();

    // CRITICAL FIX: Control de concurrencia para evitar condiciones de carrera
    if (this.loadingMutex && this.pendingRequest) {
      console.log('[DocumentosService] ⏳ Solicitud en progreso, retornando request pendiente');
      return this.pendingRequest;
    }

    if (!forzarRecarga && this.documentosCache.length > 0 && (ahora - this.ultimaActualizacion < this.CACHE_TIMEOUT)) {
      // Retornar de la caché
      console.log('[DocumentosService] 📁 Retornando documentos desde cache');
      return of(this.documentosCache);
    }

    // CRITICAL FIX: Activar mutex antes de hacer la solicitud HTTP
    this.loadingMutex = true;
    console.log('[DocumentosService] 🔍 Solicitando documentos del usuario desde:', `${this.apiUrl}/usuario`);

    this.pendingRequest = this.http.get<DocumentoUsuario[]>(`${this.apiUrl}/usuario`).pipe(
      tap(documentos => {
        console.log('[DocumentosService] ✅ Respuesta del backend:', documentos);
        console.log('[DocumentosService] 📊 Cantidad de documentos recibidos:', documentos.length);
        if (documentos.length > 0) {
          console.log('[DocumentosService] 📄 Primer documento:', documentos[0]);
        }
        this.documentosCache = documentos;
        this.ultimaActualizacion = Date.now();

        // REMOVED: No notificar actualización en consultas normales para evitar bucle infinito
        // Solo notificar cuando realmente se modifique un documento (upload, delete, replace)
      }),
      finalize(() => {
        // CRITICAL FIX: Liberar mutex al finalizar (éxito o error)
        this.loadingMutex = false;
        this.pendingRequest = null;
        console.log('[DocumentosService] 🔓 Mutex liberado');
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

    return this.pendingRequest;
  }

  /**
   * Obtiene un resumen de documentos agrupados por tipo, mostrando solo el más reciente
   * con información sobre versiones anteriores
   * @param forzarRecarga Si es true, ignora la caché y fuerza una recarga desde el servidor
   */
  getDocumentosSummary(forzarRecarga = false): Observable<DocumentoSummary[]> {
    console.log('[DocumentosService] 🔍 Solicitando resumen de documentos del usuario');

    return this.http.get<DocumentoSummary[]>(`${this.apiUrl}/usuario/summary`).pipe(
      tap(summaries => {
        console.log('[DocumentosService] ✅ Resumen de documentos recibido:', summaries);
        console.log('[DocumentosService] 📊 Cantidad de tipos de documento:', summaries.length);
        if (summaries.length > 0) {
          console.log('[DocumentosService] 📄 Primer resumen:', summaries[0]);
        }
      }),
      catchError(error => {
        console.error('[DocumentosService] ❌ Error al obtener resumen de documentos:', error);

        // Si es un error de autenticación (401), no lanzar error adicional
        if (error.status === 401) {
          return of([]);
        }

        // Retornar array vacío en caso de error para no romper la UI
        return of([]);
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

    // Log información del archivo
    const file = formData.get('file') as File;
    const tipoDocumentoId = formData.get('tipoDocumentoId') as string;
    const comentarios = formData.get('comentarios') as string;

    console.log('🔄 [DocumentosService] Iniciando carga de documento:', {
      fileName: file?.name,
      fileSize: file?.size,
      tipoDocumentoId
    });

    // Validar archivo antes del upload
    if (file) {
      if (file.size > 20 * 1024 * 1024) { // 20MB
        console.error('❌ [DocumentosService] Archivo excede 20MB:', file.size);
        return throwError(() => new Error(`El archivo excede el tamaño máximo de 20MB. Tamaño actual: ${this.formatBytes(file.size)}`));
      }

      if (file.type !== 'application/pdf') {
        console.error('❌ [DocumentosService] Tipo de archivo no válido:', file.type);
        return throwError(() => new Error(`Tipo de archivo no permitido: ${file.type}. Solo se permiten archivos PDF.`));
      }
    }

    // CRITICAL FIX: Establecer operación en progreso para prevenir condiciones de carrera
    this.setOperationInProgress(true);

    // ENHANCEMENT: Configurar timeout específico para uploads (5 minutos)
    const uploadTimeout = 5 * 60 * 1000; // 5 minutos

    // No configuramos el Content-Type porque el navegador lo establecerá automáticamente
    // con el boundary correcto para multipart/form-data
    return this.http.post<DocumentoResponse>(`${this.apiUrl}/upload`, formData, {
      // ENHANCEMENT: Configurar timeout específico para uploads
      headers: new HttpHeaders({
        'X-Upload-Timeout': uploadTimeout.toString()
      })
    }).pipe(
      tap(response => {
        console.log('✅ [DocumentosService] Carga de documento exitosa:', {
          documentId: response.id,
          mensaje: response.mensaje
        });
        this.notificarDocumentoActualizado(); // Notify listeners on success
      }),
      catchError(error => {
        // Log del error
        console.error('❌ [DocumentosService] Error al subir documento:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
          error: error.error,
          fileName: file?.name,
          fileSize: file?.size,
          timestamp: new Date().toISOString(),
          headers: error.headers,
          name: error.name,
          stack: error.stack
        });

        // ENHANCEMENT: Detectar si es un error de red/CORS/timeout
        const isNetworkError = error.status === 0 || error.status === undefined;
        const isTimeoutError = error.name === 'TimeoutError' || error.message?.includes('timeout');
        const isCorsError = error.message?.includes('CORS') || error.message?.includes('Access-Control');

        // CRITICAL FIX: Manejo mejorado de errores específicos
        let errorMessage = 'Error al subir el documento';
        let diagnosticInfo = '';

        if (isTimeoutError) {
          errorMessage = 'La carga del documento tardó demasiado tiempo (más de 5 minutos). Intente con un archivo más pequeño o verifique su conexión.';
          diagnosticInfo = 'Timeout durante el upload';
        } else if (isCorsError) {
          errorMessage = 'Error de configuración del servidor (CORS). Contacte al administrador del sistema.';
          diagnosticInfo = 'Error de CORS';
        } else if (isNetworkError) {
          errorMessage = 'Error de conexión con el servidor. Verifique su conexión a internet o intente nuevamente.';
          diagnosticInfo = 'Error de red/conexión';
        } else if (error.status === 400) {
          // Error de validación del documento
          if (error.error && error.error.mensaje) {
            errorMessage = error.error.mensaje;
          } else {
            errorMessage = 'El documento no cumple con los requisitos de validación';
          }
          diagnosticInfo = 'Error de validación del documento';
        } else if (error.status === 401) {
          errorMessage = 'Su sesión ha expirado. Por favor, inicie sesión nuevamente';
          diagnosticInfo = 'Error de autenticación';
        } else if (error.status === 413) {
          errorMessage = `El archivo es demasiado grande. El tamaño máximo permitido es 20MB. Su archivo: ${file ? this.formatBytes(file.size) : 'desconocido'}`;
          diagnosticInfo = 'Archivo demasiado grande';
        } else if (error.status === 415) {
          errorMessage = `Tipo de archivo no permitido: ${file?.type || 'desconocido'}. Solo se permiten archivos PDF`;
          diagnosticInfo = 'Tipo de archivo no válido';
        } else if (error.status === 500) {
          if (error.error && error.error.mensaje) {
            errorMessage = error.error.mensaje;
          } else {
            errorMessage = 'Error interno del servidor. Por favor, intente nuevamente más tarde';
          }
          diagnosticInfo = 'Error interno del servidor';
        } else if (error.status === 502 || error.status === 503 || error.status === 504) {
          errorMessage = 'El servidor está temporalmente no disponible. Por favor, intente nuevamente en unos minutos.';
          diagnosticInfo = 'Servidor no disponible';
        } else if (error.message) {
          errorMessage = error.message;
          diagnosticInfo = 'Error personalizado';
        }

        // Log información adicional del error
        console.error(`🔍 [DocumentosService] Información del error: ${diagnosticInfo}`, {
          originalError: error,
          processedMessage: errorMessage,
          isNetworkError,
          isTimeoutError,
          isCorsError,
          fileInfo: file ? {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified).toISOString()
          } : null
        });

        return throwError(() => new Error(errorMessage));
      }),
      finalize(() => {
        // CRITICAL FIX: Siempre liberar el estado de operación en progreso
        console.log('🔓 [DocumentosService] Liberando estado de operación de carga');
        this.setOperationInProgress(false);
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
              estado: EstadoDocumento.PENDIENTE,
              usuarioId: ''
            }
          } as DocumentoResponse);
        })
      )
    );

    return forkJoin(uploads).pipe(
      // CRITICAL FIX: Eliminar notificación duplicada - uploadDocumento() ya notifica individualmente
      // tap(() => {
      //   this.notificarDocumentoActualizado(); // Notify listeners after all uploads are attempted
      // }),
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
      // CRITICAL FIX: Eliminar notificación aquí - se notificará cuando se procesen los documentos
      // tap(queueIds => {
      //   this.notificarDocumentoActualizado(); // Potentially notify, depending on backend's queue completion
      // }),
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
  getMultipleDocumentosStatus(queueIds: string[]): Observable<EstadoColaDocumento[]> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    // CRITICAL FIX: Corregir endpoint para múltiples estados
    return this.http.post<EstadoColaDocumento[]>(`${this.apiUrl}/queue/status-multiple`, queueIds, { headers }).pipe(
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
  getDocumentoStatus(queueId: string): Observable<EstadoColaDocumento> {
    return this.http.get<EstadoColaDocumento>(`${this.apiUrl}/queue/status/${queueId}`).pipe(
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

    // ✅ Detectar si es un documento de CV y usar el endpoint correcto
    if (this.isCvDocument(documentoId)) {
      return this.getCvDocumentoFile(documentoId, reportProgress);
    }

    if (reportProgress) {
      return this.http.get(`${this.apiUrl}/${documentoId}/file`, {
        reportProgress: true,
        observe: 'events',
        responseType: 'blob'
      }).pipe(
        map(event => {
          // Validar que la respuesta final sea un blob válido
          if (event instanceof HttpResponse && event.body) {
            if (!(event.body instanceof Blob) || event.body.size === 0) {
              throw new Error('Response is not a valid Blob.');
            }
          }
          return event;
        }),
        catchError(error => {
          console.error('[DocumentosService] ❌ Error al obtener el archivo del documento con progreso:', error);
          let errorMessage = 'Error al obtener el archivo del documento';

          if (error.status === 404) {
            errorMessage = 'El documento no fue encontrado';
          } else if (error.status === 403) {
            errorMessage = 'No tiene permisos para acceder a este documento';
          } else if (error.status === 500) {
            errorMessage = 'Error interno del servidor al obtener el documento';
          } else if (error.message?.includes('not a valid Blob')) {
            errorMessage = 'El archivo del documento no está disponible o está corrupto';
          }

          return throwError(() => new Error(errorMessage));
        })
      );
    } else {
      // Sin progreso, retorna directamente el blob
      return this.http.get(`${this.apiUrl}/${documentoId}/file`, {
        responseType: 'blob'
      }).pipe(
        tap(response => {
          // Debug: Log información detallada sobre la respuesta
          console.log('[DocumentosService] 🔍 Respuesta recibida:', {
            type: typeof response,
            constructor: response?.constructor?.name,
            isBlob: response instanceof Blob,
            size: response instanceof Blob ? response.size : 'N/A',
            response: response
          });
        }),
        map(blob => {
          // Validar que la respuesta sea un blob válido
          if (!(blob instanceof Blob)) {
            console.error('[DocumentosService] ❌ Respuesta no es un Blob:', {
              type: typeof blob,
              constructor: (blob as any)?.constructor?.name,
              value: blob
            });
            throw new Error('Response is not a Blob.');
          }

          if (blob.size === 0) {
            console.error('[DocumentosService] ❌ Blob está vacío:', blob);
            throw new Error('Response is an empty Blob.');
          }

          console.log('[DocumentosService] ✅ Blob válido recibido:', {
            size: blob.size,
            type: blob.type
          });

          return blob;
        }),
        catchError(error => {
          console.error('[DocumentosService] ❌ Error al obtener archivo de documento:', error);
          let errorMessage = 'Error al obtener el archivo del documento';

          if (error.status === 404) {
            errorMessage = 'El documento no fue encontrado';
          } else if (error.status === 403) {
            errorMessage = 'No tiene permisos para acceder a este documento';
          } else if (error.status === 401) {
            errorMessage = 'Debe iniciar sesión para acceder al documento';
          } else if (error.status === 500) {
            errorMessage = 'Error interno del servidor. Verifique que el documento existe y que tiene permisos para accederlo.';
          } else if (error.status === 400) {
            errorMessage = 'ID de documento inválido';
          } else if (error.status === 0) {
            errorMessage = 'No se pudo conectar con el servidor. Verifique su conexión a internet.';
          } else if (error.message?.includes('not a Blob')) {
            errorMessage = 'El archivo del documento no está disponible o está corrupto';
          } else if (error.message?.includes('empty Blob')) {
            errorMessage = 'El archivo del documento está vacío';
          }

          // Log adicional para debugging
          console.error('[DocumentosService] 🔍 Detalles del error:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            message: error.message,
            error: error.error
          });

          return throwError(() => new Error(errorMessage));
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

    // 🔧 TEMPORAL: Deshabilitar validación backend por problemas de timeout en producción
    // TODO: Reactivar cuando se solucione el endpoint /api/documentos/validate
    console.log('[DocumentosService] ⚠️ Validación backend deshabilitada temporalmente - usando validación local');

    // Validación básica local
    const maxSize = 20 * 1024 * 1024; // 20MB
    const allowedTypes = ['application/pdf'];

    if (file.size > maxSize) {
      return throwError(() => new Error(`Archivo demasiado grande. Máximo permitido: ${Math.round(maxSize / (1024 * 1024))}MB`));
    }

    if (!allowedTypes.includes(file.type)) {
      return throwError(() => new Error(`Tipo de archivo no permitido. Solo se permiten archivos PDF.`));
    }

    // Retornar validación exitosa
    return of({
      valid: true,
      errors: [],
      message: 'Validación local exitosa',
      skipBackendValidation: true
    });

    /* CÓDIGO ORIGINAL COMENTADO TEMPORALMENTE:
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
    */
  }

  /**
   * Elimina un documento
   * @param documentoId ID del documento a eliminar
   */
  deleteDocumento(documentoId: string): Observable<boolean> {
    if (!documentoId) {
      console.error('[DocumentosService] ❌ ID de documento no proporcionado para eliminar.');
      return of(false);
    }

    console.log(`🗑️ [DocumentosService] Iniciando eliminación de documento: ${documentoId}`);

    // CRITICAL FIX: Establecer operación en progreso para prevenir condiciones de carrera
    this.setOperationInProgress(true);

    return this.http.delete<void>(`${this.apiUrl}/${documentoId}`).pipe(
      tap(() => {
        console.log(`✅ [DocumentosService] Eliminación exitosa de documento: ${documentoId}`);
        this.notificarDocumentoActualizado();
      }),
      map(() => true),
      catchError(error => {
        console.error(`❌ [DocumentosService] Error al eliminar documento ${documentoId}:`, error);
        return of(false);
      }),
      finalize(() => {
        // CRITICAL FIX: Siempre liberar el estado de operación en progreso
        console.log(`🔓 [DocumentosService] Liberando estado de operación de eliminación para documento: ${documentoId}`);
        this.setOperationInProgress(false);
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
   * Reemplaza un documento existente por uno nuevo, mostrando advertencias y detalle de impacto si corresponde
   */
  replaceDocumento(documentoId: string, file: File, comentarios?: string, forceReplace = false): Observable<DocumentoReplaceResponse> {
    console.log(`🔄 [DocumentosService] Iniciando reemplazo de documento: ${documentoId}`);

    // CRITICAL FIX: Establecer operación en progreso para prevenir condiciones de carrera
    this.setOperationInProgress(true);

    const formData = new FormData();
    formData.append('file', file);
    if (comentarios) formData.append('comentarios', comentarios);
    formData.append('forceReplace', String(forceReplace));

    return this.http.post<DocumentoReplaceResponse>(`${this.apiUrl}/${documentoId}/replace`, formData).pipe(
      tap((response) => {
        console.log(`✅ [DocumentosService] Reemplazo exitoso para documento: ${documentoId}`);
        // Notificar actualización solo si la operación fue exitosa
        this.notificarDocumentoActualizado();
      }),
      catchError(error => {
        console.error(`❌ [DocumentosService] Error al reemplazar documento ${documentoId}:`, error);
        let errorMessage = 'Error al reemplazar el documento';
        if (error.status === 400) {
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
        } else if (error.status === 409) {
          errorMessage = error.error?.mensaje || 'Conflicto de concurrencia: el documento está siendo modificado por otra operación. Por favor, intente nuevamente.';
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
      }),
      finalize(() => {
        // CRITICAL FIX: Siempre liberar el estado de operación en progreso
        console.log(`🔓 [DocumentosService] Liberando estado de operación para documento: ${documentoId}`);
        this.setOperationInProgress(false);
      })
    );
  }

  checkReplaceDocumento(documentoId: string, file: File, comentarios?: string): Observable<DocumentoReplaceResponse> {
    console.log(`🔍 [DocumentosService] Verificando reemplazo de documento: ${documentoId}`);

    const formData = new FormData();
    formData.append('file', file);
    if (comentarios) formData.append('comentarios', comentarios);

    return this.http.post<DocumentoReplaceResponse>(`${this.apiUrl}/${documentoId}/replace/check`, formData).pipe(
      catchError(error => {
        console.error(`❌ [DocumentosService] Error al verificar reemplazo de documento ${documentoId}:`, error);
        let errorMessage = 'Error al verificar el reemplazo del documento';
        if (error.status === 400) {
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

  // ===== MÉTODOS ESPECÍFICOS PARA DOCUMENTOS DE CV =====

  /**
   * Detecta si un documento pertenece al sistema de CV
   * Los documentos de CV suelen tener IDs más largos o patrones específicos
   */
  private isCvDocument(documentoId: string): boolean {
    // Los documentos de CV suelen tener IDs más largos o contener ciertos patrones
    // También pueden ser URLs relativas del sistema de CV
    return documentoId.length > 20 ||
           documentoId.includes('doc_') ||
           documentoId.includes('cv_') ||
           documentoId.includes('cv-documents/') ||
           documentoId.includes('experiences/') ||
           documentoId.includes('education/');
  }

  /**
   * Obtiene el archivo de un documento de CV específico
   * @param documentoId ID o ruta del documento de CV
   * @param reportProgress Si es true, reporta el progreso de la descarga
   */
  private getCvDocumentoFile(documentoId: string, reportProgress = false): Observable<Blob | HttpEvent<Blob>> {
    console.log(`[DocumentosService] 🔍 Descargando documento de CV con ID/ruta: ${documentoId}`);

    // ✅ Si es un documento temporal, cargar desde cache
    if (this.tempDocumentCache.isTempDocument(documentoId)) {
      console.log(`[DocumentosService] 📁 Documento temporal detectado, cargando desde cache`);
      return this.loadTempDocumentFromCache(documentoId);
    }

    // ✅ Si es una ruta relativa de CV, usar el endpoint específico de CV
    if (this.isCvDocumentPath(documentoId)) {
      return this.downloadCvDocumentByPath(documentoId, reportProgress);
    }

    // ✅ Si es un ID tradicional, usar el endpoint de documentos generales
    if (reportProgress) {
      // Con progreso, retorna HttpEvent<Blob>
      return this.http.get(`${this.apiUrl}/${documentoId}/file`, {
        responseType: 'blob',
        reportProgress: true,
        observe: 'events'
      }).pipe(
        tap(event => {
          if (event.type === HttpEventType.DownloadProgress && event.total) {
            const progress = Math.round(100 * event.loaded / event.total);
            console.log(`[DocumentosService] 📥 Progreso descarga CV: ${progress}%`);
          }
        }),
        catchError(error => {
          console.error('[DocumentosService] ❌ Error descargando documento de CV:', error);
          return throwError(() => new Error(`Error al descargar documento de CV: ${error.message}`));
        })
      );
    } else {
      // Sin progreso, retorna directamente el blob
      return this.http.get(`${this.apiUrl}/${documentoId}/file`, {
        responseType: 'blob'
      }).pipe(
        tap(response => {
          console.log('[DocumentosService] 🔍 Documento de CV descargado exitosamente:', {
            type: typeof response,
            isBlob: response instanceof Blob,
            size: response instanceof Blob ? response.size : 'N/A'
          });
        }),
        catchError(error => {
          console.error('[DocumentosService] ❌ Error descargando documento de CV:', error);
          // ✅ Intentar con endpoint alternativo si falla el principal
          return this.tryAlternativeEndpoint(documentoId);
        })
      );
    }
  }

  /**
   * Detecta si es una ruta de documento de CV
   */
  private isCvDocumentPath(path: string): boolean {
    return path.includes('/') && (
      path.includes('cv-documents/') ||
      path.includes('experiences/') ||
      path.includes('education/') ||
      path.startsWith('uploads/')
    );
  }

  /**
   * Descarga un documento de CV usando su ruta relativa
   */
  private downloadCvDocumentByPath(path: string, reportProgress = false): Observable<Blob | HttpEvent<Blob>> {
    console.log(`[DocumentosService] 🔍 Descargando documento de CV por ruta: ${path}`);

    const url = `${environment.apiUrl}/cv/documentos/file?path=${encodeURIComponent(path)}`;

    if (reportProgress) {
      return this.http.get(url, {
        responseType: 'blob',
        reportProgress: true,
        observe: 'events'
      }).pipe(
        tap(event => {
          if (event.type === HttpEventType.DownloadProgress && event.total) {
            const progress = Math.round(100 * event.loaded / event.total);
            console.log(`[DocumentosService] 📥 Progreso descarga CV por ruta: ${progress}%`);
          }
        }),
        catchError(error => {
          console.error('[DocumentosService] ❌ Error descargando documento de CV por ruta:', error);
          return throwError(() => new Error(`Error al descargar documento de CV: ${error.message}`));
        })
      );
    } else {
      return this.http.get(url, {
        responseType: 'blob'
      }).pipe(
        tap(response => {
          console.log('[DocumentosService] ✅ Documento de CV descargado por ruta exitosamente');
        }),
        catchError(error => {
          console.error('[DocumentosService] ❌ Error descargando documento de CV por ruta:', error);
          return throwError(() => new Error(`No se pudo descargar el documento con ruta: ${path}`));
        })
      );
    }
  }

  /**
   * Intenta descargar el documento usando endpoints alternativos
   */
  private tryAlternativeEndpoint(documentoId: string): Observable<Blob> {
    console.log(`[DocumentosService] 🔄 Intentando endpoint alternativo para documento: ${documentoId}`);

    // Intentar con el endpoint de archivos estáticos
    return this.http.get(`${environment.apiUrl}/files/cv-documents/${documentoId}`, {
      responseType: 'blob'
    }).pipe(
      tap(response => {
        console.log('[DocumentosService] ✅ Documento descargado con endpoint alternativo');
      }),
      catchError(error => {
        console.error('[DocumentosService] ❌ Error con endpoint alternativo:', error);
        return throwError(() => new Error(`No se pudo descargar el documento con ID: ${documentoId}`));
      })
    );
  }

  /**
   * Carga un documento temporal desde cache
   */
  private loadTempDocumentFromCache(documentoId: string): Observable<Blob> {
    try {
      const tempDoc = this.tempDocumentCache.getDocument(documentoId);

      if (!tempDoc) {
        console.error(`[DocumentosService] ❌ Documento temporal no encontrado: ${documentoId}`);
        return throwError(() => new Error(`Documento temporal no encontrado: ${documentoId}`));
      }

      // Convertir base64 a blob
      const blob = this.base64ToBlob(tempDoc.base64, tempDoc.mimeType);
      console.log(`[DocumentosService] ✅ Documento temporal cargado desde cache: ${documentoId}`);

      return of(blob);

    } catch (error) {
      console.error(`[DocumentosService] ❌ Error cargando documento temporal: ${documentoId}`, error);
      return throwError(() => new Error(`Error al cargar documento temporal: ${error}`));
    }
  }

  /**
   * Convierte base64 a Blob
   */
  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  /**
   * Invalida el cache y fuerza una recarga desde el backend
   */
  public invalidarCache(): void {
    console.log('[DocumentosService] 🗑️ Invalidando cache de documentos');
    this.documentosCache = [];
    this.ultimaActualizacion = 0;
    this.notificarDocumentoActualizado();
  }

  /**
   * Formatea bytes en formato legible
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }


}
