import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UserProfile, ProfilePhotoResponse } from '@core/models/perfil.model';
import type { ExperienciaData, HabilidadData } from '@core/models/perfil.model';

// Re-export interfaces for backward compatibility
export type { UserProfile, ExperienciaData as Experiencia, HabilidadData as Habilidad } from '@core/models/perfil.model';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(
    private http: HttpClient,
    private loggingService: LoggingService
  ) {}

  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`)
      .pipe(
        catchError(error => {
          // Solo loggear el error, no relanzarlo para evitar notificaciones automáticas
          this.loggingService.error('[ProfileService] Error loading profile', error);
          // Retornar un perfil vacío en lugar de lanzar el error
          const emptyProfile: UserProfile = {
            id: '',
            username: '',
            email: '',
            firstName: '',
            lastName: '',
            dni: '',
            telefono: '',
            direccion: '',
            fechaNacimiento: undefined,
            experiencias: [],
            educacion: []
          };
          return throwError(() => error); // Mantener el error para que el interceptor lo maneje
        })
      );
  }

  updateUserProfile(profile: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/me`, profile)
      .pipe(catchError(this.handleError));
  }

  uploadProfilePhoto(_file: File): Observable<ProfilePhotoResponse> {
    // TODO: Implement photo upload endpoint in backend
    // For now, return a mock response
    console.warn('Photo upload not implemented in backend yet');
    return throwError(() => new Error('Funcionalidad de subida de foto no implementada aún'));

    // const formData = new FormData();
    // formData.append('photo', file);
    // return this.http.post<ProfilePhotoResponse>(`${this.apiUrl}/profile/photo`, formData)
    //   .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ha ocurrido un error';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = error.error.message;
    } else {
      // Error del backend
      errorMessage = error.error?.message || 'Error del servidor';
    }

    return throwError(() => new Error(errorMessage));
  }
}
