import { Injectable, Inject, NgZone } from '@angular/core';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SecurityViolation, SecurityViolationType, SecuritySeverity, SecurityAction, SecurityViolationDetails } from '@core/interfaces/security/security-violation.interface';
import { ISecurityService } from '@core/interfaces/examenes/security/security.interface';
import { ISecurityStrategy } from '@core/interfaces/examenes/security/security-strategy.interface';
import { ICleanupService } from '@core/interfaces/examenes/cleanup/cleanup.interface';
import { ExamenNotificationService } from '../examen-notification.service';
import { LoggingService } from '@core/services/logging/logging.service';

@Injectable({
  providedIn: 'root'
})
export class ExamenSecurityService implements ISecurityService, ICleanupService {
  private readonly MAX_WARNINGS = 3; // Maximum number of warnings before final action
  private readonly MIN_WARNING_INTERVAL = 2000; // Minimum interval between warnings in milliseconds
  private readonly SECURITY_STATE_KEY_PREFIX = 'examSecurityState'; // Prefix for localStorage key

  private securityStrategies: Map<SecurityViolationType, ISecurityStrategy>;
  private violations$ = new BehaviorSubject<SecurityViolation[]>([]);
  private isSecureModeActive = new BehaviorSubject<boolean>(false);
  private destroy$ = new Subject<void>(); // Used to unsubscribe from long-lived observables

  // Centralized security state, persisted in localStorage
  private securityState$ = new BehaviorSubject<{
    warningCount: number;
    lastWarningTime: number;
    violations: SecurityViolation[];
  }>({
    warningCount: 0,
    lastWarningTime: 0,
    violations: []
  });

  constructor(
    @Inject(ExamenNotificationService) private notificationService: ExamenNotificationService,
    @Inject('SecurityStrategies') private strategies: ISecurityStrategy[],
    private ngZone: NgZone, // NgZone for running tasks outside/inside Angular's zone
    private loggingService: LoggingService // Inject LoggingService
  ) {
    this.loggingService.debug('[ExamenSecurityService] Initializing ExamenSecurityService.', undefined, 'ExamenSecurityService');
    this.securityStrategies = new Map();
    this.initializeStrategies(strategies); // Set up available strategies
    this.loadSecurityState(); // Load any previously saved security state
  }

  /**
   * Loads the security state from localStorage.
   */
  private loadSecurityState(): void {
    const userId = this.getCurrentUserId();
    const storageKey = this.getSecurityStateKey(userId);
    this.loggingService.debug(`[ExamenSecurityService] Attempting to load security state from localStorage using key: ${storageKey}.`, undefined, 'ExamenSecurityService');
    const savedState = localStorage.getItem(storageKey);

    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        // Ensure the loaded state structure matches the expected structure
        if (typeof state.warningCount === 'number' && typeof state.lastWarningTime === 'number' && Array.isArray(state.violations)) {
          this.securityState$.next(state);
          this.violations$.next(state.violations); // Sync violations subject
          this.loggingService.info('[ExamenSecurityService] Security state loaded successfully from localStorage.', state, 'ExamenSecurityService');
        } else {
          this.loggingService.warn('[ExamenSecurityService] Loaded security state has invalid structure. Resetting to initial state.', state, 'ExamenSecurityService');
          this.reset(); // Reset if structure is invalid
        }
      } catch (e) {
        this.loggingService.error('[ExamenSecurityService] Error parsing security state from localStorage. Resetting state.', e, 'ExamenSecurityService');
        this.reset(); // Reset on parsing error
      }
    } else {
      this.loggingService.info('[ExamenSecurityService] No security state found in localStorage. Starting with initial state.', undefined, 'ExamenSecurityService');
    }
  }

  /**
   * Generates the localStorage key for the security state, scoped by user ID if available.
   * @param userId The current user's ID.
   * @returns The localStorage key.
   */
  private getSecurityStateKey(userId: string | null): string {
    return userId ? `${this.SECURITY_STATE_KEY_PREFIX}_${userId}` : this.SECURITY_STATE_KEY_PREFIX;
  }

  /**
   * Retrieves the current user ID from localStorage.
   * @returns The user ID string or null if not found.
   */
  private getCurrentUserId(): string | null {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = user.id || null;
      this.loggingService.debug(`[ExamenSecurityService] Retrieved current user ID: ${userId}.`, undefined, 'ExamenSecurityService');
      return userId;
    } catch (e) {
      this.loggingService.error('[ExamenSecurityService] Error retrieving current user ID from localStorage:', e, 'ExamenSecurityService');
      return null;
    }
  }

  /**
   * Saves the current security state to localStorage.
   */
  private saveSecurityState(): void {
    const state = this.securityState$.value;
    const userId = this.getCurrentUserId();
    const storageKey = this.getSecurityStateKey(userId);
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
      this.loggingService.debug(`[ExamenSecurityService] Security state saved to localStorage. Key: ${storageKey}.`, state, 'ExamenSecurityService');
    } catch (e) {
      this.loggingService.error(`[ExamenSecurityService] Error saving security state to localStorage for key: ${storageKey}.`, e, 'ExamenSecurityService');
    }
  }

  /**
   * Initializes security measures as required by ISecurityService interface.
   * This method sets up the security service and prepares it for operation.
   */
  initializeSecurityMeasures(): void {
    this.loggingService.info('[ExamenSecurityService] Initializing security measures...', undefined, 'ExamenSecurityService');

    // Load any existing security state
    this.loadSecurityState();

    // Ensure all strategies are properly initialized
    if (this.strategies && this.strategies.length > 0) {
      this.initializeStrategies(this.strategies);
    }

    this.loggingService.info('[ExamenSecurityService] Security measures initialized successfully.', undefined, 'ExamenSecurityService');
  }

  /**
   * Initializes all registered security strategies.
   * This method is called during service construction.
   * @param strategies An array of ISecurityStrategy instances.
   */
  private initializeStrategies(strategies: ISecurityStrategy[]): void {
    this.loggingService.info(`[ExamenSecurityService] Initializing ${strategies.length} security strategies.`, undefined, 'ExamenSecurityService');
    for (const strategy of strategies) {
      const type = strategy.getType();
      this.securityStrategies.set(type, strategy);
      this.loggingService.debug(`[ExamenSecurityService] Strategy initialized: ${type}.`, undefined, 'ExamenSecurityService');
    }
  }

  /**
   * Asynchronously activates all security measures (strategies).
   * This typically involves setting up event listeners or enforcing specific browser states.
   * @returns A Promise that resolves when all strategies are activated.
   */
  async activateSecureMode(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Run inside NgZone to ensure Angular's change detection is aware of async operations
      this.ngZone.run(async () => {
        this.loggingService.info('[ExamenSecurityService] Activating secure mode...', undefined, 'ExamenSecurityService');
        try {
          // Activate each registered strategy
          for (const strategy of this.strategies) {
            this.loggingService.debug(`[ExamenSecurityService] Activating strategy: ${strategy.getType()}.`, undefined, 'ExamenSecurityService');
            // Ensure strategy.activate returns a Promise or is awaited
            await strategy.activate();
            this.loggingService.debug(`[ExamenSecurityService] Strategy ${strategy.getType()} activated successfully.`, undefined, 'ExamenSecurityService');
          }
          this.isSecureModeActive.next(true); // Indicate secure mode is active
          this.loggingService.info('[ExamenSecurityService] Secure mode activated successfully.', undefined, 'ExamenSecurityService');
          resolve();
        } catch (error) {
          this.loggingService.error('[ExamenSecurityService] Error activating secure mode:', error, 'ExamenSecurityService');
          this.isSecureModeActive.next(false); // Ensure secure mode is marked as inactive on error
          reject(error);
        }
      });
    });
  }

  /**
   * Deactivates all security measures.
   * This involves cleaning up event listeners and resetting browser states.
   */
  deactivateSecureMode(): void {
    this.ngZone.run(() => {
      this.loggingService.info('[ExamenSecurityService] Deactivating secure mode...', undefined, 'ExamenSecurityService');
      // Deactivate all registered strategies
      for (const strategy of this.strategies) {
        this.loggingService.debug(`[ExamenSecurityService] Deactivating strategy: ${strategy.getType()}.`, undefined, 'ExamenSecurityService');
        try {
          strategy.deactivate();
          this.loggingService.debug(`[ExamenSecurityService] Strategy ${strategy.getType()} deactivated.`, undefined, 'ExamenSecurityService');
        } catch (e) {
          this.loggingService.error(`[ExamenSecurityService] Error deactivating strategy ${strategy.getType()}:`, e, 'ExamenSecurityService');
        }
      }
      this.isSecureModeActive.next(false); // Indicate secure mode is inactive
      this.loggingService.info('[ExamenSecurityService] Secure mode deactivated.', undefined, 'ExamenSecurityService');
    });
  }

  /**
   * Resets the security service to its initial state, clearing all violations and counters.
   * This also removes the persisted state from localStorage.
   */
  reset(): void {
    this.loggingService.info('[ExamenSecurityService] Resetting security service state.', undefined, 'ExamenSecurityService');
    const initialState = {
      warningCount: 0,
      lastWarningTime: 0,
      violations: []
    };

    this.securityState$.next(initialState);
    this.violations$.next([]);
    this.isSecureModeActive.next(false); // Explicitly set to false

    const userId = this.getCurrentUserId();
    const storageKey = this.getSecurityStateKey(userId);
    try {
      localStorage.removeItem(storageKey);
      this.loggingService.debug(`[ExamenSecurityService] Removed security state from localStorage. Key: ${storageKey}.`, undefined, 'ExamenSecurityService');
    } catch (e) {
      this.loggingService.error(`[ExamenSecurityService] Error removing security state from localStorage for key: ${storageKey}.`, e, 'ExamenSecurityService');
    }
    this.deactivateSecureMode(); // Ensure all active measures are turned off
  }

  /**
   * Reports a security violation to the service.
   * This triggers the violation handling mechanism, updates the state, and notifies the user.
   * @param type The type of security violation.
   * @param details Optional additional details about the violation.
   */
  reportSecurityViolation(type: SecurityViolationType, details?: SecurityViolationDetails): void {
    this.loggingService.warn(`[ExamenSecurityService] Reporting security violation: ${type}. Details:`, details, 'ExamenSecurityService');

    const strategy = this.securityStrategies.get(type);
    if (!strategy) {
      this.loggingService.warn(`[ExamenSecurityService] No strategy found for violation type: ${type}.`, undefined, 'ExamenSecurityService');
      return;
    }

    // Delegate violation handling to the specific strategy
    strategy.handleViolation(details);

    const now = Date.now();
    const currentState = this.securityState$.value;
    const severity = this.getViolationSeverity(type);

    // Create the violation object
    const violation: SecurityViolation = {
      type,
      timestamp: new Date().toISOString(),
      details: details || undefined,
      severity,
      actionTaken: this.getActionForViolation(type) // Get the action to be taken for this violation
    };

    // Update the security state, respecting the minimum warning interval
    if (now - currentState.lastWarningTime >= this.MIN_WARNING_INTERVAL) {
      const newWarningCount = currentState.warningCount + 1;
      const newViolations = [...currentState.violations, violation];

      const newState = {
        warningCount: newWarningCount,
        lastWarningTime: now,
        violations: newViolations
      };

      this.securityState$.next(newState); // Update observable for state changes
      this.violations$.next(newViolations); // Update observable for list of violations
      this.saveSecurityState(); // Persist the updated state to localStorage

      this.loggingService.info(`[ExamenSecurityService] Security state updated. Warning count: ${newWarningCount}/${this.MAX_WARNINGS}. Last warning time: ${new Date(now).toLocaleString()}.`, undefined, 'ExamenSecurityService');

      // Notify the user based on the warning count
      if (newWarningCount >= this.MAX_WARNINGS) {
        this.loggingService.critical(`[ExamenSecurityService] MAX WARNINGS (${this.MAX_WARNINGS}) REACHED! Showing final warning dialog.`, newViolations, 'ExamenSecurityService');
        this.notificationService.showFinalWarningDialog(newViolations);
        // At this point, you might also want to automatically annul the exam or lock the user out.
        // E.g., this.router.navigate(['/exam-annulled']);
      } else {
        const baseMessage = this.getSecurityMessage(type);
        const remainingWarnings = this.MAX_WARNINGS - newWarningCount;
        const message = `${baseMessage}. ${remainingWarnings} advertencia${remainingWarnings !== 1 ? 's' : ''} restante${remainingWarnings !== 1 ? 's' : ''} antes de anular el examen.`;
        this.notificationService.showSecurityWarning(type, message);
        this.loggingService.warn(`[ExamenSecurityService] Showing security warning: "${message}".`, undefined, 'ExamenSecurityService');
      }
    } else {
      this.loggingService.debug(`[ExamenSecurityService] Skipping warning due to MIN_WARNING_INTERVAL (${this.MIN_WARNING_INTERVAL}ms). Time since last warning: ${now - currentState.lastWarningTime}ms.`, undefined, 'ExamenSecurityService');
    }
  }

  /**
   * Provides a user-friendly message for a given security violation type.
   * @param type The type of security violation.
   * @returns A string message.
   */
  private getSecurityMessage(type: SecurityViolationType): string {
    const messages: Record<SecurityViolationType, string> = {
      FULLSCREEN_EXIT: 'No se permite salir del modo pantalla completa',
      FULLSCREEN_DENIED: 'Debe permitir el modo pantalla completa para continuar',
      TAB_SWITCH: 'No se permite cambiar de pestaña durante el examen',
      KEYBOARD_SHORTCUT: 'Atajo de teclado no permitido',
      CLIPBOARD_OPERATION: 'Operaciones de copiar/pegar no permitidas',
      INACTIVITY_TIMEOUT: 'Sesión inactiva por mucho tiempo',
      NETWORK_VIOLATION: 'Violación de seguridad de red detectada',
      SUSPICIOUS_BEHAVIOR: 'Se ha detectado comportamiento sospechoso',
      TIME_MANIPULATION: 'Se ha detectado manipulación del tiempo',
      TIME_DRIFT: 'Se ha detectado desincronización del tiempo',
      SUSPICIOUS_ANSWER: 'Respuesta marcada como sospechosa',
      ANSWER_TOO_FAST: 'Respuesta demasiado rápida',
      ANSWER_TOO_SLOW: 'Tiempo de respuesta excedido',
      SUSPICIOUS_PATTERN: 'Se ha detectado un patrón sospechoso',
      POST_INCIDENT_VALIDATION_FAILED: 'La validación posterior al incidente ha fallado',
      FULLSCREEN_REQUIRED: 'Se requiere pantalla completa', // Could be initial requirement
      FULLSCREEN_WARNING: 'Advertencia de pantalla completa' // General fullscreen warning
    };
    return messages[type] || 'Se ha detectado una violación de seguridad';
  }

  /**
   * Returns an Observable of all recorded security violations.
   * @returns Observable of SecurityViolation array.
   */
  getSecurityViolations(): Observable<SecurityViolation[]> {
    return this.violations$.asObservable();
  }

  /**
   * Returns an Observable of the current overall security state.
   * @returns Observable of the security state object.
   */
  getSecurityState(): Observable<{
    warningCount: number;
    lastWarningTime: number;
    violations: SecurityViolation[];
  }> {
    return this.securityState$.asObservable();
  }

  /**
   * Determines the severity level for a given security violation type.
   * @param type The type of security violation.
   * @returns The corresponding SecuritySeverity.
   */
  private getViolationSeverity(type: SecurityViolationType): SecuritySeverity {
    const severityMap: Record<SecurityViolationType, SecuritySeverity> = {
      FULLSCREEN_EXIT: 'HIGH',
      FULLSCREEN_DENIED: 'HIGH',
      TAB_SWITCH: 'MEDIUM',
      KEYBOARD_SHORTCUT: 'LOW',
      CLIPBOARD_OPERATION: 'MEDIUM',
      INACTIVITY_TIMEOUT: 'LOW',
      NETWORK_VIOLATION: 'HIGH',
      SUSPICIOUS_BEHAVIOR: 'MEDIUM',
      TIME_MANIPULATION: 'HIGH',
      TIME_DRIFT: 'MEDIUM',
      SUSPICIOUS_ANSWER: 'MEDIUM',
      ANSWER_TOO_FAST: 'HIGH',
      ANSWER_TOO_SLOW: 'LOW',
      SUSPICIOUS_PATTERN: 'MEDIUM',
      POST_INCIDENT_VALIDATION_FAILED: 'HIGH',
      FULLSCREEN_REQUIRED: 'HIGH',
      FULLSCREEN_WARNING: 'MEDIUM'
    };
    const severity = severityMap[type];
    if (!severity) {
      this.loggingService.warn(`[ExamenSecurityService] Unknown violation type for severity mapping: ${type}. Defaulting to LOW.`, undefined, 'ExamenSecurityService');
    }
    return severity || 'LOW' as SecuritySeverity;
  }

  // Maps violation types to specific actions (e.g., BLOCK, WARN, LOG)
  private readonly ACTION_MAP: Record<SecurityViolationType, SecurityAction> = {
    FULLSCREEN_EXIT: 'BLOCK',
    FULLSCREEN_DENIED: 'WARN',
    TAB_SWITCH: 'WARN',
    KEYBOARD_SHORTCUT: 'LOG',
    CLIPBOARD_OPERATION: 'BLOCK',
    INACTIVITY_TIMEOUT: 'WARN',
    NETWORK_VIOLATION: 'BLOCK',
    SUSPICIOUS_BEHAVIOR: 'WARN',
    TIME_MANIPULATION: 'BLOCK',
    TIME_DRIFT: 'WARN',
    SUSPICIOUS_ANSWER: 'WARN',
    ANSWER_TOO_FAST: 'BLOCK',
    ANSWER_TOO_SLOW: 'WARN',
    SUSPICIOUS_PATTERN: 'WARN',
    POST_INCIDENT_VALIDATION_FAILED: 'BLOCK',
    FULLSCREEN_REQUIRED: 'WARN',
    FULLSCREEN_WARNING: 'WARN'
  } as const;

  /**
   * Determines the specific action to be taken for a given security violation type.
   * @param type The type of security violation.
   * @returns The corresponding SecurityAction.
   */
  private getActionForViolation(type: SecurityViolationType): SecurityAction {
    const action = this.ACTION_MAP[type];
    if (!action) {
      this.loggingService.warn(`[ExamenSecurityService] No action mapped for violation type: ${type}. Defaulting to LOG.`, undefined, 'ExamenSecurityService');
    }
    return action ?? 'LOG' as SecurityAction;
  }

  /**
   * Observes and reports security violations from all registered strategies.
   * This method should be called once to start monitoring.
   * @returns An Observable that emits the type of violation detected (or null).
   */
  iniciarMonitoreo(): Observable<SecurityViolationType | null> {
    return new Observable<SecurityViolationType | null>(observer => {
      this.ngZone.run(() => {
        this.loggingService.info('[ExamenSecurityService] Starting security monitoring. Subscribing to all strategy violations.', undefined, 'ExamenSecurityService');

        for (const strategy of this.strategies) {
          try {
            this.loggingService.debug(`[ExamenSecurityService] Subscribing to violations from strategy: ${strategy.getType()}.`, undefined, 'ExamenSecurityService');
            // Subscribe to violations emitted by each strategy
            strategy.getViolations().pipe(
              takeUntil(this.destroy$) // Unsubscribe when the service is cleaned up
            ).subscribe({
              next: (violation: SecurityViolationType) => {
                if (violation) {
                  this.loggingService.warn(`[ExamenSecurityService] Violation "${violation}" detected by strategy ${strategy.getType()}. Reporting...`, undefined, 'ExamenSecurityService');
                  this.reportSecurityViolation(violation); // Report the violation to the central service
                  observer.next(violation); // Emit the violation type
                }
              },
              error: (err) => {
                this.loggingService.error(`[ExamenSecurityService] Error in strategy ${strategy.getType()} violation observable:`, err, 'ExamenSecurityService');
                // Do not propagate the error to prevent the entire monitoring stream from stopping
              }
            });
          } catch (error) {
            this.loggingService.error(`[ExamenSecurityService] Error initializing monitoring for strategy ${strategy.getType()}:`, error, 'ExamenSecurityService');
            // Continue with other strategies even if one fails
          }
        }

        // Check if secure mode is active. This should ideally be handled by `activateSecureMode`
        // but this warning acts as a safeguard.
        if (!this.isSecureModeActive.value) {
          this.loggingService.warn('[ExamenSecurityService] Secure mode is not active. Violations might not be detected correctly. Call activateSecureMode() first.', undefined, 'ExamenSecurityService');
        }

        this.loggingService.info('[ExamenSecurityService] All strategies subscribed for monitoring.', undefined, 'ExamenSecurityService');
      }); // End ngZone.run

      // Cleanup when the observable is unsubscribed
      return () => {
        this.ngZone.run(() => {
          this.loggingService.info('[ExamenSecurityService] Cleaning up monitoring resources.', undefined, 'ExamenSecurityService');
          for (const strategy of this.strategies) {
            try {
              // Strategies should handle their own cleanup within their deactivate method if applicable
              // Or ensure getViolations() completes/unsubscribes when `this.destroy$` emits.
              this.loggingService.debug(`[ExamenSecurityService] Ensuring cleanup for strategy ${strategy.getType()}.`, undefined, 'ExamenSecurityService');
            } catch (error) {
              this.loggingService.error(`[ExamenSecurityService] Error during cleanup for strategy ${strategy.getType()}:`, error, 'ExamenSecurityService');
            }
          }
        });
      };
    });
  }

  /**
   * Performs cleanup operations for the service, typically called on component/service destruction.
   * Unsubscribes from all observables and deactivates secure mode.
   */
  cleanup(): void {
    this.loggingService.info('[ExamenSecurityService] Performing service cleanup (OnDestroy).', undefined, 'ExamenSecurityService');
    this.destroy$.next(); // Signal all `takeUntil(this.destroy$)` to complete
    this.destroy$.complete(); // Complete the subject
    this.deactivateSecureMode(); // Turn off all security measures
    this.reset(); // Reset the state and clear localStorage
    this.notificationService.cleanup(); // Clean up notification service resources
    this.loggingService.info('[ExamenSecurityService] Service cleanup completed.', undefined, 'ExamenSecurityService');
  }

  /**
   * Returns an Observable indicating whether secure mode is currently active.
   * @returns Observable of boolean.
   */
  isSecureMode(): Observable<boolean> {
    return this.isSecureModeActive.asObservable();
  }

  /**
   * Retrieves a specific security strategy by its type.
   * @param type The SecurityViolationType of the strategy to retrieve.
   * @returns The ISecurityStrategy instance or undefined if not found.
   */
  getStrategy(type: SecurityViolationType): ISecurityStrategy | undefined {
    return this.securityStrategies.get(type);
  }
}
