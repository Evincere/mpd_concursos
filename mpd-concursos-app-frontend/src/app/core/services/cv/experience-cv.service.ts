/**
 * Experience CV Service - Real service for CV experience management
 * 
 * This service uses the new standardized models and connects to the backend
 * hexagonal architecture. It replaces mock services with real HTTP operations.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, catchError, tap, finalize, retry } from 'rxjs/operators';

import { 
  Experience, 
  ExperienceRequest, 
  ExperienceResponse,
  CvOperationResult 
} from '../../models/cv';
import { CvMappers } from '../../mappers';
import { FeatureToggleService } from '../feature-toggle.service';
import { environment } from '../../../../environments/environment';

export interface ExperienceLoadingState {
  isLoading: boolean;
  error: string | null;
  lastLoaded: Date | null;
}

export interface ExperienceUploadProgress {
  type: 'progress' | 'complete';
  progress?: number;
  experience?: Experience;
}

@Injectable({
  providedIn: 'root'
})
export class ExperienceCvService {
  
  private readonly http = inject(HttpClient);
  private readonly featureToggle = inject(FeatureToggleService);
  
  private readonly apiUrl = `${environment.apiUrl}/experiencias`;
  
  // State management
  private experiencesSubject = new BehaviorSubject<Experience[]>([]);
  private loadingSubject = new BehaviorSubject<ExperienceLoadingState>({
    isLoading: false,
    error: null,
    lastLoaded: null
  });

  // Public observables
  public experiences$ = this.experiencesSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor() {
    console.log('[ExperienceCvService] Initializing with feature flags:', 
      this.featureToggle.getCvMigrationStrategy());
  }

  /**
   * Get all experiences for a user
   */
  getAllByUserId(userId: string): Observable<Experience[]> {
    this.setLoading(true);
    
    console.log(`[ExperienceCvService] Fetching experiences for user: ${userId}`);
    
    return this.http.get<ExperienceResponse[]>(`${this.apiUrl}/usuario/${userId}`)
      .pipe(
        retry(2), // Retry failed requests twice
        map(responses => {
          const experiences = responses.map(response => 
            CvMappers.fromExperienceResponse(response)
          );
          
          this.experiencesSubject.next(experiences);
          this.setLoading(false, null, new Date());
          
          console.log(`[ExperienceCvService] Successfully loaded ${experiences.length} experiences`);
          return experiences;
        }),
        catchError(error => this.handleError('getAllByUserId', error))
      );
  }

  /**
   * Get a specific experience by ID
   */
  getById(id: string): Observable<Experience> {
    console.log(`[ExperienceCvService] Fetching experience: ${id}`);
    
    return this.http.get<ExperienceResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => CvMappers.fromExperienceResponse(response)),
        catchError(error => this.handleError('getById', error))
      );
  }

  /**
   * Create a new experience
   */
  create(userId: string, experience: Experience): Observable<CvOperationResult<Experience>> {
    this.setLoading(true);
    
    const request = CvMappers.toExperienceRequest(experience);
    console.log(`[ExperienceCvService] Creating experience for user: ${userId}`, request);
    
    return this.http.post<ExperienceResponse>(`${this.apiUrl}/usuario/${userId}`, request)
      .pipe(
        map(response => {
          const createdExperience = CvMappers.fromExperienceResponse(response);
          
          // Update local state
          const currentExperiences = this.experiencesSubject.value;
          this.experiencesSubject.next([...currentExperiences, createdExperience]);
          
          this.setLoading(false, null, new Date());
          
          console.log(`[ExperienceCvService] Experience created successfully:`, createdExperience);
          
          return {
            success: true,
            data: createdExperience,
            message: 'Experiencia creada exitosamente'
          };
        }),
        catchError(error => this.handleError('create', error))
      );
  }

  /**
   * Update an existing experience
   */
  update(id: string, experience: Experience): Observable<CvOperationResult<Experience>> {
    this.setLoading(true);
    
    const request = CvMappers.toExperienceRequest(experience);
    console.log(`[ExperienceCvService] Updating experience: ${id}`, request);
    
    return this.http.put<ExperienceResponse>(`${this.apiUrl}/${id}`, request)
      .pipe(
        map(response => {
          const updatedExperience = CvMappers.fromExperienceResponse(response);
          
          // Update local state
          const currentExperiences = this.experiencesSubject.value;
          const updatedExperiences = currentExperiences.map(exp => 
            exp.id === id ? updatedExperience : exp
          );
          this.experiencesSubject.next(updatedExperiences);
          
          this.setLoading(false, null, new Date());
          
          console.log(`[ExperienceCvService] Experience updated successfully:`, updatedExperience);
          
          return {
            success: true,
            data: updatedExperience,
            message: 'Experiencia actualizada exitosamente'
          };
        }),
        catchError(error => this.handleError('update', error))
      );
  }

  /**
   * Delete an experience
   */
  delete(id: string): Observable<CvOperationResult<void>> {
    this.setLoading(true);
    
    console.log(`[ExperienceCvService] Deleting experience: ${id}`);
    
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        map(() => {
          // Update local state
          const currentExperiences = this.experiencesSubject.value;
          const filteredExperiences = currentExperiences.filter(exp => exp.id !== id);
          this.experiencesSubject.next(filteredExperiences);
          
          this.setLoading(false, null, new Date());
          
          console.log(`[ExperienceCvService] Experience deleted successfully: ${id}`);
          
          return {
            success: true,
            message: 'Experiencia eliminada exitosamente'
          };
        }),
        catchError(error => this.handleError('delete', error))
      );
  }

  /**
   * Upload document for an experience
   */
  uploadDocument(experienceId: string, file: File): Observable<ExperienceUploadProgress> {
    console.log(`[ExperienceCvService] Uploading document for experience: ${experienceId}`);
    
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<ExperienceResponse>(
      `${this.apiUrl}/${experienceId}/documento`, 
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
              console.log(`[ExperienceCvService] Upload progress: ${progress}%`);
              return { type: 'progress' as const, progress };
            }
            return { type: 'progress' as const, progress: 0 };
            
          case HttpEventType.Response:
            const updatedExperience = CvMappers.fromExperienceResponse(event.body!);
            
            // Update local state
            const currentExperiences = this.experiencesSubject.value;
            const updatedExperiences = currentExperiences.map(exp => 
              exp.id === experienceId ? updatedExperience : exp
            );
            this.experiencesSubject.next(updatedExperiences);
            
            console.log(`[ExperienceCvService] Document uploaded successfully`);
            return { type: 'complete' as const, experience: updatedExperience };
            
          default:
            return { type: 'progress' as const, progress: 0 };
        }
      }),
      catchError(error => {
        console.error(`[ExperienceCvService] Document upload failed:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Clear local state
   */
  clearState(): void {
    this.experiencesSubject.next([]);
    this.setLoading(false, null, null);
    console.log('[ExperienceCvService] State cleared');
  }

  /**
   * Get current experiences from state
   */
  getCurrentExperiences(): Experience[] {
    return this.experiencesSubject.value;
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
    console.error(`[ExperienceCvService] ${operation} failed:`, error);
    
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
