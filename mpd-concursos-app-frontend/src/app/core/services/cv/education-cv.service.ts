/**
 * Education CV Service - Real service for CV education management
 * 
 * This service uses the new standardized models and connects to the backend
 * hexagonal architecture. It replaces mock services with real HTTP operations.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, catchError, tap, finalize, retry } from 'rxjs/operators';

import { 
  Education, 
  EducationRequest, 
  EducationResponse,
  EducationType,
  EducationStatus,
  CvOperationResult 
} from '../../models/cv';
import { CvMappers } from '../../mappers';
import { FeatureToggleService } from '../feature-toggle.service';
import { environment } from '../../../../environments/environment';

export interface EducationLoadingState {
  isLoading: boolean;
  error: string | null;
  lastLoaded: Date | null;
}

export interface EducationUploadProgress {
  type: 'progress' | 'complete';
  progress?: number;
  education?: Education;
}

@Injectable({
  providedIn: 'root'
})
export class EducationCvService {
  
  private readonly http = inject(HttpClient);
  private readonly featureToggle = inject(FeatureToggleService);
  
  private readonly apiUrl = `${environment.apiUrl}/educacion`;
  
  // State management
  private educationSubject = new BehaviorSubject<Education[]>([]);
  private loadingSubject = new BehaviorSubject<EducationLoadingState>({
    isLoading: false,
    error: null,
    lastLoaded: null
  });

  // Public observables
  public education$ = this.educationSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor() {
    console.log('[EducationCvService] Initializing with feature flags:', 
      this.featureToggle.getCvMigrationStrategy());
  }

  /**
   * Get all education records for a user
   */
  getAllByUserId(userId: string): Observable<Education[]> {
    this.setLoading(true);
    
    console.log(`[EducationCvService] Fetching education for user: ${userId}`);
    
    return this.http.get<EducationResponse[]>(`${this.apiUrl}/usuario/${userId}`)
      .pipe(
        retry(2), // Retry failed requests twice
        map(responses => {
          const education = responses.map(response => 
            CvMappers.fromEducationResponse(response)
          );
          
          this.educationSubject.next(education);
          this.setLoading(false, null, new Date());
          
          console.log(`[EducationCvService] Successfully loaded ${education.length} education records`);
          return education;
        }),
        catchError(error => this.handleError('getAllByUserId', error))
      );
  }

  /**
   * Get a specific education record by ID
   */
  getById(id: string): Observable<Education> {
    console.log(`[EducationCvService] Fetching education: ${id}`);
    
    return this.http.get<EducationResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => CvMappers.fromEducationResponse(response)),
        catchError(error => this.handleError('getById', error))
      );
  }

  /**
   * Create a new education record
   */
  create(userId: string, education: Education): Observable<CvOperationResult<Education>> {
    this.setLoading(true);
    
    const request = CvMappers.toEducationRequest(education);
    console.log(`[EducationCvService] Creating education for user: ${userId}`, request);
    
    return this.http.post<EducationResponse>(`${this.apiUrl}/usuario/${userId}`, request)
      .pipe(
        map(response => {
          const createdEducation = CvMappers.fromEducationResponse(response);
          
          // Update local state
          const currentEducation = this.educationSubject.value;
          this.educationSubject.next([...currentEducation, createdEducation]);
          
          this.setLoading(false, null, new Date());
          
          console.log(`[EducationCvService] Education created successfully:`, createdEducation);
          
          return {
            success: true,
            data: createdEducation,
            message: 'Registro de educación creado exitosamente'
          };
        }),
        catchError(error => this.handleError('create', error))
      );
  }

  /**
   * Update an existing education record
   */
  update(id: string, education: Education): Observable<CvOperationResult<Education>> {
    this.setLoading(true);
    
    const request = CvMappers.toEducationRequest(education);
    console.log(`[EducationCvService] Updating education: ${id}`, request);
    
    return this.http.put<EducationResponse>(`${this.apiUrl}/${id}`, request)
      .pipe(
        map(response => {
          const updatedEducation = CvMappers.fromEducationResponse(response);
          
          // Update local state
          const currentEducation = this.educationSubject.value;
          const updatedEducationList = currentEducation.map(edu => 
            edu.id === id ? updatedEducation : edu
          );
          this.educationSubject.next(updatedEducationList);
          
          this.setLoading(false, null, new Date());
          
          console.log(`[EducationCvService] Education updated successfully:`, updatedEducation);
          
          return {
            success: true,
            data: updatedEducation,
            message: 'Registro de educación actualizado exitosamente'
          };
        }),
        catchError(error => this.handleError('update', error))
      );
  }

  /**
   * Delete an education record
   */
  delete(id: string): Observable<CvOperationResult<void>> {
    this.setLoading(true);
    
    console.log(`[EducationCvService] Deleting education: ${id}`);
    
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        map(() => {
          // Update local state
          const currentEducation = this.educationSubject.value;
          const filteredEducation = currentEducation.filter(edu => edu.id !== id);
          this.educationSubject.next(filteredEducation);
          
          this.setLoading(false, null, new Date());
          
          console.log(`[EducationCvService] Education deleted successfully: ${id}`);
          
          return {
            success: true,
            message: 'Registro de educación eliminado exitosamente'
          };
        }),
        catchError(error => this.handleError('delete', error))
      );
  }

  /**
   * Upload document for an education record
   */
  uploadDocument(educationId: string, file: File): Observable<EducationUploadProgress> {
    console.log(`[EducationCvService] Uploading document for education: ${educationId}`);
    
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<EducationResponse>(
      `${this.apiUrl}/${educationId}/documento`, 
      formData,
      {
        reportProgress: true,
        observe: 'events'
      }
    ).pipe(
      map(event => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            const total = event.total;
            if (total !== undefined && total > 0) {
              const progress = Math.round(100 * event.loaded / total);
              console.log(`[EducationCvService] Upload progress: ${progress}%`);
              return { type: 'progress' as const, progress };
            }
            return { type: 'progress' as const, progress: 0 };
            
          case HttpEventType.Response:
            const updatedEducation = CvMappers.fromEducationResponse(event.body!);
            
            // Update local state
            const currentEducation = this.educationSubject.value;
            const updatedEducationList = currentEducation.map(edu => 
              edu.id === educationId ? updatedEducation : edu
            );
            this.educationSubject.next(updatedEducationList);
            
            console.log(`[EducationCvService] Document uploaded successfully`);
            return { type: 'complete' as const, education: updatedEducation };
            
          default:
            return { type: 'progress' as const, progress: 0 };
        }
      }),
      catchError(error => {
        console.error(`[EducationCvService] Document upload failed:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get education records by type
   */
  getByType(userId: string, type: EducationType): Observable<Education[]> {
    return this.getAllByUserId(userId).pipe(
      map(education => education.filter(edu => edu.type === type))
    );
  }

  /**
   * Get education records by status
   */
  getByStatus(userId: string, status: EducationStatus): Observable<Education[]> {
    return this.getAllByUserId(userId).pipe(
      map(education => education.filter(edu => edu.status === status))
    );
  }

  /**
   * Clear local state
   */
  clearState(): void {
    this.educationSubject.next([]);
    this.setLoading(false, null, null);
    console.log('[EducationCvService] State cleared');
  }

  /**
   * Get current education from state
   */
  getCurrentEducation(): Education[] {
    return this.educationSubject.value;
  }

  /**
   * Set loading state
   */
  private setLoading(isLoading: boolean, error: string | null = null, lastLoaded: Date | null = null): void {
    this.loadingSubject.next({
      isLoading,
      error,
      lastLoaded: lastLoaded || this.loadingSubject.value.lastLoaded
    });
  }

  /**
   * Handle HTTP errors
   */
  private handleError<T>(operation: string, error: HttpErrorResponse): Observable<T> {
    console.error(`[EducationCvService] ${operation} failed:`, error);
    
    let errorMessage = 'Ha ocurrido un error inesperado';
    
    if (error.status === 0) {
      errorMessage = 'No se pudo conectar con el servidor';
    } else if (error.status === 401) {
      errorMessage = 'No tienes autorización para realizar esta acción';
    } else if (error.status === 403) {
      errorMessage = 'Acceso denegado';
    } else if (error.status === 404) {
      errorMessage = 'El recurso solicitado no fue encontrado';
    } else if (error.status === 422) {
      errorMessage = 'Los datos enviados no son válidos';
    } else if (error.status >= 500) {
      errorMessage = 'Error interno del servidor';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }
    
    this.setLoading(false, errorMessage);
    
    // For CvOperationResult operations, return error result
    if (operation === 'create' || operation === 'update' || operation === 'delete') {
      return of({
        success: false,
        error: errorMessage,
        message: errorMessage
      } as any);
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
