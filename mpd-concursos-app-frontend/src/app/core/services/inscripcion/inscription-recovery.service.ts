import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';
import { UnifiedNotificationService } from '@shared/components/unified-notification/unified-notification.service';

import { IInscriptionFormState, InscriptionStateService } from  './inscription-state.service';
import { InscriptionService } from './inscription.service';

import { InscriptionStep } from '@shared/enums/inscription-step.enum';

@Injectable({
  providedIn: 'root'
})
export class InscriptionRecoveryService {
  constructor(
    private inscriptionStateService: InscriptionStateService,
    private inscriptionService: InscriptionService,
    private notificationService: UnifiedNotificationService,
    private router: Router
  ) {}


  /**
   * Verifica si hay inscripciones pendientes y muestra una notificación informativa
   * SOLO en casos específicos como recuperación por desconexión
   * @param skipDialog Si es true, no muestra ninguna notificación
   * @param forceCheck Si es true, fuerza la verificación (usado para casos de desconexión)
   */
  checkForPendingInscriptions(skipDialog = false, forceCheck = false): void {
    // Verificar si hay parámetros en la URL que indiquen que se está continuando una inscripción
    const urlParams = new URLSearchParams(window.location.search);
    const continueInscription = urlParams.get('continueInscription') === 'true';
    const forceOpen = urlParams.get('forceOpen') === 'true';
    const fromDisconnection = urlParams.get('fromDisconnection') === 'true';

    // Si se está continuando una inscripción y se debe forzar la apertura, no mostrar notificación
    if (continueInscription && forceOpen) {
      console.log('[InscriptionRecoveryService] Detectados parámetros para continuar inscripción, omitiendo notificación');
      return;
    }

    // CORRECCIÓN: Solo verificar automáticamente en casos específicos
    if (!forceCheck && !fromDisconnection) {
      console.log('[InscriptionRecoveryService] Omitiendo verificación automática - el usuario debe decidir cuándo continuar desde "Mis Postulaciones"');
      return;
    }

    // Obtener todas las inscripciones incompletas del localStorage
    const pendingInscriptions = this.inscriptionStateService.getAllIncompleteInscriptions();

    // Filtrar inscripciones según su paso actual
    const filteredInscriptions = pendingInscriptions.filter((inscription: IInscriptionFormState) => {
      // Solo considerar inscripciones que no han llegado al paso final (COMPLETED)
      // Ignorar inscripciones que ya están en el paso final
      return inscription.currentStep !== InscriptionStep.COMPLETED;
    });

    if (filteredInscriptions.length > 0) {
      console.log('[InscriptionRecoveryService] Inscripciones pendientes encontradas en localStorage:', filteredInscriptions);

      // VALIDACIÓN CRÍTICA: Verificar que las inscripciones realmente existen en el backend
      this.validateInscriptionsWithBackend(filteredInscriptions, skipDialog);
    }
  }

  /**
   * Valida que las inscripciones del localStorage realmente existen en el backend
   * @param localInscriptions Inscripciones encontradas en localStorage
   * @param skipDialog Si se debe omitir la notificación
   */
  private validateInscriptionsWithBackend(localInscriptions: IInscriptionFormState[], skipDialog: boolean): void {
    // Obtener las inscripciones reales del backend
    this.inscriptionService.inscriptions.pipe(take(1)).subscribe({
      next: (backendInscriptions) => {
        console.log('[InscriptionRecoveryService] Inscripciones del backend:', backendInscriptions);

        // Filtrar solo las inscripciones que realmente existen en el backend y están en proceso
        const validInscriptions = localInscriptions.filter(localInscription => {
          const backendInscription = backendInscriptions.find(backend =>
            backend.id === localInscription.inscriptionId
          );

          // Solo considerar válida si existe en el backend y está en un estado que permite reanudación
          const isValid = backendInscription && this.canResumeInscription(backendInscription.state);

          if (!isValid) {
            console.log('[InscriptionRecoveryService] Limpiando inscripción inválida del localStorage:', localInscription.inscriptionId);
            // Limpiar inscripciones que ya no existen o no se pueden reanudar
            this.inscriptionStateService.clearInscriptionState(localInscription.inscriptionId);
          }

          return isValid;
        });

        console.log('[InscriptionRecoveryService] Inscripciones válidas después de validación:', validInscriptions);

        // Solo mostrar notificación si hay inscripciones válidas
        if (validInscriptions.length > 0 && !skipDialog) {
          this.showPendingInscriptionsNotification(validInscriptions);
        }
      },
      error: (error) => {
        console.error('[InscriptionRecoveryService] Error al validar inscripciones con backend:', error);
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
    return resumableStates.includes(state);
  }

  /**
   * Muestra una notificación informando que hay inscripciones pendientes
   * @param inscriptions Lista de inscripciones pendientes
   */
  private showPendingInscriptionsNotification(inscriptions: IInscriptionFormState[]): void {
    const message = inscriptions.length === 1
      ? 'Se detectó una inscripción interrumpida. Puedes continuarla desde "Mis Postulaciones".'
      : `Se detectaron ${inscriptions.length} inscripciones interrumpidas. Puedes continuarlas desde "Mis Postulaciones".`;

    this.notificationService.info(message, 'Inscripciones Recuperadas', {
      duration: 8000,
      position: 'bottom-end',
      actionText: 'Ver Postulaciones',
      onAction: () => {
        this.router.navigate(['/dashboard/postulaciones']);
      }
    });
  }

  /**
   * Limpia todas las inscripciones inválidas del localStorage
   * Útil para casos donde se reinicia la base de datos o hay inconsistencias
   */
  cleanupInvalidInscriptions(): void {
    console.log('[InscriptionRecoveryService] Iniciando limpieza de inscripciones inválidas...');

    const localInscriptions = this.inscriptionStateService.getAllIncompleteInscriptions();

    if (localInscriptions.length === 0) {
      console.log('[InscriptionRecoveryService] No hay inscripciones en localStorage para limpiar');
      return;
    }

    // Obtener inscripciones del backend para validar
    this.inscriptionService.inscriptions.pipe(take(1)).subscribe({
      next: (backendInscriptions) => {
        let cleanedCount = 0;

        localInscriptions.forEach(localInscription => {
          const existsInBackend = backendInscriptions.some(backend =>
            backend.id === localInscription.inscriptionId
          );

          if (!existsInBackend) {
            console.log('[InscriptionRecoveryService] Limpiando inscripción inexistente:', localInscription.inscriptionId);
            this.inscriptionStateService.clearInscriptionState(localInscription.inscriptionId);
            cleanedCount++;
          }
        });

        if (cleanedCount > 0) {
          console.log(`[InscriptionRecoveryService] Limpieza completada: ${cleanedCount} inscripciones eliminadas`);
        } else {
          console.log('[InscriptionRecoveryService] No se encontraron inscripciones inválidas para limpiar');
        }
      },
      error: (error) => {
        console.error('[InscriptionRecoveryService] Error durante la limpieza:', error);
      }
    });
  }
}
