/**
 * Inline Field Component - Base component for inline editing
 * 
 * This component provides a reusable inline editing experience with:
 * - Click to edit functionality
 * - Real-time validation
 * - Glassmorphism design integration
 * - Keyboard shortcuts (Enter to save, Escape to cancel)
 */

import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  ViewChild, 
  ElementRef, 
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, ValidatorFn } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { CvValidators } from '../../../core/validators';
import { RealTimeValidationService } from '../../services/real-time-validation.service';
import { ValidationFeedbackComponent } from '../validation-feedback/validation-feedback.component';

export interface InlineFieldConfig {
  label: string;
  placeholder?: string;
  icon?: string;
  type?: 'text' | 'email' | 'tel' | 'url';
  maxLength?: number;
  required?: boolean;
  disabled?: boolean;
  validators?: ValidatorFn[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Component({
  selector: 'app-inline-field',
  standalone: true,
  imports: [CommonModule, FormsModule, ValidationFeedbackComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inline-field" 
         [class.editing]="isEditing"
         [class.error]="validationResult && !validationResult.isValid"
         [class.disabled]="config.disabled"
         [class.required]="config.required">
      
      <!-- Display Mode -->
      <div *ngIf="!isEditing" 
           class="field-display"
           (click)="startEdit()"
           [attr.tabindex]="config.disabled ? -1 : 0"
           (keydown.enter)="startEdit()"
           (keydown.space)="startEdit()">
        
        <span *ngIf="config.icon" class="field-icon">{{ config.icon }}</span>
        
        <div class="field-content">
          <span class="field-label">{{ config.label }}</span>
          <span class="field-value" 
                [class.empty]="!value || value.trim() === ''">
            {{ displayValue || 'Clic para agregar' }}
          </span>
        </div>
        
        <i class="edit-indicator fas fa-edit" 
           *ngIf="!config.disabled"
           aria-hidden="true"></i>
      </div>

      <!-- Edit Mode -->
      <div *ngIf="isEditing" class="field-edit">
        <span *ngIf="config.icon" class="field-icon">{{ config.icon }}</span>
        
        <div class="field-input-container">
          <label class="field-label">{{ config.label }}</label>
          
          <input 
            #inputRef
            [(ngModel)]="editValue"
            [type]="config.type || 'text'"
            [placeholder]="config.placeholder || config.label"
            [maxlength]="config.maxLength"
            (blur)="onBlur()"
            (keydown.enter)="save()"
            (keydown.escape)="cancel()"
            (input)="onInput()"
            class="inline-input"
            [attr.aria-label]="config.label"
            [attr.aria-required]="config.required"
            [attr.aria-invalid]="validationResult && !validationResult.isValid">
          
          <!-- Character counter -->
          <div *ngIf="config.maxLength && editValue" class="character-counter">
            {{ editValue.length }}/{{ config.maxLength }}
          </div>
          
          <!-- Real-time validation feedback -->
          <div *ngIf="validationResult && !validationResult.isValid" 
               class="validation-errors">
            <div *ngFor="let error of validationResult.errors" 
                 class="error-message">
              <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
              {{ error }}
            </div>
          </div>
          
          <!-- Warnings -->
          <div *ngIf="validationResult && validationResult.warnings.length > 0" 
               class="validation-warnings">
            <div *ngFor="let warning of validationResult.warnings" 
                 class="warning-message">
              <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
              {{ warning }}
            </div>
          </div>

          <!-- Enhanced validation feedback -->
          <app-validation-feedback
            [fieldId]="getFieldId()"
            [config]="{
              showQualityScore: false,
              showSuggestions: true,
              showWarnings: true,
              compactMode: true,
              position: 'inline'
            }">
          </app-validation-feedback>
        </div>

        <!-- Action buttons -->
        <div class="field-actions">
          <button type="button"
                  class="action-btn save-btn" 
                  [disabled]="validationResult && !validationResult.isValid"
                  (click)="save()"
                  [attr.aria-label]="'Guardar ' + config.label">
            <i class="fas fa-check" aria-hidden="true"></i>
          </button>
          <button type="button"
                  class="action-btn cancel-btn" 
                  (click)="cancel()"
                  [attr.aria-label]="'Cancelar edición de ' + config.label">
            <i class="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .inline-field {
      position: relative;
      margin-bottom: 16px;
      transition: all 0.3s ease;
    }

    .field-display {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      min-height: 48px;
    }

    .field-display:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }

    .field-display:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .field-icon {
      font-size: 18px;
      margin-right: 12px;
      color: #d1d5db;
      min-width: 20px;
    }

    .field-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .field-label {
      font-size: 12px;
      font-weight: 500;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .field-value {
      font-size: 14px;
      color: #f9fafb;
      line-height: 1.4;
    }

    .field-value.empty {
      color: #6b7280;
      font-style: italic;
    }

    .edit-indicator {
      color: #6b7280;
      font-size: 14px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .field-display:hover .edit-indicator {
      opacity: 1;
    }

    .field-edit {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid #3b82f6;
      border-radius: 8px;
      backdrop-filter: blur(10px);
    }

    .field-input-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .inline-input {
      width: 100%;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: #f9fafb;
      font-size: 14px;
      transition: all 0.3s ease;
    }

    .inline-input:focus {
      outline: none;
      border-color: #3b82f6;
      background: rgba(255, 255, 255, 0.15);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    .inline-input::placeholder {
      color: #9ca3af;
    }

    .character-counter {
      font-size: 11px;
      color: #9ca3af;
      text-align: right;
    }

    .validation-errors, .validation-warnings {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #ef4444;
    }

    .warning-message {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #f59e0b;
    }

    .field-actions {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      transition: all 0.3s ease;
    }

    .save-btn {
      background: #10b981;
      color: white;
    }

    .save-btn:hover:not(:disabled) {
      background: #059669;
      transform: scale(1.05);
    }

    .save-btn:disabled {
      background: #6b7280;
      cursor: not-allowed;
    }

    .cancel-btn {
      background: #ef4444;
      color: white;
    }

    .cancel-btn:hover {
      background: #dc2626;
      transform: scale(1.05);
    }

    .inline-field.disabled .field-display {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .inline-field.error .field-display {
      border-color: #ef4444;
    }

    .inline-field.required .field-label::after {
      content: ' *';
      color: #ef4444;
    }

    @media (max-width: 768px) {
      .field-display {
        padding: 10px 12px;
        min-height: 44px;
      }

      .field-edit {
        padding: 12px;
      }

      .field-actions {
        flex-direction: column;
      }
    }
  `]
})
export class InlineFieldComponent implements OnInit, OnDestroy {
  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;

  @Input() value: string = '';
  @Input() config!: InlineFieldConfig;

  private readonly realTimeValidation = inject(RealTimeValidationService);
  
  @Output() valueChange = new EventEmitter<string>();
  @Output() save = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();
  @Output() validationChange = new EventEmitter<ValidationResult>();

  isEditing = false;
  editValue = '';
  validationResult: ValidationResult | null = null;
  
  private destroy$ = new Subject<void>();
  private validationSubject = new Subject<string>();

  get displayValue(): string {
    return this.value?.trim() || '';
  }

  ngOnInit() {
    // Register field with real-time validation service
    if (this.config.validators) {
      this.realTimeValidation.registerField(
        this.getFieldId(),
        this.config.validators,
        {
          context: 'general',
          enableSuggestions: true,
          enableQualityScore: false
        }
      ).pipe(
        takeUntil(this.destroy$)
      ).subscribe(state => {
        if (state.result) {
          this.validationResult = {
            isValid: state.result.isValid,
            errors: state.result.errors.map(e => e.message),
            warnings: state.result.warnings.map(w => w.message)
          };
          this.validationChange.emit(this.validationResult);
        }
      });
    }

    // Setup fallback validation with debouncing
    this.validationSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        this.validateValue(value);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  startEdit() {
    if (this.config.disabled) return;
    
    this.isEditing = true;
    this.editValue = this.value;
    
    // Focus input after view update
    setTimeout(() => {
      if (this.inputRef) {
        this.inputRef.nativeElement.focus();
        this.inputRef.nativeElement.select();
      }
    });
  }

  onInput() {
    // Trigger both validation systems
    this.validationSubject.next(this.editValue);
    this.realTimeValidation.validateField(this.getFieldId(), this.editValue);
  }

  onBlur() {
    // Small delay to allow action buttons to be clicked
    setTimeout(() => {
      if (this.isEditing) {
        this.save();
      }
    }, 150);
  }

  save() {
    if (!this.isEditing) return;
    
    this.validateValue(this.editValue);
    
    if (this.validationResult && !this.validationResult.isValid) {
      return; // Don't save if validation fails
    }

    const trimmedValue = this.editValue.trim();
    this.value = trimmedValue;
    this.isEditing = false;
    
    this.valueChange.emit(trimmedValue);
    this.save.emit(trimmedValue);
  }

  cancel() {
    this.isEditing = false;
    this.editValue = this.value;
    this.validationResult = null;
    this.cancel.emit();
  }

  private validateValue(value: string) {
    const validators = this.config.validators || [];
    const control = new FormControl(value);
    
    const errors: string[] = [];
    const warnings: string[] = [];

    // Apply custom validators
    validators.forEach(validator => {
      const result = validator(control);
      if (result) {
        Object.keys(result).forEach(key => {
          errors.push(this.getErrorMessage(key, result[key]));
        });
      }
    });

    // Apply built-in validations
    if (this.config.required && (!value || value.trim() === '')) {
      errors.push(`${this.config.label} es requerido`);
    }

    if (this.config.maxLength && value.length > this.config.maxLength) {
      errors.push(`${this.config.label} no puede exceder ${this.config.maxLength} caracteres`);
    }

    // XSS validation using CvValidators
    if (value && CvValidators.containsDangerousContent(value)) {
      errors.push('El contenido contiene caracteres no permitidos');
    }

    this.validationResult = {
      isValid: errors.length === 0,
      errors,
      warnings
    };

    this.validationChange.emit(this.validationResult);
  }

  private getErrorMessage(errorKey: string, errorValue: any): string {
    const messages: { [key: string]: string } = {
      required: `${this.config.label} es requerido`,
      minlength: `${this.config.label} debe tener al menos ${errorValue.requiredLength} caracteres`,
      maxlength: `${this.config.label} no puede exceder ${errorValue.requiredLength} caracteres`,
      email: `${this.config.label} debe ser un email válido`,
      pattern: `${this.config.label} tiene un formato inválido`
    };

    return messages[errorKey] || `${this.config.label} es inválido`;
  }

  /**
   * Generate unique field ID for validation service
   */
  getFieldId(): string {
    return `inline-field-${this.config.label.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
  }
}
