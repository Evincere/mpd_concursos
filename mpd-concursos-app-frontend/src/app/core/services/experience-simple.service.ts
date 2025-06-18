import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { LoggingService } from './logging.service';
import { 
  ExperienceSimple, 
  ExperienceRequest, 
  ExperienceResponse, 
  ApiResponse, 
  LoadingState 
} from '@core/models/cv-simple.model';

@Injectable({
  providedIn: 'root'
})
export class ExperienceSimpleService {

  private readonly apiUrl = `${environment.apiUrl}/experiencias`;

  // Estado
  private experiencesSubject = new BehaviorSubject<ExperienceSimple[]>([]);
  private loadingSubject = new BehaviorSubject<LoadingState>({
    isLoading: false,
    error: undefined,
    lastLoaded: undefined
  });

  // Observables públicos
  public experiences$ = this.experiencesSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(
    private http: HttpClient,
    private loggingService: LoggingService
  ) {}

  /**
   * Obtener todas las experiencias de un usuario
   */
  getExperiencesByUserId(usuarioId: string): Observable<ApiResponse<ExperienceSimple[]>> {
    this.setLoading(true);

    return this.http.get<ExperienceResponse[]>(`${this.apiUrl}/usuario/${usuarioId}`)
      .pipe(
        map((responses: ExperienceResponse[]) => {
          const experiences = responses.map(this.mapResponseToModel);
          this.experiencesSubject.next(experiences);
          this.setLoading(false, undefined, new Date());
          
          return {
            exito: true,
            data: experiences,
            mensaje: 'Experiencias cargadas correctamente'
          } as ApiResponse<ExperienceSimple[]>;
        }),
        catchError((error: HttpErrorResponse) => {
          this.setLoading(false, this.getErrorMessage(error));
          return of({
            exito: false,
            error: this.getErrorMessage(error),
            mensaje: 'Error al cargar experiencias'
          } as ApiResponse<ExperienceSimple[]>);
        })
      );
  }

  /**
   * Crear nueva experiencia
   */
  createExperience(usuarioId: string, experience: Partial<ExperienceSimple>): Observable<ApiResponse<ExperienceSimple>> {
    this.setLoading(true);

    const request: ExperienceRequest = {
      position: experience.position || '',
      company: experience.company || '',
      startDate: experience.startDate?.toISOString().split('T')[0] || '',
      endDate: experience.endDate?.toISOString().split('T')[0],
      description: experience.description,
      comments: experience.comments
    };

    return this.http.post<ExperienceResponse>(`${this.apiUrl}/usuario/${usuarioId}`, request)
      .pipe(
        map((response: ExperienceResponse) => {
          const newExperience = this.mapResponseToModel(response);
          
          // Actualizar lista local
          const currentExperiences = this.experiencesSubject.value;
          this.experiencesSubject.next([...currentExperiences, newExperience]);
          
          this.setLoading(false, undefined, new Date());
          
          return {
            exito: true,
            data: newExperience,
            mensaje: 'Experiencia creada correctamente'
          } as ApiResponse<ExperienceSimple>;
        }),
        catchError((error: HttpErrorResponse) => {
          this.setLoading(false, this.getErrorMessage(error));
          return of({
            exito: false,
            error: this.getErrorMessage(error),
            mensaje: 'Error al crear experiencia'
          } as ApiResponse<ExperienceSimple>);
        })
      );
  }

  /**
   * Actualizar experiencia existente
   */
  updateExperience(experienceId: string, experience: Partial<ExperienceSimple>): Observable<ApiResponse<ExperienceSimple>> {
    this.setLoading(true);

    const request: ExperienceRequest = {
      position: experience.position || '',
      company: experience.company || '',
      startDate: experience.startDate?.toISOString().split('T')[0] || '',
      endDate: experience.endDate?.toISOString().split('T')[0],
      description: experience.description,
      comments: experience.comments
    };

    return this.http.put<ExperienceResponse>(`${this.apiUrl}/${experienceId}`, request)
      .pipe(
        map((response: ExperienceResponse) => {
          const updatedExperience = this.mapResponseToModel(response);
          
          // Actualizar lista local
          const currentExperiences = this.experiencesSubject.value;
          const updatedList = currentExperiences.map(exp => 
            exp.id === experienceId ? updatedExperience : exp
          );
          this.experiencesSubject.next(updatedList);
          
          this.setLoading(false, undefined, new Date());
          
          return {
            exito: true,
            data: updatedExperience,
            mensaje: 'Experiencia actualizada correctamente'
          } as ApiResponse<ExperienceSimple>;
        }),
        catchError((error: HttpErrorResponse) => {
          this.setLoading(false, this.getErrorMessage(error));
          return of({
            exito: false,
            error: this.getErrorMessage(error),
            mensaje: 'Error al actualizar experiencia'
          } as ApiResponse<ExperienceSimple>);
        })
      );
  }

  /**
   * Eliminar experiencia
   */
  deleteExperience(experienceId: string): Observable<ApiResponse<boolean>> {
    this.setLoading(true);

    return this.http.delete(`${this.apiUrl}/${experienceId}`)
      .pipe(
        map(() => {
          // Actualizar lista local
          const currentExperiences = this.experiencesSubject.value;
          const filteredList = currentExperiences.filter(exp => exp.id !== experienceId);
          this.experiencesSubject.next(filteredList);
          
          this.setLoading(false, undefined, new Date());
          
          return {
            exito: true,
            data: true,
            mensaje: 'Experiencia eliminada correctamente'
          } as ApiResponse<boolean>;
        }),
        catchError((error: HttpErrorResponse) => {
          this.setLoading(false, this.getErrorMessage(error));
          return of({
            exito: false,
            error: this.getErrorMessage(error),
            mensaje: 'Error al eliminar experiencia'
          } as ApiResponse<boolean>);
        })
      );
  }

  // ===== MÉTODOS PRIVADOS =====

  private mapResponseToModel(response: ExperienceResponse): ExperienceSimple {
    return {
      id: response.id,
      usuarioId: '', // Se asignará desde el contexto
      company: response.company,
      position: response.position,
      startDate: new Date(response.startDate),
      endDate: response.endDate ? new Date(response.endDate) : undefined,
      description: response.description,
      comments: response.comments
    };
  }

  private setLoading(isLoading: boolean, error?: string, lastLoaded?: Date): void {
    this.loadingSubject.next({
      isLoading,
      error,
      lastLoaded
    });
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.error?.mensaje) {
      return error.error.mensaje;
    }
    if (error.error?.message) {
      return error.error.message;
    }
    return `Error ${error.status}: ${error.message}`;
  }
}
