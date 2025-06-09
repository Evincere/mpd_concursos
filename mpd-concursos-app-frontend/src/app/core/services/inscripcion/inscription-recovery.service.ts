import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';
import { UnifiedNotificationService } from '@shared/components/unified-notification/unified-notification.service';

import { IInscriptionFormState, InscriptionStateService } from './inscription-state.service';
import { InscriptionService } from './inscription.service';
import { IInscription } from '@shared/interfaces/inscripcion/inscription.interface';
import { LoggingService } from '@core/services/logging/logging.service'; // Import LoggingService

import { InscriptionStep } from '@shared/enums/inscription-step.enum';

@Injectable({
  providedIn: 'root'
})
export class InscriptionRecoveryService {
  constructor(
    private inscriptionStateService: InscriptionStateService,
    private inscriptionService: InscriptionService,
    private notificationService: UnifiedNotificationService,
    private router: Router,
    private loggingService: LoggingService // Inject LoggingService
  ) {
    this.loggingService.debug('[InscriptionRecoveryService] Initializing InscriptionRecoveryService.', undefined, 'InscriptionRecovery');
  }

  /**
   * Verifica si hay inscripciones pendientes y muestra una notificación informativa
   * SOLO en casos específicos como recuperación por desconexión
   * @param skipDialog Si es true, no muestra ninguna notificación
   * @param forceCheck Si es true, fuerza la verificación (usado para casos de desconexión)
   */
  checkForPendingInscriptions(skipDialog = false, forceCheck = false): void {
    this.loggingService.info('[InscriptionRecoveryService] Starting check for pending inscriptions.', { skipDialog, forceCheck }, 'InscriptionRecovery');

    // Verificar si hay parámetros en la URL que indiquen que se está continuando una inscripción
    const urlParams = new URLSearchParams(window.location.search);
    const continueInscription = urlParams.get('continueInscription') === 'true';
    const forceOpen = urlParams.get('forceOpen') === 'true';
    const fromDisconnection = urlParams.get('fromDisconnection') === 'true';

    this.loggingService.debug('[InscriptionRecoveryService] URL parameters:', { continueInscription, forceOpen, fromDisconnection }, 'InscriptionRecovery');

    // Si se está continuando una inscripción y se debe forzar la apertura, no mostrar notificación
    if (continueInscription && forceOpen) {
      this.loggingService.debug('[InscriptionRecoveryService] Skipping notification: Inscription continuation with forceOpen detected.', undefined, 'InscriptionRecovery');
      return;
    }

    // CORRECCIÓN: Solo verificar automáticamente en casos específicos
    if (!forceCheck && !fromDisconnection) {
      this.loggingService.debug('[InscriptionRecoveryService] Skipping automatic check: Not forced and not from disconnection.', undefined, 'InscriptionRecovery');
      return;
    }

    // Obtener todas las inscripciones incompletas del localStorage
    const pendingInscriptions = this.inscriptionStateService.getAllIncompleteInscriptions();
    this.loggingService.debug(`[InscriptionRecoveryService] Found ${pendingInscriptions.length} incomplete inscriptions in local storage.`, pendingInscriptions, 'InscriptionRecovery');

    // Filtrar inscripciones según su paso actual
    const filteredInscriptions = pendingInscriptions.filter((inscription: IInscriptionFormState) => {
      // Solo considerar inscripciones que no han llegado al paso final (COMPLETED)
      // Ignorar inscripciones que ya están en el paso final
      return inscription.currentStep !== InscriptionStep.COMPLETED;
    });

    if (filteredInscriptions.length > 0) {
      this.loggingService.info(`[InscriptionRecoveryService] Found ${filteredInscriptions.length} pending inscriptions after filtering.`, filteredInscriptions, 'InscriptionRecovery');
      // Validate these local inscriptions against the backend
      this.validateInscriptionsWithBackend(filteredInscriptions, skipDialog);
    } else {
      this.loggingService.info('[InscriptionRecoveryService] No pending inscriptions found after filtering.', undefined, 'InscriptionRecovery');
    }
  }

  /**
   * Valida que las inscripciones del localStorage realmente existen en el backend
   * @param localInscriptions Inscripciones encontradas en localStorage
   * @param skipDialog Si se debe omitir la notificación
   */
  private validateInscriptionsWithBackend(localInscriptions: IInscriptionFormState[], skipDialog: boolean): void {
    this.loggingService.info('[InscriptionRecoveryService] Validating local inscriptions with backend.', localInscriptions, 'InscriptionRecovery');

    // Obtener las inscripciones reales del backend
    this.inscriptionService.inscriptions.pipe(take(1)).subscribe({
      next: (backendInscriptions) => {
        // backendInscriptions is already IInscription[], no need to access .content
        this.loggingService.debug(`[InscriptionRecoveryService] Received ${backendInscriptions.length} inscriptions from backend.`, backendInscriptions, 'InscriptionRecovery');

        const validResumableInscriptions: IInscriptionFormState[] = [];

        // Check each local inscription against backend data
        localInscriptions.forEach(localInscription => {
          const backendInscription = backendInscriptions.find((b: IInscription) => b.id === localInscription.inscriptionId);

          // Only consider valid if it exists in the backend and is in a resumable state
          const isValid = backendInscription && this.canResumeInscription(backendInscription.state);

          if (isValid) {
            this.loggingService.debug(`[InscriptionRecoveryService] Local inscription ${localInscription.inscriptionId} is valid and resumable.`, undefined, 'InscriptionRecovery');
            validResumableInscriptions.push(localInscription);
          } else {
            this.loggingService.warn(`[InscriptionRecoveryService] Local inscription ${localInscription.inscriptionId} is NOT valid or resumable. Backend status: ${backendInscription?.state || 'N/A'}.`, undefined, 'InscriptionRecovery');
            // Optionally, clean up invalid local inscription immediately
            this.inscriptionStateService.clearInscriptionState(localInscription.inscriptionId);
            this.loggingService.debug(`[InscriptionRecoveryService] Cleared invalid local inscription ${localInscription.inscriptionId} from state.`, undefined, 'InscriptionRecovery');
          }
        });

        if (validResumableInscriptions.length > 0 && !skipDialog) {
          this.loggingService.info(`[InscriptionRecoveryService] Showing notification for ${validResumableInscriptions.length} resumable inscriptions.`, undefined, 'InscriptionRecovery');
          this.showPendingInscriptionsNotification(validResumableInscriptions);
        } else if (validResumableInscriptions.length === 0) {
          this.loggingService.info('[InscriptionRecoveryService] No valid resumable inscriptions found after backend validation.', undefined, 'InscriptionRecovery');
        }
      },
      error: (error) => {
        this.loggingService.error('[InscriptionRecoveryService] Error validating inscriptions with backend:', error, 'InscriptionRecovery');
        // En caso de error, no mostrar notificación para evitar confusión
      }
    });
  }

  /**
   * Determina si una inscripción puede ser reanudada basándose en su estado
   * @param state Estado de la inscripción
   * @returns true si puede ser reanudada, false en caso contrario
   */
  private canResumeInscription(state: string): boolean {
    // Estados que permiten reanudación (usando la misma lógica que InscripcionStateUtils)
    const resumableStates = ['ACTIVE', 'IN_PROCESS', 'COMPLETED_PENDING_DOCS'];
    const canResume = resumableStates.includes(state);
    this.loggingService.debug(`[InscriptionRecoveryService] Checking resumability for state "${state}": ${canResume}.`, undefined, 'InscriptionRecovery');
    return canResume;
  }

  /**
   * Muestra una notificación informando que hay inscripciones pendientes
   * @param inscriptions Lista de inscripciones pendientes
   */
  private showPendingInscriptionsNotification(inscriptions: IInscriptionFormState[]): void {
    const message = inscriptions.length === 1
      ? 'Se detectó una inscripción interrumpida. Puedes continuarla desde "Mis Postulaciones".'
      : `Se detectaron ${inscriptions.length} inscripciones interrumpidas. Puedes continuarlas desde "Mis Postulaciones".`;

    this.loggingService.info('[InscriptionRecoveryService] Displaying pending inscriptions notification.', { message, count: inscriptions.length }, 'InscriptionRecovery');

    this.notificationService.info(message, 'Inscripciones Recuperadas', {
      duration: 8000,
      position: 'bottom-end',
      actionText: 'Ver Postulaciones',
      onAction: () => {
        this.router.navigate(['/dashboard/postulaciones']);
        this.loggingService.info('[InscriptionRecoveryService] User clicked "Ver Postulaciones" in notification.', undefined, 'InscriptionRecovery');
      }
    });
  }

  /**
   * Limpia todas las inscripciones inválidas del localStorage
   * Útil para casos donde se reinicia la base de datos o hay inconsistencias
   */
  cleanupInvalidInscriptions(): void {
    this.loggingService.info('[InscriptionRecoveryService] Starting cleanup of invalid inscriptions from local storage.', undefined, 'InscriptionRecovery');

    // Obtener inscripciones locales del estado
    const localInscriptions = this.inscriptionStateService.getAllIncompleteInscriptions();

    if (localInscriptions.length === 0) {
      this.loggingService.info('[InscriptionRecoveryService] No local inscriptions found for cleanup. Skipping cleanup.', undefined, 'InscriptionRecovery');
      return;
    }
    this.loggingService.debug(`[InscriptionRecoveryService] Found ${localInscriptions.length} local inscriptions for potential cleanup.`, localInscriptions, 'InscriptionRecovery');


    // Obtener inscripciones del backend para validar
    this.inscriptionService.inscriptions.pipe(take(1)).subscribe({
      next: (backendInscriptions) => {
        let cleanedCount = 0;
        // backendInscriptions is already IInscription[], no need to access .content
        this.loggingService.debug(`[InscriptionRecoveryService] Received ${backendInscriptions.length} backend inscriptions for cleanup validation.`, backendInscriptions, 'InscriptionRecovery');

        localInscriptions.forEach(localInscription => {
          const existsInBackend = backendInscriptions.some(backend =>
            backend.id === localInscription.inscriptionId
          );

          if (!existsInBackend) {
            // Limpiar inscripción inválida del localStorage
            this.inscriptionStateService.clearInscriptionState(localInscription.inscriptionId);
            cleanedCount++;
            this.loggingService.info(`[InscriptionRecoveryService] Cleared invalid local inscription ${localInscription.inscriptionId} (not found in backend).`, undefined, 'InscriptionRecovery');
          } else {
            this.loggingService.debug(`[InscriptionRecoveryService] Local inscription ${localInscription.inscriptionId} exists in backend. Keeping it.`, undefined, 'InscriptionRecovery');
          }
        });

        if (cleanedCount > 0) {
          this.loggingService.info(`[InscriptionRecoveryService] Cleanup completed. Removed ${cleanedCount} invalid local inscriptions.`, undefined, 'InscriptionRecovery');
          this.notificationService.info(`Se han limpiado ${cleanedCount} inscripciones inválidas de tu almacenamiento local.`);
        } else {
          this.loggingService.info('[InscriptionRecoveryService] No invalid local inscriptions found to clean up.', undefined, 'InscriptionRecovery');
        }
      },
      error: (error) => {
        this.loggingService.error('[InscriptionRecoveryService] Error validating inscriptions during cleanup:', error, 'InscriptionRecovery');
        this.notificationService.error('Error al intentar limpiar inscripciones. Por favor, revise la consola.');
      }
    });
  }
}
