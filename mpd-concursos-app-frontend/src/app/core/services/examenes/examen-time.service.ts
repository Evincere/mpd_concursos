import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, Subject, of, Subscription } from 'rxjs';
import { map, takeUntil, catchError, tap } from 'rxjs/operators'; // Added tap
import { environment } from '@env/environment';
import { LoggingService } from '../logging/logging.service'; // Import LoggingService

@Injectable({
  providedIn: 'root'
})
export class ExamenTimeService {
  private readonly SYNC_INTERVAL = 30000; // 30 seconds for server time synchronization
  private readonly MAX_TIME_DRIFT = 5000; // 5 seconds maximum allowed time difference (drift)
  private serverOffset = 0; // Difference between server time and client time (serverTime - clientTime)
  private lastSyncTime = 0; // Timestamp of the last successful server synchronization
  private timeChecks: number[] = []; // History of offsets for drift detection
  private startTime = 0; // Start time of the exam (in server time)
  private destroy$ = new Subject<void>(); // Used to unsubscribe from ongoing observables
  private tiempoRestante$ = new BehaviorSubject<number>(0); // Observable for remaining time in seconds
  private duracionTotal = 0; // Total exam duration in seconds

  private serverTime$ = new BehaviorSubject<number>(Date.now()); // BehaviorSubject for current estimated server time

  private readonly LOG_TAG = 'ExamenTimeService'; // Tag for logging

  constructor(
    private http: HttpClient,
    private loggingService: LoggingService // Inject LoggingService
  ) {
    this.loggingService.debug(`[${this.LOG_TAG}] Initializing ExamenTimeService.`, undefined, this.LOG_TAG);
    this.initializeTimeSync();
  }

  /**
   * Initializes the time synchronization process.
   * Performs an initial sync and then sets up periodic syncing.
   */
  private initializeTimeSync(): void {
    this.loggingService.info(`[${this.LOG_TAG}] Starting initial time synchronization.`, undefined, this.LOG_TAG);
    // Initial synchronization
    this.syncWithServer();

    // Periodic synchronization
    interval(this.SYNC_INTERVAL).pipe(
      takeUntil(this.destroy$),
      tap(() => this.loggingService.debug(`[${this.LOG_TAG}] Performing periodic time synchronization.`, undefined, this.LOG_TAG))
    ).subscribe(() => {
      this.syncWithServer();
      this.detectTimeDrift();
    });
  }

  /**
   * Validates if a given timestamp is within a reasonable range.
   * @param timestamp The timestamp to validate.
   * @returns true if the timestamp is valid, false otherwise.
   */
  private isValidTimestamp(timestamp: number): boolean {
    const isValid = !isNaN(timestamp) &&
                    timestamp > 0 && // Must be positive
                    timestamp < 8640000000000000; // Max valid JS Date timestamp
    if (!isValid) {
      this.loggingService.warn(`[${this.LOG_TAG}] Invalid timestamp detected: ${timestamp}.`, undefined, this.LOG_TAG);
    }
    return isValid;
  }

  /**
   * Formats a timestamp into an ISO 8601 string.
   * @param timestamp The timestamp to format.
   * @returns ISO string or 'Fecha inválida' on error.
   */
  private formatDate(timestamp: number): string {
    try {
      if (!this.isValidTimestamp(timestamp)) {
        throw new Error('Timestamp inválido.');
      }
      return new Date(timestamp).toISOString();
    } catch (error) {
      this.loggingService.error(`[${this.LOG_TAG}] Error formatting date for timestamp ${timestamp}:`, error, this.LOG_TAG);
      return 'Fecha inválida';
    }
  }

  /**
   * Synchronizes the client's time with the server's time.
   * Calculates and stores the time offset.
   */
  private syncWithServer(): void {
    const requestStartTime = Date.now();
    this.loggingService.debug(`[${this.LOG_TAG}] Requesting server time from ${environment.apiUrl}/time. Request start time: ${this.formatDate(requestStartTime)}.`, undefined, this.LOG_TAG);

    this.http.get<{ timestamp: number }>(`${environment.apiUrl}/time`).pipe(
      map(response => {
        const requestEndTime = Date.now();
        const roundTripTime = requestEndTime - requestStartTime;
        const serverTime = response?.timestamp;

        this.loggingService.debug(`[${this.LOG_TAG}] Server time response received. Server timestamp: ${serverTime ? this.formatDate(serverTime) : 'N/A'}. Round trip time: ${roundTripTime}ms.`, undefined, this.LOG_TAG);

        if (serverTime === undefined || serverTime === null) {
          this.loggingService.warn(`[${this.LOG_TAG}] Server timestamp not provided in response. Using local time for now.`, undefined, this.LOG_TAG);
          return { timestamp: Date.now(), offset: 0 };
        }

        if (!this.isValidTimestamp(serverTime)) {
          this.loggingService.warn(`[${this.LOG_TAG}] Invalid server timestamp received: ${serverTime}. Using local time for now.`, undefined, this.LOG_TAG);
          return { timestamp: Date.now(), offset: 0 };
        }

        // Calculate approximate offset considering latency (half of round trip time)
        const clientTimeAtServerMoment = requestStartTime + (roundTripTime / 2);
        const newOffset = serverTime - clientTimeAtServerMoment;

        // If the offset is too large, it might indicate a system clock manipulation or major error
        if (Math.abs(newOffset) > 24 * 60 * 60 * 1000) { // More than 24 hours
          this.loggingService.warn(`[${this.LOG_TAG}] Calculated offset is unusually large (${newOffset}ms). This could indicate significant time manipulation or a server error. Resetting offset to 0.`, undefined, this.LOG_TAG);
          return { timestamp: Date.now(), offset: 0 };
        }

        return { timestamp: serverTime, offset: newOffset };
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error during server time synchronization:`, error, this.LOG_TAG);
        // Return a default value to keep the stream alive and use local time as fallback
        return of({ timestamp: Date.now(), offset: 0 });
      })
    ).subscribe({
      next: (result) => {
        this.serverOffset = result.offset ?? 0;
        this.lastSyncTime = Date.now(); // Record when this sync finished on client side
        this.timeChecks.push(this.serverOffset); // Add current offset to history for drift detection
        // Keep history to last 5 checks to avoid too much memory usage
        if (this.timeChecks.length > 5) {
          this.timeChecks.shift();
        }
        this.serverTime$.next(result.timestamp); // Update estimated server time
        this.loggingService.info(`[${this.LOG_TAG}] Time synced. Server offset: ${this.serverOffset}ms. Last sync: ${this.formatDate(this.lastSyncTime)}.`, undefined, this.LOG_TAG);
      },
      error: (error) => {
        this.loggingService.error(`[${this.LOG_TAG}] Subscription error in syncWithServer:`, error, this.LOG_TAG);
        // Fallback to current local time if subscription errors
        this.serverOffset = 0;
        this.serverTime$.next(Date.now());
      }
    });
  }

  /**
   * Detects significant time drift by comparing current offset with historical averages.
   * If a large drift is detected, it triggers a violation.
   */
  private detectTimeDrift(): void {
    if (this.timeChecks.length < 3) { // Need at least 3 checks to calculate a meaningful average
      this.loggingService.debug(`[${this.LOG_TAG}] Not enough time checks (${this.timeChecks.length}) to detect time drift. Skipping.`, undefined, this.LOG_TAG);
      return;
    }

    try {
      const currentOffset = this.serverOffset;
      // Calculate average of previous offsets (excluding current one for fairer comparison)
      const historicalOffsets = this.timeChecks.slice(0, -1);
      const avgOffset = historicalOffsets.reduce((a, b) => a + b, 0) / historicalOffsets.length;

      const drift = Math.abs(currentOffset - avgOffset);

      this.loggingService.debug(`[${this.LOG_TAG}] Detecting time drift. Current offset: ${currentOffset}ms. Average historical offset: ${avgOffset}ms. Drift: ${drift}ms.`, undefined, this.LOG_TAG);

      // Detect sudden large changes in offset
      if (drift > this.MAX_TIME_DRIFT) {
        this.handleTimeDriftViolation({
          currentOffset,
          averageOffset: avgOffset,
          drift: drift,
          timestamp: this.getCurrentServerTime()
        });
      }
    } catch (error) {
      this.loggingService.error(`[${this.LOG_TAG}] Error detecting time drift:`, error, this.LOG_TAG);
    }
  }

  /**
   * Handles a detected time drift violation by logging it and potentially reporting it.
   * @param driftInfo Details about the time drift.
   */
  private handleTimeDriftViolation(driftInfo: {
    currentOffset: number;
    averageOffset: number;
    drift: number;
    timestamp: number;
  }): void {
    try {
      this.loggingService.critical(`[${this.LOG_TAG}] Time manipulation or significant time drift detected!`, driftInfo, this.LOG_TAG);
      // In a real application, you would report this to a security service:
      // this.securityService.reportSecurityViolation(SecurityViolationType.TIME_MANIPULATION, driftInfo);
    } catch (error) {
      this.loggingService.error(`[${this.LOG_TAG}] Error handling time drift violation:`, error, this.LOG_TAG);
    }
  }

  /**
   * Returns the current estimated server time.
   * Forces a resync if the last sync was too long ago.
   * @returns The current server time in milliseconds since epoch.
   */
  getCurrentServerTime(): number {
    const currentTime = Date.now() + this.serverOffset;
    const isValid = this.isValidTimestamp(currentTime);

    if (!isValid) {
      this.loggingService.warn(`[${this.LOG_TAG}] Current estimated server time is invalid. Using local time as fallback.`, undefined, this.LOG_TAG);
      return Date.now();
    }

    // If more than 2 minutes have passed since the last synchronization, force a new one
    if (Date.now() - this.lastSyncTime > 120000) { // 120 seconds = 2 minutes
      this.loggingService.info(`[${this.LOG_TAG}] More than 2 minutes since last sync. Forcing a new time synchronization.`, undefined, this.LOG_TAG);
      this.syncWithServer(); // Trigger a new sync
    }

    this.loggingService.debug(`[${this.LOG_TAG}] Providing current server time: ${this.formatDate(currentTime)}.`, undefined, this.LOG_TAG);
    return currentTime;
  }

  /**
   * Calculates the remaining time for the exam.
   * @returns The remaining time in seconds.
   */
  getTimeRemaining(): number {
    if (this.startTime === 0 || this.duracionTotal === 0) {
      this.loggingService.warn(`[${this.LOG_TAG}] getTimeRemaining called before exam started or duration set. Returning 0. StartTime: ${this.startTime}, TotalDuration: ${this.duracionTotal}.`, undefined, this.LOG_TAG);
      return 0;
    }

    const currentTime = this.getCurrentServerTime();
    const tiempoTranscurrido = currentTime - this.startTime;

    if (tiempoTranscurrido < 0) {
      this.loggingService.warn(`[${this.LOG_TAG}] Elapsed time is negative (${tiempoTranscurrido}ms). This might indicate a clock issue. Adjusting to 0.`, undefined, this.LOG_TAG);
      return this.duracionTotal; // Return total duration if elapsed time is negative
    }

    // Ensure units are consistent: duracionTotal is in seconds, tiempoTranscurrido is in milliseconds
    const tiempoRestante = (this.duracionTotal * 1000) - tiempoTranscurrido;
    const tiempoRestanteSegundos = Math.max(0, Math.floor(tiempoRestante / 1000));

    this.loggingService.debug(`[${this.LOG_TAG}] Time remaining: ${tiempoRestanteSegundos} seconds. (Elapsed: ${tiempoTranscurrido}ms, Total: ${this.duracionTotal}s)`, undefined, this.LOG_TAG);

    return tiempoRestanteSegundos;
  }

  /**
   * Validates a given timestamp against the current server time and allowed drift.
   * @param timestamp The timestamp to validate.
   * @returns true if the timestamp is valid and within the allowed drift, false otherwise.
   */
  validateTimestamp(timestamp: number): boolean {
    if (!this.isValidTimestamp(timestamp)) {
      this.loggingService.warn(`[${this.LOG_TAG}] Validation failed: Provided timestamp is invalid: ${timestamp}.`, undefined, this.LOG_TAG);
      return false;
    }
    const currentTime = this.getCurrentServerTime();
    const timeDiff = Math.abs(currentTime - timestamp);
    const isValid = timeDiff <= this.MAX_TIME_DRIFT;
    this.loggingService.debug(`[${this.LOG_TAG}] Validating timestamp ${this.formatDate(timestamp)}. Current server time: ${this.formatDate(currentTime)}. Difference: ${timeDiff}ms. Valid: ${isValid}.`, undefined, this.LOG_TAG);
    return isValid;
  }

  /**
   * Stops the exam timer and resets its state.
   */
  detener(): void {
    this.loggingService.info(`[${this.LOG_TAG}] Stopping exam timer and resetting state.`, undefined, this.LOG_TAG);
    this.destroy$.next(); // Signal ongoing subscriptions to complete
    this.destroy$.complete(); // Complete the subject
    this.startTime = 0;
    this.duracionTotal = 0;
    this.tiempoRestante$.next(0);
    this.loggingService.debug(`[${this.LOG_TAG}] Exam timer stopped and state reset.`, undefined, this.LOG_TAG);
  }

  /**
   * Calculates the total time used since the exam started.
   * @returns The time used in milliseconds. Returns 0 if exam hasn't started.
   */
  getTiempoUtilizado(): number {
    if (this.startTime === 0) {
      this.loggingService.debug(`[${this.LOG_TAG}] getTiempoUtilizado called, but exam has not started. Returning 0.`, undefined, this.LOG_TAG);
      return 0;
    }
    const tiempoUsed = Math.max(0, this.getCurrentServerTime() - this.startTime);
    this.loggingService.debug(`[${this.LOG_TAG}] Time used: ${tiempoUsed}ms.`, undefined, this.LOG_TAG);
    return tiempoUsed;
  }

  /**
   * Starts the exam timer with a specified duration.
   * Emits the remaining time every second.
   * @param duracionMinutos Total duration of the exam in minutes.
   * @returns An Observable that emits the remaining time in seconds.
   */
  iniciar(duracionMinutos: number): Observable<number> {
    this.loggingService.info(`[${this.LOG_TAG}] Attempting to start exam timer with duration: ${duracionMinutos} minutes.`, undefined, this.LOG_TAG);

    if (!duracionMinutos || duracionMinutos <= 0) {
      const errorMsg = 'Duración inválida para iniciar el temporizador.';
      this.loggingService.error(`[${this.LOG_TAG}] Validation Error: ${errorMsg}. Provided duration: ${duracionMinutos}.`, undefined, this.LOG_TAG);
      return new Observable(observer => {
        observer.error(new Error(errorMsg));
        return () => {
          this.loggingService.debug(`[${this.LOG_TAG}] Cleanup for invalid duration observable.`, undefined, this.LOG_TAG);
        };
      });
    }

    // Reset destroy$ subject to allow new subscriptions for a new exam session
    if (this.destroy$.closed) {
        this.destroy$ = new Subject<void>();
        this.loggingService.debug(`[${this.LOG_TAG}] Recreated destroy$ subject for new exam session.`, undefined, this.LOG_TAG);
    }


    return new Observable<number>(observer => {
      let subscription: Subscription;
      try {
        // Convert minutes to seconds
        this.duracionTotal = duracionMinutos * 60;
        this.startTime = this.getCurrentServerTime(); // Set start time based on server time

        this.loggingService.info(`[${this.LOG_TAG}] Exam timer started. Total duration: ${this.duracionTotal} seconds. Start time (server): ${this.formatDate(this.startTime)}.`, undefined, this.LOG_TAG);

        // Emit the initial remaining time immediately
        const tiempoRestanteInicial = this.getTimeRemaining();
        this.tiempoRestante$.next(tiempoRestanteInicial);
        observer.next(tiempoRestanteInicial);

        // Start the interval to emit remaining time every second
        subscription = interval(1000).pipe(
          takeUntil(this.destroy$), // Stop when destroy$ emits
          map(() => {
            const tiempoRestante = this.getTimeRemaining();
            this.tiempoRestante$.next(tiempoRestante);
            return tiempoRestante;
          })
        ).subscribe({
          next: (tiempo) => {
            observer.next(tiempo);
            if (tiempo <= 0) {
              this.loggingService.info(`[${this.LOG_TAG}] Exam timer reached 0. Completing observable.`, undefined, this.LOG_TAG);
              observer.complete(); // Complete the observable when time runs out
            }
          },
          error: (error) => {
            this.loggingService.error(`[${this.LOG_TAG}] Error in exam timer interval:`, error, this.LOG_TAG);
            observer.error(error); // Propagate error
          },
          complete: () => {
            this.loggingService.info(`[${this.LOG_TAG}] Exam timer interval completed.`, undefined, this.LOG_TAG);
            this.detener(); // Ensure state is reset after completion
          }
        });
      } catch (error) {
        this.loggingService.error(`[${this.LOG_TAG}] Error starting the exam timer:`, error, this.LOG_TAG);
        observer.error(error); // Propagate error from setup
      }

      // Cleanup function for the observable
      return () => {
        if (subscription && !subscription.closed) {
          subscription.unsubscribe();
          this.loggingService.debug(`[${this.LOG_TAG}] Exam timer observable unsubscribed.`, undefined, this.LOG_TAG);
        }
      };
    });
  }

  /**
   * Returns an observable of the remaining time, updated every second.
   * @returns Observable of remaining time in seconds.
   */
  getTiempoRestanteObservable(): Observable<number> {
    return this.tiempoRestante$.asObservable();
  }
}
