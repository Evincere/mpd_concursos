import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from  '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { AdminHelpService, HelpFeedback } from '@core/services/admin/admin-help.service';

@Component({
  selector: 'app-help-feedback',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSnackBarModule
  ],
  template: `
    <div class="help-feedback">
      <h3>¿Le resultó útil esta información?</h3>

      <div class="feedback-buttons">
        <button
          mat-stroked-button
          [color]="feedbackForm.get('helpful')?.value ? 'primary' : ''"
          (click)="setHelpful(true)"
          [class.selected]="feedbackForm.get('helpful')?.value === true">
          <mat-icon>thumb_up</mat-icon>
          Sí
        </button>

        <button
          mat-stroked-button
          [color]="feedbackForm.get('helpful')?.value === false ? 'warn' : ''"
          (click)="setHelpful(false)"
          [class.selected]="feedbackForm.get('helpful')?.value === false">
          <mat-icon>thumb_down</mat-icon>
          No
        </button>
      </div>

      <form [formGroup]="feedbackForm" (ngSubmit)="submitFeedback()" *ngIf="feedbackForm.get('helpful')?.value !== null">
        <mat-form-field appearance="outline" class="comment-field">
          <mat-label>Comentarios adicionales (opcional)</mat-label>
          <textarea
            matInput
            formControlName="comment"
            placeholder="Díganos cómo podemos mejorar esta documentación..."
            rows="3">
          </textarea>
        </mat-form-field>

        <div class="form-actions">
          <button
            mat-raised-button
            color="primary"
            type="submit"
            [disabled]="isSending">
            <mat-icon>send</mat-icon>
            Enviar comentarios
          </button>
        </div>
      </form>

      <div class="feedback-sent" *ngIf="feedbackSent">
        <mat-icon>check_circle</mat-icon>
        <p>¡Gracias por sus comentarios!</p>
      </div>
    </div>
  `,
  styles: [`
    .help-feedback {
      margin-top: 2rem;
      padding: 1.5rem;
      border-radius: var(--border-radius);
      background-color: var(--color-surface-light);

      h3 {
        font-size: var(--font-size-md);
        font-weight: 500;
        margin: 0 0 1rem;
        color: var(--color-text-primary);
      }
    }

    .feedback-buttons {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;

      button {
        display: flex;
        align-items: center;

        mat-icon {
          margin-right: 0.5rem;
        }

        &.selected {
          font-weight: 500;
        }
      }
    }

    .comment-field {
      width: 100%;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 1rem;

      button {
        mat-icon {
          margin-right: 0.5rem;
        }
      }
    }

    .feedback-sent {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem;

      mat-icon {
        font-size: 48px;
        color: var(--color-success);
        margin-bottom: 1rem;
      }

      p {
        font-weight: 500;
        color: var(--color-text-primary);
      }
    }
  `]
})
export class HelpFeedbackComponent implements OnInit {
  @Input() articleId!: string;

  feedbackForm: FormGroup;
  isSending = false;
  feedbackSent = false;

  constructor(
    private fb: FormBuilder,
    private adminHelpService: AdminHelpService,
    private snackBar: MatSnackBar
  ) {
    this.feedbackForm = this.fb.group({
      helpful: [null],
      comment: ['']
    });
  }

  ngOnInit(): void {
    // Verificar si se ha proporcionado un ID de artículo
    if (this.articleId) {
      console.log('Componente de feedback inicializado para el artículo:', this.articleId);
    } else {
      console.warn('No se ha proporcionado un ID de artículo para el feedback');
    }
  }

  /**
   * Establece si la ayuda fue útil o no
   * @param helpful Indica si la ayuda fue útil
   */
  setHelpful(helpful: boolean): void {
    this.feedbackForm.get('helpful')?.setValue(helpful);
  }

  /**
   * Envía el feedback
   */
  submitFeedback(): void {
    if (this.feedbackForm.invalid) {
      return;
    }

    this.isSending = true;

    const feedback: HelpFeedback = {
      articleId: this.articleId,
      userId: 'current-user', // En una implementación real, esto sería el ID del usuario actual
      rating: this.feedbackForm.get('helpful')?.value ? 5 : 1,
      comment: this.feedbackForm.get('comment')?.value,
      helpful: this.feedbackForm.get('helpful')?.value,
      timestamp: new Date().toISOString()
    };

    this.adminHelpService.sendFeedback(feedback)
      .subscribe({
        next: (success) => {
          this.isSending = false;

          if (success) {
            this.feedbackSent = true;
          } else {
            this.snackBar.open('Error al enviar los comentarios', 'Cerrar', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error enviando feedback:', error);
          this.snackBar.open('Error al enviar los comentarios', 'Cerrar', { duration: 3000 });
          this.isSending = false;
        }
      });
  }
}
