import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, tap, map, finalize } from 'rxjs/operators';
import { environment } from '@env/environment';
import { Inscripcion } from '@shared/interfaces/inscripcion/inscripcion.interface';
import { AuthService } from '@core/services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class InscripcionService {
  private apiUrl = `${environment.apiUrl}`;
  private inscripcionesUsuario = new BehaviorSubject<Inscripcion[]>([]);

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.cargarInscripcionesUsuario();
  }

  private cargarInscripcionesUsuario(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      console.warn('[InscripcionService] No hay usuario autenticado');
      return;
    }

    console.log('[InscripcionService] Cargando inscripciones para usuario:', userId);

    this.http.get<Inscripcion[]>(`${this.apiUrl}/inscripciones/user/${userId}`)
      .pipe(
        tap(response => {
          console.log('[InscripcionService] Respuesta del servidor:', response);
        }),
        catchError(error => {
          console.error('[InscripcionService] Error al cargar inscripciones:', error);
          return of([]);
        }),
        finalize(() => {
          console.log('[InscripcionService] Finalizada la carga de inscripciones');
        })
      )
      .subscribe(inscripciones => {
        console.log('[InscripcionService] Inscripciones cargadas:', inscripciones);
        this.inscripcionesUsuario.next(inscripciones);
      });
  }

  inscribirseAConcurso(concursoId: string): Observable<Inscripcion> {
    if (!concursoId) {
      return throwError(() => new Error('El ID del concurso es requerido'));
    }

    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    console.log('[InscripcionService] Intentando inscribir usuario:', {
      userId,
      concursoId
    });

    return this.http.post<Inscripcion>(`${this.apiUrl}/inscripciones`, {
      userId,
      concursoId
    }).pipe(
      tap(response => {
        console.log('[InscripcionService] Inscripción exitosa:', response);
        this.cargarInscripcionesUsuario(); // Recargar la lista después de una nueva inscripción
      }),
      catchError(error => {
        console.error('[InscripcionService] Error al inscribirse:', error);
        return throwError(() => new Error('Error al inscribirse al concurso'));
      })
    );
  }

  desinscribirse(inscripcionId: string): Observable<void> {
    if (!inscripcionId) {
      return throwError(() => new Error('El ID de la inscripción es requerido'));
    }

    return this.http.delete<void>(`${this.apiUrl}/inscripciones/${inscripcionId}`).pipe(
      tap(() => {
        const inscripciones = this.inscripcionesUsuario.value;
        this.inscripcionesUsuario.next(
          inscripciones.filter(i => i.id !== inscripcionId)
        );
      }),
      catchError(error => {
        console.error('[InscripcionService] Error al cancelar la inscripción:', error);
        return throwError(() => new Error('Error al cancelar la inscripción'));
      })
    );
  }

  verificarInscripcion(concursoId: string): Observable<boolean> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      return of(false);
    }

    return this.inscripcionesUsuario.pipe(
      map(inscripciones => inscripciones.some(i => i.concursoId === concursoId))
    );
  }

  getInscripcionesUsuario(): Observable<Inscripcion[]> {
    return this.inscripcionesUsuario.asObservable();
  }

  estaInscripto(concursoId: string): Observable<boolean> {
    return this.inscripcionesUsuario.pipe(
      map(inscripciones => {
        if (!inscripciones || inscripciones.length === 0) return false;
        return inscripciones.some(i => {
          const inscripcionId = i.concursoId?.toString() || '';
          return inscripcionId === concursoId;
        });
      })
    );
  }

  getInscripcionesConcurso(concursoId: string): Observable<Inscripcion[]> {
    return this.http.get<Inscripcion[]>(`${this.apiUrl}/inscripciones/concurso/${concursoId}`);
  }

  cancelarInscripcion(inscripcionId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/inscripciones/${inscripcionId}`);
  }

  actualizarEstadoInscripcion(inscripcionId: string, estado: string, observaciones?: string): Observable<Inscripcion> {
    return this.http.patch<Inscripcion>(`${this.apiUrl}/inscripciones/${inscripcionId}/estado`, {
      estado,
      observaciones
    });
  }

  refreshInscripciones(): void {
    this.cargarInscripcionesUsuario();
  }
}
