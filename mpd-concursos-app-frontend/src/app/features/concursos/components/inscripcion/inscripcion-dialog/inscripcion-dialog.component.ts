import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { InscriptionStateService, IInscriptionFormState } from '@core/services/inscripcion/inscription-state.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Contest } from '@shared/interfaces/concurso/concurso.interface';
import { InscripcionStepperComponent } from '../inscripcion-stepper/inscripcion-stepper.component';
import { InscriptionStep } from '@shared/enums/inscription-step.enum';
import { ActivatedRoute } from '@angular/router';

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
      [contest]="data.contest"
      [initialStep]="initialStep"
      [inscriptionId]="inscriptionId"
      [formData]="formData"
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
  inscriptionId: string | null = null;
  formData: any = null;

  constructor(
    public dialogRef: MatDialogRef<InscripcionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      contest: Contest;
      inscriptionId?: string;
      continueInscription?: boolean;
    },
    private inscriptionService: InscriptionService,
    private inscriptionStateService: InscriptionStateService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Verificar si se proporcionó un ID de inscripción en los datos del diálogo
    if (this.data.inscriptionId) {
      this.inscriptionId = this.data.inscriptionId;
      console.log('[InscripcionDialog] ID de inscripción proporcionado:', this.inscriptionId);

      // Verificar si se debe continuar una inscripción
      if (this.data.continueInscription) {
        // Obtener el estado guardado
        const savedState = this.inscriptionStateService.getInscriptionState(this.inscriptionId);
        if (savedState) {
          console.log('[InscripcionDialog] Estado de inscripción recuperado:', savedState);
          this.initialStep = Number(savedState.currentStep);
          this.formData = savedState.formData;
        }
      }
    }

    // Verificar si hay una inscripción en progreso para este concurso (método antiguo)
    const savedInscription = this.inscriptionStateService.getInProgressInscription();
    if (savedInscription && savedInscription.contestId === this.data.contest.id) {
      console.log('[InscripcionDialog] Encontrada inscripción en progreso para este concurso:', savedInscription);

      // Si no tenemos un ID de inscripción, usar el de la inscripción guardada
      if (!this.inscriptionId) {
        this.inscriptionId = savedInscription.id;
      }

      // Verificar si venimos de la pestaña de documentación
      const redirectId = this.inscriptionStateService.getRedirectFromInscription();
      if (redirectId && redirectId === savedInscription.id) {
        console.log('[InscripcionDialog] Detectada redirección desde documentación, iniciando en paso 3');

        // Iniciar en el paso 3 (confirmación de datos)
        this.initialStep = 3;

        // Intentar obtener el estado guardado con el nuevo método
        const savedState = this.inscriptionStateService.getInscriptionState(redirectId);
        if (savedState) {
          console.log('[InscripcionDialog] Estado de inscripción recuperado desde redirección:', savedState);
          this.formData = savedState.formData;
        }
      }
    }

    // Verificar parámetros de consulta para continuar inscripción
    this.route.queryParams.subscribe(params => {
      if (params['continueInscription'] === 'true' && params['inscriptionId']) {
        const inscriptionId = params['inscriptionId'];
        console.log('[InscripcionDialog] Detectada solicitud de continuar inscripción desde parámetros:', inscriptionId);

        // Establecer el ID de inscripción
        this.inscriptionId = inscriptionId;

        // Obtener el estado guardado
        const savedState = this.inscriptionStateService.getInscriptionState(inscriptionId);
        if (savedState) {
          console.log('[InscripcionDialog] Estado de inscripción recuperado desde parámetros:', savedState);
          this.initialStep = Number(savedState.currentStep);
          this.formData = savedState.formData;
        }
      }
    });
  }

  onInscriptionCompleted(): void {
    this.dialogRef.close(true);
  }
}
