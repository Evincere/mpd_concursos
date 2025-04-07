import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { InscriptionStateService, IInscriptionFormState } from './inscription-state.service';
import { ContinueInscriptionDialogComponent } from '@features/concursos/components/inscripcion/continue-inscription-dialog/continue-inscription-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class InscriptionRecoveryService {
  constructor(
    private inscriptionStateService: InscriptionStateService,
    private dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}
  
  /**
   * Verifica si hay inscripciones pendientes y muestra un diálogo si es necesario
   */
  checkForPendingInscriptions(): void {
    const pendingInscriptions = this.inscriptionStateService.getAllIncompleteInscriptions();
    
    if (pendingInscriptions.length > 0) {
      console.log('[InscriptionRecoveryService] Inscripciones pendientes encontradas:', pendingInscriptions);
      
      // Si hay varias, mostrar un diálogo con la lista
      if (pendingInscriptions.length > 1) {
        this.showMultiplePendingInscriptionsSnackbar(pendingInscriptions);
      } else {
        // Si hay solo una, preguntar si quiere continuar
        const inscription = pendingInscriptions[0];
        this.showContinueInscriptionDialog(inscription);
      }
    }
  }
  
  /**
   * Muestra un diálogo para continuar una inscripción específica
   * @param inscription Estado de la inscripción
   */
  showContinueInscriptionDialog(inscription: IInscriptionFormState): void {
    // Verificar si ya hay un diálogo abierto
    if (this.dialog.openDialogs.length > 0) {
      return;
    }
    
    const dialogRef = this.dialog.open(ContinueInscriptionDialogComponent, {
      width: '400px',
      data: {
        contestId: inscription.contestId,
        contestTitle: inscription.contestTitle || `Concurso #${inscription.contestId}`,
        inscriptionId: inscription.inscriptionId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Si el usuario quiere continuar, navegar al detalle del concurso
        this.router.navigate(['/dashboard/concursos', inscription.contestId], {
          queryParams: {
            continueInscription: 'true',
            inscriptionId: inscription.inscriptionId
          }
        });
      } else {
        // Si no quiere continuar, limpiar el estado guardado
        this.inscriptionStateService.clearInscriptionState(inscription.inscriptionId);
      }
    });
  }
  
  /**
   * Muestra un snackbar informando que hay múltiples inscripciones pendientes
   * @param inscriptions Lista de inscripciones pendientes
   */
  private showMultiplePendingInscriptionsSnackbar(inscriptions: IInscriptionFormState[]): void {
    const snackBarRef = this.snackBar.open(
      `Tienes ${inscriptions.length} inscripciones en proceso. Puedes continuarlas desde la sección "Mis Postulaciones".`,
      'Ver Postulaciones',
      {
        duration: 10000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      }
    );

    snackBarRef.onAction().subscribe(() => {
      this.router.navigate(['/dashboard/postulaciones']);
    });
  }
}
