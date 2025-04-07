import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { InscriptionStateService } from '@core/services/inscripcion/inscription-state.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Contest } from '@shared/interfaces/concurso/concurso.interface';
import { InscripcionStepperComponent } from '../inscripcion-stepper/inscripcion-stepper.component';
import { InscriptionStep } from '@shared/enums/inscription-step.enum';

@Component({
  selector: 'app-inscripcion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    InscripcionStepperComponent
  ],
  template: `
    <app-inscripcion-stepper
      [contest]="data"
      [initialStep]="initialStep"
      (inscriptionCompleted)="onInscriptionCompleted()">
    </app-inscripcion-stepper>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      width: 100%;
    }
  `]
})
export class InscripcionDialogComponent implements OnInit {
  initialStep = 1; // Paso inicial por defecto
  constructor(
    public dialogRef: MatDialogRef<InscripcionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Contest,
    private inscriptionService: InscriptionService,
    private inscriptionStateService: InscriptionStateService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Verificar si hay una inscripción en progreso para este concurso
    const savedInscription = this.inscriptionStateService.getInProgressInscription();
    if (savedInscription && savedInscription.contestId === this.data.id) {
      console.log('[InscripcionDialog] Encontrada inscripción en progreso para este concurso:', savedInscription);

      // Verificar si venimos de la pestaña de documentación
      const redirectId = this.inscriptionStateService.getRedirectFromInscription();
      if (redirectId && redirectId === savedInscription.id) {
        console.log('[InscripcionDialog] Detectada redirección desde documentación, iniciando en paso 3');

        // Iniciar en el paso 3 (confirmación de datos)
        this.initialStep = 3;
      }
    }
  }

  onInscriptionCompleted(): void {
    this.dialogRef.close(true);
  }
}
