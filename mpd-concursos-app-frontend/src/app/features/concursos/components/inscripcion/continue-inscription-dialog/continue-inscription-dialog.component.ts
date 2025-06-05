import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { CustomButtonComponent } from '@shared/components/custom-button/custom-button.component';

@Component({
  selector: 'app-continue-inscription-dialog',
  standalone: true,
  imports: [
    CommonModule,
    CustomButtonComponent
  ],
  template: `
    <div class="continue-inscription-dialog">
      <div class="dialog-header">
        <div class="icon-container">
          <i class="fas fa-info-circle"></i>
        </div>
        <h2 class="dialog-title">Continuar inscripción</h2>
      </div>

      <div class="dialog-content">
        <div class="message">
          <p>Tienes una inscripción en proceso para el concurso <strong>"{{ data.contestTitle }}"</strong>.</p>
          <p>¿Deseas continuar donde lo dejaste?</p>
        </div>
      </div>

      <div class="dialog-actions">
        <app-custom-button
          variant="secondary"
          label="No, empezar de nuevo"
          (buttonClick)="onCancel()">
        </app-custom-button>

        <app-custom-button
          variant="primary"
          label="Sí, continuar"
          icon="play"
          (buttonClick)="onConfirm()">
        </app-custom-button>
      </div>
    </div>
  `,
  styles: [`
    .continue-inscription-dialog {
      /* Glassmorphism premium dark design */
      background: rgba(55, 65, 81, 0.9);
      background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      backdrop-filter: blur(10px);
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.3),
        0 4px 16px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      padding: 0;
      overflow: hidden;
      min-width: 400px;
      max-width: 500px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      padding: 1.5rem 2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
    }

    .icon-container {
      margin-right: 1rem;

      i {
        font-size: 1.5rem;
        color: #3b82f6;
      }
    }

    .dialog-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: #f9fafb;
    }

    .dialog-content {
      padding: 2rem;
    }

    .message {
      p {
        margin: 0 0 1rem 0;
        color: #d1d5db;
        line-height: 1.6;
        font-size: 1rem;

        &:last-child {
          margin-bottom: 0;
        }

        strong {
          color: #3b82f6;
          font-weight: 600;
        }
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem 2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.02);
    }
  `]
})
export class ContinueInscriptionDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ContinueInscriptionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      contestId: number;
      contestTitle: string;
      inscriptionId: string;
    }
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
