import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of, EMPTY } from 'rxjs';
import { catchError, tap, map, take } from 'rxjs/operators';
import { environment } from '@env/environment';
import { AuthService } from '@core/services/auth/auth.service';
import { TokenService } from '../auth/token.service';
import { Router } from '@angular/router';
import { Page } from '@shared/interfaces/page.interface';
import {
  IInscription,
  IInscriptionRequest,
  IInscriptionResponse,
  IInscriptionStatusResponse,
  IInscriptionUpdateRequest,
  IInscriptionStepRequest
} from '@shared/interfaces/inscripcion/inscription.interface';
import { InscriptionStep } from '@shared/enums/inscription-step.enum';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';

@Injectable({
  providedIn: 'root'
})
export class InscriptionService {
  private readonly baseUrl = environment.apiUrl;
  private readonly inscriptionsEndpoint = '/inscripciones';
  private inscriptions$ = new BehaviorSubject<IInscription[]>([]);

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private tokenService: TokenService,
    private router: Router
  ) {}

  // Métodos públicos
  createInscription(contestId: string | number): Observable<IInscriptionResponse> {
    if (!this.validateAuthentication()) return EMPTY;

    const request: IInscriptionRequest = {
      contestId: typeof contestId === 'string' ? parseInt(contestId, 10) : contestId
    };

    return this.http.post<IInscriptionResponse>(
      `${this.baseUrl}${this.inscriptionsEndpoint}`,
      request
    ).pipe(
      tap(response => {
        console.log('[InscriptionService] Inscripción creada:', response);
        this.refreshInscriptions();
      }),
      catchError(this.handleError.bind(this))
    );
  }

  updateInscriptionStep(inscriptionId: string, request: IInscriptionStepRequest): Observable<IInscriptionResponse> {
    if (!this.validateAuthentication()) return EMPTY;
    if (!inscriptionId) {
      return throwError(() => new Error('El ID de inscripción es requerido'));
    }

    return this.http.put<IInscriptionResponse>(
      `${this.baseUrl}${this.inscriptionsEndpoint}/${inscriptionId}/step`,
      request
    ).pipe(
      tap(response => {
        console.log('[InscriptionService] Paso de inscripción actualizado:', response);
        this.refreshInscriptions();
      }),
      catchError(this.handleError.bind(this))
    );
  }

  getCurrentStep(inscriptionId: string): Observable<InscriptionStep> {
    if (!this.validateAuthentication()) return EMPTY;
    if (!inscriptionId) {
      return throwError(() => new Error('El ID de inscripción es requerido'));
    }

    return this.http.get<{ step: InscriptionStep }>(
      `${this.baseUrl}${this.inscriptionsEndpoint}/${inscriptionId}/step`
    ).pipe(
      map(response => response.step),
      tap(step => console.log('[InscriptionService] Paso actual:', step)),
      catchError(this.handleError.bind(this))
    );
  }

  getUserInscriptions(
    page: number = 0,
    size: number = 10,
    sort: string = 'inscriptionDate',
    direction: string = 'DESC'
  ): Observable<Page<IInscriptionResponse>> {
    if (!this.validateAuthentication()) return EMPTY;

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort)
      .set('direction', direction);

    return this.http.get<Page<IInscriptionResponse>>(
      `${this.baseUrl}${this.inscriptionsEndpoint}/me`,
      { params }
    ).pipe(
      tap(response => {
        console.log('[InscriptionService] Inscripciones obtenidas:', response);
        if (response?.content) {
          const inscriptions: IInscription[] = response.content.map(item => ({
            id: item.id,
            contestId: item.contestId,
            userId: item.userId,
            state: item.state,
            createdAt: new Date(item.inscriptionDate),
            updatedAt: new Date(item.inscriptionDate),
            observations: undefined
          }));
          this.inscriptions$.next(inscriptions);
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  getInscriptionStatus(contestId: string | number): Observable<InscripcionState> {
    if (!this.validateAuthentication()) return of(InscripcionState.NO_INSCRIPTO);

    const numericContestId = typeof contestId === 'string' ? parseInt(contestId, 10) : contestId;

    return this.http.get<boolean>(
      `${this.baseUrl}${this.inscriptionsEndpoint}/estado/${numericContestId}`
    ).pipe(
      map(status => status ? InscripcionState.CONFIRMADA : InscripcionState.NO_INSCRIPTO),
      tap(state => console.log('[InscriptionService] Estado de inscripción:', state)),
      catchError(error => {
        console.error('[InscriptionService] Error al verificar estado:', error);
        return of(InscripcionState.NO_INSCRIPTO);
      })
    );
  }

  cancelInscription(inscriptionId: string): Observable<void> {
    if (!this.validateAuthentication()) return EMPTY;
    if (!inscriptionId) {
      return throwError(() => new Error('El ID de inscripción es requerido'));
    }

    console.log('[InscriptionService] Iniciando proceso de cancelación para inscripción:', inscriptionId);

    return this.http.delete<void>(
      `${this.baseUrl}${this.inscriptionsEndpoint}/${inscriptionId}`
    ).pipe(
      tap(() => {
        console.log('[InscriptionService] Inscripción cancelada exitosamente:', inscriptionId);
        // Agregar delay para asegurar que el backend procese la cancelación
        setTimeout(() => {
          console.log('[InscriptionService] Refrescando inscripciones después de cancelación');
          this.refreshInscriptions();
        }, 500);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  updateInscriptionStatus(
    inscriptionId: string,
    request: IInscriptionUpdateRequest
  ): Observable<IInscriptionResponse> {
    if (!this.validateAuthentication()) return EMPTY;
    if (!inscriptionId) {
      return throwError(() => new Error('El ID de inscripción es requerido'));
    }

    return this.http.patch<IInscriptionResponse>(
      `${this.baseUrl}${this.inscriptionsEndpoint}/${inscriptionId}/estado`,
      request
    ).pipe(
      tap(response => {
        console.log('[InscriptionService] Estado actualizado:', response);
        this.refreshInscriptions();
      }),
      catchError(this.handleError.bind(this))
    );
  }

  // Getters públicos
  get inscriptions(): Observable<IInscription[]> {
    if (this.inscriptions$.value.length === 0) {
      this.refreshInscriptions();
    }
    return this.inscriptions$.asObservable();
  }

  // Métodos privados
  private refreshInscriptions(): void {
    console.log('[InscriptionService] Actualizando lista de inscripciones...');
    this.getUserInscriptions()
      .pipe(take(1))
      .subscribe({
        error: error => console.error('[InscriptionService] Error al actualizar inscripciones:', error)
      });
  }

  private validateAuthentication(): boolean {
    if (!this.authService.isAuthenticated()) {
      console.warn('[InscriptionService] Usuario no autenticado');
      this.router.navigate(['/auth/login']);
      return false;
    }
    return true;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('[InscriptionService] Error:', error);

    let errorMessage = 'Ha ocurrido un error inesperado';

    switch (error.status) {
      case 401:
        errorMessage = 'Su sesión ha expirado. Por favor, vuelva a iniciar sesión.';
        this.tokenService.signOut();
        this.router.navigate(['/auth/login']);
        break;
      case 403:
        errorMessage = 'No tiene permisos para realizar esta acción.';
        break;
      case 404:
        errorMessage = 'El recurso solicitado no existe.';
        break;
      case 409:
        errorMessage = 'La operación no pudo completarse debido a un conflicto.';
        break;
      case 422:
        errorMessage = 'Los datos proporcionados no son válidos.';
        break;
    }

    return throwError(() => new Error(errorMessage));
  }
}
