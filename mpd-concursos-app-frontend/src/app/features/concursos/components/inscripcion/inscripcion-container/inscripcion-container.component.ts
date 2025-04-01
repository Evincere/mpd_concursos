import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InscripcionStepperComponent } from '../inscripcion-stepper/inscripcion-stepper.component';
import { Contest } from '@shared/interfaces/concurso/concurso.interface';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InscriptionStep } from '@shared/enums/inscription-step.enum';

@Component({
  selector: 'app-inscripcion-container',
  standalone: true,
  imports: [
    CommonModule,
    InscripcionStepperComponent
  ],
  template: `
    <div class="inscripcion-container">
      <app-inscripcion-stepper
        [contest]="contest"
        (inscriptionCompleted)="onInscriptionCompleted()">
      </app-inscripcion-stepper>
    </div>
  `,
  styles: [`
    .inscripcion-container {
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      background-color: #1e1e1e;
      border-radius: 8px;
      overflow: hidden;
    }
  `]
})
export class InscripcionContainerComponent {
  @Input() contest!: Contest;
  @Output() inscriptionCompleted = new EventEmitter<void>();

  constructor(
    private inscriptionService: InscriptionService,
    private snackBar: MatSnackBar
  ) {}

  onInscriptionCompleted(): void {
    const inscriptionId = typeof this.contest.id === 'number' 
      ? this.contest.id.toString() 
      : this.contest.id;

    const request = {
      step: InscriptionStep.COMPLETED
    };

    this.inscriptionService.updateInscriptionStep(inscriptionId, request)
      .subscribe({
        next: () => {
          this.snackBar.open('Inscripción completada exitosamente', 'Cerrar', {
            duration: 3000
          });
          this.inscriptionCompleted.emit();
        },
        error: (error) => {
          console.error('Error al completar la inscripción:', error);
          this.snackBar.open('Error al completar la inscripción', 'Cerrar', {
            duration: 3000
          });
        }
      });
  }
} 