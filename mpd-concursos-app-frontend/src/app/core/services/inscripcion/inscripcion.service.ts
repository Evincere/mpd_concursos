import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of, EMPTY } from 'rxjs';
import { catchError, tap, map, finalize } from 'rxjs/operators';
import { environment } from '@env/environment';
import { Inscripcion } from '@shared/interfaces/inscripcion/inscripcion.interface';
import { AuthService } from '@core/services/auth/auth.service';
import { TokenService } from '../auth/token.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Router } from '@angular/router';
import { PageRequest, PageResponse } from '@core/interfaces/page.interface';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';

interface InscripcionRequest {
  contestId: number;
  userId: string;
}

@Injectable({
  providedIn: 'root'
})
export class InscripcionService {
  private apiUrl = environment.apiUrl;
  private inscripcionesUsuario = new BehaviorSubject<Inscripcion[]>([]);
  private jwtHelperService: JwtHelperService = new JwtHelperService();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private tokenService: TokenService,
    private router: Router
  ) {
    this.cargarInscripcionesUsuario({ page: 0, size: 10 });
  }

  private cargarInscripcionesUsuario(pageRequest: PageRequest): Observable<PageResponse<Inscripcion>> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      console.warn('[InscripcionService] No hay usuario autenticado');
      return EMPTY;
    }

    console.log('[InscripcionService] Cargando inscripciones para usuario:', userId);
    const params = new HttpParams()
      .set('page', pageRequest.page.toString())
      .set('size', pageRequest.size.toString())
      .set('sort', pageRequest.sort || '');

    return this.http.get<PageResponse<Inscripcion>>(`${this.apiUrl}/inscripciones/usuario/${userId}`, { params })
      .pipe(
        tap(response => console.log('[InscripcionService] Inscripciones cargadas:', response)),
        catchError(error => this.handleError(error))
      );
  }

  private handleError(error: any): Observable<never> {
    console.error('[InscripcionService] Error:', error);
    if (error.status === 401) {
      console.log('[InscripcionService] Error de autenticación, redirigiendo a login');
      this.tokenService.signOut();
      this.router.navigate(['/login']);
    }
    return throwError(() => error);
  }

  public inscribirse(inscripcion: Inscripcion): Observable<Inscripcion> {
    if (!this.authService.isAuthenticated()) {
      console.warn('[InscripcionService] Usuario no autenticado');
      this.router.navigate(['/auth/login']);
      return EMPTY;
    }

    console.log('[InscripcionService] Iniciando inscripción:', inscripcion);
    return this.http.post<Inscripcion>(`${this.apiUrl}/inscripciones`, inscripcion)
      .pipe(
        tap(response => console.log('[InscripcionService] Inscripción exitosa:', response)),
        catchError(error => this.handleError(error))
      );
  }

  public inscribirseAConcurso(concursoId: string): Observable<Inscripcion> {
    if (!this.tokenService.getToken()) {
      console.warn('[InscripcionService] No hay token disponible');
      this.router.navigate(['/login']);
      return EMPTY;
    }

    if (!this.authService.isAuthenticated()) {
      console.warn('[InscripcionService] Token no válido');
      this.tokenService.signOut();
      this.router.navigate(['/login']);
      return EMPTY;
    }

    if (!concursoId) {
      console.warn('[InscripcionService] El ID del concurso es requerido');
      return throwError(() => new Error('El ID del concurso es requerido'));
    }

    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      console.warn('[InscripcionService] No se pudo obtener el ID del usuario');
      this.tokenService.signOut();
      this.router.navigate(['/login']);
      return EMPTY;
    }

    console.log('[InscripcionService] Preparando inscripción:', {
      userId,
      concursoId,
      tokenPresente: !!this.tokenService.getToken(),
      token: this.tokenService.getToken()
    });

    // Crear el objeto de inscripción en el formato que espera el backend
    const inscripcionRequest: InscripcionRequest = {
      contestId: parseInt(concursoId, 10),
      userId: userId
    };

    console.log('[InscripcionService] Request que será enviado:', {
      url: `${this.apiUrl}/inscripciones`,
      body: inscripcionRequest,
      headers: {
        'Authorization': `Bearer ${this.tokenService.getToken()}`,
        'Content-Type': 'application/json'
      }
    });

    return this.http.post<Inscripcion>(`${this.apiUrl}/inscripciones`, inscripcionRequest)
      .pipe(
        tap(response => {
          console.log('[InscripcionService] Inscripción exitosa:', response);
          this.refreshInscripciones();
        }),
        catchError(error => {
          console.error('[InscripcionService] Error en la inscripción:', {
            status: error.status,
            message: error.message,
            error: error
          });
          return this.handleError(error);
        })
      );
  }

  desinscribirse(inscripcionId: string): Observable<void> {
    if (!inscripcionId) {
      return throwError(() => new Error('El ID de la inscripción es requerido'));
    }

    const token = this.validateTokenAndGetToken();
    if (!token) {
      console.error('[InscripcionService] No hay token disponible');
      return throwError(() => new Error('No hay token de autenticación'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.delete<void>(`${this.apiUrl}/inscripciones/${inscripcionId}`, { headers }).pipe(
      tap(() => {
        const inscripciones = this.inscripcionesUsuario.value;
        this.inscripcionesUsuario.next(
          inscripciones.filter(i => i.id !== inscripcionId)
        );
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('[InscripcionService] Error al cancelar la inscripción:', error);
        let errorMessage = 'Error desconocido al cancelar la inscripción';
        
        switch (error.status) {
          case 401:
            errorMessage = 'No autorizado. Por favor, inicie sesión nuevamente.';
            break;
          case 403:
            errorMessage = 'No tiene permisos para acceder a este recurso.';
            break;
          case 404:
            errorMessage = 'No se encontraron inscripciones para este usuario.';
            break;
          case 500:
            errorMessage = 'Error interno del servidor. Intente nuevamente más tarde.';
            break;
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }

  public verificarInscripcion(concursoId: string): Observable<boolean> {
    console.log('[InscripcionService] Verificando inscripción para concurso:', concursoId);
    
    if (!this.tokenService.getToken()) {
      console.warn('[InscripcionService] No hay token disponible');
      return of(false);
    }

    if (!this.authService.isAuthenticated()) {
      console.warn('[InscripcionService] Token no válido');
      this.tokenService.signOut();
      this.router.navigate(['/login']);
      return of(false);
    }

    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      console.warn('[InscripcionService] No hay usuario autenticado');
      return of(false);
    }

    // Usar el endpoint específico para verificar el estado de inscripción
    return this.http.get<boolean>(`${this.apiUrl}/inscripciones/estado/${concursoId}/${userId}`).pipe(
      tap(inscripto => console.log('[InscripcionService] Estado de inscripción:', inscripto)),
      catchError(error => {
        console.error('[InscripcionService] Error al verificar inscripción:', error);
        return of(false);
      })
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
    const token = this.validateTokenAndGetToken();
    if (!token) {
      console.error('[InscripcionService] No hay token disponible');
      return throwError(() => new Error('No hay token de autenticación'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.get<Inscripcion[]>(`${this.apiUrl}/inscripciones/concurso/${concursoId}`, { headers });
  }

  cancelarInscripcion(inscripcionId: string): Observable<void> {
    const token = this.validateTokenAndGetToken();
    if (!token) {
      console.error('[InscripcionService] No hay token disponible');
      return throwError(() => new Error('No hay token de autenticación'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.delete<void>(`${this.apiUrl}/inscripciones/${inscripcionId}`, { headers });
  }

  actualizarEstadoInscripcion(inscripcionId: string, estado: string, observaciones?: string): Observable<Inscripcion> {
    const token = this.validateTokenAndGetToken();
    if (!token) {
      console.error('[InscripcionService] No hay token disponible');
      return throwError(() => new Error('No hay token de autenticación'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.patch<Inscripcion>(`${this.apiUrl}/inscripciones/${inscripcionId}/estado`, {
      estado,
      observaciones
    }, { headers });
  }

  refreshInscripciones(): void {
    this.cargarInscripcionesUsuario({ page: 0, size: 10 });
  }

  private validateTokenAndGetToken(): string | null {
    const token = this.tokenService.getToken();
    if (!token) {
      console.warn('[InscripcionService] No hay token disponible');
      return null;
    }
    return token;
  }
}
