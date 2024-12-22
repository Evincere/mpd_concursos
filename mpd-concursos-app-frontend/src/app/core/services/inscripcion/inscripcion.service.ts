import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, tap, map, finalize } from 'rxjs/operators';
import { environment } from '@env/environment';
import { Inscripcion } from '@shared/interfaces/inscripcion/inscripcion.interface';
import { AuthService } from '@core/services/auth/auth.service';
import { TokenService } from '../auth/token.service';

@Injectable({
  providedIn: 'root'
})
export class InscripcionService {
  private apiUrl = environment.apiUrl;
  private inscripcionesUsuario = new BehaviorSubject<Inscripcion[]>([]);

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private tokenService: TokenService // Inyectar el servicio de token
  ) {
    this.cargarInscripcionesUsuario();
  }

  private cargarInscripcionesUsuario(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      console.warn('[InscripcionService] No hay usuario autenticado');
      this.inscripcionesUsuario.next([]);
      return;
    }

    console.log('[InscripcionService] Cargando inscripciones para usuario:', userId);
    
    // Verificar token antes de hacer la petición
    const token = this.tokenService.getToken();
    const tokenInfo = token ? this.tokenService.decodeToken(token) : null;
    
    console.log('[InscripcionService] Detalles del token:', {
      tokenPresent: !!token,
      tokenDecoded: tokenInfo ? {
        sub: tokenInfo.sub,
        exp: tokenInfo.exp ? new Date(tokenInfo.exp * 1000).toISOString() : 'N/A',
        roles: tokenInfo.roles,
        userId: tokenInfo.userId || tokenInfo.sub
      } : 'No decodificado'
    });

    if (!token) {
      console.error('[InscripcionService] No hay token disponible');
      return;
    }

    if (!this.tokenService.validateToken(token)) {
      console.error('[InscripcionService] Token inválido o expirado');
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    this.http.get<Inscripcion[]>(`${this.apiUrl}/inscripciones/user/${userId}`, { headers }).pipe(
      tap(response => {
        console.log('[InscripcionService] Respuesta exitosa:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('[InscripcionService] Error al obtener inscripciones:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url,
          headers: Object.fromEntries(error.headers.keys().map(key => [key, error.headers.get(key)])),
          body: error.error
        });

        let errorMessage = 'Error desconocido al obtener inscripciones';
        
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

        if (error.status === 401) {
          console.warn('[InscripcionService] Error de autenticación al cargar inscripciones', {
            errorBody: error.error,
            errorUrl: error.url
          });
          this.inscripcionesUsuario.next([]);
          this.authService.logout();
        } else if (error.status === 403) {
          console.warn('[InscripcionService] Sin permisos para cargar inscripciones');
          this.inscripcionesUsuario.next([]);
        } else {
          console.warn('[InscripcionService] Error desconocido al cargar inscripciones');
          this.inscripcionesUsuario.next([]);
        }
        return of([]);
      }),
      finalize(() => {
        console.log('[InscripcionService] Finalizada la carga de inscripciones');
      })
    ).subscribe(inscripciones => {
      console.log('[InscripcionService] Actualizando inscripciones:', inscripciones);
      this.inscripcionesUsuario.next(inscripciones || []);
    });
  }

  inscribirseAConcurso(concursoId: string): Observable<Inscripcion> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      console.warn('[InscripcionService] No hay usuario autenticado');
      return throwError(() => new Error('Usuario no autenticado'));
    }

    console.log('[InscripcionService] Inscribiendo usuario a concurso:', {
      userId,
      concursoId
    });

    // Verificar token antes de hacer la petición
    const token = this.tokenService.getToken();
    const tokenInfo = token ? this.tokenService.decodeToken(token) : null;
    
    console.log('[InscripcionService] Detalles del token:', {
      tokenPresent: !!token,
      tokenDecoded: tokenInfo ? {
        sub: tokenInfo.sub,
        exp: tokenInfo.exp ? new Date(tokenInfo.exp * 1000).toISOString() : 'N/A',
        roles: tokenInfo.roles,
        userId: tokenInfo.userId || tokenInfo.sub
      } : 'No decodificado'
    });

    if (!token) {
      console.error('[InscripcionService] No hay token disponible');
      return throwError(() => new Error('No hay token de autenticación'));
    }

    if (!this.tokenService.validateToken(token)) {
      console.error('[InscripcionService] Token inválido o expirado');
      return throwError(() => new Error('Token inválido o expirado'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.post<Inscripcion>(`${this.apiUrl}/inscripciones`, {
      userId,
      concursoId
    }, { headers }).pipe(
      tap(inscripcion => {
        const inscripciones = this.inscripcionesUsuario.value;
        this.inscripcionesUsuario.next([...inscripciones, inscripcion]);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('[InscripcionService] Error al inscribirse:', error);
        let errorMessage = 'Error desconocido al inscribirse';
        
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

  desinscribirse(inscripcionId: string): Observable<void> {
    if (!inscripcionId) {
      return throwError(() => new Error('El ID de la inscripción es requerido'));
    }

    // Verificar token antes de hacer la petición
    const token = this.tokenService.getToken();
    const tokenInfo = token ? this.tokenService.decodeToken(token) : null;
    
    console.log('[InscripcionService] Detalles del token:', {
      tokenPresent: !!token,
      tokenDecoded: tokenInfo ? {
        sub: tokenInfo.sub,
        exp: tokenInfo.exp ? new Date(tokenInfo.exp * 1000).toISOString() : 'N/A',
        roles: tokenInfo.roles,
        userId: tokenInfo.userId || tokenInfo.sub
      } : 'No decodificado'
    });

    if (!token) {
      console.error('[InscripcionService] No hay token disponible');
      return throwError(() => new Error('No hay token de autenticación'));
    }

    if (!this.tokenService.validateToken(token)) {
      console.error('[InscripcionService] Token inválido o expirado');
      return throwError(() => new Error('Token inválido o expirado'));
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

  verificarInscripcion(concursoId: string | number): Observable<boolean> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      console.warn('[InscripcionService] No hay usuario autenticado');
      return of(false);
    }

    return this.inscripcionesUsuario.pipe(
      map(inscripciones => {
        if (!inscripciones || inscripciones.length === 0) {
          console.log('[InscripcionService] No hay inscripciones para el usuario');
          return false;
        }
        const inscripto = inscripciones.some(i => {
          const inscripcionId = i.concursoId?.toString() || '';
          const concursoIdStr = concursoId?.toString() || '';
          const resultado = inscripcionId === concursoIdStr;
          console.log('[InscripcionService] Comparando:', { inscripcionId, concursoIdStr, resultado });
          return resultado;
        });
        console.log('[InscripcionService] Estado de inscripción:', inscripto);
        return inscripto;
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
    // Verificar token antes de hacer la petición
    const token = this.tokenService.getToken();
    const tokenInfo = token ? this.tokenService.decodeToken(token) : null;
    
    console.log('[InscripcionService] Detalles del token:', {
      tokenPresent: !!token,
      tokenDecoded: tokenInfo ? {
        sub: tokenInfo.sub,
        exp: tokenInfo.exp ? new Date(tokenInfo.exp * 1000).toISOString() : 'N/A',
        roles: tokenInfo.roles,
        userId: tokenInfo.userId || tokenInfo.sub
      } : 'No decodificado'
    });

    if (!token) {
      console.error('[InscripcionService] No hay token disponible');
      return throwError(() => new Error('No hay token de autenticación'));
    }

    if (!this.tokenService.validateToken(token)) {
      console.error('[InscripcionService] Token inválido o expirado');
      return throwError(() => new Error('Token inválido o expirado'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.get<Inscripcion[]>(`${this.apiUrl}/inscripciones/concurso/${concursoId}`, { headers });
  }

  cancelarInscripcion(inscripcionId: string): Observable<void> {
    // Verificar token antes de hacer la petición
    const token = this.tokenService.getToken();
    const tokenInfo = token ? this.tokenService.decodeToken(token) : null;
    
    console.log('[InscripcionService] Detalles del token:', {
      tokenPresent: !!token,
      tokenDecoded: tokenInfo ? {
        sub: tokenInfo.sub,
        exp: tokenInfo.exp ? new Date(tokenInfo.exp * 1000).toISOString() : 'N/A',
        roles: tokenInfo.roles,
        userId: tokenInfo.userId || tokenInfo.sub
      } : 'No decodificado'
    });

    if (!token) {
      console.error('[InscripcionService] No hay token disponible');
      return throwError(() => new Error('No hay token de autenticación'));
    }

    if (!this.tokenService.validateToken(token)) {
      console.error('[InscripcionService] Token inválido o expirado');
      return throwError(() => new Error('Token inválido o expirado'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.delete<void>(`${this.apiUrl}/inscripciones/${inscripcionId}`, { headers });
  }

  actualizarEstadoInscripcion(inscripcionId: string, estado: string, observaciones?: string): Observable<Inscripcion> {
    // Verificar token antes de hacer la petición
    const token = this.tokenService.getToken();
    const tokenInfo = token ? this.tokenService.decodeToken(token) : null;
    
    console.log('[InscripcionService] Detalles del token:', {
      tokenPresent: !!token,
      tokenDecoded: tokenInfo ? {
        sub: tokenInfo.sub,
        exp: tokenInfo.exp ? new Date(tokenInfo.exp * 1000).toISOString() : 'N/A',
        roles: tokenInfo.roles,
        userId: tokenInfo.userId || tokenInfo.sub
      } : 'No decodificado'
    });

    if (!token) {
      console.error('[InscripcionService] No hay token disponible');
      return throwError(() => new Error('No hay token de autenticación'));
    }

    if (!this.tokenService.validateToken(token)) {
      console.error('[InscripcionService] Token inválido o expirado');
      return throwError(() => new Error('Token inválido o expirado'));
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
    this.cargarInscripcionesUsuario();
  }

  // Método para manejar errores genéricos
  private handleError(error: HttpErrorResponse) {
    console.error('[InscripcionService] Error HTTP:', error);
    return throwError(() => new Error('Ocurrió un error inesperado'));
  }
}
