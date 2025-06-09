import { HttpClient, HttpEventType, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators'; // Added tap
import { environment } from '@env/environment';
import { DocumentosService } from '../documentos/documentos.service'; // Assuming DocumentosService path
import { LoggingService } from '../logging/logging.service'; // Adjust path as necessary

/**
 * Interface for the request payload when creating or updating an experience.
 */
export interface ExperienceRequest {
  company: string;
  position: string;
  startDate: string; // ISO 8601 string (e.g., 'YYYY-MM-DD')
  endDate?: string; // Optional ISO 8601 string
  description: string;
  comments?: string;
}

/**
 * Interface for the response received after creating, updating, or fetching an experience.
 */
export interface ExperienceResponse {
  id: string; // Unique identifier for the experience
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description: string;
  comments?: string;
  documentUrl?: string; // URL to an associated document (e.g., certificate)
}

@Injectable({
  providedIn: 'root'
})
export class ExperienceService {
  private apiUrl = `${environment.apiUrl}/experiencias`; // Base API URL for experiences

  constructor(
    private http: HttpClient,
    private documentosService: DocumentosService, // Injected DocumentosService
    private loggingService: LoggingService // Inject LoggingService
  ) {
    this.loggingService.debug('[ExperienceService] Initializing ExperienceService.', undefined, 'ExperienceService');
  }

  /**
   * Retrieves all experiences for a specific user.
   * @param userId The ID of the user whose experiences to retrieve.
   * @returns An Observable of an array of ExperienceResponse.
   */
  getAllExperiencesByUserId(userId: string): Observable<ExperienceResponse[]> {
    this.loggingService.info(`[ExperienceService] Fetching all experiences for user ID: ${userId}.`, undefined, 'ExperienceService');
    return this.http.get<ExperienceResponse[]>(`${this.apiUrl}/usuario/${userId}`).pipe(
      tap(experiences => {
        this.loggingService.debug(`[ExperienceService] Successfully fetched ${experiences.length} experiences for user ID: ${userId}.`, experiences, 'ExperienceService');
      }),
      catchError(error => {
        this.loggingService.error(`[ExperienceService] Error fetching experiences for user ID: ${userId}:`, error, 'ExperienceService');
        return throwError(() => new Error('Error al obtener las experiencias del usuario.'));
      })
    );
  }

  /**
   * Retrieves a single experience by its ID.
   * @param id The ID of the experience to retrieve.
   * @returns An Observable of ExperienceResponse.
   */
  getExperienceById(id: string): Observable<ExperienceResponse> {
    this.loggingService.info(`[ExperienceService] Fetching experience by ID: ${id}.`, undefined, 'ExperienceService');
    return this.http.get<ExperienceResponse>(`${this.apiUrl}/${id}`).pipe(
      tap(experience => {
        this.loggingService.debug(`[ExperienceService] Successfully fetched experience with ID: ${id}.`, experience, 'ExperienceService');
      }),
      catchError(error => {
        this.loggingService.error(`[ExperienceService] Error fetching experience with ID ${id}:`, error, 'ExperienceService');
        return throwError(() => new Error(`Error al obtener experiencia con ID ${id}.`));
      })
    );
  }

  /**
   * Creates a new experience for a specific user.
   * @param userId The ID of the user for whom to create the experience.
   * @param experience The experience data to create.
   * @returns An Observable of the created ExperienceResponse.
   */
  createExperience(userId: string, experience: ExperienceRequest): Observable<ExperienceResponse> {
    this.loggingService.info(`[ExperienceService] Creating new experience for user ID: ${userId}.`, experience, 'ExperienceService');
    return this.http.post<ExperienceResponse>(`${this.apiUrl}/usuario/${userId}`, experience).pipe(
      tap(response => {
        this.loggingService.debug(`[ExperienceService] Experience created successfully for user ID: ${userId}.`, response, 'ExperienceService');
      }),
      catchError(error => {
        this.loggingService.error(`[ExperienceService] Error creating experience for user ID: ${userId}:`, error, 'ExperienceService');
        return throwError(() => new Error('Error al crear la experiencia.'));
      })
    );
  }

  /**
   * Updates an existing experience.
   * @param id The ID of the experience to update.
   * @param experience The updated experience data.
   * @returns An Observable of the updated ExperienceResponse.
   */
  updateExperience(id: string, experience: ExperienceRequest): Observable<ExperienceResponse> {
    this.loggingService.info(`[ExperienceService] Updating experience with ID: ${id}.`, experience, 'ExperienceService');
    return this.http.put<ExperienceResponse>(`${this.apiUrl}/${id}`, experience).pipe(
      tap(response => {
        this.loggingService.debug(`[ExperienceService] Experience with ID: ${id} updated successfully.`, response, 'ExperienceService');
      }),
      catchError(error => {
        this.loggingService.error(`[ExperienceService] Error updating experience with ID ${id}:`, error, 'ExperienceService');
        return throwError(() => new Error(`Error al actualizar experiencia con ID ${id}.`));
      })
    );
  }

  /**
   * Deletes an experience by its ID.
   * @param id The ID of the experience to delete.
   * @returns An Observable that emits void on successful deletion.
   */
  deleteExperience(id: string): Observable<void> {
    this.loggingService.info(`[ExperienceService] Deleting experience with ID: ${id}.`, undefined, 'ExperienceService');
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.loggingService.debug(`[ExperienceService] Experience with ID: ${id} deleted successfully.`, undefined, 'ExperienceService');
      }),
      catchError(error => {
        this.loggingService.error(`[ExperienceService] Error deleting experience with ID ${id}:`, error, 'ExperienceService');
        return throwError(() => new Error(`Error al eliminar experiencia con ID ${id}.`));
      })
    );
  }

  /**
   * Uploads a document associated with an experience.
   * This implementation follows the same pattern as the education service which works correctly.
   * @param experienceId The ID of the experience to associate the document with.
   * @param file The file to upload.
   * @returns An Observable reporting upload progress and success.
   */
  uploadDocument(experienceId: string, file: File): Observable<{
    type: string;
    progress?: number;
    experience?: ExperienceResponse; // Updated experience object on success
    event?: HttpEvent<ExperienceResponse>; // Raw HttpEvent for more details
    error?: Error | unknown; // Error object on failure
    message?: string; // User-friendly error message
    details?: string; // More technical error details
  }> {
    this.loggingService.info(`[ExperienceService] Initiating document upload for experience ID: ${experienceId}. File name: ${file?.name}.`, undefined, 'ExperienceService');

    if (!file) {
      const error = new Error('No se proporcionó ningún archivo para subir.');
      this.loggingService.error('[ExperienceService] Validation Error: No file provided for upload.', error, 'ExperienceService');
      return throwError(() => ({
        type: 'error',
        error: error,
        message: error.message,
        details: 'No se ha seleccionado un archivo válido para subir.'
      }));
    }

    const formData = new FormData();
    formData.append('file', file);
    // Assuming the backend endpoint is `experiences/{experienceId}/document` and it expects a file via FormData.
    const uploadUrl = `${this.apiUrl}/${experienceId}/document`;

    this.loggingService.debug(`[ExperienceService] Uploading document to: ${uploadUrl}`, { fileName: file.name, fileSize: file.size }, 'ExperienceService');

    // Log for FormData debugging (if needed, but usually not visible in console)
    // for (const pair of formData.entries()) {
    //   this.loggingService.debug(`[ExperienceService] FormData Entry: ${pair[0]}, ${pair[1]}`, undefined, 'ExperienceService');
    // }

    return this.http.post<ExperienceResponse>(uploadUrl, formData, {
      reportProgress: true, // Enable progress events
      observe: 'events' // Observe all events (including progress)
    }).pipe(
      map(event => {
        switch (event.type) {
          case HttpEventType.UploadProgress: {
            const total = event.total;
            if (total !== undefined && total > 0) {
              const progress = Math.round(100 * event.loaded / total);
              this.loggingService.debug(`[ExperienceService] Upload Progress for ${file.name}: ${progress}%`, undefined, 'ExperienceService');
              return { type: 'progress', progress: progress };
            }
            // If total is 0 or undefined, return 0 progress to prevent division by zero or NaN
            this.loggingService.warn(`[ExperienceService] UploadProgress event with total=0 or undefined for ${file.name}.`, { loaded: event.loaded, total: event.total }, 'ExperienceService');
            return { type: 'progress', progress: 0 };
          }

          case HttpEventType.Response: {
            this.loggingService.info(`[ExperienceService] Document uploaded successfully for experience ID: ${experienceId}.`, event.body, 'ExperienceService');
            return {
              type: 'success',
              experience: (event.body as ExperienceResponse | null) || undefined,
              event: event // Pass the full event for more context if needed by consumer
            };
          }

          default:
            this.loggingService.debug(`[ExperienceService] Unhandled HttpEventType: ${event.type}.`, event, 'ExperienceService');
            return { type: 'other', event: event };
        }
      }),
      catchError(error => {
        this.loggingService.error(`[ExperienceService] Error during document upload for experience ID: ${experienceId}:`, error, 'ExperienceService');

        let errorDetails = '';
        if (error.error instanceof ErrorEvent) {
          // Client-side error (e.g., network issues)
          errorDetails = `Error del cliente: ${error.error.message}`;
        } else if (error.error) {
          // Server-side error (e.g., validation errors, specific backend messages)
          errorDetails = `Error del servidor: ${JSON.stringify(error.error)}`;
        } else {
          // Generic HTTP error (e.g., no response, timeout)
          errorDetails = `Código HTTP: ${error.status || 'N/A'}, mensaje: ${error.message || 'Error desconocido'}`;
        }

        this.loggingService.debug(`[ExperienceService] Additional error details for upload failure: ${errorDetails}`, undefined, 'ExperienceService');

        return throwError(() => ({
          type: 'error',
          error: error, // Pass original error object
          message: error.message || 'Error al subir documento',
          details: errorDetails
        }));
      })
    );
  }
}
