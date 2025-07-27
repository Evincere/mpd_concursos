/**
 * Servicio HTTP para Experiencias Laborales del CV
 *
 * @description Servicio real para conectar con el backend /api/experiencias
 * @author Augment Agent
 * @date 2025-06-22
 * @version 1.0.0
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, tap, catchError, retry } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { WorkExperience, WorkExperienceDto } from '@core/models/cv';

export interface ExperienceApiResponse {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
  comments?: string;
  location?: string;
  technologies?: string;
  achievements?: string;
  documentUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExperienceCvService {
  private readonly apiUrl = `${environment.apiUrl}/experiencias`;
  private experiencesSubject = new BehaviorSubject<WorkExperience[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Observables públicos
  public experiences$ = this.experiencesSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todas las experiencias laborales de un usuario
   */
  getAllByUserId(userId: string): Observable<WorkExperience[]> {
    this.setLoading(true);
    this.setError(null);

    return this.http.get<ExperienceApiResponse[]>(`${this.apiUrl}/usuario/${userId}`)
      .pipe(
        retry(2), // Reintentar hasta 2 veces en caso de error
        map(responses => responses.map(response => this.mapApiResponseToWorkExperience(response))),
        tap(experiences => {
          this.experiencesSubject.next(experiences);
          this.setLoading(false);
          console.log(`[ExperienceCvService] Loaded ${experiences.length} experiences for user ${userId}`);
        }),
        catchError(error => this.handleError('getAllByUserId', error))
      );
  }

  /**
   * Obtiene una experiencia laboral específica por ID
   */
  getById(id: string): Observable<WorkExperience> {
    return this.http.get<ExperienceApiResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => this.mapApiResponseToWorkExperience(response)),
        catchError(error => this.handleError('getById', error))
      );
  }

  /**
   * Crea una nueva experiencia laboral
   */
  create(userId: string, experience: WorkExperienceDto): Observable<WorkExperience> {
    this.setLoading(true);
    this.setError(null);

    const payload = this.mapWorkExperienceDtoToApiRequest(experience);

    return this.http.post<ExperienceApiResponse>(`${this.apiUrl}/usuario/${userId}`, payload)
      .pipe(
        map(response => this.mapApiResponseToWorkExperience(response)),
        tap(newExperience => {
          const current = this.experiencesSubject.value;
          this.experiencesSubject.next([...current, newExperience]);
          this.setLoading(false);
          console.log(`[ExperienceCvService] Created experience:`, newExperience);
        }),
        catchError(error => this.handleError('create', error))
      );
  }

  /**
   * Actualiza una experiencia laboral existente
   */
  update(id: string, experience: WorkExperienceDto): Observable<WorkExperience> {
    this.setLoading(true);
    this.setError(null);

    const payload = this.mapWorkExperienceDtoToApiRequest(experience);

    return this.http.put<ExperienceApiResponse>(`${this.apiUrl}/${id}`, payload)
      .pipe(
        map(response => this.mapApiResponseToWorkExperience(response)),
        tap(updatedExperience => {
          const current = this.experiencesSubject.value;
          const index = current.findIndex(exp => exp.id === id);
          if (index !== -1) {
            current[index] = updatedExperience;
            this.experiencesSubject.next([...current]);
          }
          this.setLoading(false);
          console.log(`[ExperienceCvService] Updated experience:`, updatedExperience);
        }),
        catchError(error => this.handleError('update', error))
      );
  }

  /**
   * Elimina una experiencia laboral (soft delete)
   */
  delete(id: string): Observable<boolean> {
    this.setLoading(true);
    this.setError(null);

    return this.http.delete(`${this.apiUrl}/${id}`)
      .pipe(
        map(() => {
          const current = this.experiencesSubject.value;
          const filtered = current.filter(exp => exp.id !== id);
          this.experiencesSubject.next(filtered);
          this.setLoading(false);
          console.log(`[ExperienceCvService] Deleted experience with ID: ${id}`);
          return true;
        }),
        catchError(error => this.handleError('delete', error))
      );
  }

  /**
   * Sube un documento probatorio para una experiencia
   */
  uploadDocument(id: string, file: File): Observable<WorkExperience> {
    this.setLoading(true);
    this.setError(null);

    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ExperienceApiResponse>(`${this.apiUrl}/${id}/documento`, formData)
      .pipe(
        map(response => this.mapApiResponseToWorkExperience(response)),
        tap(updatedExperience => {
          const current = this.experiencesSubject.value;
          const index = current.findIndex(exp => exp.id === id);
          if (index !== -1) {
            current[index] = updatedExperience;
            this.experiencesSubject.next([...current]);
          }
          this.setLoading(false);
          console.log(`[ExperienceCvService] Uploaded document for experience:`, updatedExperience);
        }),
        catchError(error => this.handleError('uploadDocument', error))
      );
  }

  /**
   * Refresca la lista de experiencias desde el servidor
   */
  refresh(userId: string): void {
    this.getAllByUserId(userId).subscribe();
  }

  /**
   * Limpia el estado del servicio
   */
  clearState(): void {
    this.experiencesSubject.next([]);
    this.setLoading(false);
    this.setError(null);
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Mapea la respuesta de la API a WorkExperience
   */
  private mapApiResponseToWorkExperience(response: ExperienceApiResponse): WorkExperience {
    return {
      id: response.id,
      userId: '', // Se asignará desde el contexto
      status: 'ACTIVE' as any, // Valor por defecto
      position: response.position,
      company: response.company,
      description: response.description || '',
      startDate: this.parseApiDate(response.startDate),
      endDate: response.endDate ? this.parseApiDate(response.endDate) : undefined,
      isCurrentJob: !response.endDate, // Si no hay fecha fin, es trabajo actual
      location: response.location || '',
      achievements: response.achievements ? response.achievements.split(', ').filter(a => a.trim()) : [],
      technologies: response.technologies ? response.technologies.split(', ').filter(t => t.trim()) : [],
      comments: response.comments,
      documentUrl: response.documentUrl, // Mapeo directo de la URL del documento
      document: response.documentUrl ? {
        id: response.id + '_doc',
        fileName: response.documentUrl.split('/').pop() || 'documento.pdf',
        originalFileName: response.documentUrl.split('/').pop() || 'documento.pdf',
        uploadDate: new Date(),
        fileSize: 0, // No disponible en API actual
        mimeType: 'application/pdf' // Valor por defecto
      } : undefined,
      createdAt: new Date(), // Valor por defecto
      updatedAt: new Date() // Valor por defecto
    };
  }

  /**
   * Mapea WorkExperienceDto a formato de API request
   */
  private mapWorkExperienceDtoToApiRequest(dto: WorkExperienceDto): any {
    console.log('[ExperienceCvService] Mapping DTO to API request:', dto);

    // Convertir fechas de string ISO a LocalDate format (YYYY-MM-DD)
    const startDate = dto.startDate ? this.formatDateForBackend(dto.startDate) : null;
    const endDate = dto.endDate ? this.formatDateForBackend(dto.endDate) : null;

    const payload = {
      company: dto.company,
      position: dto.position,
      startDate: startDate,
      endDate: endDate,
      description: dto.description,
      comments: dto.comments,
      location: dto.location || null,
      technologies: dto.technologies ? dto.technologies.join(', ') : null,
      achievements: dto.achievements ? dto.achievements.join(', ') : null
    };

    console.log('[ExperienceCvService] API payload:', payload);
    return payload;
  }

  /**
   * Parsea una fecha que viene del backend (YYYY-MM-DD) evitando problemas de zona horaria
   */
  private parseApiDate(dateString: string): Date {
    // Crear fecha usando los componentes individuales para evitar problemas de zona horaria
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month - 1 porque Date usa índices 0-11 para meses
  }

  /**
   * Formatea una fecha para el backend (YYYY-MM-DD)
   */
  private formatDateForBackend(dateInput: string | Date): string {
    let date: Date;

    if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else {
      date = dateInput;
    }

    if (isNaN(date.getTime())) {
      console.error('[ExperienceCvService] Invalid date:', dateInput);
      throw new Error('Fecha inválida');
    }

    // Formato YYYY-MM-DD requerido por LocalDate
    return date.toISOString().split('T')[0];
  }

  /**
   * Maneja errores de las llamadas HTTP
   */
  private handleError(operation: string, error: HttpErrorResponse): Observable<never> {
    this.setLoading(false);

    let errorMessage = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error de red: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      switch (error.status) {
        case 400:
          // Intentar extraer mensaje específico de validación
          if (error.error && typeof error.error === 'object') {
            if (error.error.message) {
              errorMessage = error.error.message;
            } else if (error.error.errors && Array.isArray(error.error.errors)) {
              errorMessage = error.error.errors.join(', ');
            } else {
              errorMessage = 'Datos inválidos enviados al servidor';
            }
          } else {
            errorMessage = 'Datos inválidos enviados al servidor';
          }
          break;
        case 401:
          errorMessage = 'No autorizado. Por favor, inicie sesión nuevamente';
          break;
        case 403:
          errorMessage = 'No tiene permisos para realizar esta acción';
          break;
        case 404:
          errorMessage = 'Experiencia laboral no encontrada';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Por favor, intente nuevamente más tarde.';
          break;
        default:
          errorMessage = `Error del servidor: ${error.status} - ${error.message}`;
      }
    }

    this.setError(errorMessage);
    console.error(`[ExperienceCvService] Error in ${operation}:`, {
      type: 'SERVER',
      message: errorMessage,
      originalError: error,
      timestamp: Date.now()
    });

    return throwError(() => new Error(`Error del servidor: ${error.status} - ${errorMessage}`));
  }

  /**
   * Establece el estado de carga
   */
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  /**
   * Establece el mensaje de error
   */
  private setError(error: string | null): void {
    this.errorSubject.next(error);
  }
}
