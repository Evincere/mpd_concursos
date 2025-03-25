import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEventType } from '@angular/common/http';
import { Observable, throwError, Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DocumentoUsuario, TipoDocumento, DocumentoResponse } from '../../models/documento.model';
import { map, filter, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DocumentosService {
  private apiUrl = `${environment.apiUrl}/documentos`;

  // Subject para notificar cuando se sube un nuevo documento
  private documentoActualizadoSource = new Subject<void>();
  documentoActualizado$ = this.documentoActualizadoSource.asObservable();

  constructor(private http: HttpClient) { }

  /**
   * Notifica a todos los subscriptores que se ha actualizado un documento
   */
  notificarDocumentoActualizado(): void {
    this.documentoActualizadoSource.next();
  }

  /**
   * Obtiene todos los documentos del usuario actual
   */
  getDocumentosUsuario(): Observable<DocumentoUsuario[]> {
    return this.http.get<DocumentoUsuario[]>(`${this.apiUrl}/usuario`);
  }

  /**
   * Obtiene los tipos de documento disponibles
   */
  getTiposDocumento(): Observable<TipoDocumento[]> {
    return this.http.get<TipoDocumento[]>(`${this.apiUrl}/tipos`);
  }

  /**
   * Carga un nuevo documento
   * @param formData Datos del formulario con el archivo y metadatos
   */
  uploadDocumento(formData: FormData): Observable<DocumentoResponse> {
    // No configuramos el Content-Type porque el navegador lo establecerá automáticamente
    // con el boundary correcto para multipart/form-data
    return this.http.post<DocumentoResponse>(`${this.apiUrl}/upload`, formData);
  }

  /**
   * Obtiene el archivo de un documento específico
   * @param documentoId ID del documento
   */
  getDocumentoFile(documentoId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${documentoId}/file`, {
      responseType: 'blob'
    });
  }

  /**
   * Elimina un documento
   * @param documentoId ID del documento a eliminar
   */
  deleteDocumento(documentoId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${documentoId}`);
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
    return this.http.put<DocumentoResponse>(`${this.apiUrl}/${documentoId}`, formData, { headers });
  }

  /**
   * Sube un certificado para una experiencia laboral
   * @param file Archivo a subir
   * @param experienciaId ID de la experiencia
   * @returns Observable con la respuesta del servidor
   */
  subirDocumentoExperiencia(file: File, experienciaId: string | number): Observable<any> {
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
        if (event.type === HttpEventType.UploadProgress && event.total) {
          const progreso = Math.round(100 * event.loaded / event.total);
          return { type: 'progreso', progreso };
        } else if (event.type === HttpEventType.Response) {
          console.log('Documento subido correctamente', event.body);
          return { type: 'completado', response: event.body };
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
            if (event.type === HttpEventType.UploadProgress && event.total) {
              const progreso = Math.round(100 * event.loaded / event.total);
              return { type: 'progreso', progreso };
            } else if (event.type === HttpEventType.Response) {
              console.log('Documento subido correctamente usando endpoint alternativo', event.body);
              return { type: 'completado', response: event.body };
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
