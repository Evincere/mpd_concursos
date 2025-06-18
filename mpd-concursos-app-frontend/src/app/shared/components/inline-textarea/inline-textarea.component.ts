/**
 * Inline Textarea Component - Multi-line text editing with auto-expand
 * 
 * This component provides inline editing for longer text content with:
 * - Auto-expanding textarea
 * - Real-time validation and character counting
 * - Rich text preview
 * - Glassmorphism design integration
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
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, ValidatorFn } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { CvValidators } from '../../../core/validators';

export interface InlineTextareaConfig {
  label: string;
  placeholder?: string;
  icon?: string;
  maxLength?: number;
  minRows?: number;
  maxRows?: number;
  required?: boolean;
  disabled?: boolean;
  autoExpand?: boolean;
  validators?: ValidatorFn[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Component({
  selector: 'app-inline-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inline-textarea" 
         [class.editing]="isEditing"
         [class.error]="validationResult && !validationResult.isValid"
         [class.disabled]="config.disabled"
         [class.required]="config.required">
      
      <!-- Display Mode -->
      <div *ngIf="!isEditing" 
           class="textarea-display"
           (click)="startEdit()"
           [attr.tabindex]="config.disabled ? -1 : 0"
           (keydown.enter)="startEdit()"
           (keydown.space)="startEdit()">
        
        <div class="display-header">
          <span *ngIf="config.icon" class="field-icon">{{ config.icon }}</span>
          <span class="field-label">{{ config.label }}</span>
          <i class="edit-indicator fas fa-edit" 
             *ngIf="!config.disabled"
             aria-hidden="true"></i>
        </div>
        
        <div class="field-content">
          <div class="field-value" 
               [class.empty]="!value || value.trim() === ''">
            <div *ngIf="displayValue; else emptyState" 
                 class="text-content"
                 [innerHTML]="formattedDisplayValue">
            </div>
            <ng-template #emptyState>
              <span class="empty-text">Clic para agregar {{ config.label.toLowerCase() }}</span>
            </ng-template>
          </div>
          
          <div *ngIf="displayValue" class="content-stats">
            <span class="word-count">{{ wordCount }} palabras</span>
            <span class="char-count">{{ displayValue.length }} caracteres</span>
          </div>
        </div>
      </div>

      <!-- Edit Mode -->
      <div *ngIf="isEditing" class="textarea-edit">
        <div class="edit-header">
          <span *ngIf="config.icon" class="field-icon">{{ config.icon }}</span>
          <label class="field-label">{{ config.label }}</label>
          
          <!-- Character counter -->
          <div class="character-counter" 
               [class.warning]="config.maxLength && editValue.length > config.maxLength * 0.9"
               [class.error]="config.maxLength && editValue.length > config.maxLength">
            {{ editValue.length }}{{ config.maxLength ? '/' + config.maxLength : '' }}
          </div>
        </div>
        
        <div class="textarea-container">
          <textarea 
            #textareaRef
            [(ngModel)]="editValue"
            [placeholder]="config.placeholder || 'Escribe aquí...'"
            [maxlength]="config.maxLength"
            [rows]="currentRows"
            (blur)="onBlur()"
            (keydown)="onKeyDown($event)"
            (input)="onInput()"
            (scroll)="onScroll()"
            class="inline-textarea-input"
            [attr.aria-label]="config.label"
            [attr.aria-required]="config.required"
            [attr.aria-invalid]="validationResult && !validationResult.isValid">
          </textarea>
          
          <!-- Resize handle -->
          <div *ngIf="!config.autoExpand" 
               class="resize-handle"
               (mousedown)="startResize($event)">
            <i class="fas fa-grip-lines" aria-hidden="true"></i>
          </div>
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
        
        <!-- Action buttons -->
        <div class="textarea-actions">
          <div class="action-group">
            <button type="button"
                    class="action-btn save-btn" 
                    [disabled]="validationResult && !validationResult.isValid"
                    (click)="save()"
                    [attr.aria-label]="'Guardar ' + config.label">
              <i class="fas fa-check" aria-hidden="true"></i>
              Guardar
            </button>
            <button type="button"
                    class="action-btn cancel-btn" 
                    (click)="cancel()"
                    [attr.aria-label]="'Cancelar edición de ' + config.label">
              <i class="fas fa-times" aria-hidden="true"></i>
              Cancelar
            </button>
          </div>
          
          <div class="formatting-help">
            <small>
              <i class="fas fa-info-circle" aria-hidden="true"></i>
              Ctrl+Enter para guardar, Escape para cancelar
            </small>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .inline-textarea {
      position: relative;
      margin-bottom: 20px;
      transition: all 0.3s ease;
    }

    .textarea-display {
      padding: 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      min-height: 80px;
    }

    .textarea-display:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }

    .textarea-display:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .display-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .field-icon {
      font-size: 18px;
      color: #d1d5db;
      min-width: 20px;
    }

    .field-label {
      font-size: 12px;
      font-weight: 500;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      flex: 1;
    }

    .edit-indicator {
      color: #6b7280;
      font-size: 14px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .textarea-display:hover .edit-indicator {
      opacity: 1;
    }

    .field-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .field-value {
      flex: 1;
    }

    .text-content {
      font-size: 14px;
      color: #f9fafb;
      line-height: 1.6;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .empty-text {
      color: #6b7280;
      font-style: italic;
      font-size: 14px;
    }

    .content-stats {
      display: flex;
      gap: 16px;
      font-size: 11px;
      color: #9ca3af;
    }

    .textarea-edit {
      padding: 20px;
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid #3b82f6;
      border-radius: 8px;
      backdrop-filter: blur(10px);
    }

    .edit-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .character-counter {
      font-size: 12px;
      color: #9ca3af;
      padding: 4px 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      transition: all 0.3s ease;
    }

    .character-counter.warning {
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.1);
    }

    .character-counter.error {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }

    .textarea-container {
      position: relative;
      margin-bottom: 16px;
    }

    .inline-textarea-input {
      width: 100%;
      min-height: 120px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: #f9fafb;
      font-size: 14px;
      font-family: inherit;
      line-height: 1.6;
      resize: vertical;
      transition: all 0.3s ease;
    }

    .inline-textarea-input:focus {
      outline: none;
      border-color: #3b82f6;
      background: rgba(255, 255, 255, 0.15);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    .inline-textarea-input::placeholder {
      color: #9ca3af;
    }

    .resize-handle {
      position: absolute;
      bottom: 4px;
      right: 4px;
      width: 16px;
      height: 16px;
      cursor: nw-resize;
      color: #6b7280;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
    }

    .validation-errors, .validation-warnings {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 16px;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #ef4444;
    }

    .warning-message {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #f59e0b;
    }

    .textarea-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .action-group {
      display: flex;
      gap: 12px;
    }

    .action-btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .save-btn {
      background: #10b981;
      color: white;
    }

    .save-btn:hover:not(:disabled) {
      background: #059669;
      transform: translateY(-1px);
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
      transform: translateY(-1px);
    }

    .formatting-help {
      color: #9ca3af;
      font-size: 11px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .inline-textarea.disabled .textarea-display {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .inline-textarea.error .textarea-display {
      border-color: #ef4444;
    }

    .inline-textarea.required .field-label::after {
      content: ' *';
      color: #ef4444;
    }

    @media (max-width: 768px) {
      .textarea-display {
        padding: 12px;
        min-height: 70px;
      }

      .textarea-edit {
        padding: 16px;
      }

      .textarea-actions {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }

      .action-group {
        justify-content: center;
      }

      .formatting-help {
        text-align: center;
      }
    }
  `]
})
export class InlineTextareaComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('textareaRef') textareaRef!: ElementRef<HTMLTextAreaElement>;

  @Input() value: string = '';
  @Input() config!: InlineTextareaConfig;
  
  @Output() valueChange = new EventEmitter<string>();
  @Output() save = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();
  @Output() validationChange = new EventEmitter<ValidationResult>();

  isEditing = false;
  editValue = '';
  validationResult: ValidationResult | null = null;
  currentRows = 4;
  
  private destroy$ = new Subject<void>();
  private validationSubject = new Subject<string>();

  get displayValue(): string {
    return this.value?.trim() || '';
  }

  get formattedDisplayValue(): string {
    return this.displayValue
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }

  get wordCount(): number {
    return this.displayValue
      .split(/\s+/)
      .filter(word => word.length > 0).length;
  }

  ngOnInit() {
    this.currentRows = this.config.minRows || 4;
    
    // Setup real-time validation with debouncing
    this.validationSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        this.validateValue(value);
      });
  }

  ngAfterViewInit() {
    if (this.config.autoExpand) {
      this.adjustTextareaHeight();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  startEdit() {
    if (this.config.disabled) return;
    
    this.isEditing = true;
    this.editValue = this.value;
    
    // Focus textarea after view update
    setTimeout(() => {
      if (this.textareaRef) {
        this.textareaRef.nativeElement.focus();
        this.adjustTextareaHeight();
      }
    });
  }

  onInput() {
    if (this.config.autoExpand) {
      this.adjustTextareaHeight();
    }
    this.validationSubject.next(this.editValue);
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      this.save();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancel();
    }
  }

  onBlur() {
    // Small delay to allow action buttons to be clicked
    setTimeout(() => {
      if (this.isEditing && document.activeElement?.closest('.textarea-actions') === null) {
        this.save();
      }
    }, 150);
  }

  onScroll() {
    // Handle scroll events if needed
  }

  startResize(event: MouseEvent) {
    // Implement manual resize functionality if needed
    event.preventDefault();
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

  private adjustTextareaHeight() {
    if (!this.textareaRef || !this.config.autoExpand) return;
    
    const textarea = this.textareaRef.nativeElement;
    const minRows = this.config.minRows || 4;
    const maxRows = this.config.maxRows || 12;
    
    // Reset height to calculate scroll height
    textarea.style.height = 'auto';
    
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
    const padding = parseInt(getComputedStyle(textarea).paddingTop) * 2;
    const minHeight = lineHeight * minRows + padding;
    const maxHeight = lineHeight * maxRows + padding;
    
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
    
    textarea.style.height = newHeight + 'px';
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

    // Word count warnings
    const wordCount = value.split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount > 200) {
      warnings.push('Considera reducir el texto para mejor legibilidad');
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
      maxlength: `${this.config.label} no puede exceder ${errorValue.requiredLength} caracteres`
    };

    return messages[errorKey] || `${this.config.label} es inválido`;
  }
}
