/**
 * Servicio HTTP para Educación del CV
 * 
 * @description Servicio real para conectar con el backend /api/educacion
 * @author Augment Agent
 * @date 2025-06-22
 * @version 1.0.0
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, tap, catchError, retry } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { EducationEntry, EducationDto, EducationType, EducationStatus } from '@core/models/cv';

export interface EducationApiResponse {
  id: string;
  // Campos principales
  education_type?: string;  // Nuevo campo de la tabla real
  type?: string;            // Campo legacy para compatibilidad
  education_status?: string; // Nuevo campo de la tabla real
  status?: string;          // Campo legacy para compatibilidad
  program_title?: string;   // Nuevo campo de la tabla real
  title?: string;           // Campo legacy para compatibilidad
  institution_name?: string; // Nuevo campo de la tabla real
  institution?: string;     // Campo legacy para compatibilidad

  // Fechas - campos reales de la tabla
  start_date?: string;
  end_date?: string;
  issue_date?: string;
  graduation_date?: string;

  // Campos legacy para compatibilidad
  issueDate?: string;

  // Documentación
  supporting_document_url?: string; // Nuevo campo de la tabla real
  documentUrl?: string;             // Campo legacy para compatibilidad

  // Campos académicos
  duration_years?: number;    // Nuevo campo de la tabla real
  durationYears?: number;     // Campo legacy para compatibilidad
  final_grade?: number;       // Nuevo campo de la tabla real
  average?: number;           // Campo legacy para compatibilidad
  grade_scale?: string;
  academic_honors?: string;

  // Campos específicos por tipo
  thesis_title?: string;      // Nuevo campo de la tabla real
  thesis_topic?: string;      // Nuevo campo de la tabla real
  thesisTopic?: string;       // Campo legacy para compatibilidad
  thesis_advisor?: string;

  duration_hours?: number;    // Nuevo campo de la tabla real
  hourlyLoad?: number;        // Campo legacy para compatibilidad
  credit_hours?: number;
  hadFinalEvaluation?: boolean;

  // Actividades científicas
  activity_type?: string;     // Nuevo campo de la tabla real
  activityType?: string;      // Campo legacy para compatibilidad
  topic?: string;
  activity_role?: string;     // Nuevo campo de la tabla real
  activityRole?: string;      // Campo legacy para compatibilidad
  presentation_location?: string; // Nuevo campo de la tabla real
  expositionPlaceDate?: string;   // Campo legacy para compatibilidad
  presentation_date?: string;

  // Otros campos
  field_of_study?: string;
  certification_number?: string;
  issuing_authority?: string;
  expiration_date?: string;
  is_ongoing?: boolean;
  verification_status?: string;
  verification_notes?: string;
  comments?: string;

  // Campos de auditoría
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EducationCvService {
  private readonly apiUrl = `${environment.apiUrl}/educacion`;
  private educationSubject = new BehaviorSubject<EducationEntry[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Observables públicos
  public education$ = this.educationSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) { }

  /**
   * Obtiene toda la educación de un usuario
   */
  getAllByUserId(userId: string): Observable<EducationEntry[]> {
    this.setLoading(true);
    this.setError(null);

    return this.http.get<EducationApiResponse[]>(`${this.apiUrl}/usuario/${userId}`)
      .pipe(
        retry(2), // Reintentar hasta 2 veces en caso de error
        map(responses => responses.map(response => this.mapApiResponseToEducationEntry(response))),
        tap(education => {
          this.educationSubject.next(education);
          this.setLoading(false);
          console.log(`[EducationCvService] Loaded ${education.length} education records for user ${userId}`);
        }),
        catchError(error => this.handleError('getAllByUserId', error))
      );
  }

  /**
   * Obtiene un registro de educación específico por ID
   */
  getById(id: string): Observable<EducationEntry> {
    return this.http.get<EducationApiResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => this.mapApiResponseToEducationEntry(response)),
        catchError(error => this.handleError('getById', error))
      );
  }

  /**
   * Crea un nuevo registro de educación
   */
  create(userId: string, education: EducationDto): Observable<EducationEntry> {
    this.setLoading(true);
    this.setError(null);

    const payload = this.mapEducationDtoToApiRequest(education);

    return this.http.post<EducationApiResponse>(`${this.apiUrl}/usuario/${userId}`, payload)
      .pipe(
        map(response => this.mapApiResponseToEducationEntry(response)),
        tap(newEducation => {
          const current = this.educationSubject.value;
          this.educationSubject.next([...current, newEducation]);
          this.setLoading(false);
          console.log(`[EducationCvService] Created education:`, newEducation);
        }),
        catchError(error => this.handleError('create', error))
      );
  }

  /**
   * Actualiza un registro de educación existente
   */
  update(id: string, education: EducationDto): Observable<EducationEntry> {
    this.setLoading(true);
    this.setError(null);

    const payload = this.mapEducationDtoToApiRequest(education);

    return this.http.put<EducationApiResponse>(`${this.apiUrl}/${id}`, payload)
      .pipe(
        map(response => this.mapApiResponseToEducationEntry(response)),
        tap(updatedEducation => {
          const current = this.educationSubject.value;
          const index = current.findIndex(edu => edu.id === id);
          if (index !== -1) {
            current[index] = updatedEducation;
            this.educationSubject.next([...current]);
          }
          this.setLoading(false);
          console.log(`[EducationCvService] Updated education:`, updatedEducation);
        }),
        catchError(error => this.handleError('update', error))
      );
  }

  /**
   * Elimina un registro de educación
   */
  delete(id: string): Observable<boolean> {
    this.setLoading(true);
    this.setError(null);

    return this.http.delete(`${this.apiUrl}/${id}`)
      .pipe(
        map(() => {
          const current = this.educationSubject.value;
          const filtered = current.filter(edu => edu.id !== id);
          this.educationSubject.next(filtered);
          this.setLoading(false);
          console.log(`[EducationCvService] Deleted education with ID: ${id}`);
          return true;
        }),
        catchError(error => this.handleError('delete', error))
      );
  }

  /**
   * Sube un documento probatorio para un registro de educación
   */
  uploadDocument(id: string, file: File): Observable<EducationEntry> {
    this.setLoading(true);
    this.setError(null);

    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<EducationApiResponse>(`${this.apiUrl}/${id}/documento`, formData)
      .pipe(
        map(response => this.mapApiResponseToEducationEntry(response)),
        tap(updatedEducation => {
          const current = this.educationSubject.value;
          const index = current.findIndex(edu => edu.id === id);
          if (index !== -1) {
            current[index] = updatedEducation;
            this.educationSubject.next([...current]);
          }
          this.setLoading(false);
          console.log(`[EducationCvService] Uploaded document for education:`, updatedEducation);
        }),
        catchError(error => this.handleError('uploadDocument', error))
      );
  }

  /**
   * Refresca la lista de educación desde el servidor
   */
  refresh(userId: string): void {
    this.getAllByUserId(userId).subscribe();
  }

  /**
   * Limpia el estado del servicio
   */
  clearState(): void {
    this.educationSubject.next([]);
    this.setLoading(false);
    this.setError(null);
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Mapea la respuesta de la API a EducationEntry
   */
  private mapApiResponseToEducationEntry(response: EducationApiResponse): EducationEntry {
    console.log('[EducationCvService] Raw API response:', response);
    console.log('[EducationCvService] Available fields:', Object.keys(response));

    // Usar campos que realmente vienen del backend (con fallback para compatibilidad)
    const educationType = response.type;
    const educationStatus = response.status;
    const programTitle = response.title;
    const institutionName = response.institution;

    // Fechas - usar lo que realmente viene del backend
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    // Si vienen fechas específicas de la tabla nueva, usarlas
    if (response.start_date) {
      startDate = this.parseApiDate(response.start_date);
    }
    if (response.end_date) {
      endDate = this.parseApiDate(response.end_date);
    }

    // Si no vienen fechas específicas, usar issueDate como fallback
    const issueDate = response.issueDate;
    if (!startDate && !endDate && issueDate) {
      const parsedIssueDate = this.parseApiDate(issueDate);
      if (response.status === 'En Curso') {
        // Para estudios en curso, issueDate podría ser fecha de inicio
        startDate = parsedIssueDate;
      } else {
        // Para estudios completados, issueDate es fecha de finalización
        endDate = parsedIssueDate;
        // Estimar fecha de inicio si hay duración
        if (response.durationYears && response.durationYears > 0) {
          startDate = new Date(parsedIssueDate);
          startDate.setFullYear(startDate.getFullYear() - response.durationYears);
        }
      }
    }

    // Determinar si está en curso
    const isOngoing = response.status === 'En Curso' || response.status === 'IN_PROGRESS';

    console.log('[EducationCvService] Mapped dates:', { startDate, endDate, issueDate, isOngoing });

    const mappedEntry = {
      id: response.id,
      type: this.mapStringToEducationType(educationType || 'Curso de Capacitación') as any,
      status: this.mapStringToEducationStatus(educationStatus || 'En Curso'),
      title: programTitle || 'Sin título',
      institution: institutionName || 'Sin institución',
      startDate: startDate,
      endDate: endDate,
      isOngoing: isOngoing,
      document: response.documentUrl ? {
        id: response.id + '_doc',
        fileName: response.documentUrl.split('/').pop() || 'documento.pdf',
        originalFileName: response.documentUrl.split('/').pop() || 'documento.pdf',
        uploadDate: new Date(),
        fileSize: 0, // No disponible en API actual
        mimeType: 'application/pdf' // Valor por defecto
      } : undefined,
      // Campos específicos según el tipo
      durationYears: response.durationYears,
      average: response.average,
      thesisTopic: response.thesisTopic,
      hourlyLoad: response.hourlyLoad,
      activityType: (response.activityType || 'CONFERENCE') as any,
      topic: response.topic || '',
      comments: response.comments
    } as unknown as EducationEntry;

    console.log('[EducationCvService] Final mapped entry:', mappedEntry);
    return mappedEntry;
  }

  /**
   * Mapea EducationDto a formato de API request
   */
  private mapEducationDtoToApiRequest(dto: EducationDto): any {
    console.log('[EducationCvService] Mapping DTO to API request:', dto);

    // Convertir enums a strings que el backend entiende
    const typeString = this.mapEducationTypeToString(dto.type);
    const statusString = this.mapEducationStatusToString(dto.status);

    // El backend solo maneja issueDate (fecha de emisión/finalización)
    // Para estudios en curso: usar startDate como issueDate (fecha de inicio)
    // Para estudios completados: usar endDate como issueDate (fecha de finalización)
    let issueDate: string | null = null;

    if (statusString === 'En Curso') {
      // Para estudios en curso, usar la fecha de inicio
      issueDate = dto.startDate ? this.formatDateForBackend(dto.startDate) : null;
    } else {
      // Para estudios completados, usar la fecha de finalización
      issueDate = dto.endDate ? this.formatDateForBackend(dto.endDate) : null;
    }

    const payload = {
      type: typeString,
      status: statusString,
      title: dto.title,
      institution: dto.institution,
      issueDate: issueDate, // Backend espera issueDate, no startDate/endDate
      durationYears: dto.durationYears,
      average: dto.average,
      thesisTopic: dto.thesisTopic,
      hourlyLoad: dto.hourlyLoad,
      activityType: dto.activityType,
      topic: dto.topic,
      comments: dto.comments
    };

    console.log('[EducationCvService] API payload:', payload);
    return payload;
  }

  /**
   * Mapea EducationType enum a string para la API
   */
  private mapEducationTypeToString(type: EducationType): string {
    const typeMap: { [key in EducationType]: string } = {
      [EducationType.SECONDARY]: 'Educación Secundaria',
      [EducationType.TECHNICAL]: 'Título Terciario',
      [EducationType.UNIVERSITY_DEGREE]: 'Título Universitario',
      [EducationType.POSTGRADUATE_SPECIALIZATION]: 'Especialización',
      [EducationType.MASTER_DEGREE]: 'Maestría',
      [EducationType.DOCTORATE]: 'Doctorado',
      [EducationType.DIPLOMA]: 'Diplomatura',
      [EducationType.CERTIFICATION]: 'Curso de Capacitación',
      [EducationType.SCIENTIFIC_ACTIVITY]: 'Actividad Científica'
    };

    return typeMap[type] || 'Curso de Capacitación';
  }

  /**
   * Mapea EducationStatus enum a string para la API
   */
  private mapEducationStatusToString(status: EducationStatus): string {
    const statusMap: { [key in EducationStatus]: string } = {
      [EducationStatus.IN_PROGRESS]: 'En Curso',
      [EducationStatus.COMPLETED]: 'Completado',
      [EducationStatus.SUSPENDED]: 'Suspendido',
      [EducationStatus.ABANDONED]: 'Abandonado'
    };

    return statusMap[status] || 'En Curso';
  }

  /**
   * Mapea string de la API a EducationType
   */
  private mapStringToEducationType(type: string): EducationType {
    const typeMap: { [key: string]: EducationType } = {
      'Educación Secundaria': EducationType.SECONDARY,
      'Título Terciario': EducationType.TECHNICAL,
      'Título Universitario': EducationType.UNIVERSITY_DEGREE,
      'Especialización': EducationType.POSTGRADUATE_SPECIALIZATION,
      'Maestría': EducationType.MASTER_DEGREE,
      'Doctorado': EducationType.DOCTORATE,
      'Diplomatura': EducationType.DIPLOMA,
      'Curso de Capacitación': EducationType.CERTIFICATION,
      'Actividad Científica': EducationType.SCIENTIFIC_ACTIVITY
    };

    return typeMap[type] || EducationType.CERTIFICATION;
  }

  /**
   * Mapea string de la API a EducationStatus
   */
  private mapStringToEducationStatus(status: string): EducationStatus {
    const statusMap: { [key: string]: EducationStatus } = {
      'En Curso': EducationStatus.IN_PROGRESS,
      'Completado': EducationStatus.COMPLETED,
      'Suspendido': EducationStatus.SUSPENDED,
      'Abandonado': EducationStatus.ABANDONED
    };

    return statusMap[status] || EducationStatus.IN_PROGRESS;
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
   * Formatea fecha para el backend (YYYY-MM-DD) evitando problemas de zona horaria
   */
  private formatDateForBackend(dateString: string): string {
    try {
      // Si ya está en formato YYYY-MM-DD, devolverlo tal como está
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }

      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('[EducationCvService] Invalid date string:', dateString);
        return dateString;
      }

      // Usar getFullYear, getMonth, getDate para evitar problemas de zona horaria
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('[EducationCvService] Error formatting date:', error);
      return dateString;
    }
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
          errorMessage = 'Datos inválidos enviados al servidor';
          break;
        case 401:
          errorMessage = 'No autorizado. Por favor, inicie sesión nuevamente';
          break;
        case 403:
          errorMessage = 'No tiene permisos para realizar esta acción';
          break;
        case 404:
          errorMessage = 'Registro de educación no encontrado';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        default:
          errorMessage = `Error del servidor: ${error.status} - ${error.message}`;
      }
    }

    this.setError(errorMessage);
    console.error(`[EducationCvService] Error in ${operation}:`, error);

    return throwError(() => new Error(errorMessage));
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
