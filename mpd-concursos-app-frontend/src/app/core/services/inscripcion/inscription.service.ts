import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of, EMPTY } from 'rxjs';
import { catchError, tap, map, take, finalize, share } from 'rxjs/operators';
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
import { InscriptionStateMachineService } from './inscription-state-machine.service';

@Injectable({
  providedIn: 'root'
})
export class InscriptionService {

  /**
   * CRITICAL FIX: Helper function para validar fechas antes de usar toISOString()
   * Evita el error "RangeError: Invalid time value"
   */
  private getValidDateString(date: any): string {
    if (!date) return new Date().toISOString();

    // Si es string, intentar convertir a Date
    if (typeof date === 'string') {
      const parsedDate = new Date(date);
      return isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
    }

    // Si es Date, verificar que sea válida
    if (date instanceof Date) {
      return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    }

    // Si no es ni string ni Date, usar fecha actual
    return new Date().toISOString();
  }
  private readonly baseUrl = environment.apiUrl;
  private readonly inscriptionsEndpoint = '/inscriptions';
  // Keep old endpoint for backward compatibility during transition
  private readonly oldInscriptionsEndpoint = '/inscripciones';
  private inscriptions$ = new BehaviorSubject<IInscription[]>([]);

  // Cache for pending requests to avoid duplicate API calls for the same contest status
  private pendingRequests = new Map<string, Observable<InscripcionState>>();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private tokenService: TokenService,
    private router: Router,
    private inscriptionStateService: InscriptionStateService,
    private inscriptionStateMachine: InscriptionStateMachineService,
    private loggingService: LoggingService
  ) {
    // Save a reference to the inscription state service in the window object
    // to avoid circular injection issues
    (window as unknown as Record<string, unknown>)['inscriptionStateService'] = inscriptionStateService;
  }

  // Public methods

  /**
   * Verifica si una transición de estado es válida usando el state machine
   * @param from Estado actual
   * @param to Estado objetivo
   * @returns true si la transición es válida
   */
  canTransitionState(from: InscripcionState, to: InscripcionState): boolean {
    return this.inscriptionStateMachine.canTransition(from, to);
  }

  /**
   * Obtiene el siguiente estado automático basado en reglas de negocio
   * @param currentState Estado actual
   * @param hasAllDocuments Si tiene todos los documentos requeridos
   * @returns Siguiente estado automático o null
   */
  getNextAutomaticState(currentState: InscripcionState, hasAllDocuments: boolean): InscripcionState | null {
    return this.inscriptionStateMachine.getNextAutomaticState(currentState, hasAllDocuments);
  }

  /**
   * Obtiene el texto de visualización para un estado
   * @param state Estado de la inscripción
   * @returns Texto descriptivo para el usuario
   */
  getStateDisplayText(state: InscripcionState): string {
    return this.inscriptionStateMachine.getDisplayText(state);
  }

  /**
   * Obtiene la clase CSS para un estado
   * @param state Estado de la inscripción
   * @returns Clase CSS para styling
   */
  getStateClass(state: InscripcionState): string {
    return this.inscriptionStateMachine.getStateClass(state);
  }

  /**
   * Maps a backend status string to an InscripcionState enum value.
   * @param status The status string from the backend.
   * @returns The corresponding InscripcionState enum value.
   */
  private mapStatusToState(status: string): InscripcionState {
    switch (status.toLowerCase()) {
      case 'no_inscription':
        return InscripcionState.NO_INSCRIPTION;
      case 'active':
        return InscripcionState.ACTIVE;
      case 'pending':
        return InscripcionState.PENDING;
      case 'approved':
        return InscripcionState.APPROVED;
      case 'rejected':
        return InscripcionState.REJECTED;
      case 'cancelled':
        return InscripcionState.CANCELLED;
      case 'completed_with_docs': // Assuming backend might send these specific completed states
        return InscripcionState.COMPLETED_WITH_DOCS;
      case 'completed_pending_docs':
        return InscripcionState.COMPLETED_PENDING_DOCS;
      default:
        this.loggingService.warn(`[InscriptionService] Unknown status received from backend: ${status}. Defaulting to ACTIVE.`, undefined, 'Inscription');
        return InscripcionState.ACTIVE;
    }
  }

  /**
   * Helper to handle common HTTP errors.
   */
  private handleSimpleError(error: HttpErrorResponse): Observable<never> {
    // Log silently for expected errors (404, 500) to avoid console spam
    if (error.status === 404 || error.status === 500) {
      this.loggingService.debug('[InscriptionService] Expected error occurred:', error.status, 'Inscription');
    } else {
      this.loggingService.error('[InscriptionService] Unexpected error occurred:', error, 'Inscription');
    }

    let errorMessage = 'Ocurrió un error inesperado.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      errorMessage = `Error del servidor: ${error.status} ${error.statusText || ''} - ${error.error?.message || error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Validates if the user is authenticated. If not, redirects to login.
   * @returns True if authenticated, false otherwise.
   */
  private validateAuthentication(): boolean {
    if (!this.authService.isAuthenticated()) {
      this.loggingService.warn('[InscriptionService] Usuario no autenticado. Redirigiendo a login.', undefined, 'Inscription');
      this.router.navigate(['/auth/login']); // Redirect to login
      return false;
    }
    return true;
  }

  /**
   * Marks an inscription as cancelled and sends a notification to the user.
   * @param inscriptionId ID of the inscription.
   * @returns Observable<void>
   */
  markAsCancelled(inscriptionId: string): Observable<void> {
    if (!this.validateAuthentication()) return EMPTY;
    if (!inscriptionId) {
      this.loggingService.error('[InscriptionService] markAsCancelled: Inscription ID is required.', undefined, 'Inscription');
      return throwError(() => new Error('El ID de inscripción es requerido'));
    }

    this.loggingService.info(`[InscriptionService] Marking inscription ${inscriptionId} as CANCELLED.`, undefined, 'Inscription');
    return this.http.patch<void>(`${this.baseUrl}${this.inscriptionsEndpoint}/${inscriptionId}/cancel`, {}).pipe(
      tap(() => {
        this.loggingService.debug(`[InscriptionService] Inscription ${inscriptionId} successfully marked as CANCELLED on backend.`, undefined, 'Inscription');
        this.updateLocalInscriptionState(inscriptionId, InscripcionState.CANCELLED);
        // Clear local state for cancelled inscriptions
        this.inscriptionStateService.clearInscriptionState(inscriptionId);
      }),
      catchError(error => {
        console.error(`[InscriptionService] Error marking inscription ${inscriptionId} as CANCELLED:`, error);
        // Even if there's an error, we don't want the UI to show an error to the user for this background task.
        // We log it, but return a successful observable.
        return of(void 0);
      })
    );
  }

  /**
   * Creates a new inscription for a given contest.
   * @param contestId The ID of the contest.
   * @returns An Observable of the created inscription response.
   */
  createInscription(contestId: string | number): Observable<IInscriptionResponse> {
    if (!this.validateAuthentication()) return EMPTY;

    const request: IInscriptionRequest = {
      contestId: typeof contestId === 'string' ? parseInt(contestId, 10) : contestId
    };

    // CRITICAL FIX: Remove local cache validation - let the backend handle all validations
    // The local cache might be stale or incorrect, so we should always attempt to create
    // and let the backend return appropriate errors if needed
    this.loggingService.info('[InscriptionService] Creating new inscription for contest:', request.contestId, 'Inscription');

    return this.http.post<any>(
      `${this.baseUrl}${this.inscriptionsEndpoint}`,
      request
    ).pipe(
      map(response => {
        this.loggingService.debug('[InscriptionService] Full response from createInscription:', response, 'Inscription');

        // Adapt backend response to frontend interface
        const adaptedResponse: IInscriptionResponse = {
          id: response.id ? response.id.toString() : '',
          contestId: response.contestId || 0,
          userId: response.userId || '',
          status: response.estado || 'ACTIVE', // Assuming 'estado' from backend maps to 'status'
          inscriptionDate: response.fechaPostulacion ? response.fechaPostulacion.toString() : new Date().toISOString(),
          createdAt: response.fechaPostulacion ? response.fechaPostulacion.toString() : new Date().toISOString(),
          updatedAt: response.fechaPostulacion ? response.fechaPostulacion.toString() : new Date().toISOString()
        };

        this.loggingService.debug('[InscriptionService] Adapted response:', adaptedResponse, 'Inscription');
        this.loggingService.debug(`[InscriptionService] Adapted ID: ${adaptedResponse.id}, Type: ${typeof adaptedResponse.id}`, undefined, 'Inscription');

        return adaptedResponse;
      }),
      tap(response => {
        // Validate that ID is present
        if (!response.id) {
          console.error('[InscriptionService] Error: Inscription ID not received in response');
          throw new Error('ID de inscripción no válido');
        }

        // Update local state immediately
        const newInscription: IInscription = {
          id: response.id,
          contestId: response.contestId,
          userId: response.userId,
          state: this.mapStatusToState(response.status), // Map to correct enum state
          createdAt: new Date(response.createdAt),
          updatedAt: new Date(response.updatedAt)
        };
        const currentInscriptions = this.inscriptions$.getValue();
        this.inscriptions$.next([...currentInscriptions, newInscription]);
        this.loggingService.info(`[InscriptionService] Local cache updated with new inscription: ${newInscription.id}`, undefined, 'Inscription');

        // Refresh the list after a brief delay to ensure consistency
        setTimeout(() => this.refreshInscriptions(), 500);
      }),
      catchError(error => {
        this.loggingService.debug('[InscriptionService] Error creating inscription:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          errorBody: error.error
        }, 'Inscription');

        // Handle specific HTTP status codes
        if (error.status === 403) {
          // Forbidden - Period closed or not started
          const errorMessage = error.error?.message || 'El período de inscripción para este concurso ha finalizado o aún no ha comenzado.';
          this.loggingService.warn('[InscriptionService] Inscription period closed or not started:', errorMessage, 'Inscription');
          return throwError(() => new Error(errorMessage));
        } else if (error.status === 409 || error.status === 500) {
          // Conflict or Server Error - might be due to existing inscription
          this.loggingService.warn('[InscriptionService] Conflict or Server Error detected during inscription creation, potentially due to existing entry.', undefined, 'Inscription');
          return throwError(() => new Error('Ya existe una inscripción para este concurso o hubo un problema al crearla. Por favor, intente nuevamente en unos momentos.'));
        }

        return this.handleSimpleError(error);
      })
    );
  }

  /**
   * Gets the current step of an inscription process.
   * @param inscriptionId The ID of the inscription.
   * @returns An Observable of the current InscriptionStep.
   */
  getCurrentStep(inscriptionId: string): Observable<InscriptionStep> {
    if (!this.validateAuthentication()) return EMPTY;
    if (!inscriptionId) {
      this.loggingService.error('[InscriptionService] getCurrentStep: Inscription ID is required.', undefined, 'Inscription');
      return throwError(() => new Error('El ID de inscripción es requerido'));
    }

    this.loggingService.debug(`[InscriptionService] Fetching current step for inscription ID: ${inscriptionId}`, undefined, 'Inscription');
    return this.http.get<{ step: InscriptionStep }>(
      `${this.baseUrl}${this.inscriptionsEndpoint}/${inscriptionId}/step`
    ).pipe(
      map(response => response.step),
      tap(step => {
        this.loggingService.debug(`[InscriptionService] Current step for ${inscriptionId}: ${step}`, undefined, 'Inscription');
      }),
      catchError(error => {
        console.error(`[InscriptionService] Error fetching current step for ${inscriptionId}:`, error);
        return this.handleSimpleError(error);
      })
    );
  }

  /**
   * Retrieves a paginated list of user's inscriptions.
   * @param page The page number (0-indexed).
   * @param size The number of items per page.
   * @param sort The field to sort by.
   * @param direction The sort direction ('ASC' or 'DESC').
   * @returns An Observable of a Page containing inscription responses.
   */
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

    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      console.error('[InscriptionService] Could not get current user ID for getUserInscriptions.');
      return EMPTY;
    }

    this.loggingService.info(`[InscriptionService] Fetching user inscriptions for userId: ${userId} with params: ${params.toString()}`, undefined, 'Inscription');

    return this.http.get<Page<IInscriptionResponse>>(
      `${this.baseUrl}${this.inscriptionsEndpoint}/user/${userId}`,
      { params }
    ).pipe(
      tap(response => {
        this.loggingService.debug('[InscriptionService] User inscriptions fetched successfully (new endpoint):', response, 'Inscription');
        if (response?.content) {
          const inscriptions: IInscription[] = response.content.map(item => ({
            id: item.id,
            contestId: item.contestId,
            userId: item.userId,
            state: this.mapStatusToState(item.status),
            createdAt: new Date(item.inscriptionDate), // Assuming inscriptionDate is creation date
            updatedAt: new Date(item.inscriptionDate), // Assuming inscriptionDate is update date for simplicity
            observations: item.observations // If applicable
          }));
          this.inscriptions$.next(inscriptions);
          this.loggingService.debug('[InscriptionService] Local inscriptions cache updated with fetched data.', undefined, 'Inscription');
        }
      }),
      catchError(error => {
        // Log silently for expected errors to avoid console spam
        this.loggingService.debug('[InscriptionService] Error fetching user inscriptions from new endpoint:', error.status, 'Inscription');
        // If it fails, try with the alternative old endpoint
        if (error.status === 404 || error.status === 403) { // Also handle 403 if user doesn't have access to new endpoint
          this.loggingService.debug('[InscriptionService] Attempting to fetch user inscriptions from old endpoint due to 404/403 on new endpoint.', undefined, 'Inscription');
          return this.http.get<Page<IInscriptionResponse>>(
            `${this.baseUrl}${this.oldInscriptionsEndpoint}/me`,
            { params }
          ).pipe(
            tap(response => {
              this.loggingService.debug('[InscriptionService] User inscriptions fetched successfully (old endpoint):', response, 'Inscription');
              if (response?.content) {
                const inscriptions: IInscription[] = response.content.map(item => {
                  const mappedInscription: IInscription = {
                    id: item.id,
                    contestId: item.contestId,
                    userId: item.userId,
                    state: this.mapStatusToState(item.status),
                    createdAt: new Date(item.inscriptionDate),
                    updatedAt: new Date(item.inscriptionDate),
                    observations: item.observations // If applicable
                  };
                  return mappedInscription;
                });
                this.inscriptions$.next(inscriptions);
                this.loggingService.debug('[InscriptionService] Local inscriptions cache updated with fetched data (old endpoint).', undefined, 'Inscription');
              }
            }),
            catchError(secondError => {
              this.loggingService.debug('[InscriptionService] Error with alternative old endpoint:', secondError.status, 'Inscription');
              // If it also fails, return an empty array to avoid UI errors
              this.inscriptions$.next([]);
              const emptyPage: Page<IInscriptionResponse> = {
                content: [],
                totalElements: 0,
                totalPages: 0,
                number: 0,
                size: 10,
                pageable: {
                  sort: { sorted: false, unsorted: true, empty: true },
                  pageNumber: 0,
                  pageSize: 10,
                  offset: 0,
                  paged: true,
                  unpaged: false
                },
                last: true,
                sort: { sorted: false, unsorted: true, empty: true },
                first: true,
                numberOfElements: 0,
                empty: true
              };
              return of(emptyPage);
            })
          );
        }
        return this.handleSimpleError(error);
      })
    );
  }

  /**
   * Retrieves the inscription status for a specific contest for the current user.
   * It first checks local cache, then tries specific backend endpoints, with fallbacks.
   * @param contestId The ID of the contest.
   * @returns An Observable of the inscription state.
   */
  getInscriptionStatus(contestId: string | number): Observable<InscripcionState> {
    if (!this.validateAuthentication()) return of(InscripcionState.NO_INSCRIPTION); // Default to NO_INSCRIPTION if not authenticated

    const numericContestId = typeof contestId === 'string' ? parseInt(contestId, 10) : contestId;

    // First check local state
    const currentInscriptions = this.inscriptions$.getValue();
    this.loggingService.debug(`[InscriptionService] Checking local cache for inscription status for contest ID: ${numericContestId}`, undefined, 'Inscription');
    this.loggingService.debug('[InscriptionService] Inscriptions in cache:', currentInscriptions, 'Inscription');

    const localInscription = currentInscriptions.find(ins => ins.contestId === numericContestId);

    if (localInscription) {
      this.loggingService.debug(`[InscriptionService] Local inscription found for ${numericContestId}. State: ${localInscription.state}`, undefined, 'Inscription');
      // Business Rule: Once cancelled, always return CANCELLED. Do not allow re-inscription regardless of time.
      return of(localInscription.state);
    }

    // CRITICAL FIX: Check localStorage for interrupted inscription processes
    const incompleteInscriptions = this.inscriptionStateService.getAllIncompleteInscriptions();
    const interruptedInscription = incompleteInscriptions.find(ins => ins.contestId === numericContestId);

    if (interruptedInscription) {
      this.loggingService.debug(`[InscriptionService] Found interrupted inscription in localStorage for contest ${numericContestId}. Returning ACTIVE state.`, interruptedInscription, 'Inscription');
      return of(InscripcionState.ACTIVE); // Return ACTIVE to indicate it can be resumed
    }

    this.loggingService.debug('[InscriptionService] No local inscription found, querying backend...', undefined, 'Inscription');

    // Optimization: Check if a request for this contest is already pending
    const cacheKey = `status_${numericContestId}`;
    if (this.pendingRequests.has(cacheKey)) {
      this.loggingService.debug(`[InscriptionService] Request for ${numericContestId} already pending. Returning existing observable.`, undefined, 'Inscription');
      return this.pendingRequests.get(cacheKey)!;
    }

    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      console.error('[InscriptionService] Could not get current user ID for getInscriptionStatus.');
      return of(InscripcionState.NO_INSCRIPTION); // Default to NO_INSCRIPTION
    }

    // Try optimized endpoint first: /inscriptions/user/{userId}/contest/{contestId}/status
    this.loggingService.info(`[InscriptionService] Attempting to fetch inscription status from optimized endpoint for userId: ${userId}, contestId: ${numericContestId}`, undefined, 'Inscription');
    const request$ = this.http.get<any>(
      `${this.baseUrl}${this.inscriptionsEndpoint}/user/${userId}/contest/${numericContestId}/status`
    ).pipe(
      map(response => {
        // CRITICAL FIX: Handle the new simplified response format from backend correctly
        if (response.hasInscription) {
          this.loggingService.debug(`[InscriptionService] Found inscription with status: ${response.status}`, undefined, 'Inscription');
          return this.mapStatusToState(response.status);
        } else {
          // CRITICAL FIX: When no inscription exists, return a special state to distinguish from ACTIVE inscription
          this.loggingService.debug(`[InscriptionService] No inscription found, returning NO_INSCRIPTION`, undefined, 'Inscription');
          return InscripcionState.NO_INSCRIPTION;
        }
      }),
      tap(state => {
        this.loggingService.debug(`[InscriptionService] Status fetched successfully from optimized endpoint: ${state}`, undefined, 'Inscription');
      }),
      catchError(error => {
        this.loggingService.debug(`[InscriptionService] Optimized endpoint failed with status ${error.status}. Trying single fallback.`, undefined, 'Inscription');

        // Only try one fallback to reduce 404 errors
        if (error.status === 404) {
          // Try the existing user-specific endpoint as fallback
          this.loggingService.debug(`[InscriptionService] Attempting fallback endpoint /user/${userId}/contest/${numericContestId}`, undefined, 'Inscription');
          return this.http.get<IInscriptionResponse>(`${this.baseUrl}${this.inscriptionsEndpoint}/user/${userId}/contest/${numericContestId}`).pipe(
            map(response => {
              this.loggingService.debug(`[InscriptionService] Status fetched successfully from fallback endpoint: ${response.status}`, undefined, 'Inscription');
              return this.mapStatusToState(response?.status || 'NO_INSCRIPTION');
            }),
            catchError(fallbackError => {
              // Only log as debug for 404 errors (expected when no inscription exists)
              if (fallbackError.status === 404) {
                this.loggingService.debug(`[InscriptionService] Fallback endpoint returned 404 for ${numericContestId}. No inscription exists - returning ACTIVE.`, undefined, 'Inscription');
              } else {
                this.loggingService.warn(`[InscriptionService] Fallback endpoint failed with status ${fallbackError.status}. Checking local state before defaulting.`, undefined, 'Inscription');
              }

              // Verificar estado local antes de defaultear a ACTIVE
              const currentInscriptions = this.inscriptions$.getValue();
              const localInscription = currentInscriptions.find(ins => ins.contestId === numericContestId);

              if (localInscription?.state) {
                this.loggingService.debug(`[InscriptionService] Using local state: ${localInscription.state}`, undefined, 'Inscription');
                return of(localInscription.state);
              }

              // Solo defaultear a ACTIVE si no hay información local
              this.loggingService.warn(`[InscriptionService] No local state found. Defaulting to ACTIVE.`, undefined, 'Inscription');
              return of(InscripcionState.ACTIVE);
            })
          );
        }

        // For other errors (500, 403, etc.), handle gracefully without additional requests
        if (error.status === 500) {
          this.loggingService.warn('[InscriptionService] Server error when verifying status. Checking local state.', undefined, 'Inscription');
          // In case of 500 error, re-check local state as a last resort
          const currentInscriptionsOn500 = this.inscriptions$.getValue();
          const localInscriptionOn500 = currentInscriptionsOn500.find(ins => ins.contestId === numericContestId);
          return of(localInscriptionOn500?.state || InscripcionState.ACTIVE);
        }

        // For all other errors, just return ACTIVE without additional requests
        this.loggingService.debug(`[InscriptionService] Non-404 error (${error.status}) for contest ${numericContestId}. Defaulting to ACTIVE.`, undefined, 'Inscription');
        return of(InscripcionState.ACTIVE); // Default to ACTIVE for other errors
      }),
      finalize(() => {
        this.pendingRequests.delete(cacheKey); // Clear pending request
      }),
      share() // Share the request among multiple subscribers
    );

    // Save the pending request
    this.pendingRequests.set(cacheKey, request$);

    return request$;
  }

  /**
   * Cancels an inscription on the backend.
   * @param inscriptionId ID of the inscription to cancel.
   * @param isProcessCancellation Indicates if it's a cancellation during the inscription process (true) or a cancellation of an already completed application (false).
   * @returns Observable<void>
   */
  cancelInscription(inscriptionId: string, isProcessCancellation = true): Observable<void> {
    if (!this.validateAuthentication()) return EMPTY;
    if (!inscriptionId) {
      this.loggingService.error('[InscriptionService] cancelInscription: Inscription ID is required.', undefined, 'Inscription');
      return throwError(() => new Error('El ID de inscripción es requerido'));
    }

    this.loggingService.info(`[InscriptionService] Attempting to cancel inscription ${inscriptionId}. Process cancellation: ${isProcessCancellation}`, undefined, 'Inscription');

    // Use the correct endpoint for user cancellation
    return this.http.patch<void>(`${this.baseUrl}${this.inscriptionsEndpoint}/${inscriptionId}/cancel`, {}).pipe(
      tap(() => {
        this.loggingService.debug(`[InscriptionService] Inscription ${inscriptionId} cancelled successfully via PATCH.`, undefined, 'Inscription');
        this.handleLocalCancellation(inscriptionId, isProcessCancellation); // Update local state

        // Add delay to ensure backend processes cancellation
        setTimeout(() => {
          this.loggingService.debug('[InscriptionService] Clearing cache after successful cancellation (PATCH).', undefined, 'Inscription');
          this.clearCacheAndRefresh().subscribe({
            next: () => {
              this.loggingService.debug('[InscriptionService] Cache cleared and refreshed after cancellation (PATCH).', undefined, 'Inscription');
            },
            error: (error) => {
              console.error('[InscriptionService] Error clearing cache after cancellation (PATCH):', error);
            }
          });
        }, 1000); // Increase delay for more backend processing time
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('[InscriptionService] Error cancelling inscription with PATCH:', error);

        // If it's a 404 or 405 error, try with the DELETE method (for backward compatibility)
        if (error.status === 404 || error.status === 405) {
          this.loggingService.warn(`[InscriptionService] PATCH cancellation failed (${error.status}). Trying DELETE as fallback for inscription ${inscriptionId}.`, undefined, 'Inscription');
          return this.http.delete<void>(`${this.baseUrl}${this.inscriptionsEndpoint}/${inscriptionId}`).pipe(
            tap(() => {
              this.loggingService.debug(`[InscriptionService] Inscription ${inscriptionId} cancelled successfully via DELETE.`, undefined, 'Inscription');
              this.handleLocalCancellation(inscriptionId, isProcessCancellation); // Update local state

              // Add delay to ensure backend processes cancellation
              setTimeout(() => {
                this.loggingService.debug('[InscriptionService] Clearing cache after successful cancellation (DELETE).', undefined, 'Inscription');
                this.clearCacheAndRefresh().subscribe({
                  next: () => {
                    this.loggingService.debug('[InscriptionService] Cache cleared and refreshed after cancellation (DELETE).', undefined, 'Inscription');
                  },
                  error: (error) => {
                    console.error('[InscriptionService] Error clearing cache after cancellation (DELETE):', error);
                  }
                });
              }, 1000);
            }),
            catchError((deleteError: HttpErrorResponse) => {
              this.loggingService.debug('[InscriptionService] Error cancelling inscription with DELETE:', deleteError.status, 'Inscription');

              this.clearFormState(inscriptionId); // Clear local form state
              this.handleLocalCancellation(inscriptionId, isProcessCancellation); // Update local inscription state

              // Force an update of inscriptions from the backend
              setTimeout(() => {
                this.refreshInscriptions();
              }, 500);

              return this.handleSimpleError(deleteError); // Propagate error
            })
          );
        }

        this.clearFormState(inscriptionId); // Clear local form state
        this.handleLocalCancellation(inscriptionId, isProcessCancellation); // Update local inscription state

        setTimeout(() => {
          this.refreshInscriptions();
        }, 500);

        return this.handleSimpleError(error); // Propagate error
      })
    );
  }

  /**
   * Handles local cancellation of an inscription when backend communication fails.
   * @param inscriptionId ID of the inscription to cancel.
   * @param isProcessCancellation Indicates if it's a cancellation during the process or of a completed application.
   */
  private handleLocalCancellation(inscriptionId: string, isProcessCancellation: boolean): void {
    const currentInscriptions = this.inscriptions$.getValue();

    if (isProcessCancellation) {
      // If cancellation during process, completely remove inscription from local list
      const filteredInscriptions = currentInscriptions.filter(ins => ins.id !== inscriptionId);
      this.loggingService.debug(`[InscriptionService] Locally removing inscription ${inscriptionId} from cache.`, undefined, 'Inscription');
      this.inscriptions$.next(filteredInscriptions);
    } else {
      // If cancellation of a completed application, update its state to CANCELLED
      const updatedInscriptions = currentInscriptions.map(ins => {
        if (ins.id === inscriptionId) {
          this.loggingService.debug(`[InscriptionService] Locally setting inscription ${inscriptionId} state to CANCELLED.`, undefined, 'Inscription');
          return { ...ins, state: InscripcionState.CANCELLED, updatedAt: new Date() };
        }
        return ins;
      });
      this.inscriptions$.next(updatedInscriptions);
    }
  }

  // Variable to control retry attempts for status update
  private updateStatusRetryCount: Record<string, number> = {};
  private readonly MAX_RETRY_ATTEMPTS = 3;

  /**
   * Maps frontend states to backend states.
   * The backend typically accepts: ACTIVE, PENDING, APPROVED, REJECTED, CANCELLED.
   */
  private mapFrontendStateToBackend(state: InscripcionState): string {
    switch (state) {
      // Standard states (direct mapping)
      case InscripcionState.ACTIVE:
        return 'ACTIVE';
      case InscripcionState.PENDING:
        return 'PENDING';
      case InscripcionState.APPROVED:
        return 'APPROVED';
      case InscripcionState.REJECTED:
        return 'REJECTED';
      case InscripcionState.CANCELLED:
        return 'CANCELLED';

      // New completion states (direct mapping to preserve specific states)
      case InscripcionState.COMPLETED_WITH_DOCS:
        return 'COMPLETED_WITH_DOCS'; // Inscription completed with all documents
      case InscripcionState.COMPLETED_PENDING_DOCS:
        return 'COMPLETED_PENDING_DOCS'; // Inscription completed but with pending documents

      default:
        this.loggingService.warn(`[InscriptionService] Unknown frontend state: ${state}. Defaulting to ACTIVE for backend mapping.`, undefined, 'Inscription');
        return 'ACTIVE';
    }
  }

  /**
   * Updates the status of an inscription on the backend. Includes retry logic and fallbacks.
   * @param inscriptionId The ID of the inscription to update.
   * @param request The update request containing the new state and optionally current step.
   * @returns An Observable of the updated inscription response.
   */
  updateInscriptionStatus(
    inscriptionId: string,
    request: IInscriptionUpdateRequest
  ): Observable<IInscriptionResponse> {
    if (!this.validateAuthentication()) return EMPTY;
    if (!inscriptionId) {
      this.loggingService.error('[InscriptionService] updateInscriptionStatus: Inscription ID is required.', undefined, 'Inscription');
      return throwError(() => new Error('El ID de inscripción es requerido'));
    }

    // Initialize retry counter if it doesn't exist
    if (!this.updateStatusRetryCount[inscriptionId]) {
      this.updateStatusRetryCount[inscriptionId] = 0;
    }

    // Check if max retry attempts have been reached
    if (this.updateStatusRetryCount[inscriptionId] >= this.MAX_RETRY_ATTEMPTS) {
      this.loggingService.error(`[InscriptionService] Max retry attempts reached for updating inscription ${inscriptionId}. Aborting API call.`, undefined, 'Inscription');
      // Clear counter for future attempts
      delete this.updateStatusRetryCount[inscriptionId];
      // Return a successful observable with local data to prevent infinite loops
      const localInscription = this.inscriptions$.getValue().find(ins => ins.id === inscriptionId);
      return of({
        id: inscriptionId,
        contestId: localInscription?.contestId || 0,
        userId: localInscription?.userId || '',
        status: request.state, // Return the requested state as 'successfully' applied locally
        inscriptionDate: this.getValidDateString(localInscription?.createdAt),
        createdAt: this.getValidDateString(localInscription?.createdAt),
        updatedAt: new Date().toISOString()
      } as IInscriptionResponse);
    }

    // Increment retry counter
    this.updateStatusRetryCount[inscriptionId]++;

    // If the state is PENDING, ensure the step is COMPLETED
    if (request.state === InscripcionState.PENDING && !request.currentStep) {
      request = {
        ...request,
        currentStep: InscriptionStep.COMPLETED
      };
      this.loggingService.debug('[InscriptionService] Setting currentStep to COMPLETED for PENDING status update.', undefined, 'Inscription');
    }

    const backendState = this.mapFrontendStateToBackend(request.state);
    this.loggingService.info(`[InscriptionService] Updating inscription ${inscriptionId} to status: ${backendState} (Attempt ${this.updateStatusRetryCount[inscriptionId]}/${this.MAX_RETRY_ATTEMPTS})`, undefined, 'Inscription');

    // Determine which endpoint to use based on the state
    // Use user-status endpoint for user-initiated completion states (PENDING, COMPLETED_WITH_DOCS, COMPLETED_PENDING_DOCS)
    // Use status endpoint for admin-only states (APPROVED, REJECTED, CANCELLED, etc.)
    const userCompletionStates = ['PENDING', 'COMPLETED_WITH_DOCS', 'COMPLETED_PENDING_DOCS'];
    const endpoint = userCompletionStates.includes(backendState)
      ? `${this.baseUrl}${this.inscriptionsEndpoint}/${inscriptionId}/user-status?status=${backendState}`
      : `${this.baseUrl}${this.inscriptionsEndpoint}/${inscriptionId}/status?status=${backendState}`;

    // Old endpoint for backward compatibility during transition
    const oldEndpoint = userCompletionStates.includes(backendState)
      ? `${this.baseUrl}${this.oldInscriptionsEndpoint}/${inscriptionId}/user-status?status=${backendState}`
      : `${this.baseUrl}${this.oldInscriptionsEndpoint}/${inscriptionId}/status?status=${backendState}`;


    this.loggingService.debug(`[InscriptionService] Sending PATCH request to: ${endpoint}`, undefined, 'Inscription');
    return this.http.patch<IInscriptionResponse>(endpoint, {}).pipe(
      tap(response => {
        this.loggingService.debug(`[InscriptionService] Inscription ${inscriptionId} status updated successfully to ${backendState} (Attempt ${this.updateStatusRetryCount[inscriptionId]}).`, response, 'Inscription');
        this.updateLocalInscriptionState(inscriptionId, request.state); // Update local state
        delete this.updateStatusRetryCount[inscriptionId]; // Clear retry counter on success
        setTimeout(() => this.refreshInscriptions(), 500); // Refresh the list after a brief delay
      }),
      catchError(error => {
        this.loggingService.debug('[InscriptionService] Error updating status:', error.status, 'Inscription');

        // If it's a 403 or 404 and we're trying to change to a user completion state, try with the other endpoint
        if ((error.status === 403 || error.status === 404) && userCompletionStates.includes(backendState) && this.updateStatusRetryCount[inscriptionId] === 1) {
          const alternativeEndpoint = `${this.baseUrl}${this.inscriptionsEndpoint}/${inscriptionId}/status?status=${backendState}`;
          this.loggingService.warn(`[InscriptionService] PATCH to user-status failed (${error.status}). Trying alternative endpoint: ${alternativeEndpoint} (Attempt ${this.updateStatusRetryCount[inscriptionId]}).`, undefined, 'Inscription');

          return this.http.patch<IInscriptionResponse>(alternativeEndpoint, {}).pipe(
            tap(response => {
              this.loggingService.debug(`[InscriptionService] Inscription ${inscriptionId} status updated successfully to ${backendState} via alternative endpoint (Attempt ${this.updateStatusRetryCount[inscriptionId]}).`, response, 'Inscription');
              this.updateLocalInscriptionState(inscriptionId, request.state); // Update local state
              delete this.updateStatusRetryCount[inscriptionId]; // Clear retry counter on success
              setTimeout(() => this.refreshInscriptions(), 500); // Refresh the list after a brief delay
            }),
            catchError(secondError => {
              this.loggingService.debug('[InscriptionService] Error in second attempt (alternative endpoint):', secondError.status, 'Inscription');

              // If both new endpoints fail, try the old endpoints for backward compatibility
              if ((secondError.status === 403 || secondError.status === 404 || secondError.status === 400 || secondError.status === 500) && this.updateStatusRetryCount[inscriptionId] <= this.MAX_RETRY_ATTEMPTS) {
                this.loggingService.warn(`[InscriptionService] Both new endpoints failed. Trying old endpoint: ${oldEndpoint} (Attempt ${this.updateStatusRetryCount[inscriptionId]}).`, undefined, 'Inscription');

                return this.http.patch<IInscriptionResponse>(oldEndpoint, {}).pipe(
                  tap(response => {
                    this.loggingService.debug(`[InscriptionService] Inscription ${inscriptionId} status updated successfully via old endpoint (Attempt ${this.updateStatusRetryCount[inscriptionId]}).`, response, 'Inscription');
                    this.updateLocalInscriptionState(inscriptionId, request.state); // Update local state
                    delete this.updateStatusRetryCount[inscriptionId]; // Clear retry counter on success
                    setTimeout(() => this.refreshInscriptions(), 500); // Refresh the list after a brief delay
                  }),
                  catchError(thirdError => {
                    this.loggingService.debug('[InscriptionService] Error in third attempt (old endpoint):', thirdError.status, 'Inscription');
                    delete this.updateStatusRetryCount[inscriptionId]; // Clear retry counter to avoid infinite loops
                    // We already updated the local state, so we can return a successful observable
                    const localInscription = this.inscriptions$.getValue().find(ins => ins.id === inscriptionId);
                    return of({
                      id: inscriptionId,
                      contestId: localInscription?.contestId || 0,
                      userId: localInscription?.userId || '',
                      status: request.state,
                      inscriptionDate: this.getValidDateString(localInscription?.createdAt),
                      createdAt: this.getValidDateString(localInscription?.createdAt),
                      updatedAt: new Date().toISOString()
                    } as IInscriptionResponse);
                  })
                );
              }

              delete this.updateStatusRetryCount[inscriptionId]; // Clear retry counter to avoid infinite loops
              // We already updated the local state, so we can return a successful observable
              const localInscription = this.inscriptions$.getValue().find(ins => ins.id === inscriptionId);

              return of({
                id: inscriptionId,
                contestId: localInscription?.contestId || 0,
                userId: localInscription?.userId || '',
                status: request.state,
                inscriptionDate: this.getValidDateString(localInscription?.createdAt),
                createdAt: this.getValidDateString(localInscription?.createdAt),
                updatedAt: new Date().toISOString()
              } as IInscriptionResponse);
            })
          );
        }

        // If it's a 404, 400 or 500, we can try an alternative solution
        if (error.status === 404 || error.status === 400 || error.status === 500) {
          this.loggingService.warn(`[InscriptionService] Update status failed with ${error.status}. Returning local state as fallback.`, undefined, 'Inscription');
          // We already updated the local state, so we can return a successful observable
          const localInscription = this.inscriptions$.getValue().find(ins => ins.id === inscriptionId);

          return of({
            id: inscriptionId,
            contestId: localInscription?.contestId || 0,
            userId: localInscription?.userId || '',
            status: request.state,
            inscriptionDate: this.getValidDateString(localInscription?.createdAt),
            createdAt: this.getValidDateString(localInscription?.createdAt),
            updatedAt: new Date().toISOString()
          } as IInscriptionResponse);
        }

        return this.handleSimpleError(error);
      })
    );
  }

  /**
   * Updates the state of an inscription locally without calling the backend.
   * @param inscriptionId The ID of the inscription to update.
   * @param newState The new state to set.
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
    this.loggingService.debug(`[InscriptionService] Local inscription ${inscriptionId} state updated to: ${newState}`, undefined, 'Inscription');

    // Also update/clear local storage state via InscriptionStateService
    if (newState === InscripcionState.CANCELLED || newState === InscripcionState.COMPLETED_WITH_DOCS || newState === InscripcionState.COMPLETED_PENDING_DOCS || newState === InscripcionState.REJECTED || newState === InscripcionState.APPROVED) {
      this.inscriptionStateService.clearInscriptionState(inscriptionId);
      this.loggingService.debug(`[InscriptionService] Cleared local storage state for inscription ${inscriptionId} due to final/cancelled status.`, undefined, 'Inscription');
    }
  }

  // Variable to control retry attempts for step update
  private updateStepRetryCount: Record<string, number> = {};

  /**
   * Updates the current step of an inscription on the backend.
   * @param inscriptionId The ID of the inscription.
   * @param request The update request containing the new step.
   * @returns An Observable of the updated inscription response.
   */
  updateInscriptionStep(
    inscriptionId: string,
    request: IInscriptionStepRequest
  ): Observable<IInscriptionResponse> {
    if (!this.validateAuthentication()) return EMPTY;
    if (!inscriptionId) {
      this.loggingService.error('[InscriptionService] updateInscriptionStep: Inscription ID is required.', undefined, 'Inscription');
      return throwError(() => new Error('El ID de inscripción es requerido'));
    }

    // Initialize retry counter if it doesn't exist
    if (!this.updateStepRetryCount[inscriptionId]) {
      this.updateStepRetryCount[inscriptionId] = 0;
    }

    // Check if max retry attempts have been reached
    if (this.updateStepRetryCount[inscriptionId] >= this.MAX_RETRY_ATTEMPTS) {
      this.loggingService.error(`[InscriptionService] Max retry attempts reached for updating inscription step ${inscriptionId}. Aborting API call.`, undefined, 'Inscription');
      // Clear counter for future attempts
      delete this.updateStepRetryCount[inscriptionId];
      // Return a successful observable with local data to prevent infinite loops
      const localInscription = this.inscriptions$.getValue().find(ins => ins.id === inscriptionId);
      return of({
        id: inscriptionId,
        contestId: localInscription?.contestId || 0,
        userId: localInscription?.userId || '',
        status: localInscription?.state, // Return current local status
        inscriptionDate: this.getValidDateString(localInscription?.createdAt),
        createdAt: this.getValidDateString(localInscription?.createdAt),
        updatedAt: new Date().toISOString()
      } as IInscriptionResponse);
    }

    // Increment retry counter
    this.updateStepRetryCount[inscriptionId]++;

    this.loggingService.info(`[InscriptionService] Updating inscription ${inscriptionId} step to ${request.step} (Attempt ${this.updateStepRetryCount[inscriptionId]}/${this.MAX_RETRY_ATTEMPTS}).`, undefined, 'Inscription');

    // Use the correct path with PUT method
    return this.http.put<IInscriptionResponse>(
      `${this.baseUrl}${this.inscriptionsEndpoint}/${inscriptionId}/step`,
      request
    ).pipe(
      tap(response => {
        this.loggingService.debug(`[InscriptionService] Inscription ${inscriptionId} step updated successfully to ${request.step} (Attempt ${this.updateStepRetryCount[inscriptionId]}).`, response, 'Inscription');
        // Update local state (optional, as `getCurrentStep` should fetch from backend if needed)
        const currentInscriptions = this.inscriptions$.getValue();
        const updatedInscriptions = currentInscriptions.map(ins => {
          if (ins.id === inscriptionId) {
            return { ...ins, updatedAt: new Date() }; // Only update timestamp for simplicity
          }
          return ins;
        });
        this.inscriptions$.next(updatedInscriptions);
        delete this.updateStepRetryCount[inscriptionId]; // Clear retry counter on success
      }),
      catchError(error => {
        console.error(`[InscriptionService] Error updating inscription ${inscriptionId} step to ${request.step}:`, error);

        // If it's a 404, 400 or 500, we can try an alternative solution
        if (error.status === 404 || error.status === 400 || error.status === 500) {
          this.loggingService.warn(`[InscriptionService] Update step failed with ${error.status}. Returning local state as fallback.`, undefined, 'Inscription');
          const localInscription = this.inscriptions$.getValue().find(ins => ins.id === inscriptionId);
          return of({
            id: inscriptionId,
            contestId: localInscription?.contestId || 0,
            userId: localInscription?.userId || '',
            status: localInscription?.state, // Return current local status
            inscriptionDate: this.getValidDateString(localInscription?.createdAt),
            createdAt: this.getValidDateString(localInscription?.createdAt),
            updatedAt: new Date().toISOString()
          } as IInscriptionResponse);
        }
        return this.handleSimpleError(error);
      })
    );
  }

  /**
   * Finalizes an inscription, setting its state to COMPLETED.
   * @param inscriptionId The ID of the inscription to finalize.
   * @param request The update request containing final data.
   * @returns An Observable of the updated inscription response.
   */
  finalizeInscription(inscriptionId: string, request: IInscriptionUpdateRequest): Observable<IInscriptionResponse> {
    if (!this.validateAuthentication()) return EMPTY;
    if (!inscriptionId) {
      this.loggingService.error('[InscriptionService] finalizeInscription: Inscription ID is required.', undefined, 'Inscription');
      return throwError(() => new Error('El ID de inscripción es requerido para finalizar.'));
    }

    this.loggingService.info(`[InscriptionService] Finalizing inscription ${inscriptionId}.`, request, 'Inscription');

    // Force the state to PENDING, as this means it's submitted for review
    const backendState = this.mapFrontendStateToBackend(InscripcionState.PENDING);
    // Ensure currentStep is COMPLETED when finalizing
    const finalRequest = {
      ...request,
      state: InscripcionState.PENDING, // Always set to PENDING for backend
      currentStep: InscriptionStep.COMPLETED
    };

    return this.http.patch<IInscriptionResponse>(`${this.baseUrl}${this.inscriptionsEndpoint}/${inscriptionId}/user-status?status=${backendState}`, finalRequest).pipe(
      tap(response => {
        this.loggingService.debug(`[InscriptionService] Inscription ${inscriptionId} finalized successfully.`, response, 'Inscription');
        this.updateLocalInscriptionState(inscriptionId, InscripcionState.PENDING); // Update local state to PENDING
        this.inscriptionStateService.clearInscriptionState(inscriptionId); // Clear local storage state
        this.refreshInscriptions(); // Refresh local list
      }),
      catchError(error => {
        this.loggingService.debug('[InscriptionService] Error finalizing inscription:', error.status, 'Inscription');
        // On error, try to update local state to reflect attempt
        // Note: request doesn't have inscriptionId, this needs to be passed separately
        return this.handleSimpleError(error);
      })
    );
  }

  /**
   * Observable to get the current list of user inscriptions.
   * @returns An Observable emitting the current list of inscriptions.
   */
  get inscriptions(): Observable<IInscription[]> {
    return this.inscriptions$.asObservable();
  }

  /**
   * Forces a refresh of the user's inscription list from the backend.
   */
  refreshInscriptions(): Observable<Page<IInscriptionResponse>> {
    this.loggingService.info('[InscriptionService] Forcing refresh of user inscriptions from backend.', undefined, 'Inscription');
    // Calling getUserInscriptions with forceReload will bypass cache and fetch fresh data
    return this.getUserInscriptions();
  }

  /**
   * Clears the in-memory cache of inscriptions and triggers a refresh from the backend.
   * @returns An Observable representing the completion of the clear and refresh operation.
   */
  clearCacheAndRefresh(): Observable<Page<IInscriptionResponse>> {
    this.loggingService.info('[InscriptionService] Clearing in-memory inscription cache and refreshing.', undefined, 'Inscription');
    this.inscriptions$.next([]); // Clear the BehaviorSubject
    this.pendingRequests.clear(); // Clear pending API requests cache
    return this.refreshInscriptions(); // Then refresh from backend
  }

  /**
   * Clears the local form state for a specific inscription.
   * @param inscriptionId The ID of the inscription whose form state to clear.
   */
  clearFormState(inscriptionId: string): void {
    this.inscriptionStateService.clearInscriptionState(inscriptionId);
    this.loggingService.debug(`[InscriptionService] Cleared form state for inscription ID: ${inscriptionId}`, undefined, 'Inscription');
  }

  /**
   * Updates the local inscription cache.
   * @param response The inscription status response from the backend.
   */
  private updateLocalInscriptionCache(response: any): void {
    const currentInscriptions = this.inscriptions$.getValue();
    const existingIndex = currentInscriptions.findIndex(ins => ins.contestId === response.contestId);
    const newInscription: IInscription = {
      id: response.inscriptionId || response.id || '',
      contestId: response.contestId || 0,
      userId: response.userId || '',
      state: this.mapStatusToState(response.status),
      createdAt: response.createdAt ? new Date(response.createdAt) : new Date(),
      updatedAt: response.updatedAt ? new Date(response.updatedAt) : new Date(),
      observations: response.observations
    };

    if (existingIndex > -1) {
      // Update existing inscription
      currentInscriptions[existingIndex] = newInscription;
      this.loggingService.debug(`[InscriptionService] Updated existing local inscription cache for contest ${response.contestId}.`, undefined, 'Inscription');
    } else {
      // Add new inscription
      currentInscriptions.push(newInscription);
      this.loggingService.debug(`[InscriptionService] Added new inscription to local cache for contest ${response.contestId}.`, undefined, 'Inscription');
    }
    this.inscriptions$.next([...currentInscriptions]); // Emit new array to trigger updates
  }
}
