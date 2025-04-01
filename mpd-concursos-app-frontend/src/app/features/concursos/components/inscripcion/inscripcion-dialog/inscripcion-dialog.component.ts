import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Contest } from '@shared/interfaces/concurso/concurso.interface';
import { InscripcionStepperComponent } from '../inscripcion-stepper/inscripcion-stepper.component';

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
export class InscripcionDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<InscripcionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Contest,
    private inscriptionService: InscriptionService,
    private snackBar: MatSnackBar
  ) {}

  onInscriptionCompleted(): void {
    this.dialogRef.close(true);
  }
}
