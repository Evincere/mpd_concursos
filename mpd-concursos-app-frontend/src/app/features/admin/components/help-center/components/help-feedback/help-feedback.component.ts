import { Component, Input, OnInit, OnDestroy } from '@angular/core'; // Added OnDestroy
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs'; // Import Subject
import { takeUntil, finalize } from 'rxjs/operators'; // Import takeUntil and finalize

import { AdminHelpService, HelpFeedback } from '@core/services/admin/admin-help.service'; // Assuming AdminHelpService path
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service'; // Assuming CustomNotificationService path
import { LoggingService } from '@core/services/logging/logging.service'; // Import LoggingService

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
export class HelpFeedbackComponent implements OnInit, OnDestroy { // Implemented OnDestroy
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

  private destroy$ = new Subject<void>(); // Subject for unsubscribing

  constructor(
    private fb: FormBuilder,
    private adminHelpService: AdminHelpService,
    private notificationService: CustomNotificationService, // Inject NotificationService
    private loggingService: LoggingService // Inject LoggingService
  ) {
    this.loggingService.debug('[HelpFeedbackComponent] Constructor: Initializing feedback form.', undefined, 'HelpFeedback');
    this.feedbackForm = this.fb.group({
      helpful: [null, Validators.required], // Null initially, then true/false
      comment: [''],
      rating: [0, [Validators.min(0), Validators.max(5)]] // Min can be 0 if not rated
    });
  }

  ngOnInit(): void {
    this.loggingService.info('[HelpFeedbackComponent] Component initialized.', undefined, 'HelpFeedback');
    // Verify if an article ID has been provided
    if (this.articleId) {
      this.loggingService.debug(`[HelpFeedbackComponent] Article ID provided: ${this.articleId}`, undefined, 'HelpFeedback');
      if (this.showStats) {
        this.loadFeedbackStats();
      }
    } else {
      this.loggingService.warn('[HelpFeedbackComponent] No article ID provided for feedback component.', undefined, 'HelpFeedback');
    }

    // Set initial helpful value to null to ensure required validator works
    this.feedbackForm.get('helpful')?.setValue(null);
  }

  ngOnDestroy(): void {
    this.loggingService.info('[HelpFeedbackComponent] Component destroyed. Cleaning up subscriptions.', undefined, 'HelpFeedback');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Sets whether the help was helpful or not.
   * @param helpful Indicates if the help was helpful.
   */
  setHelpful(helpful: boolean): void {
    this.loggingService.debug(`[HelpFeedbackComponent] Setting helpful to: ${helpful}`, undefined, 'HelpFeedback');
    this.feedbackForm.get('helpful')?.setValue(helpful);
    // Reset rating when helpfulness changes
    this.currentRating = 0;
    this.hoverRating = 0;
    this.feedbackForm.get('rating')?.setValue(0);
  }

  /**
   * Sets the star rating.
   * @param rating Rating from 1 to 5.
   */
  setRating(rating: number): void {
    this.loggingService.debug(`[HelpFeedbackComponent] Setting rating to: ${rating}`, undefined, 'HelpFeedback');
    this.currentRating = rating;
    this.feedbackForm.get('rating')?.setValue(rating);
  }

  /**
   * Sets the hover rating for star display.
   * @param rating Hover rating.
   */
  setHoverRating(rating: number): void {
    this.hoverRating = rating;
  }

  /**
   * Gets the descriptive text for the rating.
   * @param rating Rating.
   * @returns Descriptive text.
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
   * Submits the feedback.
   */
  submitFeedback(): void {
    this.feedbackForm.markAllAsTouched(); // Mark all controls as touched to show validation errors
    if (this.feedbackForm.invalid) {
      this.loggingService.warn('[HelpFeedbackComponent] Form is invalid. Cannot submit feedback.', this.feedbackForm.errors, 'HelpFeedback');
      this.notificationService.warning('Por favor, complete todos los campos requeridos antes de enviar.');
      return;
    }

    if (this.isSending) {
      this.loggingService.debug('[HelpFeedbackComponent] Feedback already sending, preventing duplicate submission.', undefined, 'HelpFeedback');
      return;
    }

    this.isSending = true;
    this.hasError = false;
    this.errorMessage = '';
    this.loggingService.info('[HelpFeedbackComponent] Attempting to submit feedback.', this.feedbackForm.value, 'HelpFeedback');

    const helpfulValue = this.feedbackForm.get('helpful')?.value;
    const ratingValue = this.currentRating;

    const feedback: HelpFeedback = {
      articleId: this.articleId,
      userId: 'current-user-mock-id', // In a real implementation, this would be the actual user ID
      rating: ratingValue > 0 ? ratingValue : (helpfulValue ? 5 : 1), // Assign 5 if helpful true and no rating, 1 if helpful false and no rating
      comment: this.feedbackForm.get('comment')?.value || '',
      helpful: helpfulValue,
      timestamp: new Date().toISOString()
    };

    // Simulate feedback submission via service call (replace with actual adminHelpService.submitFeedback)
    // For now, we're using setTimeout to simulate network delay.
    setTimeout(() => {
      // Simulate possible error (10% chance)
      if (Math.random() < 0.1) {
        this.loggingService.error('[HelpFeedbackComponent] Simulated submission error.', undefined, 'HelpFeedback');
        this.handleSubmissionError('Error de conexión. Por favor, inténtelo nuevamente.');
        return;
      }

      this.loggingService.info('[HelpFeedbackComponent] Feedback submitted successfully (simulated).', feedback, 'HelpFeedback');
      this.feedbackSent = true;
      this.notificationService.success('¡Gracias por tu feedback!');

      // Update statistics if enabled (simulated)
      if (this.showStats) {
        this.updateFeedbackStats(feedback);
      }
      this.isSending = false; // Reset sending state after simulation
    }, 1500);

    // If you had an actual service call, it would look more like this:
    /*
    this.adminHelpService.submitFeedback(feedback).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.isSending = false; // Always reset loading state
      })
    ).subscribe({
      next: (response) => {
        this.loggingService.info('[HelpFeedbackComponent] Feedback submitted successfully.', response, 'HelpFeedback');
        this.feedbackSent = true;
        this.notificationService.success('¡Gracias por tu feedback!');
        if (this.showStats) {
          this.loadFeedbackStats(); // Reload stats from backend
        }
      },
      error: (error) => {
        this.loggingService.error('[HelpFeedbackComponent] Error submitting feedback:', error, 'HelpFeedback');
        this.handleSubmissionError('Error al enviar feedback. Por favor, intente de nuevo.');
      }
    });
    */
  }

  /**
   * Handles submission errors by updating component state and logging.
   * @param message Error message to display to the user.
   */
  private handleSubmissionError(message: string): void {
    this.isSending = false;
    this.hasError = true;
    this.errorMessage = message;
    this.notificationService.error(message);
    this.loggingService.error(`[HelpFeedbackComponent] Submission error: ${message}`, undefined, 'HelpFeedback');
  }

  /**
   * Resets the feedback form to its initial state.
   */
  resetFeedback(): void {
    this.loggingService.debug('[HelpFeedbackComponent] Resetting feedback form.', undefined, 'HelpFeedback');
    this.feedbackForm.reset();
    this.feedbackForm.get('helpful')?.setValue(null); // Explicitly set to null
    this.feedbackForm.get('comment')?.setValue('');
    this.feedbackForm.get('rating')?.setValue(0);
    this.currentRating = 0;
    this.hoverRating = 0;
    this.feedbackSent = false;
    this.hasError = false;
    this.errorMessage = '';
  }

  /**
   * Loads feedback statistics (simulated).
   * In a real app, this would be an API call.
   */
  private loadFeedbackStats(): void {
    this.loggingService.info('[HelpFeedbackComponent] Loading feedback statistics (simulated).', undefined, 'HelpFeedback');
    // Simulate loading stats from a backend
    setTimeout(() => {
      this.feedbackStats = {
        totalFeedbacks: 127,
        helpfulPercentage: 89,
        averageRating: 4.2
      };
      this.loggingService.debug('[HelpFeedbackComponent] Feedback statistics loaded (simulated):', this.feedbackStats, 'HelpFeedback');
    }, 500);

    // If you had an actual service call, it would look like this:
    /*
    this.adminHelpService.getFeedbackStats(this.articleId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (stats) => {
        this.feedbackStats = stats;
        this.loggingService.debug('[HelpFeedbackComponent] Feedback statistics loaded from API:', stats, 'HelpFeedback');
      },
      error: (error) => {
        this.loggingService.error('[HelpFeedbackComponent] Error loading feedback stats:', error, 'HelpFeedback');
        this.notificationService.error('Error al cargar estadísticas de feedback.');
      }
    });
    */
  }

  /**
   * Updates statistics with the new feedback (simulated).
   * In a real app, this might be handled by the backend after submission,
   * or by reloading stats after successful submission.
   * @param feedback New feedback submitted.
   */
  private updateFeedbackStats(feedback: HelpFeedback): void {
    this.loggingService.debug('[HelpFeedbackComponent] Updating feedback statistics locally with new feedback.', feedback, 'HelpFeedback');
    if (this.feedbackStats) {
      this.feedbackStats.totalFeedbacks++;

      // Recalculate helpful percentage (simulated)
      const helpfulCount = Math.round(this.feedbackStats.totalFeedbacks * this.feedbackStats.helpfulPercentage / 100);
      const newHelpfulCount = feedback.helpful ? helpfulCount + 1 : helpfulCount;
      this.feedbackStats.helpfulPercentage = Math.round((newHelpfulCount / this.feedbackStats.totalFeedbacks) * 100);

      // Recalculate average rating (simulated)
      if (feedback.rating !== undefined && feedback.rating > 0) {
        const totalRating = (this.feedbackStats.averageRating * (this.feedbackStats.totalFeedbacks - 1));
        this.feedbackStats.averageRating = Number(((totalRating + feedback.rating) / this.feedbackStats.totalFeedbacks).toFixed(1));
      }
      this.loggingService.debug('[HelpFeedbackComponent] Feedback statistics updated locally:', this.feedbackStats, 'HelpFeedback');
    }
  }
}
