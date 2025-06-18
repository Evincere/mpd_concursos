/**
 * Validation Feedback Component - Visual feedback for real-time validation
 * 
 * This component provides rich visual feedback for validation results with:
 * - Animated feedback indicators
 * - Quality score visualization
 * - Suggestions and warnings
 * - Accessibility support
 */

import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import { 
  RealTimeValidationService, 
  ValidationResult, 
  FieldValidationState,
  ValidationSuggestion 
} from '../../services/real-time-validation.service';

export interface ValidationFeedbackConfig {
  showQualityScore?: boolean;
  showSuggestions?: boolean;
  showWarnings?: boolean;
  animateChanges?: boolean;
  compactMode?: boolean;
  position?: 'bottom' | 'right' | 'inline';
}

@Component({
  selector: 'app-validation-feedback',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="validation-feedback" 
         [class.compact]="config.compactMode"
         [class.position-bottom]="config.position === 'bottom'"
         [class.position-right]="config.position === 'right'"
         [class.position-inline]="config.position === 'inline'"
         [class.animating]="isAnimating()"
         [attr.aria-live]="'polite'"
         [attr.aria-atomic]="true">
      
      <!-- Validation Status Indicator -->
      <div class="validation-status" 
           [class.valid]="isValid()"
           [class.invalid]="!isValid() && !isValidating()"
           [class.validating]="isValidating()">
        
        <div class="status-icon">
          <i *ngIf="isValidating()" 
             class="fas fa-spinner fa-spin" 
             aria-hidden="true"></i>
          <i *ngIf="!isValidating() && isValid()" 
             class="fas fa-check-circle" 
             aria-hidden="true"></i>
          <i *ngIf="!isValidating() && !isValid()" 
             class="fas fa-exclamation-circle" 
             aria-hidden="true"></i>
        </div>
        
        <span class="status-text" [attr.aria-label]="getStatusAriaLabel()">
          {{ getStatusText() }}
        </span>
      </div>

      <!-- Quality Score -->
      <div *ngIf="config.showQualityScore && validationResult() && !config.compactMode" 
           class="quality-score">
        <div class="score-label">Calidad del contenido</div>
        <div class="score-bar">
          <div class="score-fill" 
               [style.width.%]="validationResult()?.score || 0"
               [class.excellent]="(validationResult()?.score || 0) >= 90"
               [class.good]="(validationResult()?.score || 0) >= 70 && (validationResult()?.score || 0) < 90"
               [class.fair]="(validationResult()?.score || 0) >= 50 && (validationResult()?.score || 0) < 70"
               [class.poor]="(validationResult()?.score || 0) < 50">
          </div>
        </div>
        <div class="score-value">{{ validationResult()?.score || 0 }}/100</div>
      </div>

      <!-- Errors -->
      <div *ngIf="hasErrors()" class="validation-errors">
        <div class="section-header">
          <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
          <span>Errores que corregir</span>
        </div>
        <ul class="error-list" role="list">
          <li *ngFor="let error of validationResult()?.errors; trackBy: trackByErrorCode" 
              class="error-item"
              [class.severity-error]="error.severity === 'error'"
              [class.severity-warning]="error.severity === 'warning'"
              [class.severity-info]="error.severity === 'info'"
              role="listitem">
            <i class="fas fa-times-circle" aria-hidden="true"></i>
            <span class="error-message">{{ error.message }}</span>
          </li>
        </ul>
      </div>

      <!-- Warnings -->
      <div *ngIf="config.showWarnings && hasWarnings()" class="validation-warnings">
        <div class="section-header">
          <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
          <span>Advertencias</span>
        </div>
        <ul class="warning-list" role="list">
          <li *ngFor="let warning of validationResult()?.warnings; trackBy: trackByWarningCode" 
              class="warning-item"
              role="listitem">
            <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
            <div class="warning-content">
              <span class="warning-message">{{ warning.message }}</span>
              <span *ngIf="warning.suggestion" class="warning-suggestion">
                {{ warning.suggestion }}
              </span>
            </div>
          </li>
        </ul>
      </div>

      <!-- Suggestions -->
      <div *ngIf="config.showSuggestions && hasSuggestions()" class="validation-suggestions">
        <div class="section-header">
          <i class="fas fa-lightbulb" aria-hidden="true"></i>
          <span>Sugerencias para mejorar</span>
        </div>
        <ul class="suggestion-list" role="list">
          <li *ngFor="let suggestion of validationResult()?.suggestions; trackBy: trackBySuggestionCode" 
              class="suggestion-item"
              role="listitem">
            <i class="fas fa-lightbulb" aria-hidden="true"></i>
            <div class="suggestion-content">
              <span class="suggestion-message">{{ suggestion.message }}</span>
              <button *ngIf="suggestion.autoFix" 
                      class="auto-fix-btn"
                      (click)="applySuggestion(suggestion)"
                      [attr.aria-label]="'Aplicar sugerencia: ' + suggestion.message">
                <i class="fas fa-magic" aria-hidden="true"></i>
                {{ suggestion.action || 'Aplicar' }}
              </button>
            </div>
          </li>
        </ul>
      </div>

      <!-- Compact Mode Summary -->
      <div *ngIf="config.compactMode && validationResult()" class="compact-summary">
        <span class="compact-score" 
              [class.excellent]="(validationResult()?.score || 0) >= 90"
              [class.good]="(validationResult()?.score || 0) >= 70"
              [class.fair]="(validationResult()?.score || 0) >= 50"
              [class.poor]="(validationResult()?.score || 0) < 50">
          {{ validationResult()?.score || 0 }}%
        </span>
        <span class="compact-issues" *ngIf="getTotalIssues() > 0">
          {{ getTotalIssues() }} problema{{ getTotalIssues() > 1 ? 's' : '' }}
        </span>
      </div>
    </div>
  `,
  styles: [`
    .validation-feedback {
      margin-top: 8px;
      transition: all 0.3s ease;
    }

    .validation-feedback.animating {
      transform: scale(1.02);
    }

    .validation-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .validation-status.valid {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .validation-status.invalid {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .validation-status.validating {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }

    .status-icon {
      font-size: 14px;
    }

    .quality-score {
      margin-top: 12px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .score-label {
      font-size: 11px;
      color: #9ca3af;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .score-bar {
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 6px;
    }

    .score-fill {
      height: 100%;
      transition: width 0.5s ease;
      border-radius: 3px;
    }

    .score-fill.excellent { background: #10b981; }
    .score-fill.good { background: #3b82f6; }
    .score-fill.fair { background: #f59e0b; }
    .score-fill.poor { background: #ef4444; }

    .score-value {
      font-size: 12px;
      color: #d1d5db;
      text-align: right;
    }

    .validation-errors, .validation-warnings, .validation-suggestions {
      margin-top: 12px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;
      color: #d1d5db;
    }

    .error-list, .warning-list, .suggestion-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .error-item, .warning-item, .suggestion-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px;
      border-radius: 4px;
      font-size: 12px;
      line-height: 1.4;
    }

    .error-item {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #fca5a5;
    }

    .error-item.severity-warning {
      background: rgba(245, 158, 11, 0.1);
      border-color: rgba(245, 158, 11, 0.2);
      color: #fcd34d;
    }

    .error-item.severity-info {
      background: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.2);
      color: #93c5fd;
    }

    .warning-item {
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.2);
      color: #fcd34d;
    }

    .suggestion-item {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      color: #6ee7b7;
    }

    .warning-content, .suggestion-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .warning-suggestion {
      font-style: italic;
      opacity: 0.8;
    }

    .auto-fix-btn {
      align-self: flex-start;
      padding: 4px 8px;
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 4px;
      color: #10b981;
      cursor: pointer;
      font-size: 11px;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.3s ease;
    }

    .auto-fix-btn:hover {
      background: rgba(16, 185, 129, 0.3);
      transform: translateY(-1px);
    }

    .compact-summary {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
    }

    .compact-score {
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }

    .compact-score.excellent { background: rgba(16, 185, 129, 0.2); color: #10b981; }
    .compact-score.good { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
    .compact-score.fair { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
    .compact-score.poor { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

    .compact-issues {
      color: #9ca3af;
    }

    .validation-feedback.compact {
      margin-top: 4px;
    }

    .validation-feedback.compact .validation-status {
      padding: 4px 8px;
      font-size: 11px;
    }

    .validation-feedback.position-right {
      position: absolute;
      right: -250px;
      top: 0;
      width: 240px;
      z-index: 10;
    }

    .validation-feedback.position-bottom {
      margin-top: 12px;
    }

    .validation-feedback.position-inline {
      margin-top: 6px;
      margin-bottom: 6px;
    }

    @media (max-width: 768px) {
      .validation-feedback.position-right {
        position: static;
        width: auto;
        margin-top: 8px;
      }

      .quality-score {
        padding: 8px;
      }

      .error-item, .warning-item, .suggestion-item {
        padding: 6px;
        font-size: 11px;
      }
    }
  `]
})
export class ValidationFeedbackComponent implements OnInit, OnDestroy {
  private readonly validationService = inject(RealTimeValidationService);

  @Input() fieldId!: string;
  @Input() config: ValidationFeedbackConfig = {
    showQualityScore: true,
    showSuggestions: true,
    showWarnings: true,
    animateChanges: true,
    compactMode: false,
    position: 'bottom'
  };

  @Output() suggestionApplied = new EventEmitter<ValidationSuggestion>();

  // Signals for reactive state
  private fieldState = signal<FieldValidationState | null>(null);
  private animationState = signal<boolean>(false);

  // Computed properties
  validationResult = computed(() => this.fieldState()?.result);
  isValidating = computed(() => this.fieldState()?.isValidating || false);
  isValid = computed(() => {
    const result = this.validationResult();
    return result ? result.isValid : true;
  });
  hasErrors = computed(() => {
    const result = this.validationResult();
    return result ? result.errors.length > 0 : false;
  });
  hasWarnings = computed(() => {
    const result = this.validationResult();
    return result ? result.warnings.length > 0 : false;
  });
  hasSuggestions = computed(() => {
    const result = this.validationResult();
    return result ? result.suggestions.length > 0 : false;
  });
  isAnimating = computed(() => this.animationState());

  private destroy$ = new Subject<void>();

  ngOnInit() {
    if (!this.fieldId) {
      console.warn('[ValidationFeedbackComponent] fieldId is required');
      return;
    }

    // Subscribe to field validation state
    const fieldState$ = this.validationService.getFieldState(this.fieldId);
    if (fieldState$) {
      // For now, we'll poll the state since we don't have an observable
      // In a real implementation, this would be an observable subscription
      this.updateFieldState();
      
      // Set up periodic updates (this is a simplified approach)
      setInterval(() => this.updateFieldState(), 500);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateFieldState() {
    const state = this.validationService.getFieldState(this.fieldId);
    if (state) {
      const previousState = this.fieldState();
      this.fieldState.set(state);
      
      // Trigger animation if state changed and animations are enabled
      if (this.config.animateChanges && 
          previousState && 
          JSON.stringify(previousState.result) !== JSON.stringify(state.result)) {
        this.triggerAnimation();
      }
    }
  }

  private triggerAnimation() {
    this.animationState.set(true);
    setTimeout(() => this.animationState.set(false), 300);
  }

  getStatusText(): string {
    if (this.isValidating()) {
      return 'Validando...';
    }
    
    if (this.isValid()) {
      return 'Válido';
    }
    
    const result = this.validationResult();
    if (result) {
      const errorCount = result.errors.length;
      return errorCount === 1 ? '1 error' : `${errorCount} errores`;
    }
    
    return '';
  }

  getStatusAriaLabel(): string {
    if (this.isValidating()) {
      return 'Validando contenido';
    }
    
    if (this.isValid()) {
      return 'Contenido válido';
    }
    
    const result = this.validationResult();
    if (result) {
      const errorCount = result.errors.length;
      return `${errorCount} error${errorCount > 1 ? 'es' : ''} encontrado${errorCount > 1 ? 's' : ''}`;
    }
    
    return 'Estado de validación desconocido';
  }

  getTotalIssues(): number {
    const result = this.validationResult();
    if (!result) return 0;
    
    return result.errors.length + 
           (this.config.showWarnings ? result.warnings.length : 0);
  }

  applySuggestion(suggestion: ValidationSuggestion) {
    this.suggestionApplied.emit(suggestion);
  }

  // TrackBy functions for performance
  trackByErrorCode(index: number, error: any): string {
    return error.code;
  }

  trackByWarningCode(index: number, warning: any): string {
    return warning.code;
  }

  trackBySuggestionCode(index: number, suggestion: any): string {
    return suggestion.code;
  }
}
