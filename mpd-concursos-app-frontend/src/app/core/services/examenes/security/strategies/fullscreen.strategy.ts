import { Injectable } from '@angular/core';
import { BaseSecurityStrategy } from './base-security.strategy';
import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import { ISecurityStrategy } from '@core/interfaces/examenes/security/security-strategy.interface';
import { ExamenNotificationService } from '../../examen-notification.service';
import { LoggingService } from '@core/services/logging/logging.service';

/**
 * Defines the various states of the fullscreen mode strategy.
 */
export enum FullscreenState {
  INITIAL = 'INITIAL',       // Initial state (before activating)
  ENTERING = 'ENTERING',     // Requesting to enter fullscreen
  ACTIVE = 'ACTIVE',         // Currently in fullscreen
  EXITING = 'EXITING',       // Attempting to exit fullscreen
  VIOLATED = 'VIOLATED'      // Exited fullscreen unexpectedly (violation)
}

@Injectable()
export class FullscreenStrategy extends BaseSecurityStrategy implements ISecurityStrategy {
  private currentState: FullscreenState = FullscreenState.INITIAL;
  private readonly LOG_TAG = 'FullscreenStrategy'; // Tag for logging

  constructor(
    private notificationService: ExamenNotificationService,
    private loggingService: LoggingService // Inject LoggingService
  ) {
    super();
    this.loggingService.debug(`[${this.LOG_TAG}] Initializing strategy. Current state: ${this.currentState}.`, undefined, this.LOG_TAG);
  }

  /**
   * Returns the type of security violation handled by this strategy.
   */
  getType(): SecurityViolationType {
    return SecurityViolationType.FULLSCREEN_REQUIRED;
  }

  /**
   * Handles a security violation specific to fullscreen requirements.
   * Only processes violations when in ACTIVE or EXITING states.
   * @param details Optional additional details about the violation.
   */
  handleViolation(details?: unknown): void {
    // Only handle violations when we are in ACTIVE or EXITING states
    if (this.currentState === FullscreenState.ACTIVE ||
        this.currentState === FullscreenState.EXITING) {
      this.loggingService.warn(`[${this.LOG_TAG}] Fullscreen violation detected! State: ${this.currentState}. Details:`, details, this.LOG_TAG);
      // Emit the violation to the violations$ subject
      this.violations$.next(this.getType());
    } else {
      this.loggingService.debug(`[${this.LOG_TAG}] Fullscreen violation detected, but not handled due to current state: ${this.currentState}.`, details, this.LOG_TAG);
    }
  }

  /**
   * Checks if the browser supports the Fullscreen API.
   * @returns true if fullscreen is supported, false otherwise.
   */
  checkFullscreenSupport(): boolean {
    const docElm = document.documentElement;

    // Check for different fullscreen API prefixes
    const fullscreenEnabled = document.fullscreenEnabled ||
                              (document as Document & { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled ||
                              (document as Document & { mozFullScreenEnabled?: boolean }).mozFullScreenEnabled ||
                              (document as Document & { msFullscreenEnabled?: boolean }).msFullscreenEnabled;

    const requestFullscreen = docElm.requestFullscreen ||
                              (docElm as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen ||
                              (docElm as HTMLElement & { mozRequestFullScreen?: () => Promise<void> }).mozRequestFullScreen ||
                              (docElm as HTMLElement & { msRequestFullscreen?: () => Promise<void> }).msRequestFullscreen;

    const isSupported = !!(fullscreenEnabled && requestFullscreen);
    this.loggingService.debug(`[${this.LOG_TAG}] Fullscreen API support check: ${isSupported}.`, { fullscreenEnabled: !!fullscreenEnabled, requestFullscreenAvailable: !!requestFullscreen }, this.LOG_TAG);
    return isSupported;
  }

  /**
   * Activates the fullscreen mode.
   * Overrides the base class activate method.
   * @returns A Promise that resolves when fullscreen is active.
   * @throws Error if fullscreen is not supported or activation fails.
   */
  override async activate(): Promise<void> {
    this.loggingService.info(`[${this.LOG_TAG}] Attempting to activate fullscreen. Current state: ${this.currentState}.`, undefined, this.LOG_TAG);
    try {
      // Check if the browser supports fullscreen
      if (!this.checkFullscreenSupport()) {
        const errorMsg = 'Este navegador no soporta la API de pantalla completa.';
        this.loggingService.error(`[${this.LOG_TAG}] ${errorMsg}`, undefined, this.LOG_TAG);
        throw new Error(errorMsg);
      }

      // If we are already in ACTIVE state, do nothing
      if (this.currentState === FullscreenState.ACTIVE) {
        this.loggingService.debug(`[${this.LOG_TAG}] Already in ACTIVE fullscreen state. Skipping activation.`, undefined, this.LOG_TAG);
        return;
      }

      this.currentState = FullscreenState.ENTERING;
      this.loggingService.debug(`[${this.LOG_TAG}] State changed to ${this.currentState}.`, undefined, this.LOG_TAG);

      // Check if we are already in fullscreen (e.g., if user manually enabled it)
      if (!document.fullscreenElement) {
        this.loggingService.debug(`[${this.LOG_TAG}] Document not in fullscreen. Requesting fullscreen.`, undefined, this.LOG_TAG);
        const docElm = document.documentElement; // Get the whole document element
        try {
          // Use the prefixed requestFullscreen if available, otherwise standard
          const requestFn = docElm.requestFullscreen ||
                            (docElm as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen ||
                            (docElm as HTMLElement & { mozRequestFullScreen?: () => Promise<void> }).mozRequestFullScreen ||
                            (docElm as HTMLElement & { msRequestFullscreen?: () => Promise<void> }).msRequestFullscreen;

          if (requestFn) {
            await requestFn.call(docElm); // Call the function with `docElm` as context
            this.loggingService.info(`[${this.LOG_TAG}] Successfully requested fullscreen.`, undefined, this.LOG_TAG);
            this.currentState = FullscreenState.ACTIVE;
            this.loggingService.debug(`[${this.LOG_TAG}] State changed to ${this.currentState}.`, undefined, this.LOG_TAG);
          } else {
            const errorMsg = 'No se encontró la función para solicitar pantalla completa.';
            this.loggingService.error(`[${this.LOG_TAG}] ${errorMsg}`, undefined, this.LOG_TAG);
            throw new Error(errorMsg);
          }
        } catch (fsError: unknown) {
          this.loggingService.error(`[${this.LOG_TAG}] Error requesting fullscreen:`, fsError, this.LOG_TAG);
          this.currentState = FullscreenState.INITIAL; // Revert state on failure to enter
          throw fsError;
        }
      } else {
        this.loggingService.info(`[${this.LOG_TAG}] Already in fullscreen mode. Setting state to ACTIVE.`, undefined, this.LOG_TAG);
        this.currentState = FullscreenState.ACTIVE;
      }
      this.loggingService.debug(`[${this.LOG_TAG}] Fullscreen activation process completed. Final state: ${this.currentState}.`, undefined, this.LOG_TAG);
    } catch (error) {
      this.loggingService.error(`[${this.LOG_TAG}] Critical error in activate method:`, error, this.LOG_TAG);
      // Do not change state here, let calling component handle the error or keep current state
      throw error;
    }
  }

  /**
   * Deactivates the fullscreen mode.
   * If currently in fullscreen and in ACTIVE state, it attempts to exit fullscreen.
   * Does not change state to VIOLATED here, that's handled by handleFullscreenChange.
   */
  override deactivate(): void {
    this.loggingService.info(`[${this.LOG_TAG}] Attempting to deactivate fullscreen. Current state: ${this.currentState}.`, undefined, this.LOG_TAG);
    if (document.fullscreenElement && this.currentState === FullscreenState.ACTIVE) {
      this.loggingService.debug(`[${this.LOG_TAG}] Exiting fullscreen programmatically.`, undefined, this.LOG_TAG);
      document.exitFullscreen();
      this.currentState = FullscreenState.EXITING; // Set to EXITING, actual state change handled by event listener
      this.loggingService.debug(`[${this.LOG_TAG}] State changed to ${this.currentState}.`, undefined, this.LOG_TAG);
    } else {
      this.loggingService.debug(`[${this.LOG_TAG}] Not in fullscreen or not in ACTIVE state. Skipping programmatic exit.`, undefined, this.LOG_TAG);
    }
  }

  /**
   * Handles changes in the fullscreen status. This method should be called by an event listener
   * (e.g., `document.onfullscreenchange`).
   * @param isInFullscreen Indicates if the document is currently in fullscreen mode.
   * @returns true if the fullscreen state transition is allowed/expected, false if it's a violation.
   */
  async handleFullscreenChange(isInFullscreen: boolean): Promise<boolean> {
    this.loggingService.info(`[${this.LOG_TAG}] Fullscreen change detected. Current state: ${this.currentState}. Is now in fullscreen: ${isInFullscreen}.`, undefined, this.LOG_TAG);

    switch (this.currentState) {
      case FullscreenState.INITIAL:
        if (isInFullscreen) {
          // Unexpectedly entered fullscreen (e.g., user manually pressed F11)
          this.loggingService.warn(`[${this.LOG_TAG}] Entered fullscreen from INITIAL state unexpectedly.`, undefined, this.LOG_TAG);
          this.currentState = FullscreenState.ACTIVE;
          return true; // Still considered "active"
        }
        break;

      case FullscreenState.ENTERING:
        if (isInFullscreen) {
          this.loggingService.info(`[${this.LOG_TAG}] Successfully entered fullscreen. State changed to ACTIVE.`, undefined, this.LOG_TAG);
          this.currentState = FullscreenState.ACTIVE;
          return true;
        } else {
          // Failed to enter fullscreen after request
          this.loggingService.error(`[${this.LOG_TAG}] Failed to enter fullscreen after request. State changed to INITIAL.`, undefined, this.LOG_TAG);
          this.currentState = FullscreenState.INITIAL;
          // Optionally, notify the user or handle this failure
          this.notificationService.mostrarAdvertencia('No se pudo activar la pantalla completa. Por favor, asegúrese de permitirla.');
          return false; // Indicates a problem
        }
        break;

      case FullscreenState.ACTIVE:
        if (!isInFullscreen) {
          // Exited fullscreen from ACTIVE state unexpectedly (violation)
          this.loggingService.warn(`[${this.LOG_TAG}] Exited fullscreen from ACTIVE state unexpectedly (VIOLATION).`, undefined, this.LOG_TAG);
          this.currentState = FullscreenState.VIOLATED;
          this.handleViolation(); // Trigger violation handling
          this.notificationService.mostrarError('¡Ha salido de la pantalla completa! Esto se considera una infracción.');
          return false; // Indicates a violation
        }
        break;

      case FullscreenState.EXITING:
        if (isInFullscreen) {
          // User canceled the exit request (e.g., pressed escape after programmatic exit)
          this.loggingService.warn(`[${this.LOG_TAG}] User canceled fullscreen exit. Remaining in ACTIVE state.`, undefined, this.LOG_TAG);
          this.currentState = FullscreenState.ACTIVE;
          return true; // Expected behavior, not a violation
        } else {
          // Programmatic exit was successful
          this.loggingService.info(`[${this.LOG_TAG}] Successfully exited fullscreen programmatically. State changed to INITIAL.`, undefined, this.LOG_TAG);
          this.currentState = FullscreenState.INITIAL;
          return true; // Expected behavior
        }
        break;

      case FullscreenState.VIOLATED:
        if (isInFullscreen) {
          // User re-entered fullscreen after a violation
          this.loggingService.info(`[${this.LOG_TAG}] Re-entered fullscreen from VIOLATED state. State changed to ACTIVE.`, undefined, this.LOG_TAG);
          this.currentState = FullscreenState.ACTIVE;
          return true;
        }
        break;
    }
    // Default case: no specific state transition, or harmless state change.
    this.loggingService.debug(`[${this.LOG_TAG}] Unhandled or harmless fullscreen change. Current state: ${this.currentState}. Is in fullscreen: ${isInFullscreen}.`, undefined, this.LOG_TAG);
    return true;
  }

  /**
   * Checks if the strategy is currently in a violated state.
   * @returns true if in VIOLATED state, false otherwise.
   */
  isInViolatedState(): boolean {
    return this.currentState === FullscreenState.VIOLATED;
  }

  /**
   * Checks if the strategy is in an initial or entering phase.
   * @returns true if in INITIAL or ENTERING state, false otherwise.
   */
  isInInitialPhase(): boolean {
    return this.currentState === FullscreenState.INITIAL ||
           this.currentState === FullscreenState.ENTERING;
  }
}
