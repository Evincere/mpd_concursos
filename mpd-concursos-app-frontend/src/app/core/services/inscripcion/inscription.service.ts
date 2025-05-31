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
import { InscriptionStateService } from './inscription-state.service';

@Injectable({
  providedIn: 'root'
})
export class InscriptionService { // TODO: Refactorizar para solo utilizar las apis en ingles
  private readonly baseUrl = environment.apiUrl;
  private readonly inscriptionsEndpoint = '/inscriptions';
  // Keep old endpoint for backward compatibility during transition
  private readonly oldInscriptionsEndpoint = '/inscripciones';
  private inscriptions$ = new BehaviorSubject<IInscription[]>([]);

  // Estado temporal de inscripciones en progreso
  private inProgressInscriptions = new Map<string, Record<string, unknown>>();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private tokenService: TokenService,
    private router: Router,
    private inscriptionStateService: InscriptionStateService
  ) {
    // Guardar una referencia al servicio de estado de inscripción en el objeto window
    // para evitar problemas de inyección circular
    (window as unknown as Record<string, unknown>)['inscriptionStateService'] = inscriptionStateService;
  }

  // Métodos públicos
  /**
   * Marca una inscripción como interrumpida y envía una notificación al usuario
   * @param inscriptionId ID de la inscripción
   * @returns Observable<void>
   */
  markAsInterrupted(inscriptionId: string): Observable<void> {
    if (!this.validateAuthentication()) return EMPTY;
    if (!inscriptionId) {
      return throwError(() => new Error('El ID de inscripción es requerido'));
    }

    console.log('[InscriptionService] Marcando inscripción como interrumpida:', inscriptionId);

    return this.http.post<void>(
      `${this.baseUrl}${this.inscriptionsEndpoint}/${inscriptionId}/interrupt`,
      {}
    ).pipe(
      tap(() => {
        console.log('[InscriptionService] Inscripción marcada como interrumpida exitosamente:', inscriptionId);
      }),
      catchError(error => {
        console.error('[InscriptionService] Error al marcar inscripción como interrumpida:', error);
        // Incluso si hay un error, no queremos que la UI muestre un error al usuario
        return of(void 0);
      })
    );
  }

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
    page = 0,
    size = 10,
    sort = 'inscriptionDate',
    direction = 'DESC'
  ): Observable<Page<IInscriptionResponse>> {
    if (!this.validateAuthentication()) return EMPTY;

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort)
      .set('direction', direction);

    // Obtener el ID del usuario actual
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      console.error('[InscriptionService] No se pudo obtener el ID del usuario actual');
      return EMPTY;
    }

    // Usar el endpoint correcto con el ID del usuario en lugar de 'me'
    return this.http.get<Page<IInscriptionResponse>>(
      `${this.baseUrl}${this.inscriptionsEndpoint}/user/${userId}`,
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
      catchError(error => {
        // Si falla, intentar con el endpoint alternativo
        if (error.status === 404) {
          console.log('[InscriptionService] Endpoint /user/{userId} no encontrado, intentando con endpoint alternativo');
          return this.http.get<Page<IInscriptionResponse>>(
            `${this.baseUrl}${this.inscriptionsEndpoint}/by-user/${userId}`,
            { params }
          ).pipe(
            tap(response => {
              console.log('[InscriptionService] Inscripciones obtenidas (endpoint alternativo):', response);
              if (response?.content) {
                const inscriptions: IInscription[] = response.content.map(item => {
                  const mappedInscription: IInscription = {
                    id: item.id,
                    contestId: item.contestId,
                    userId: item.userId,
                    state: this.mapStatusToState(item.status),
                    createdAt: new Date(item.inscriptionDate),
                    updatedAt: new Date(item.inscriptionDate),
                    observations: undefined
                  };
                  return mappedInscription;
                });
                this.inscriptions$.next(inscriptions);
              }
            }),
            catchError(secondError => {
              console.error('[InscriptionService] Error con endpoint alternativo:', secondError);
              // Si también falla, devolver un array vacío para evitar errores en la UI
              this.inscriptions$.next([]);
              return this.handleError(secondError);
            })
          );
        }
        return this.handleError(error);
      })
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

      // Si el estado es CANCELLED, verificar si es una inscripción reciente (menos de 1 hora)
      // para determinar si es una cancelación de proceso o una cancelación de postulación completada
      if (localInscription.state === InscripcionState.CANCELLED) {
        // Si la inscripción fue actualizada hace menos de 1 hora, considerarla como una cancelación de proceso
        // y permitir reiniciar el proceso de inscripción
        const now = new Date();
        const updatedAt = localInscription.updatedAt ? new Date(localInscription.updatedAt) : now;
        const timeDiff = now.getTime() - updatedAt.getTime();
        const oneHourInMs = 60 * 60 * 1000;

        if (timeDiff < oneHourInMs) {
          console.log('[InscriptionService] Estado CANCELLED reciente encontrado, devolviendo NO_INSCRIPTO para permitir reiniciar');
          return of(InscripcionState.NO_INSCRIPTO);
        } else {
          console.log('[InscriptionService] Estado CANCELLED antiguo encontrado, manteniendo como CANCELLED');
          return of(InscripcionState.CANCELLED);
        }
      }

      return of(localInscription.state);
    }

    // Obtener el ID del usuario actual
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      console.error('[InscriptionService] No se pudo obtener el ID del usuario actual');
      return of(InscripcionState.NO_INSCRIPTO);
    }

    // Usar el endpoint de usuario/concurso que funciona correctamente
    console.log(`[InscriptionService] Verificando estado con endpoint: ${this.baseUrl}${this.inscriptionsEndpoint}/user/${userId}/contest/${numericContestId}`);
    return this.http.get<IInscriptionResponse>(
      `${this.baseUrl}${this.inscriptionsEndpoint}/user/${userId}/contest/${numericContestId}`
    ).pipe(
      map(response => {
        console.log('[InscriptionService] Respuesta de estado (endpoint user/contest):', response);
        return this.mapStatusToState(response.status);
      }),
      tap(state => console.log('[InscriptionService] Estado de inscripción mapeado:', state)),
      catchError(error => {
        console.error('[InscriptionService] Error al verificar estado con endpoint user/contest:', error);

        // Si falla, intentar con el endpoint status
        if (error.status === 404) {
          console.log(`[InscriptionService] Intentando con endpoint status: ${this.baseUrl}${this.inscriptionsEndpoint}/status/${numericContestId}`);
          return this.http.get<boolean>(
            `${this.baseUrl}${this.inscriptionsEndpoint}/status/${numericContestId}`
          ).pipe(
            map(isInscribed => {
              console.log('[InscriptionService] Respuesta de estado (endpoint status):', isInscribed);
              // Este endpoint solo devuelve true/false, así que mapeamos a un estado
              return isInscribed ? InscripcionState.PENDING : InscripcionState.NO_INSCRIPTO;
            }),
            catchError(secondError => {
              console.error('[InscriptionService] Error al verificar estado con endpoint status:', secondError);

              // Si también falla, intentar con el endpoint antiguo
              if (secondError.status === 404) {
                console.log('[InscriptionService] Intentando con endpoint antiguo: /inscripciones/estado/{contestId}');
                return this.http.get<IInscriptionStatusResponse>(
                  `${this.baseUrl}${this.oldInscriptionsEndpoint}/estado/${numericContestId}`
                ).pipe(
                  map(response => {
                    console.log('[InscriptionService] Respuesta de estado (endpoint antiguo):', response);
                    return response?.status || InscripcionState.NO_INSCRIPTO;
                  }),
                  catchError(thirdError => {
                    console.error('[InscriptionService] Error al verificar estado con todos los endpoints:', thirdError);
                    console.log('[InscriptionService] No se encontró inscripción para el concurso');
                    return of(InscripcionState.NO_INSCRIPTO);
                  })
                );
              }

              console.log('[InscriptionService] No se encontró inscripción para el concurso');
              return of(InscripcionState.NO_INSCRIPTO);
            })
          );
        }

        if (error.status === 500) {
          console.error('[InscriptionService] Error del servidor al verificar estado:', error);
          // En caso de error 500, verificar el estado local nuevamente
          const currentInscriptions = this.inscriptions$.getValue();
          const localInscription = currentInscriptions.find(ins => ins.contestId === numericContestId);
          return of(localInscription?.state || InscripcionState.NO_INSCRIPTO);
        }

        console.log('[InscriptionService] No se encontró inscripción para el concurso');
        return of(InscripcionState.NO_INSCRIPTO);
      })
    );
  }

  /**
   * Cancela una inscripción en el backend
   * @param inscriptionId ID de la inscripción a cancelar
   * @param isProcessCancellation Indica si es una cancelación durante el proceso de inscripción (true) o una cancelación de una postulación ya completada (false)
   * @returns Observable<void>
   */
  cancelInscription(inscriptionId: string, isProcessCancellation = true): Observable<void> {
    if (!this.validateAuthentication()) return EMPTY;
    if (!inscriptionId) {
      return throwError(() => new Error('El ID de inscripción es requerido'));
    }

    console.log('[InscriptionService] Iniciando proceso de cancelación para inscripción:', inscriptionId, 'Cancelación de proceso:', isProcessCancellation);

    // Usar el endpoint PATCH para cancelar la inscripción (más compatible con el backend actual)
    return this.http.patch<void>(
      `${this.baseUrl}${this.inscriptionsEndpoint}/${inscriptionId}/cancel`,
      {} // Cuerpo vacío
    ).pipe(
      tap(() => {
        console.log('[InscriptionService] Inscripción cancelada exitosamente:', inscriptionId);

        // Limpiar el estado del formulario en memoria
        this.clearFormState(inscriptionId);

        // Actualizar el estado local de la inscripción
        const currentInscriptions = this.inscriptions$.getValue();

        if (isProcessCancellation) {
          // Si es una cancelación durante el proceso, eliminar completamente la inscripción de la lista local
          console.log('[InscriptionService] Cancelación durante el proceso, eliminando inscripción de la lista local');
          const filteredInscriptions = currentInscriptions.filter(ins => ins.id !== inscriptionId);
          this.inscriptions$.next(filteredInscriptions);
        } else {
          // Si es una cancelación de una postulación completada, actualizar su estado a CANCELLED
          console.log('[InscriptionService] Cancelación de postulación completada, actualizando estado a CANCELLED');
          const updatedInscriptions = currentInscriptions.map(ins => {
            if (ins.id === inscriptionId) {
              return {
                ...ins,
                state: InscripcionState.CANCELLED,
                updatedAt: new Date()
              };
            }
            return ins;
          });
          this.inscriptions$.next(updatedInscriptions);
        }

        // Agregar delay para asegurar que el backend procese la cancelación
        setTimeout(() => {
          console.log('[InscriptionService] Refrescando inscripciones después de cancelación');
          this.refreshInscriptions();
        }, 500);
      }),
      catchError((error) => {
        console.error('[InscriptionService] Error al cancelar inscripción con PATCH:', error);

        // Si es un error 404 o 405, intentar con el método DELETE (para compatibilidad con versiones anteriores)
        if (error.status === 404 || error.status === 405) {
          console.log('[InscriptionService] Intentando cancelar con método DELETE como fallback');

          return this.http.delete<void>(
            `${this.baseUrl}${this.inscriptionsEndpoint}/${inscriptionId}`
          ).pipe(
            tap(() => {
              console.log('[InscriptionService] Inscripción cancelada exitosamente con DELETE:', inscriptionId);

              // Limpiar el estado del formulario en memoria
              this.clearFormState(inscriptionId);

              // Actualizar el estado local de la inscripción
              const currentInscriptions = this.inscriptions$.getValue();

              if (isProcessCancellation) {
                // Si es una cancelación durante el proceso, eliminar completamente la inscripción de la lista local
                console.log('[InscriptionService] Cancelación durante el proceso, eliminando inscripción de la lista local');
                const filteredInscriptions = currentInscriptions.filter(ins => ins.id !== inscriptionId);
                this.inscriptions$.next(filteredInscriptions);
              } else {
                // Si es una cancelación de una postulación completada, actualizar su estado a CANCELLED
                console.log('[InscriptionService] Cancelación de postulación completada, actualizando estado a CANCELLED');
                const updatedInscriptions = currentInscriptions.map(ins => {
                  if (ins.id === inscriptionId) {
                    return {
                      ...ins,
                      state: InscripcionState.CANCELLED,
                      updatedAt: new Date()
                    };
                  }
                  return ins;
                });
                this.inscriptions$.next(updatedInscriptions);
              }

              // Agregar delay para asegurar que el backend procese la cancelación
              setTimeout(() => {
                console.log('[InscriptionService] Refrescando inscripciones después de cancelación con DELETE');
                this.refreshInscriptions();
              }, 500);
            }),
            catchError((deleteError) => {
              console.error('[InscriptionService] Error al cancelar inscripción con DELETE:', deleteError);

              // Incluso en caso de error, intentamos limpiar el estado local
              this.clearFormState(inscriptionId);

              // Actualizar el estado local de la inscripción
              this.handleLocalCancellation(inscriptionId, isProcessCancellation);

              // Forzar una actualización de las inscripciones desde el backend
              setTimeout(() => {
                this.refreshInscriptions();
              }, 500);

              // Propagar el error para que el componente pueda manejarlo
              return this.handleError(deleteError);
            })
          );
        }

        // Incluso en caso de error, intentamos limpiar el estado local
        this.clearFormState(inscriptionId);

        // Actualizar el estado local de la inscripción
        this.handleLocalCancellation(inscriptionId, isProcessCancellation);

        // Forzar una actualización de las inscripciones desde el backend
        setTimeout(() => {
          this.refreshInscriptions();
        }, 500);

        // Propagar el error para que el componente pueda manejarlo
        return this.handleError(error);
      })
    );
  }

  /**
   * Maneja la cancelación local de una inscripción cuando falla la comunicación con el backend
   * @param inscriptionId ID de la inscripción a cancelar
   * @param isProcessCancellation Indica si es una cancelación durante el proceso o de una postulación completada
   */
  private handleLocalCancellation(inscriptionId: string, isProcessCancellation: boolean): void {
    const currentInscriptions = this.inscriptions$.getValue();

    if (isProcessCancellation) {
      // Si es una cancelación durante el proceso, eliminar completamente la inscripción de la lista local
      console.log('[InscriptionService] Error en cancelación durante el proceso, eliminando inscripción de la lista local');
      const filteredInscriptions = currentInscriptions.filter(ins => ins.id !== inscriptionId);
      this.inscriptions$.next(filteredInscriptions);
    } else {
      // Si es una cancelación de una postulación completada, actualizar su estado a CANCELLED
      console.log('[InscriptionService] Error en cancelación de postulación completada, actualizando estado a CANCELLED');
      const updatedInscriptions = currentInscriptions.map(ins => {
        if (ins.id === inscriptionId) {
          return {
            ...ins,
            state: InscripcionState.CANCELLED,
            updatedAt: new Date()
          };
        }
        return ins;
      });
      this.inscriptions$.next(updatedInscriptions);
    }
  }

  // Variable para controlar los reintentos
  private updateStatusRetryCount: Record<string, number> = {};
  private readonly MAX_RETRY_ATTEMPTS = 3;

  /**
   * Maps frontend states to backend states
   * The backend only accepts: ACTIVE, PENDING, APPROVED, REJECTED, CANCELLED
   */
  private mapFrontendStateToBackend(state: InscripcionState): string {
    switch (state) {
      // Standard states (direct mapping)
      case InscripcionState.ACTIVE:
        return 'ACTIVE';    // Inscription in progress
      case InscripcionState.PENDING:
        return 'PENDING';   // Inscription completed by user, waiting for validation
      case InscripcionState.APPROVED:
        return 'APPROVED';  // Inscription approved by admin
      case InscripcionState.REJECTED:
        return 'REJECTED';  // Inscription rejected by admin
      case InscripcionState.CANCELLED:
        return 'CANCELLED'; // Inscription cancelled by user

      // Legacy states (mapping to standardized states)
      case InscripcionState.IN_PROCESS:
        return 'ACTIVE';    // Now mapped to ACTIVE
      case InscripcionState.PENDIENTE:
        return 'PENDING';   // Spanish for PENDING
      case InscripcionState.INSCRIPTO:
        return 'APPROVED';  // Spanish for APPROVED
      case InscripcionState.CONFIRMADA:
        return 'PENDING';   // Old term for PENDING
      case InscripcionState.NO_INSCRIPTO:
      default:
        return 'ACTIVE';    // Default to ACTIVE for new inscriptions
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

    // Determinar qué endpoint usar según el estado
    // Si es PENDING, usar el endpoint user-status que permite a usuarios normales cambiar a PENDING
    // Si es otro estado, usar el endpoint status que requiere permisos de administrador
    // Try the new endpoint first, but fall back to the old one if needed
    const endpoint = backendState === 'PENDING'
      ? `${this.baseUrl}${this.inscriptionsEndpoint}/${inscriptionId}/user-status?status=${backendState}`
      : `${this.baseUrl}${this.inscriptionsEndpoint}/${inscriptionId}/status?status=${backendState}`;

    // Keep old endpoint for backward compatibility during transition
    // This will be used in the catch block if the first attempt fails
    // const oldEndpoint = backendState === 'PENDING'
    //   ? `${this.baseUrl}${this.oldInscriptionsEndpoint}/${inscriptionId}/user-status?status=${backendState}`
    //   : `${this.baseUrl}${this.oldInscriptionsEndpoint}/${inscriptionId}/status?status=${backendState}`;

    console.log(`[InscriptionService] Using endpoint: ${endpoint}`);

    return this.http.patch<IInscriptionResponse>(
      endpoint,
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

        // Si es un error 403 o 404 y estamos intentando cambiar a PENDING, intentar con el otro endpoint
        if ((error.status === 403 || error.status === 404) && backendState === 'PENDING' && this.updateStatusRetryCount[inscriptionId] === 1) {
          console.log(`[InscriptionService] Error ${error.status}, trying alternative endpoint for PENDING`);

          // First try the alternative new endpoint (switch between user-status and status)
          const alternativeEndpoint = endpoint.includes('user-status')
            ? `${this.baseUrl}${this.inscriptionsEndpoint}/${inscriptionId}/status?status=${backendState}`
            : `${this.baseUrl}${this.inscriptionsEndpoint}/${inscriptionId}/user-status?status=${backendState}`;

          console.log(`[InscriptionService] Using alternative endpoint: ${alternativeEndpoint}`);

          // Incrementar el contador de reintentos
          this.updateStatusRetryCount[inscriptionId]++;

          return this.http.patch<IInscriptionResponse>(alternativeEndpoint, {}).pipe(
            tap(response => {
              console.log('[InscriptionService] Status updated with alternative endpoint:', response);
              // Limpiar el contador de reintentos al tener éxito
              delete this.updateStatusRetryCount[inscriptionId];
              // Refrescar la lista después de un breve delay
              setTimeout(() => this.refreshInscriptions(), 500);
            }),
            catchError(secondError => {
              console.error('[InscriptionService] Error in second attempt:', secondError);

              // If both new endpoints fail, try the old endpoints for backward compatibility
              if ((secondError.status === 403 || secondError.status === 404) && this.updateStatusRetryCount[inscriptionId] === 2) {
                console.log(`[InscriptionService] Error ${secondError.status}, trying old endpoint format`);

                // Try the old endpoint format
                const oldEndpoint = backendState === 'PENDING'
                  ? `${this.baseUrl}${this.oldInscriptionsEndpoint}/${inscriptionId}/user-status?status=${backendState}`
                  : `${this.baseUrl}${this.oldInscriptionsEndpoint}/${inscriptionId}/status?status=${backendState}`;

                console.log(`[InscriptionService] Using old endpoint format: ${oldEndpoint}`);

                // Incrementar el contador de reintentos
                this.updateStatusRetryCount[inscriptionId]++;

                return this.http.patch<IInscriptionResponse>(oldEndpoint, {}).pipe(
                  tap(response => {
                    console.log('[InscriptionService] Status updated with old endpoint format:', response);
                    // Limpiar el contador de reintentos al tener éxito
                    delete this.updateStatusRetryCount[inscriptionId];
                    // Refrescar la lista después de un breve delay
                    setTimeout(() => this.refreshInscriptions(), 500);
                  }),
                  catchError(thirdError => {
                    console.error('[InscriptionService] Error in third attempt with old endpoint:', thirdError);
                    // Limpiar el contador de reintentos para evitar bucles infinitos
                    delete this.updateStatusRetryCount[inscriptionId];
                    // Ya actualizamos el estado local, así que podemos devolver un observable exitoso
                    return of({
                      id: inscriptionId,
                      contestId: 0,
                      userId: '',
                      status: request.state,
                      inscriptionDate: new Date().toISOString(),
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    } as IInscriptionResponse);
                  })
                );
              }

              // Limpiar el contador de reintentos para evitar bucles infinitos
              delete this.updateStatusRetryCount[inscriptionId];
              // Ya actualizamos el estado local, así que podemos devolver un observable exitoso
              return of({
                id: inscriptionId,
                contestId: 0,
                userId: '',
                status: request.state,
                inscriptionDate: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              } as IInscriptionResponse);
            })
          );
        }

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

    // Si el estado es final (PENDIENTE, INSCRIPTO, CANCELLED o REJECTED), limpiar el estado local en localStorage
    if (newState === InscripcionState.PENDIENTE ||
        newState === InscripcionState.INSCRIPTO ||
        newState === InscripcionState.APPROVED ||
        newState === InscripcionState.CANCELLED ||
        newState === InscripcionState.REJECTED) {
      // Limpiar el estado del formulario en memoria
      this.clearFormState(inscriptionId);

      // Limpiar el estado en localStorage
      console.log('[InscriptionService] Limpiando estado local en localStorage para inscripción:', inscriptionId);
      this.inscriptionStateService.clearInscriptionState(inscriptionId);
    }
  }

  // Variable para controlar los reintentos de actualización de paso
  private updateStepRetryCount: Record<string, number> = {};

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

    // Usar la ruta correcta con el método PUT en lugar de PATCH
    // El controlador en el backend usa @PutMapping("/{inscriptionId}/step")
    return this.http.put<IInscriptionResponse>(
      `${this.baseUrl}${this.inscriptionsEndpoint}/${inscriptionId}/step`,
      {
        step: request.step,
        centroDeVida: request.centroDeVida,
        selectedCircunscripciones: request.selectedCircunscripciones,
        acceptedTerms: request.acceptedTerms,
        confirmedPersonalData: request.confirmedPersonalData
      } // Enviar todos los datos en el cuerpo JSON
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
          // Si el primer intento falló, intentar con ruta alternativa
          if (this.updateStepRetryCount[inscriptionId] === 1) {
            console.log('[InscriptionService] Primer intento fallido, intentando con ruta alternativa');
            return this.http.put<IInscriptionResponse>(
              `${this.baseUrl}${this.oldInscriptionsEndpoint}/${inscriptionId}/step`,
              {
                step: request.step,
                centroDeVida: request.centroDeVida,
                selectedCircunscripciones: request.selectedCircunscripciones,
                acceptedTerms: request.acceptedTerms,
                confirmedPersonalData: request.confirmedPersonalData
              }
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

  refreshInscriptions(): Observable<Page<IInscriptionResponse>> {
    // Evitar múltiples llamadas simultáneas
    if (this.refreshInProgress) {
      console.log('[InscriptionService] Ya hay una actualización en progreso, devolviendo observable vacío');
      return EMPTY;
    }

    // Aplicar throttling para evitar demasiadas peticiones
    const now = Date.now();
    const timeSinceLastRefresh = now - this.lastRefreshTimestamp;

    if (timeSinceLastRefresh < this.MIN_REFRESH_INTERVAL) {
      console.log(`[InscriptionService] Throttling aplicado, última actualización hace ${timeSinceLastRefresh}ms`);
      return EMPTY;
    }

    console.log('[InscriptionService] Actualizando lista de inscripciones...');
    this.refreshInProgress = true;
    this.lastRefreshTimestamp = now;

    return this.getUserInscriptions().pipe(
      take(1),
      finalize(() => {
        this.refreshInProgress = false;
      }),
      catchError(error => {
        console.error('[InscriptionService] Error al actualizar inscripciones:', error);
        return EMPTY;
      })
    );
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
   * Maps backend states to frontend states
   * This method converts states received from the backend to the states used by the frontend
   */
  private mapStatusToState(status: string): InscripcionState {
    if (!status) {
      console.warn('[InscriptionService] Null or undefined status');
      return InscripcionState.ACTIVE; // Default to ACTIVE for undefined states
    }

    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      // Standard states (direct mapping to standardized states)
      case 'ACTIVE':
        return InscripcionState.ACTIVE;    // Inscription in progress
      case 'PENDING':
        return InscripcionState.PENDING;   // Inscription completed by user, waiting for validation
      case 'APPROVED':
        return InscripcionState.APPROVED;  // Inscription approved by admin
      case 'REJECTED':
        return InscripcionState.REJECTED;  // Inscription rejected by admin
      case 'CANCELLED':
        return InscripcionState.CANCELLED; // Inscription cancelled by user

      // Legacy backend states (mapping to standardized states)
      case 'IN_PROCESS':
        return InscripcionState.ACTIVE;    // Now mapped to ACTIVE
      case 'CANCELED':
      case 'CANCELADA':
      case 'CANCELADO':
        console.log('[InscriptionService] Legacy CANCELLED state received from backend');
        return InscripcionState.CANCELLED; // All variations map to CANCELLED
      case 'RECHAZADA':
      case 'RECHAZADO':
        return InscripcionState.REJECTED;  // Spanish variations map to REJECTED
      case 'CONFIRMADA':
        return InscripcionState.PENDING;   // Old term maps to PENDING
      default:
        console.warn('[InscriptionService] Unknown status:', status);
        return InscripcionState.ACTIVE;    // Default to ACTIVE for unknown states
    }
  }

  /**
   * Guarda el estado del formulario de inscripción en memoria
   * @param inscriptionId ID de la inscripción
   * @param formState Estado del formulario
   */
  saveFormState(inscriptionId: string, formState: unknown): void {
    console.log('[InscriptionService] Guardando estado del formulario:', { inscriptionId, formState });
    this.inProgressInscriptions.set(inscriptionId, formState as Record<string, unknown>);
  }

  // Cache para evitar llamadas repetitivas a getFormState
  private formStateCache = new Map<string, Record<string, unknown> | null>();

  /**
   * Recupera el estado del formulario de inscripción desde la memoria
   * @param inscriptionId ID de la inscripción
   * @returns Estado del formulario o null si no existe
   */
  getFormState(inscriptionId: string): Record<string, unknown> | null {
    // Verificar si ya tenemos el estado en cache
    if (this.formStateCache.has(inscriptionId)) {
      return this.formStateCache.get(inscriptionId) || null;
    }

    // Si no está en cache, obtenerlo y guardarlo
    const state = this.inProgressInscriptions.get(inscriptionId);
    console.log('[InscriptionService] Recuperando estado del formulario:', { inscriptionId, state });

    // Guardar en cache para futuras llamadas
    this.formStateCache.set(inscriptionId, state || null);

    return state || null;
  }

  /**
   * Limpia el estado del formulario de inscripción
   * @param inscriptionId ID de la inscripción
   */
  clearFormState(inscriptionId: string): void {
    console.log('[InscriptionService] Limpiando estado del formulario:', inscriptionId);
    this.inProgressInscriptions.delete(inscriptionId);
    // También limpiar la cache
    this.formStateCache.delete(inscriptionId);
  }
}
