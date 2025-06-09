import { Injectable, Inject } from '@angular/core';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';
import { Observable, of, throwError, retry, timeout, catchError, map, forkJoin, take } from 'rxjs';
import { Pregunta, ExamenEnCurso, RespuestaUsuario } from '@shared/interfaces/examen/pregunta.interface';

import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import { LoggingService } from '@core/services/logging/logging.service';

import { environment } from '@env/environment';


// Define a token for AuthService to avoid circular dependencies if it's in the same module
const AUTH_SERVICE_TOKEN = 'AUTH_SERVICE_TOKEN';

// Mock/Interface for AuthService (assuming it has getCurrentUserId method)
interface AuthService {
  getCurrentUserId: () => string;
}

// Mock/Interface for TimeService
interface TimeService {
  iniciar: (duracionMinutos: number) => Observable<number>;
  detener: () => void;
  getTiempoUtilizado: () => number;
  validateTimestamp: (timestamp: number) => boolean;
  getCurrentServerTime: () => number;
}

// Mock/Interface for StateService
interface StateService {
  initializeState: (examen: ExamenEnCurso) => void;
  setPreguntas: (preguntas: Pregunta[]) => void;
  getExamenEnCurso: () => Observable<ExamenEnCurso | null>;
  getPreguntas: () => Observable<Pregunta[]>;
  getPreguntaActual: () => Observable<Pregunta | null>;
  getTiempoRestante: () => Observable<number>;
  actualizarTiempoRestante: (tiempoRestante: number) => void;
  guardarRespuesta: (respuesta: RespuestaUsuario) => void;
  setPreguntaActual: (index: number) => void;
  cambiarEstadoExamen: (estado: string) => void;
}

// Mock/Interface for SecurityService
interface SecurityService {
  reset: () => void;
  reportSecurityViolation: (type: SecurityViolationType, details?: unknown) => void;
  cleanup: () => void;
}

// Mock/Interface for RecoveryService
interface RecoveryService {
  recoverExamen: (examenId: string) => Promise<ExamenEnCurso | null>;
  initializeAutoSave: (examenId: string) => void;
  saveToLocalBackup: (examenId: string, examen: ExamenEnCurso) => void;
  getLatestBackup: (examenId: string) => { examen: ExamenEnCurso } | null;
  cleanupBackups: (examenId: string) => void;
}

// Mock/Interface for ValidationService
interface ValidationService {
  generarHash: (respuesta: RespuestaUsuario) => Promise<string>;
  validarRespuesta: (respuesta: RespuestaUsuario, context: unknown) => Promise<{ isValid: boolean; violationType?: SecurityViolationType; details?: unknown }>;
  validarIntegridadPostIncidente: (respuestas: RespuestaUsuario[], backupRespuestas: RespuestaUsuario[]) => { isValid: boolean; violationType?: SecurityViolationType; details?: unknown };
}

// Mock/Interface for NotificationService
interface NotificationService {
  reset: () => void;
}


@Injectable({
  providedIn: 'root'
})
export class ExamenRendicionService {
  private readonly API_URL = environment.apiUrl;
  private readonly TIMEOUT = 15000; // 15 seconds for API requests
  private readonly MAX_RETRIES = 3; // Maximum number of retries for failed API calls
  private readonly LOG_TAG = 'ExamenRendicionService'; // Tag for logging

  constructor(
    private http: HttpClient,
    @Inject(AUTH_SERVICE_TOKEN) private authService: AuthService,
    @Inject('TIME_SERVICE') private timeService: TimeService,
    @Inject('STATE_SERVICE') private stateService: StateService,
    @Inject('SECURITY_SERVICE') private securityService: SecurityService,
    @Inject('RECOVERY_SERVICE') private recoveryService: RecoveryService,
    @Inject('VALIDATION_SERVICE') private validationService: ValidationService,
    @Inject('NOTIFICATION_SERVICE') private notificationService: NotificationService,
    private loggingService: LoggingService // Inject LoggingService
  ) {
    this.loggingService.debug(`[${this.LOG_TAG}] Initializing ExamenRendicionService.`, undefined, this.LOG_TAG);
    this.loggingService.debug(`[${this.LOG_TAG}] Injected dependencies:`, {
      authService: !!authService,
      timeService: !!timeService,
      stateService: !!stateService,
      securityService: !!securityService,
      recoveryService: !!recoveryService,
      validationService: !!validationService,
      notificationService: !!notificationService
    }, this.LOG_TAG);
  }

  /**
   * Initializes a new exam session or recovers an ongoing one.
   * Resets security and notification services before starting.
   * @param examenId The ID of the exam.
   * @param preguntas The array of questions for the exam.
   */
  async iniciarExamen(examenId: string, preguntas: Pregunta[]): Promise<void> {
    this.loggingService.info(`[${this.LOG_TAG}] Attempting to start/recover exam with ID: ${examenId}.`, undefined, this.LOG_TAG);

    // Reset security and notification state for a clean start
    this.securityService.reset();
    this.notificationService.reset();
    this.loggingService.debug(`[${this.LOG_TAG}] Security and notification services reset.`, undefined, this.LOG_TAG);

    let examenEnCurso: ExamenEnCurso | null = null;
    try {
      // Attempt to recover an ongoing exam from local storage or backend
      examenEnCurso = await this.recoveryService.recoverExamen(examenId);
      if (examenEnCurso) {
        this.loggingService.info(`[${this.LOG_TAG}] Exam "${examenId}" recovered successfully.`, examenEnCurso, this.LOG_TAG);
      } else {
        this.loggingService.info(`[${this.LOG_TAG}] No ongoing exam "${examenId}" found to recover. Creating new exam.`, undefined, this.LOG_TAG);
        // Create a new exam object if no recovery
        examenEnCurso = {
          examenId,
          usuarioId: this.getCurrentUserId(), // Ensure userId is obtained
          fechaInicio: new Date().toISOString(),
          // Default fechaLimite to 2 hours from now if not recovered
          fechaLimite: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          respuestas: [],
          preguntaActual: 0,
          estado: 'EN_CURSO'
        };
        this.loggingService.debug(`[${this.LOG_TAG}] New exam object created:`, examenEnCurso, this.LOG_TAG);
      }

      // Initialize central state with the (recovered or new) exam data
      this.stateService.initializeState(examenEnCurso);
      this.stateService.setPreguntas(preguntas); // Set questions in state
      this.loggingService.debug(`[${this.LOG_TAG}] Exam state initialized with questions count: ${preguntas.length}.`, undefined, this.LOG_TAG);

      // Start auto-saving and the exam timer
      this.recoveryService.initializeAutoSave(examenId);
      this.loggingService.info(`[${this.LOG_TAG}] Auto-save initialized for exam ID: ${examenId}.`, undefined, this.LOG_TAG);
      this.iniciarTemporizador();
      this.loggingService.info(`[${this.LOG_TAG}] Exam timer started.`, undefined, this.LOG_TAG);

    } catch (error) {
      this.loggingService.error(`[${this.LOG_TAG}] Error during exam initialization for ID: ${examenId}:`, error, this.LOG_TAG);
      throw error; // Re-throw to be handled by the caller (e.g., component)
    }
  }

  /**
   * Starts the exam timer and updates the remaining time in the central state.
   */
  private iniciarTemporizador(): void {
    this.loggingService.info(`[${this.LOG_TAG}] Initializing exam timer.`, undefined, this.LOG_TAG);
    // Get the current exam from the centralized state
    this.stateService.getExamenEnCurso().subscribe(examen => {
      if (!examen) {
        this.loggingService.warn(`[${this.LOG_TAG}] Cannot start timer: No active exam found in state.`, undefined, this.LOG_TAG);
        return;
      }

      // Calculate exam duration in minutes from start and end dates
      const fechaInicioExamen = new Date(examen.fechaInicio);
      const fechaLimiteExamen = new Date(examen.fechaLimite);
      const duracionMinutos = (fechaLimiteExamen.getTime() - fechaInicioExamen.getTime()) / (1000 * 60);

      this.loggingService.debug(`[${this.LOG_TAG}] Exam duration calculated: ${duracionMinutos} minutes. Start: ${fechaInicioExamen.toISOString()}, Limit: ${fechaLimiteExamen.toISOString()}.`, undefined, this.LOG_TAG);

      // Delegate time management to ExamenTimeService
      this.timeService.iniciar(duracionMinutos).subscribe({
        next: (tiempoRestante) => {
          this.loggingService.debug(`[${this.LOG_TAG}] Timer tick. Remaining time: ${tiempoRestante} seconds.`, undefined, this.LOG_TAG);
          // Update remaining time in the centralized state
          this.stateService.actualizarTiempoRestante(tiempoRestante);

          if (tiempoRestante === 0) {
            this.loggingService.info(`[${this.LOG_TAG}] Exam time has run out. Finalizing exam.`, undefined, this.LOG_TAG);
            this.finalizarExamen().subscribe({
              next: () => this.loggingService.info(`[${this.LOG_TAG}] Exam finalized automatically due to time expiry.`, undefined, this.LOG_TAG),
              error: (err) => this.loggingService.error(`[${this.LOG_TAG}] Error finalizing exam due to time expiry:`, err, this.LOG_TAG)
            });
          }
        },
        error: (error) => {
          this.loggingService.error(`[${this.LOG_TAG}] Error in exam timer subscription:`, error, this.LOG_TAG);
          // Handle timer errors, potentially report as security violation or log
        }
      });
    });
  }

  /**
   * Saves a user's answer for the current question.
   * Generates a hash and validates the answer, reporting security violations if detected.
   * @param respuesta The user's answer to save.
   */
  guardarRespuesta(respuesta: RespuestaUsuario): void {
    this.loggingService.info(`[${this.LOG_TAG}] Saving user answer for question ID: ${respuesta.preguntaId}.`, respuesta, this.LOG_TAG);

    this.stateService.getExamenEnCurso().pipe(take(1)).subscribe(examen => {
      if (!examen) {
        this.loggingService.warn(`[${this.LOG_TAG}] Cannot save answer: No active exam found in state.`, undefined, this.LOG_TAG);
        return;
      }

      // Generate hash for the answer for integrity checks
      this.validationService.generarHash(respuesta).then(hash => {
        respuesta.hash = hash;
        this.loggingService.debug(`[${this.LOG_TAG}] Answer hash generated for question ${respuesta.preguntaId}: ${hash}.`, undefined, this.LOG_TAG);

        // Validate the answer with context (e.g., timestamp, response time)
        const context = {
          examenId: examen.examenId,
          timestamp: this.timeService.getCurrentServerTime(), // Use server time for context
          tiempoRespuesta: respuesta.tiempoRespuesta // Response time from client
        };

        this.validationService.validarRespuesta(respuesta, context).then(result => {
          if (!result.isValid && result.violationType) {
            this.loggingService.warn(`[${this.LOG_TAG}] Answer validation failed for question ${respuesta.preguntaId}. Reporting violation: ${result.violationType}.`, result.details, this.LOG_TAG);
            this.securityService.reportSecurityViolation(result.violationType, result.details);
          } else {
            this.loggingService.debug(`[${this.LOG_TAG}] Answer for question ${respuesta.preguntaId} validated successfully.`, undefined, this.LOG_TAG);
          }

          // Save the answer in the centralized state
          this.stateService.guardarRespuesta(respuesta);
          this.loggingService.debug(`[${this.LOG_TAG}] Answer for question ${respuesta.preguntaId} saved to central state.`, undefined, this.LOG_TAG);

          // Save a local backup of the current exam state (for recovery)
          this.recoveryService.saveToLocalBackup(examen.examenId, examen);
          this.loggingService.debug(`[${this.LOG_TAG}] Exam state backed up locally for exam ID: ${examen.examenId}.`, undefined, this.LOG_TAG);
        }).catch(error => {
          this.loggingService.error(`[${this.LOG_TAG}] Error during answer validation for question ${respuesta.preguntaId}:`, error, this.LOG_TAG);
          // Still save the answer even if validation fails to not lose user's work
          this.stateService.guardarRespuesta(respuesta);
        });
      }).catch(hashError => {
        this.loggingService.error(`[${this.LOG_TAG}] Error generating hash for answer for question ${respuesta.preguntaId}:`, hashError, this.LOG_TAG);
        // Continue without hash if generation fails
        this.stateService.guardarRespuesta(respuesta);
      });
    });
  }

  /**
   * Navigates to the next question in the exam.
   */
  siguientePregunta(): void {
    this.loggingService.info(`[${this.LOG_TAG}] Navigating to next question.`, undefined, this.LOG_TAG);
    this.stateService.getExamenEnCurso().pipe(take(1)).subscribe(examen => {
      if (!examen) {
        this.loggingService.warn(`[${this.LOG_TAG}] Cannot navigate to next question: No active exam found.`, undefined, this.LOG_TAG);
        return;
      }
      this.stateService.getPreguntas().pipe(take(1)).subscribe(preguntas => {
        if (examen.preguntaActual < preguntas.length - 1) {
          this.stateService.setPreguntaActual(examen.preguntaActual + 1);
          this.loggingService.debug(`[${this.LOG_TAG}] Moved to question index: ${examen.preguntaActual + 1}.`, undefined, this.LOG_TAG);
        } else {
          this.loggingService.info(`[${this.LOG_TAG}] Already on the last question. Cannot navigate next.`, undefined, this.LOG_TAG);
        }
      });
    });
  }

  /**
   * Navigates to the previous question in the exam.
   */
  preguntaAnterior(): void {
    this.loggingService.info(`[${this.LOG_TAG}] Navigating to previous question.`, undefined, this.LOG_TAG);
    this.stateService.getExamenEnCurso().pipe(take(1)).subscribe(examen => {
      if (!examen || examen.preguntaActual === 0) {
        this.loggingService.warn(`[${this.LOG_TAG}] Cannot navigate to previous question: No active exam or already on first question.`, undefined, this.LOG_TAG);
        return;
      }
      this.stateService.setPreguntaActual(examen.preguntaActual - 1);
      this.loggingService.debug(`[${this.LOG_TAG}] Moved to question index: ${examen.preguntaActual - 1}.`, undefined, this.LOG_TAG);
    });
  }

  /**
   * Finalizes the exam session.
   * Stops the timer, performs post-incident validation, cleans up resources,
   * updates exam status, and sends the final state to the backend.
   * @param examenAnulado Optional: If provided, indicates the exam was annulled.
   * @returns An Observable that completes when the exam is finalized.
   */
  finalizarExamen(examenAnulado?: ExamenEnCurso): Observable<void> {
    return new Observable<void>(observer => {
      this.loggingService.info(`[${this.LOG_TAG}] Attempting to finalize exam. Was annulled: ${!!examenAnulado}.`, undefined, this.LOG_TAG);
      this.stateService.getExamenEnCurso().pipe(take(1)).subscribe(examen => {
        if (!examen) {
          this.loggingService.warn(`[${this.LOG_TAG}] Cannot finalize exam: No active exam found in state. Completing observable.`, undefined, this.LOG_TAG);
          observer.next();
          observer.complete();
          return;
        }

        // Stop the timer immediately to prevent further time-related validations
        this.timeService.detener();
        this.loggingService.info(`[${this.LOG_TAG}] Exam timer stopped for exam ID: ${examen.examenId}.`, undefined, this.LOG_TAG);

        // If the exam was not annulled, perform post-incident integrity validation
        if (!examenAnulado) {
          this.loggingService.debug(`[${this.LOG_TAG}] Performing post-incident validation for exam ID: ${examen.examenId}.`, undefined, this.LOG_TAG);
          const backup = this.recoveryService.getLatestBackup(examen.examenId);
          if (backup) {
            const validationResult = this.validationService.validarIntegridadPostIncidente(
              examen.respuestas,
              backup.examen.respuestas // Compare with the latest backup
            );

            if (!validationResult.isValid && validationResult.violationType) {
              this.loggingService.warn(`[${this.LOG_TAG}] Post-incident validation failed for exam ID: ${examen.examenId}. Reporting violation: ${validationResult.violationType}.`, validationResult.details, this.LOG_TAG);
              this.securityService.reportSecurityViolation(
                validationResult.violationType,
                validationResult.details
              );
            } else {
              this.loggingService.debug(`[${this.LOG_TAG}] Post-incident validation passed for exam ID: ${examen.examenId}.`, undefined, this.LOG_TAG);
            }
          } else {
            this.loggingService.warn(`[${this.LOG_TAG}] No local backup found for post-incident validation for exam ID: ${examen.examenId}. Skipping validation.`, undefined, this.LOG_TAG);
          }
        } else {
          this.loggingService.info(`[${this.LOG_TAG}] Exam was annulled. Skipping post-incident validation.`, undefined, this.LOG_TAG);
        }

        // Clean up all related resources
        this.securityService.cleanup();
        this.loggingService.info(`[${this.LOG_TAG}] Security service cleaned up.`, undefined, this.LOG_TAG);
        this.recoveryService.cleanupBackups(examen.examenId);
        this.loggingService.info(`[${this.LOG_TAG}] Local backups cleaned up for exam ID: ${examen.examenId}.`, undefined, this.LOG_TAG);

        // Change exam status in centralized state
        const finalStatus = examenAnulado ? 'ANULADO' : 'FINALIZADO';
        this.stateService.cambiarEstadoExamen(finalStatus);
        this.loggingService.info(`[${this.LOG_TAG}] Exam state changed to: ${finalStatus}.`, undefined, this.LOG_TAG);

        // Send the final exam state to the backend
        this.enviarEstadoFinal(examenAnulado || examen).subscribe({
          next: () => {
            this.loggingService.info(`[${this.LOG_TAG}] Exam finalized successfully and state sent to backend for ID: ${examen.examenId}.`, undefined, this.LOG_TAG);
            observer.next();
            observer.complete();
          },
          error: (error) => {
            this.loggingService.error(`[${this.LOG_TAG}] Error sending final exam state to backend for ID: ${examen.examenId}:`, error, this.LOG_TAG);
            observer.error(error); // Propagate error
          }
        });
      });
    });
  }

  /**
   * Annuls an exam on the backend.
   * Retries multiple times and falls back to local storage if API call fails.
   * @param examenId The ID of the exam to annul.
   * @param motivo The reason for annulment, including date and violation types.
   * @returns An Observable indicating success, local save, or error.
   */
  anularExamen(examenId: string, motivo: { fecha: string; infracciones: SecurityViolationType[] }): Observable<{ success: boolean; local?: boolean; message?: string }> {
    this.loggingService.info(`[${this.LOG_TAG}] Attempting to annul exam ID: ${examenId}. Motive:`, motivo, this.LOG_TAG);
    return this.http.post<{ success: boolean; local?: boolean; message?: string }>(`${this.API_URL}/examenes/${examenId}/anular`, motivo).pipe(
      timeout(this.TIMEOUT),
      retry({
        count: this.MAX_RETRIES,
        delay: 1000 // 1 second delay between retries
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error annulling exam ID ${examenId} after retries:`, error, this.LOG_TAG);

        // Attempt to save annulment data to localStorage as a backup
        try {
          const userId = this.getCurrentUserId(); // Ensure userId is available for the key
          const localStorageKey = `examen_anulado_${userId}_${examenId}`; // Include userId for uniqueness
          localStorage.setItem(localStorageKey, JSON.stringify({
            datos: motivo,
            timestamp: new Date().toISOString(),
            error: error.message // Store error message for context
          }));
          this.loggingService.warn(`[${this.LOG_TAG}] Exam annulment saved locally for ID: ${examenId} due to API failure.`, undefined, this.LOG_TAG);

          return of({
            success: true, // Report success from a local perspective
            local: true,
            message: 'Anulación guardada localmente debido a problemas de conexión.'
          });
        } catch (e) {
          this.loggingService.error(`[${this.LOG_TAG}] Critical error: Could not save annulment data locally for ID: ${examenId}.`, e, this.LOG_TAG);
          return throwError(() => new Error('No se pudo anular el examen ni guardar localmente. Por favor, contacte al soporte técnico.'));
        }
      })
    );
  }

  /**
   * Sends the final exam state to the backend API.
   * Includes retry and fallback logic for different API endpoints/formats.
   * @param datos The exam data to send.
   * @returns An Observable of the API response.
   */
  finalizarExamenApi(datos: Record<string, unknown>): Observable<any> {
    this.loggingService.info(`[${this.LOG_TAG}] Attempting to finalize exam via API.`, datos, this.LOG_TAG);
    const examenId = datos['examenId'] as string;

    if (!examenId) {
      this.loggingService.error(`[${this.LOG_TAG}] Error: No valid exam ID provided for API finalization.`, undefined, this.LOG_TAG);
      return throwError(() => new Error('ID de examen no válido para finalizar.'));
    }

    // Ensure the user ID is included in the payload
    if (!datos['usuarioId']) {
      const userId = this.getCurrentUserId();
      if (userId) {
        datos['usuarioId'] = userId;
        this.loggingService.debug(`[${this.LOG_TAG}] Added current user ID (${userId}) to finalization data.`, undefined, this.LOG_TAG);
      } else {
        this.loggingService.warn(`[${this.LOG_TAG}] User ID not available for finalization data. Proceeding without it.`, undefined, this.LOG_TAG);
      }
    }

    // Clone data to avoid modifying the original object during formatting
    const datosEnvio: Record<string, unknown> = { ...datos };

    // Format answers to ensure compatibility with the backend
    this.formatearRespuestas(datosEnvio);
    this.loggingService.debug(`[${this.LOG_TAG}] Answers formatted for API submission.`, undefined, this.LOG_TAG);

    // Add time spent if not already present
    if (datosEnvio['tiempoUtilizado'] === undefined || datosEnvio['tiempoUtilizado'] === null) {
      datosEnvio['tiempoUtilizado'] = this.timeService.getTiempoUtilizado();
      this.loggingService.debug(`[${this.LOG_TAG}] Added tiempoUtilizado (${datosEnvio['tiempoUtilizado']}ms) to finalization data.`, undefined, this.LOG_TAG);
    } else {
      this.loggingService.debug(`[${this.LOG_TAG}] tiempoUtilizado already present in finalization data: ${datosEnvio['tiempoUtilizado']}ms.`, undefined, this.LOG_TAG);
    }

    // First attempt: POST to /examenes/{examenId}/finalizar
    this.loggingService.debug(`[${this.LOG_TAG}] Attempting API call to POST ${this.API_URL}/examenes/${examenId}/finalizar (Primary).`, datosEnvio, this.LOG_TAG);
    return this.http.post<any>(`${this.API_URL}/examenes/${examenId}/finalizar`, datosEnvio).pipe(
      timeout(this.TIMEOUT),
      retry({
        count: this.MAX_RETRIES,
        delay: 1000
      }),
      catchError((error: HttpErrorResponse) => {
        this.loggingService.error(`[${this.LOG_TAG}] Primary API call to /examenes/${examenId}/finalizar failed:`, error, this.LOG_TAG);

        // If it's a data format error (400) or internal server error (500), try alternative format
        if (error.status === 400 || error.status === 500) {
          this.loggingService.warn(`[${this.LOG_TAG}] Primary API failed with status ${error.status}. Attempting with alternative format.`, undefined, this.LOG_TAG);
          const datosAlternativos = this.prepararFormatoAlternativo(datosEnvio); // Prepare alternative format

          this.loggingService.debug(`[${this.LOG_TAG}] Attempting API call to POST ${this.API_URL}/examenes/${examenId}/finalizar (Alternative Format).`, datosAlternativos, this.LOG_TAG);
          return this.http.post(`${this.API_URL}/examenes/${examenId}/finalizar`, datosAlternativos).pipe(
            timeout(this.TIMEOUT),
            catchError(errorAlt => {
              this.loggingService.error(`[${this.LOG_TAG}] Alternative format API call to /examenes/${examenId}/finalizar also failed:`, errorAlt, this.LOG_TAG);
              // If it also fails, attempt with the alternative endpoint
              return this.intentarEndpointAlternativo(examenId, datosEnvio);
            })
          );
        }

        // If it's another type of error (e.g., network, unauthorized), attempt with the alternative endpoint
        this.loggingService.warn(`[${this.LOG_TAG}] Primary API failed with status ${error.status}. Attempting alternative endpoint.`, undefined, this.LOG_TAG);
        return this.intentarEndpointAlternativo(examenId, datosEnvio);
      })
    );
  }

  /**
   * Attempts to finalize the exam using an alternative API endpoint.
   * Includes retry and fallback logic for a third endpoint.
   * @param examenId The ID of the exam.
   * @param datos The exam data to send.
   * @returns An Observable of the API response or local save result.
   */
  private intentarEndpointAlternativo(examenId: string, datos: Record<string, unknown>): Observable<any> {
    this.loggingService.debug(`[${this.LOG_TAG}] Attempting API call to POST ${this.API_URL}/examenes/submit/${examenId} (Alternative Endpoint).`, datos, this.LOG_TAG);
    return this.http.post<any>(`${this.API_URL}/examenes/submit/${examenId}`, datos).pipe(
      timeout(this.TIMEOUT),
      retry({
        count: this.MAX_RETRIES,
        delay: 1000
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Alternative API call to /examenes/submit/${examenId} failed:`, error, this.LOG_TAG);

        // Try a third endpoint as a last resort
        this.loggingService.warn(`[${this.LOG_TAG}] Alternative endpoint failed. Attempting third endpoint: /examenes/finalizar/${examenId}.`, undefined, this.LOG_TAG);
        return this.http.post(`${this.API_URL}/examenes/finalizar/${examenId}`, datos).pipe(
          timeout(this.TIMEOUT),
          catchError(finalError => {
            this.loggingService.error(`[${this.LOG_TAG}] All API attempts to finalize exam ${examenId} failed. Saving to local storage as fallback.`, finalError, this.LOG_TAG);
            // If all API calls fail, save to local storage as a last resort
            return of(this.guardarExamenLocalStorage(datos));
          })
        );
      })
    );
  }

  /**
   * Formats the answers within the exam data for backend compatibility.
   * Converts the answers object to an array format.
   * @param datos The exam data object to modify.
   */
  private formatearRespuestas(datos: Record<string, unknown>): void {
    this.loggingService.debug(`[${this.LOG_TAG}] Formatting answers for exam ID: ${datos['examenId']}.`, undefined, this.LOG_TAG);
    if (!datos['respuestas'] || typeof datos['respuestas'] !== 'object') {
      this.loggingService.warn(`[${this.LOG_TAG}] 'respuestas' property is missing or not an object. Skipping answer formatting.`, datos['respuestas'], this.LOG_TAG);
      return;
    }

    // Convert the answers object to an array format that the backend can process better
    const respuestasArray = Object.entries(datos['respuestas'] as Record<string, unknown>).map(([preguntaId, respuesta]) => {
      return {
        preguntaId,
        respuesta, // The actual answer value (could be string, number, array, etc.)
        timestamp: new Date().toISOString() // Add timestamp for each answer if needed
      };
    });

    // Replace the original answers object with the new array
    datos['respuestasArray'] = respuestasArray;
    this.loggingService.debug(`[${this.LOG_TAG}] Answers formatted into an array for exam ID: ${datos['examenId']}. Array length: ${respuestasArray.length}.`, undefined, this.LOG_TAG);

    // Keep the original object structure for compatibility if needed by other parts of the application
    // datos.respuestas = datos.respuestas; // This line essentially does nothing if `datos.respuestas` is already present
  }

  /**
   * Prepares an alternative format for exam data, potentially for different backend endpoints.
   * @param datos The original exam data.
   * @returns An object with an alternative format.
   */
  private prepararFormatoAlternativo(datos: Record<string, unknown>): Record<string, unknown> {
    // Create an alternative format that might be compatible with the backend
    const alternativo = {
      examenId: datos['examenId'],
      usuarioId: datos['usuarioId'],
      motivo: datos['motivo'], // If it's an annulment scenario
      tiempoUtilizado: datos['tiempoUtilizado'] || 0,
      respuestas: datos['respuestasArray'] || datos['respuestas'] || [] // Use array first, then original object
    };
    this.loggingService.debug(`[${this.LOG_TAG}] Prepared alternative data format for exam ID: ${datos['examenId']}.`, alternativo, this.LOG_TAG);
    return alternativo;
  }

  /**
   * Saves exam data to localStorage when there are connection issues or API failures.
   * @param datos The exam data to save.
   * @returns An object indicating local save success.
   */
  guardarExamenLocalStorage(datos: Record<string, unknown>): { success: boolean; guardadoLocal: boolean; message: string } {
    this.loggingService.warn(`[${this.LOG_TAG}] Attempting to save exam data to localStorage as emergency backup due to API failure.`, datos, this.LOG_TAG);
    try {
      const examenId = datos['examenId'] as string;
      if (!examenId) {
        this.loggingService.error(`[${this.LOG_TAG}] Cannot save to localStorage: No valid examenId found in data.`, undefined, this.LOG_TAG);
        throw new Error('No se pudo guardar localmente: ID de examen no válido.');
      }
      const userId = this.getCurrentUserId(); // Ensure userId is available

      // Save to localStorage as backup, including user ID in the key for uniqueness
      const localStorageKey = `examen_${userId}_${examenId}`;
      localStorage.setItem(localStorageKey, JSON.stringify({
        datos: datos,
        timestamp: new Date().toISOString(),
        intentos: 3 // Potentially add retry count for later sync attempts
      }));
      this.loggingService.info(`[${this.LOG_TAG}] Exam data for ID: ${examenId} saved locally to key: ${localStorageKey} due to API errors.`, undefined, this.LOG_TAG);

      return {
        success: true,
        guardadoLocal: true,
        message: 'Guardado localmente debido a errores en la conexión. Se intentará sincronizar más tarde.'
      };
    } catch (e) {
      this.loggingService.critical(`[${this.LOG_TAG}] Critical error: Could not save exam data locally! Exam ID: ${datos['examenId']}.`, e, this.LOG_TAG);
      throw new Error('No se pudo finalizar el examen ni guardar localmente. Por favor, contacte al soporte técnico.');
    }
  }

  /**
   * Sends the final exam state (e.g., answers, time spent) to the backend.
   * @param examen The current exam object.
   * @returns An Observable that completes when the state is sent.
   */
  private enviarEstadoFinal(examen: ExamenEnCurso): Observable<void> {
    this.loggingService.info(`[${this.LOG_TAG}] Sending final exam state to backend for exam ID: ${examen.examenId}. Status: ${examen.estado}.`, undefined, this.LOG_TAG);
    const datosFinalizacion = {
      respuestas: examen.respuestas, // Send current answers
      tiempoUtilizado: this.timeService.getTiempoUtilizado(), // Get total time used
      estado: examen.estado // Final state of the exam
    };
    this.loggingService.debug(`[${this.LOG_TAG}] Finalization payload:`, datosFinalizacion, this.LOG_TAG);

    return this.http.post<void>(`${this.API_URL}/examenes/${examen.examenId}/finalizar`, datosFinalizacion).pipe(
      timeout(this.TIMEOUT),
      retry(this.MAX_RETRIES),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error sending final exam state for ID: ${examen.examenId}. Saving to local backup.`, error, this.LOG_TAG);
        // Save locally in case of error
        this.recoveryService.saveToLocalBackup(examen.examenId, examen); // Save full exam object to backup
        return throwError(() => new Error('Error al enviar el estado final del examen. Se ha guardado una copia de seguridad local.'));
      })
    );
  }

  // --- Methods delegating to StateService (kept for interface consistency) ---

  getExamenEnCurso(): Observable<ExamenEnCurso | null> {
    this.loggingService.debug(`[${this.LOG_TAG}] Delegating getExamenEnCurso to StateService.`, undefined, this.LOG_TAG);
    return this.stateService.getExamenEnCurso();
  }

  getPreguntas(): Observable<Pregunta[]> {
    this.loggingService.debug(`[${this.LOG_TAG}] Delegating getPreguntas to StateService.`, undefined, this.LOG_TAG);
    return this.stateService.getPreguntas();
  }

  getPreguntaActual(): Observable<Pregunta | null> {
    this.loggingService.debug(`[${this.LOG_TAG}] Delegating getPreguntaActual to StateService.`, undefined, this.LOG_TAG);
    return this.stateService.getPreguntaActual();
  }

  getTiempoRestante(): Observable<number> {
    this.loggingService.debug(`[${this.LOG_TAG}] Delegating getTiempoRestante to StateService.`, undefined, this.LOG_TAG);
    return this.stateService.getTiempoRestante();
  }

  // --- Internal helper for user ID ---

  private getCurrentUserId(): string {
    try {
      const userId = this.authService.getCurrentUserId();
      if (!userId) {
        this.loggingService.error('[${this.LOG_TAG}] Error: User ID not available from authentication service.', undefined, this.LOG_TAG);
        throw new Error('ID de usuario no disponible');
      }
      this.loggingService.debug(`[${this.LOG_TAG}] Retrieved current user ID: ${userId}.`, undefined, this.LOG_TAG);
      return userId;
    } catch (error) {
      this.loggingService.critical(`[${this.LOG_TAG}] Critical error trying to get user ID. Using 'anonymous' fallback.`, error, this.LOG_TAG);
      return 'anonymous'; // Fallback to prevent critical errors
    }
  }

  // --- Synchronization of locally finalized exams ---

  /**
   * Synchronizes locally saved finalized exams with the backend.
   * Iterates through localStorage, attempts to send each exam, and removes it on success.
   * @returns An Observable of results for each synchronized exam.
   */
  sincronizarExamenesFinalizados(): Observable<{ id: string; success: boolean; error?: string }[]> {
    this.loggingService.info(`[${this.LOG_TAG}] Starting synchronization of locally finalized exams.`, undefined, this.LOG_TAG);
    const examenesFinalizados = this.obtenerExamenesFinalizadosLocalmente();

    if (examenesFinalizados.length === 0) {
      this.loggingService.info(`[${this.LOG_TAG}] No locally finalized exams found to synchronize.`, undefined, this.LOG_TAG);
      return of([{ id: '', success: true, message: 'No exams to synchronize' }]); // Return a successful empty result
    }

    this.loggingService.debug(`[${this.LOG_TAG}] Found ${examenesFinalizados.length} locally finalized exams for synchronization.`, undefined, this.LOG_TAG);

    // Create an observable for each finalized exam
    const observables = examenesFinalizados.map(examen => {
      this.loggingService.debug(`[${this.LOG_TAG}] Attempting to synchronize local exam ID: ${examen.id}.`, examen.datos, this.LOG_TAG);
      return this.http.post(`${this.API_URL}/examenes/${examen.id}/finalizar`, examen.datos).pipe(
        map(() => {
          // If successful, remove from localStorage
          localStorage.removeItem(`examen_finalizado_${examen.id}`);
          this.loggingService.info(`[${this.LOG_TAG}] Successfully synchronized and removed local exam ID: ${examen.id}.`, undefined, this.LOG_TAG);
          return { id: examen.id, success: true };
        }),
        catchError(error => {
          this.loggingService.error(`[${this.LOG_TAG}] Error synchronizing local exam ID: ${examen.id}:`, error, this.LOG_TAG);
          // Return failure for this specific exam, but allow others to proceed
          return of({ id: examen.id, success: false, error: error.message || 'Error de sincronización' });
        })
      );
    });

    // Combine all observables and return results when all complete
    return forkJoin(observables);
  }

  /**
   * Retrieves locally saved finalized exams from localStorage.
   * @returns An array of locally saved exam data.
   */
  private obtenerExamenesFinalizadosLocalmente(): { id: string, datos: Record<string, unknown>, timestamp: string }[] {
    this.loggingService.debug(`[${this.LOG_TAG}] Scanning localStorage for locally finalized exams.`, undefined, this.LOG_TAG);
    const examenesFinalizados = [];
    const userId = this.getCurrentUserId(); // Get current user ID to scope keys

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Look for keys matching our pattern, potentially including user ID
      if (key && (key.startsWith(`examen_finalizado_${userId}_`) || key.startsWith('examen_finalizado_'))) { // Allow for old keys without user ID
        try {
          // Extract exam ID from the key
          const examenId = key.split('_').pop(); // Assumes ID is the last part after last underscore
          if (!examenId) {
            this.loggingService.warn(`[${this.LOG_TAG}] Skipping localStorage key "${key}": Could not extract exam ID.`, undefined, this.LOG_TAG);
            continue;
          }

          const rawData = localStorage.getItem(key);
          if (!rawData) {
            this.loggingService.warn(`[${this.LOG_TAG}] Skipping localStorage key "${key}": No data found.`, undefined, this.LOG_TAG);
            continue;
          }

          const datos = JSON.parse(rawData);

          examenesFinalizados.push({
            id: examenId,
            datos: datos.datos, // Assuming 'datos' property holds the actual exam data
            timestamp: datos.timestamp // Assuming 'timestamp' property holds the save time
          });
          this.loggingService.debug(`[${this.LOG_TAG}] Found local exam: ${examenId}.`, undefined, this.LOG_TAG);
        } catch (e) {
          this.loggingService.error(`[${this.LOG_TAG}] Error parsing locally finalized exam from key "${key}":`, e, this.LOG_TAG);
          // Optionally, remove the corrupted item
          // localStorage.removeItem(key);
        }
      }
    }
    this.loggingService.info(`[${this.LOG_TAG}] Finished scanning localStorage. Found ${examenesFinalizados.length} finalized exams.`, undefined, this.LOG_TAG);
    return examenesFinalizados;
  }
}
