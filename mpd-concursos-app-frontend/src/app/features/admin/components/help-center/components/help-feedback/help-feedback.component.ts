import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from  '@angular/forms';

import { AdminHelpService, HelpFeedback } from '@core/services/admin/admin-help.service';

@Component({
  selector: 'app-help-feedback',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './help-feedback.component.html',
  styleUrls: ['./help-feedback.component.scss']
})
export class HelpFeedbackComponent implements OnInit {
  @Input() articleId!: string;
  @Input() showStats = false;

  feedbackForm: FormGroup;
  isSending = false;
  feedbackSent = false;
  hasError = false;
  errorMessage = '';

  // Rating system
  currentRating = 0;
  hoverRating = 0;

  // Optional feedback stats
  feedbackStats: {
    totalFeedbacks: number;
    helpfulPercentage: number;
    averageRating: number;
  } | null = null;

  constructor(
    private fb: FormBuilder,
    private adminHelpService: AdminHelpService
  ) {
    this.feedbackForm = this.fb.group({
      helpful: [null, Validators.required],
      comment: [''],
      rating: [0, [Validators.min(1), Validators.max(5)]]
    });
  }

  ngOnInit(): void {
    // Verificar si se ha proporcionado un ID de artículo
    if (this.articleId) {
      console.log('Componente de feedback inicializado para el artículo:', this.articleId);

      // Cargar estadísticas si están habilitadas
      if (this.showStats) {
        this.loadFeedbackStats();
      }
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
    // Resetear rating cuando cambia la utilidad
    this.currentRating = 0;
    this.feedbackForm.get('rating')?.setValue(0);
  }

  /**
   * Establece la calificación con estrellas
   * @param rating Calificación de 1 a 5
   */
  setRating(rating: number): void {
    this.currentRating = rating;
    this.feedbackForm.get('rating')?.setValue(rating);
  }

  /**
   * Establece la calificación hover
   * @param rating Calificación hover
   */
  setHoverRating(rating: number): void {
    this.hoverRating = rating;
  }

  /**
   * Obtiene el texto descriptivo de la calificación
   * @param rating Calificación
   * @returns Texto descriptivo
   */
  getRatingText(rating: number): string {
    switch (rating) {
      case 1:
        return 'Muy malo';
      case 2:
        return 'Malo';
      case 3:
        return 'Regular';
      case 4:
        return 'Bueno';
      case 5:
        return 'Excelente';
      default:
        return 'Sin calificar';
    }
  }

  /**
   * Envía el feedback
   */
  submitFeedback(): void {
    if (this.feedbackForm.valid && !this.isSending) {
      this.isSending = true;
      this.hasError = false;

      const feedback: HelpFeedback = {
        articleId: this.articleId,
        userId: 'current-user', // En una implementación real, esto sería el ID del usuario actual
        rating: this.currentRating || (this.feedbackForm.get('helpful')?.value ? 5 : 1),
        comment: this.feedbackForm.get('comment')?.value,
        helpful: this.feedbackForm.get('helpful')?.value,
        timestamp: new Date().toISOString()
      };

      // Simular envío del feedback
      setTimeout(() => {
        // Simular posible error (10% de probabilidad)
        if (Math.random() < 0.1) {
          this.handleSubmissionError('Error de conexión. Por favor, inténtelo nuevamente.');
          return;
        }

        console.log('Feedback enviado:', feedback);
        this.isSending = false;
        this.feedbackSent = true;

        // Actualizar estadísticas si están habilitadas
        if (this.showStats) {
          this.updateFeedbackStats(feedback);
        }
      }, 1500);
    }
  }

  /**
   * Maneja errores en el envío
   * @param message Mensaje de error
   */
  private handleSubmissionError(message: string): void {
    this.isSending = false;
    this.hasError = true;
    this.errorMessage = message;
  }

  /**
   * Reinicia el formulario de feedback
   */
  resetFeedback(): void {
    this.feedbackForm.reset();
    this.feedbackForm.get('helpful')?.setValue(null);
    this.feedbackForm.get('comment')?.setValue('');
    this.feedbackForm.get('rating')?.setValue(0);
    this.currentRating = 0;
    this.hoverRating = 0;
    this.feedbackSent = false;
    this.hasError = false;
    this.errorMessage = '';
  }

  /**
   * Carga las estadísticas de feedback
   */
  private loadFeedbackStats(): void {
    // Simular carga de estadísticas
    setTimeout(() => {
      this.feedbackStats = {
        totalFeedbacks: 127,
        helpfulPercentage: 89,
        averageRating: 4.2
      };
    }, 500);
  }

  /**
   * Actualiza las estadísticas con el nuevo feedback
   * @param feedback Nuevo feedback
   */
  private updateFeedbackStats(feedback: HelpFeedback): void {
    if (this.feedbackStats) {
      this.feedbackStats.totalFeedbacks++;

      // Recalcular porcentaje útil (simulado)
      const helpfulCount = Math.round(this.feedbackStats.totalFeedbacks * this.feedbackStats.helpfulPercentage / 100);
      const newHelpfulCount = feedback.helpful ? helpfulCount + 1 : helpfulCount;
      this.feedbackStats.helpfulPercentage = Math.round((newHelpfulCount / this.feedbackStats.totalFeedbacks) * 100);

      // Recalcular promedio de rating (simulado)
      if (feedback.rating && feedback.rating > 0) {
        const totalRating = this.feedbackStats.averageRating * (this.feedbackStats.totalFeedbacks - 1);
        this.feedbackStats.averageRating = Number(((totalRating + feedback.rating) / this.feedbackStats.totalFeedbacks).toFixed(1));
      }
    }
  }
}
