import { HttpClient, HttpEventType } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '@env/environment';
import { DocumentosService } from '../documentos/documentos.service';

export interface ExperienceRequest {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description: string;
  comments?: string;
}

export interface ExperienceResponse {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description: string;
  comments?: string;
  documentUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExperienceService {
  private apiUrl = `${environment.apiUrl}/experiencias`;

  constructor(
    private http: HttpClient,
    private documentosService: DocumentosService
  ) { }

  /**
   * Obtiene todas las experiencias de un usuario
   */
  getAllExperiencesByUserId(userId: string): Observable<ExperienceResponse[]> {
    return this.http.get<ExperienceResponse[]>(`${this.apiUrl}/usuario/${userId}`)
      .pipe(
        catchError(error => {
          console.error('Error al obtener experiencias del usuario:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtiene una experiencia por su ID
   */
  getExperienceById(id: string): Observable<ExperienceResponse> {
    return this.http.get<ExperienceResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Error al obtener experiencia con ID ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Crea una nueva experiencia para un usuario
   */
  createExperience(userId: string, experience: ExperienceRequest): Observable<ExperienceResponse> {
    return this.http.post<ExperienceResponse>(`${this.apiUrl}/usuario/${userId}`, experience)
      .pipe(
        catchError(error => {
          console.error('Error al crear experiencia:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Actualiza una experiencia existente
   */
  updateExperience(id: string, experience: ExperienceRequest): Observable<ExperienceResponse> {
    return this.http.put<ExperienceResponse>(`${this.apiUrl}/${id}`, experience)
      .pipe(
        catchError(error => {
          console.error(`Error al actualizar experiencia con ID ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Elimina una experiencia
   */
  deleteExperience(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Error al eliminar experiencia con ID ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Sube un documento asociado a una experiencia
   * Esta implementación sigue el mismo patrón que el servicio de educación que funciona correctamente
   */
  uploadDocument(experienceId: string, file: File): Observable<any> {
    // Verificar que tenemos un archivo válido
    if (!file) {
      console.error('Error: No se proporcionó ningún archivo para subir');
      return throwError(() => new Error('No se proporcionó ningún archivo'));
    }

    console.log(`Preparando para subir documento a experiencia ID ${experienceId}.`);
    console.log(`Detalles del archivo: nombre=${file.name}, tamaño=${file.size} bytes, tipo=${file.type}`);

    // Crear FormData
    const formData = new FormData();
    formData.append('file', file);

    // Log para depuración del FormData
    console.log('FormData creado con archivo:', { campo: 'file', archivo: file.name });

    // URL del endpoint
    const uploadUrl = `${this.apiUrl}/${experienceId}/documento`;
    console.log(`Subiendo archivo a: ${uploadUrl}`);

    // Realizar la solicitud HTTP con monitoreo de progreso
    return this.http.post(uploadUrl, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map(event => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            if (event.total) {
              const progress = Math.round(100 * event.loaded / event.total);
              console.log(`Progreso de carga: ${progress}%`);
              return { type: 'progress', progress };
            }
            return { type: 'progress', progress: 0 };

          case HttpEventType.Response:
            console.log('Documento subido correctamente:', event.body);
            // Notificar al servicio de documentos que se ha subido un nuevo documento
            this.documentosService.notificarDocumentoActualizado();
            return {
              type: 'success',
              experience: event.body
            };

          default:
            return { type: 'other', event };
        }
      }),
      catchError(error => {
        console.error('Error al subir documento a experiencia:', error);

        // Incluir detalles del error para depuración
        let errorDetails = '';
        if (error.error instanceof Error) {
          errorDetails = `Error: ${error.error.message}`;
        } else if (error.error) {
          errorDetails = `Error del servidor: ${JSON.stringify(error.error)}`;
        } else {
          errorDetails = `Código HTTP: ${error.status}, mensaje: ${error.message}`;
        }

        console.error(`Detalles adicionales del error: ${errorDetails}`);
        return throwError(() => ({
          type: 'error',
          error: error,
          message: error.message || 'Error al subir documento',
          details: errorDetails
        }));
      })
    );
  }
}
