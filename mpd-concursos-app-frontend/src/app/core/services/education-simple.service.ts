import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { LoggingService } from './logging.service';
import {
  EducationSimple,
  EducationRequest,
  EducationResponse,
  ApiResponse,
  LoadingState,
  EDUCATION_TYPES,
  EDUCATION_STATUSES
} from '@core/models/cv-simple.model';

@Injectable({
  providedIn: 'root'
})
export class EducationSimpleService {

  private readonly apiUrl = `${environment.apiUrl}/educacion`;

  // Estado
  private educationSubject = new BehaviorSubject<EducationSimple[]>([]);
  private loadingSubject = new BehaviorSubject<LoadingState>({
    isLoading: false,
    error: undefined,
    lastLoaded: undefined
  });

  // Observables públicos
  public education$ = this.educationSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(
    private http: HttpClient,
    private loggingService: LoggingService
  ) {}

  /**
   * Obtener toda la educación de un usuario
   */
  getEducationByUserId(usuarioId: string): Observable<ApiResponse<EducationSimple[]>> {
    this.setLoading(true);

    return this.http.get<EducationResponse[]>(`${this.apiUrl}/usuario/${usuarioId}`)
      .pipe(
        map((responses: EducationResponse[]) => {
          const education = responses.map(this.mapResponseToModel);
          this.educationSubject.next(education);
          this.setLoading(false, undefined, new Date());
          
          return {
            exito: true,
            data: education,
            mensaje: 'Educación cargada correctamente'
          } as ApiResponse<EducationSimple[]>;
        }),
        catchError((error: HttpErrorResponse) => {
          this.setLoading(false, this.getErrorMessage(error));
          return of({
            exito: false,
            error: this.getErrorMessage(error),
            mensaje: 'Error al cargar educación'
          } as ApiResponse<EducationSimple[]>);
        })
      );
  }

  /**
   * Crear nueva educación
   */
  createEducation(usuarioId: string, education: Partial<EducationSimple>): Observable<ApiResponse<EducationSimple>> {
    this.setLoading(true);

    const request: EducationRequest = {
      title: education.title || '',
      institution: education.institution || '',
      type: education.type || 'Título Universitario',
      issueDate: education.issueDate?.toISOString().split('T')[0],
      status: education.status || 'En Curso',
      comments: education.comments
    };

    return this.http.post<EducationResponse>(`${this.apiUrl}/usuario/${usuarioId}`, request)
      .pipe(
        map((response: EducationResponse) => {
          const newEducation = this.mapResponseToModel(response);
          
          // Actualizar lista local
          const currentEducation = this.educationSubject.value;
          this.educationSubject.next([...currentEducation, newEducation]);
          
          this.setLoading(false, undefined, new Date());
          
          return {
            exito: true,
            data: newEducation,
            mensaje: 'Educación creada correctamente'
          } as ApiResponse<EducationSimple>;
        }),
        catchError((error: HttpErrorResponse) => {
          this.setLoading(false, this.getErrorMessage(error));
          return of({
            exito: false,
            error: this.getErrorMessage(error),
            mensaje: 'Error al crear educación'
          } as ApiResponse<EducationSimple>);
        })
      );
  }

  /**
   * Actualizar educación existente
   */
  updateEducation(educationId: string, education: Partial<EducationSimple>): Observable<ApiResponse<EducationSimple>> {
    this.setLoading(true);

    const request: EducationRequest = {
      title: education.title || '',
      institution: education.institution || '',
      type: education.type || 'Título Universitario',
      issueDate: education.issueDate?.toISOString().split('T')[0],
      status: education.status || 'En Curso',
      comments: education.comments
    };

    return this.http.put<EducationResponse>(`${this.apiUrl}/${educationId}`, request)
      .pipe(
        map((response: EducationResponse) => {
          const updatedEducation = this.mapResponseToModel(response);
          
          // Actualizar lista local
          const currentEducation = this.educationSubject.value;
          const updatedList = currentEducation.map(edu => 
            edu.id === educationId ? updatedEducation : edu
          );
          this.educationSubject.next(updatedList);
          
          this.setLoading(false, undefined, new Date());
          
          return {
            exito: true,
            data: updatedEducation,
            mensaje: 'Educación actualizada correctamente'
          } as ApiResponse<EducationSimple>;
        }),
        catchError((error: HttpErrorResponse) => {
          this.setLoading(false, this.getErrorMessage(error));
          return of({
            exito: false,
            error: this.getErrorMessage(error),
            mensaje: 'Error al actualizar educación'
          } as ApiResponse<EducationSimple>);
        })
      );
  }

  /**
   * Eliminar educación
   */
  deleteEducation(educationId: string): Observable<ApiResponse<boolean>> {
    this.setLoading(true);

    return this.http.delete(`${this.apiUrl}/${educationId}`)
      .pipe(
        map(() => {
          // Actualizar lista local
          const currentEducation = this.educationSubject.value;
          const filteredList = currentEducation.filter(edu => edu.id !== educationId);
          this.educationSubject.next(filteredList);
          
          this.setLoading(false, undefined, new Date());
          
          return {
            exito: true,
            data: true,
            mensaje: 'Educación eliminada correctamente'
          } as ApiResponse<boolean>;
        }),
        catchError((error: HttpErrorResponse) => {
          this.setLoading(false, this.getErrorMessage(error));
          return of({
            exito: false,
            error: this.getErrorMessage(error),
            mensaje: 'Error al eliminar educación'
          } as ApiResponse<boolean>);
        })
      );
  }

  // ===== MÉTODOS PRIVADOS =====

  private mapResponseToModel(response: EducationResponse): EducationSimple {
    return {
      id: response.id,
      usuarioId: '', // Se asignará desde el contexto
      title: response.title,
      institution: response.institution,
      type: response.type,
      issueDate: response.issueDate ? new Date(response.issueDate) : undefined,
      status: response.status,
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
