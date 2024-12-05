import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InscriptionService } from '../../services/inscription.service';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-inscription-button',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `
    <button
      mat-flat-button
      color="primary"
      [disabled]="loading"
      (click)="onInscribe()"
    >
      <i class="fas fa-user-plus" *ngIf="!loading"></i>
      <i class="fas fa-spinner fa-spin" *ngIf="loading"></i>
      {{ loading ? 'Inscribiendo...' : 'Inscribirse' }}
    </button>
  `,
  styles: [`
    button {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;

      i {
        font-size: 1rem;
      }
    }
  `]
})
export class InscriptionButtonComponent {
  @Input() contestId!: number;
  @Output() inscriptionComplete = new EventEmitter<number>();
  
  loading = false;

  constructor(
    private inscriptionService: InscriptionService,
    private snackBar: MatSnackBar
  ) {}

  onInscribe(): void {
    if (!this.contestId) {
      this.showError('ID de concurso no válido');
      return;
    }

    this.loading = true;
    this.inscriptionService.createInscription(this.contestId)
      .subscribe({
        next: () => {
          this.showSuccess('Inscripción realizada con éxito');
          this.inscriptionComplete.emit(this.contestId);
        },
        error: (error) => {
          console.error('Error al inscribirse:', error);
          this.showError('Error al realizar la inscripción');
        },
        complete: () => {
          this.loading = false;
        }
      });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}
