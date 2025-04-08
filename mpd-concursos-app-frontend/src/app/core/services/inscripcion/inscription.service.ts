import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of, EMPTY } from 'rxjs';
import { catchError, tap, map, take, finalize } from 'rxjs/operators';
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
  private readonly contestsEndpoint = '/contests';
  private inscriptions$ = new BehaviorSubject<IInscription[]>([]);

  // Estado temporal de inscripciones en progreso
  private inProgressInscriptions: Map<string, any> = new Map();

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

    console.log('[InscriptionService] Creando inscripción:', request);

    // Verificar primero si ya existe una inscripción local activa o pendiente
    const currentInscriptions = this.inscriptions$.getValue();
    const existingInscription = currentInscriptions.find(ins =>
      ins.contestId === request.contestId &&
      (ins.state === InscripcionState.PENDING || ins.state === InscripcionState.CONFIRMADA)
    );

    if (existingInscription) {
      console.log('[InscriptionService] Inscripción existente activa encontrada localmente:', existingInscription);
      return of({
        id: existingInscription.id,
        contestId: existingInscription.contestId,
        userId: existingInscription.userId,
        status: existingInscription.state
      } as IInscriptionResponse);
    }

    // Si hay una inscripción cancelada, la eliminamos del estado local
    const cancelledInscription = currentInscriptions.find(ins =>
      ins.contestId === request.contestId &&
      ins.state === InscripcionState.CANCELLED
    );

    if (cancelledInscription) {
      console.log('[InscriptionService] Eliminando inscripción cancelada del estado local:', cancelledInscription);
      this.inscriptions$.next(currentInscriptions.filter(ins => ins.id !== cancelledInscription.id));
    }

    return this.http.post<IInscriptionResponse>(
      `${this.baseUrl}${this.inscriptionsEndpoint}`,
      request
    ).pipe(
      tap(response => {
        console.log('[InscriptionService] Inscripción creada:', response);
        // Actualizar el estado local inmediatamente
        const newInscription: IInscription = {
          id: response.id,
          contestId: response.contestId,
          userId: response.userId,
          state: InscripcionState.PENDING,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.inscriptions$.next([...currentInscriptions, newInscription]);
        // Refrescar la lista después de un breve delay
        setTimeout(() => this.refreshInscriptions(), 500);
      }),
      catchError(error => {
        console.error('[InscriptionService] Error al crear inscripción:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });

        // Si el error es 409 (Conflict) o 500 (Internal Server Error), puede ser porque ya existe una inscripción
        // pero está en estado CANCELLED y el backend no la está manejando correctamente
        if (error.status === 409 || error.status === 500) {
          console.log('[InscriptionService] Error 409/500 - Posible inscripción cancelada, intentando forzar actualización');

          // Forzar una actualización de las inscripciones desde el backend
          this.refreshInscriptions();

          // Mostrar mensaje más amigable al usuario
          return throwError(() => new Error('Ya existe una inscripción para este concurso. Por favor, intente nuevamente en unos momentos.'));
        }

        return this.handleError(error);
      })
    );
  }

  // Este método ha sido reemplazado por una versión actualizada más abajo

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
          const inscriptions: IInscription[] = response.content.map(item => {
            console.log('[InscriptionService] Mapeando inscripción:', item);
            const mappedInscription: IInscription = {
              id: item.id,
              contestId: item.contestId,
              userId: item.userId,
              state: this.mapStatusToState(item.status),
              createdAt: new Date(item.inscriptionDate),
              updatedAt: new Date(item.inscriptionDate),
              observations: undefined
            };
            console.log('[InscriptionService] Inscripción mapeada:', mappedInscription);
            return mappedInscription;
          });
          this.inscriptions$.next(inscriptions);
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  getInscriptionStatus(contestId: string | number): Observable<InscripcionState> {
    if (!this.validateAuthentication()) return of(InscripcionState.NO_INSCRIPTO);

    const numericContestId = typeof contestId === 'string' ? parseInt(contestId, 10) : contestId;

    // Primero verificar el estado local
    const currentInscriptions = this.inscriptions$.getValue();
    const localInscription = currentInscriptions.find(ins => ins.contestId === numericContestId);

    if (localInscription) {
      console.log('[InscriptionService] Estado encontrado localmente:', localInscription.state);
      return of(localInscription.state);
    }

    return this.http.get<IInscriptionStatusResponse>(
      `${this.baseUrl}${this.inscriptionsEndpoint}/estado/${numericContestId}`
    ).pipe(
      map(response => {
        console.log('[InscriptionService] Respuesta de estado:', response);
        return response?.status || InscripcionState.NO_INSCRIPTO;
      }),
      tap(state => console.log('[InscriptionService] Estado de inscripción mapeado:', state)),
      catchError(error => {
        console.error('[InscriptionService] Error al verificar estado:', error);
        if (error.status === 404) {
          console.log('[InscriptionService] No se encontró inscripción para el concurso');
          return of(InscripcionState.NO_INSCRIPTO);
        }
        if (error.status === 500) {
          console.error('[InscriptionService] Error del servidor al verificar estado:', error);
          // En caso de error 500, verificar el estado local nuevamente
          const currentInscriptions = this.inscriptions$.getValue();
          const localInscription = currentInscriptions.find(ins => ins.contestId === numericContestId);
          return of(localInscription?.state || InscripcionState.NO_INSCRIPTO);
        }
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
        // Actualizar el estado local de la inscripción
        const currentInscriptions = this.inscriptions$.getValue();
        const updatedInscriptions = currentInscriptions.map(inscription => {
          if (inscription.id === inscriptionId) {
            return { ...inscription, state: InscripcionState.CANCELLED };
          }
          return inscription;
        });
        this.inscriptions$.next(updatedInscriptions);

        // Agregar delay para asegurar que el backend procese la cancelación
        setTimeout(() => {
          console.log('[InscriptionService] Refrescando inscripciones después de cancelación');
          this.refreshInscriptions();
        }, 500);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  // Variable para controlar los reintentos
  private updateStatusRetryCount: { [key: string]: number } = {};
  private readonly MAX_RETRY_ATTEMPTS = 3;

  /**
   * Mapea los estados del frontend a los estados aceptados por el backend
   * El backend solo acepta: ACTIVE, PENDING, CANCELLED, REJECTED, IN_PROCESS
   */
  private mapFrontendStateToBackend(state: InscripcionState): string {
    switch (state) {
      // Estados estandarizados
      case InscripcionState.PENDIENTE:
        return 'PENDING'; // Inscripción completada por el usuario, pendiente de validación
      case InscripcionState.INSCRIPTO:
        return 'ACTIVE';  // Inscripción validada por el administrador
      case InscripcionState.IN_PROCESS:
        return 'IN_PROCESS'; // Inscripción en proceso (interrumpida)
      case InscripcionState.CANCELLED:
        return 'CANCELLED'; // Inscripción cancelada
      case InscripcionState.REJECTED:
        return 'REJECTED';  // Inscripción rechazada por el administrador

      // Estados antiguos (mantenidos por compatibilidad)
      case InscripcionState.CONFIRMADA:
        return 'PENDING';   // Equivalente a PENDIENTE
      case InscripcionState.APPROVED:
        return 'ACTIVE';    // Equivalente a INSCRIPTO
      case InscripcionState.PENDING:
        return 'IN_PROCESS'; // Equivalente a IN_PROCESS
      case InscripcionState.NO_INSCRIPTO:
      default:
        return 'PENDING';   // Por defecto, usar PENDING
    }
  }

  // Usamos el método mapStatusToState en lugar de este método

  updateInscriptionStatus(
    inscriptionId: string,
    request: IInscriptionUpdateRequest
  ): Observable<IInscriptionResponse> {
    if (!this.validateAuthentication()) return EMPTY;
    if (!inscriptionId) {
      return throwError(() => new Error('El ID de inscripción es requerido'));
    }

    // Si el estado es CONFIRMADA, asegurarse de que el paso esté en COMPLETED
    if (request.state === InscripcionState.CONFIRMADA && !request.currentStep) {
      request = {
        ...request,
        currentStep: InscriptionStep.COMPLETED
      };
      console.log('[InscriptionService] Agregando paso COMPLETED a la inscripción CONFIRMADA');
    }

    // Inicializar contador de reintentos si no existe
    if (!this.updateStatusRetryCount[inscriptionId]) {
      this.updateStatusRetryCount[inscriptionId] = 0;
    }

    // Verificar si hemos excedido el número máximo de reintentos
    if (this.updateStatusRetryCount[inscriptionId] >= this.MAX_RETRY_ATTEMPTS) {
      console.warn(`[InscriptionService] Máximo número de reintentos alcanzado para inscripción ${inscriptionId}`);
      // Limpiar el contador para futuros intentos
      delete this.updateStatusRetryCount[inscriptionId];
      // Devolver un observable exitoso con datos locales para evitar bucles infinitos
      return of({
        id: inscriptionId,
        contestId: 0,
        userId: '',
        status: request.state,
        inscriptionDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as IInscriptionResponse);
    }

    // Incrementar el contador de reintentos
    this.updateStatusRetryCount[inscriptionId]++;

    // Mapear el estado del frontend al estado aceptado por el backend
    const backendState = this.mapFrontendStateToBackend(request.state);

    console.log('[InscriptionService] Actualizando estado de inscripción:', {
      inscriptionId,
      frontendState: request.state,
      backendState,
      intento: this.updateStatusRetryCount[inscriptionId]
    });

    // Actualizar el estado local inmediatamente para mejorar la experiencia de usuario
    this.updateLocalInscriptionState(inscriptionId, request.state);

    // Usar la ruta correcta con parámetros de consulta en lugar de cuerpo JSON
    // El backend espera un parámetro de consulta 'status', no un cuerpo JSON
    return this.http.patch<IInscriptionResponse>(
      `${this.baseUrl}${this.inscriptionsEndpoint}/${inscriptionId}/status?status=${backendState}`,
      {} // Cuerpo vacío, ya que enviamos el estado como parámetro de consulta
    ).pipe(
      tap(response => {
        console.log('[InscriptionService] Estado actualizado:', response);
        // Limpiar el contador de reintentos al tener éxito
        delete this.updateStatusRetryCount[inscriptionId];
        // Refrescar la lista después de un breve delay
        setTimeout(() => this.refreshInscriptions(), 500);
      }),
      catchError(error => {
        console.error('[InscriptionService] Error al actualizar estado:', error);

        // Si es un error 404, 400 o 500, podemos intentar una solución alternativa
        if (error.status === 404 || error.status === 400 || error.status === 500) {
          console.log(`[InscriptionService] Error ${error.status}, usando actualización local solamente`);
          // Limpiar el contador de reintentos para evitar bucles infinitos
          delete this.updateStatusRetryCount[inscriptionId];
          // Ya actualizamos el estado local, así que podemos devolver un observable exitoso
          return of({
            id: inscriptionId,
            contestId: 0, // Estos valores serán reemplazados por los datos reales en el frontend
            userId: '',
            status: request.state,
            inscriptionDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as IInscriptionResponse);
        }

        return this.handleError(error);
      })
    );
  }

  /**
   * Actualiza el estado de una inscripción localmente sin llamar al backend
   */
  private updateLocalInscriptionState(inscriptionId: string, newState: InscripcionState): void {
    const currentInscriptions = this.inscriptions$.getValue();
    const updatedInscriptions = currentInscriptions.map(inscription => {
      if (inscription.id === inscriptionId) {
        return {
          ...inscription,
          state: newState,
          updatedAt: new Date()
        };
      }
      return inscription;
    });
    this.inscriptions$.next(updatedInscriptions);
    console.log('[InscriptionService] Estado local actualizado para inscripción:', inscriptionId);
  }

  // Variable para controlar los reintentos de actualización de paso
  private updateStepRetryCount: { [key: string]: number } = {};

  updateInscriptionStep(
    inscriptionId: string,
    request: IInscriptionStepRequest
  ): Observable<IInscriptionResponse> {
    if (!this.validateAuthentication()) return EMPTY;
    if (!inscriptionId) {
      return throwError(() => new Error('El ID de inscripción es requerido'));
    }

    // Inicializar contador de reintentos si no existe
    if (!this.updateStepRetryCount[inscriptionId]) {
      this.updateStepRetryCount[inscriptionId] = 0;
    }

    // Verificar si hemos excedido el número máximo de reintentos
    if (this.updateStepRetryCount[inscriptionId] >= this.MAX_RETRY_ATTEMPTS) {
      console.warn(`[InscriptionService] Máximo número de reintentos alcanzado para actualizar paso de inscripción ${inscriptionId}`);
      // Limpiar el contador para futuros intentos
      delete this.updateStepRetryCount[inscriptionId];
      // Devolver un observable exitoso con datos locales para evitar bucles infinitos
      return of({
        id: inscriptionId,
        contestId: 0,
        userId: '',
        status: '',
        inscriptionDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as IInscriptionResponse);
    }

    // Incrementar el contador de reintentos
    this.updateStepRetryCount[inscriptionId]++;

    console.log('[InscriptionService] Actualizando paso de inscripción:', {
      inscriptionId,
      request,
      intento: this.updateStepRetryCount[inscriptionId]
    });

    // Actualizar el estado local inmediatamente para mejorar la experiencia de usuario
    this.updateLocalInscriptionStep(inscriptionId, request.step);

    // Usar la ruta correcta con parámetros de consulta en lugar de cuerpo JSON
    // Intentar usar el formato que espera el backend
    return this.http.patch<IInscriptionResponse>(
      `${this.baseUrl}${this.inscriptionsEndpoint}/${inscriptionId}/step`,
      { step: request.step } // Probar primero con el cuerpo JSON
    ).pipe(
      tap(response => {
        console.log('[InscriptionService] Paso actualizado:', response);
        // Limpiar el contador de reintentos al tener éxito
        delete this.updateStepRetryCount[inscriptionId];
        this.refreshInscriptions();
      }),
      catchError(error => {
        console.error('[InscriptionService] Error al actualizar paso:', error);

        // Si es un error 404, 400 o 500, podemos intentar una solución alternativa
        if (error.status === 404 || error.status === 400 || error.status === 500) {
          // Si el primer intento falló, intentar con parámetros de consulta
          if (this.updateStepRetryCount[inscriptionId] === 1) {
            console.log('[InscriptionService] Primer intento fallido, intentando con parámetros de consulta');
            return this.http.patch<IInscriptionResponse>(
              `${this.baseUrl}${this.inscriptionsEndpoint}/${inscriptionId}/step?step=${request.step}`,
              {} // Cuerpo vacío, ya que enviamos el paso como parámetro de consulta
            ).pipe(
              tap(response => {
                console.log('[InscriptionService] Paso actualizado con parámetros de consulta:', response);
                // Limpiar el contador de reintentos al tener éxito
                delete this.updateStepRetryCount[inscriptionId];
                this.refreshInscriptions();
              }),
              catchError(secondError => {
                console.error('[InscriptionService] Error en segundo intento:', secondError);
                // Limpiar el contador de reintentos para evitar bucles infinitos
                delete this.updateStepRetryCount[inscriptionId];
                // Ya actualizamos el estado local, así que podemos devolver un observable exitoso
                return of({
                  id: inscriptionId,
                  contestId: 0,
                  userId: '',
                  status: '',
                  inscriptionDate: new Date().toISOString(),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                } as IInscriptionResponse);
              })
            );
          }

          console.log(`[InscriptionService] Error ${error.status}, usando actualización local solamente`);
          // Limpiar el contador de reintentos para evitar bucles infinitos
          delete this.updateStepRetryCount[inscriptionId];
          // Ya actualizamos el estado local, así que podemos devolver un observable exitoso
          return of({
            id: inscriptionId,
            contestId: 0, // Estos valores serán reemplazados por los datos reales en el frontend
            userId: '',
            status: '',
            inscriptionDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as IInscriptionResponse);
        }

        return this.handleError(error);
      })
    );
  }

  /**
   * Actualiza el paso de una inscripción localmente sin llamar al backend
   */
  private updateLocalInscriptionStep(inscriptionId: string, step: InscriptionStep): void {
    const currentInscriptions = this.inscriptions$.getValue();
    const updatedInscriptions = currentInscriptions.map(inscription => {
      if (inscription.id === inscriptionId) {
        return {
          ...inscription,
          step: step,
          updatedAt: new Date()
        };
      }
      return inscription;
    });
    this.inscriptions$.next(updatedInscriptions);
    console.log('[InscriptionService] Paso local actualizado para inscripción:', inscriptionId);
  }

  // Getters públicos
  get inscriptions(): Observable<IInscription[]> {
    if (this.inscriptions$.value.length === 0) {
      this.refreshInscriptions();
    }
    return this.inscriptions$.asObservable();
  }

  // Métodos públicos adicionales
  // Variable para controlar el throttling de las actualizaciones
  private lastRefreshTimestamp = 0;
  private readonly MIN_REFRESH_INTERVAL = 5000; // 5 segundos mínimo entre actualizaciones
  private refreshInProgress = false;

  refreshInscriptions(): void {
    // Evitar múltiples llamadas simultáneas
    if (this.refreshInProgress) {
      console.log('[InscriptionService] Ya hay una actualización en progreso, ignorando solicitud');
      return;
    }

    // Aplicar throttling para evitar demasiadas peticiones
    const now = Date.now();
    const timeSinceLastRefresh = now - this.lastRefreshTimestamp;

    if (timeSinceLastRefresh < this.MIN_REFRESH_INTERVAL) {
      console.log(`[InscriptionService] Throttling aplicado, última actualización hace ${timeSinceLastRefresh}ms`);
      return;
    }

    console.log('[InscriptionService] Actualizando lista de inscripciones...');
    this.refreshInProgress = true;
    this.lastRefreshTimestamp = now;

    this.getUserInscriptions()
      .pipe(
        take(1),
        finalize(() => {
          this.refreshInProgress = false;
        })
      )
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
    console.error('[InscriptionService] Error detallado:', {
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      error: error.error
    });

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
        // Para errores 404, podemos ser más específicos sobre qué recurso no se encontró
        if (error.url?.includes('/status')) {
          errorMessage = 'No se pudo actualizar el estado de la inscripción. El endpoint no existe.';
          console.log('[InscriptionService] Endpoint de estado no encontrado. Esto es normal si el backend no ha implementado este endpoint.');
          // En este caso, no queremos mostrar un error al usuario ya que manejamos esto localmente
        } else if (error.url?.includes('/step')) {
          errorMessage = 'No se pudo actualizar el paso de la inscripción. El endpoint no existe.';
          console.log('[InscriptionService] Endpoint de paso no encontrado. Esto es normal si el backend no ha implementado este endpoint.');
          // En este caso, no queremos mostrar un error al usuario ya que manejamos esto localmente
        } else {
          errorMessage = 'El recurso solicitado no existe.';
        }
        break;
      case 409:
        errorMessage = 'Ya existe una inscripción para este concurso.';
        // Intentar obtener la inscripción existente para actualizar el estado local
        this.refreshInscriptions();
        break;
      case 422:
        errorMessage = 'Los datos proporcionados no son válidos.';
        break;
      case 500:
        // Para errores 500, podemos ser más específicos si es un error de estado inválido
        if (error.error && error.error.message && error.error.message.includes('Estado de inscripción inválido')) {
          errorMessage = 'El estado de inscripción proporcionado no es válido para el backend.';
          console.log('[InscriptionService] Error de estado inválido. Esto puede ocurrir si el frontend y el backend tienen diferentes estados definidos.');
          // Intentar actualizar el estado local en caso de error del servidor
          this.refreshInscriptions();
        } else {
          errorMessage = 'Error del servidor. Por favor, intente nuevamente más tarde.';
          // Intentar actualizar el estado local en caso de error del servidor
          this.refreshInscriptions();
        }
        break;
    }

    // Si hay un mensaje de error en la respuesta, lo usamos
    if (error.error && error.error.message) {
      // Pero si es un error de estado inválido, usamos un mensaje más amigable
      if (error.error.message.includes('Estado de inscripción inválido')) {
        errorMessage = 'El estado de inscripción proporcionado no es válido para el backend.';
      } else {
        errorMessage = error.error.message;
      }
    }

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Mapea los estados del backend a los estados del frontend
   * Este método se usa para convertir los estados que vienen del backend a los estados que usa el frontend
   */
  private mapStatusToState(status: string): InscripcionState {
    if (!status) {
      console.warn('[InscriptionService] Estado nulo o indefinido');
      return InscripcionState.IN_PROCESS; // Cambiado de PENDING a IN_PROCESS
    }

    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      // Mapeo de estados del backend a los nuevos estados estandarizados
      case 'ACTIVE':
        return InscripcionState.INSCRIPTO; // Inscripción validada por el administrador
      case 'PENDING':
        return InscripcionState.PENDIENTE; // Inscripción completada por el usuario, pendiente de validación
      case 'IN_PROCESS':
        return InscripcionState.IN_PROCESS; // Inscripción en proceso (interrumpida)
      case 'CANCELLED':
      case 'CANCELED':
      case 'CANCELADA':
      case 'CANCELADO':
        return InscripcionState.CANCELLED; // Inscripción cancelada
      case 'REJECTED':
      case 'RECHAZADA':
      case 'RECHAZADO':
        return InscripcionState.REJECTED; // Inscripción rechazada

      // Compatibilidad con estados antiguos
      case 'CONFIRMADA':
        return InscripcionState.PENDIENTE; // Ahora mapeado a PENDIENTE
      default:
        console.warn('[InscriptionService] Estado desconocido:', status);
        return InscripcionState.IN_PROCESS; // Cambiado de PENDING a IN_PROCESS
    }
  }

  /**
   * Guarda el estado del formulario de inscripción en memoria
   * @param inscriptionId ID de la inscripción
   * @param formState Estado del formulario
   */
  saveFormState(inscriptionId: string, formState: any): void {
    console.log('[InscriptionService] Guardando estado del formulario:', { inscriptionId, formState });
    this.inProgressInscriptions.set(inscriptionId, formState);
  }

  /**
   * Recupera el estado del formulario de inscripción desde la memoria
   * @param inscriptionId ID de la inscripción
   * @returns Estado del formulario o null si no existe
   */
  getFormState(inscriptionId: string): any {
    const state = this.inProgressInscriptions.get(inscriptionId);
    console.log('[InscriptionService] Recuperando estado del formulario:', { inscriptionId, state });
    return state || null;
  }

  /**
   * Limpia el estado del formulario de inscripción
   * @param inscriptionId ID de la inscripción
   */
  clearFormState(inscriptionId: string): void {
    console.log('[InscriptionService] Limpiando estado del formulario:', inscriptionId);
    this.inProgressInscriptions.delete(inscriptionId);
  }
}
