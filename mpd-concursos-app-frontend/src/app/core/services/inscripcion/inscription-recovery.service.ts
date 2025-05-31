import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { IInscriptionFormState, InscriptionStateService } from  './inscription-state.service';

import { InscriptionStep } from '@shared/enums/inscription-step.enum';

@Injectable({
  providedIn: 'root'
})
export class InscriptionRecoveryService {
  constructor(
    private inscriptionStateService: InscriptionStateService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}


  /**
   * Verifica si hay inscripciones pendientes y muestra una notificación informativa
   * @param skipDialog Si es true, no muestra ninguna notificación (usado cuando se navega desde la pestaña de documentación)
   */
  checkForPendingInscriptions(skipDialog = false): void {
    // Verificar si hay parámetros en la URL que indiquen que se está continuando una inscripción
    const urlParams = new URLSearchParams(window.location.search);
    const continueInscription = urlParams.get('continueInscription') === 'true';
    const forceOpen = urlParams.get('forceOpen') === 'true';

    // Si se está continuando una inscripción y se debe forzar la apertura, no mostrar notificación
    if (continueInscription && forceOpen) {
      console.log('[InscriptionRecoveryService] Detectados parámetros para continuar inscripción, omitiendo notificación');
      return;
    }

    // Obtener todas las inscripciones incompletas
    const pendingInscriptions = this.inscriptionStateService.getAllIncompleteInscriptions();

    // Filtrar inscripciones según su paso actual
    const filteredInscriptions = pendingInscriptions.filter((inscription: IInscriptionFormState) => {
      // Solo considerar inscripciones que no han llegado al paso final (COMPLETED)
      // Ignorar inscripciones que ya están en el paso final
      return inscription.currentStep !== InscriptionStep.COMPLETED;
    });

    if (filteredInscriptions.length > 0) {
      console.log('[InscriptionRecoveryService] Inscripciones pendientes encontradas:', filteredInscriptions);

      // Si se debe omitir la notificación, no hacer nada
      if (skipDialog) {
        console.log('[InscriptionRecoveryService] Omitiendo notificación por solicitud');
        return;
      }

      // Mostrar notificación informativa independientemente de la cantidad de inscripciones pendientes
      this.showPendingInscriptionsSnackbar(filteredInscriptions);
    }
  }

  /**
   * Muestra un snackbar informando que hay inscripciones pendientes
   * @param inscriptions Lista de inscripciones pendientes
   */
  private showPendingInscriptionsSnackbar(inscriptions: IInscriptionFormState[]): void {
    const message = inscriptions.length === 1
      ? 'Tienes una inscripción en proceso. Puedes continuarla desde la sección "Mis Postulaciones".'
      : `Tienes ${inscriptions.length} inscripciones en proceso. Puedes continuarlas desde la sección "Mis Postulaciones".`;

    const snackBarRef = this.snackBar.open(
      message,
      'Ver Postulaciones',
      {
        duration: 10000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['info-snackbar']
      }
    );

    snackBarRef.onAction().subscribe(() => {
      this.router.navigate(['/dashboard/postulaciones']);
    });
  }
}
