/**
 * Inline Date Range Component - Date range editing with validation
 * 
 * This component provides inline editing for date ranges with:
 * - Start and end date validation
 * - "Current" checkbox for ongoing positions
 * - Smart date formatting and display
 * - Duration calculation
 */

import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, ValidatorFn } from '@angular/forms';
import { Subject, takeUntil, debounceTime } from 'rxjs';

import { CvValidators } from '../../../core/validators';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
  isCurrent: boolean;
}

export interface InlineDateRangeConfig {
  label: string;
  icon?: string;
  required?: boolean;
  disabled?: boolean;
  allowCurrent?: boolean;
  minStartDate?: Date;
  maxEndDate?: Date;
  validators?: ValidatorFn[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Component({
  selector: 'app-inline-date-range',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inline-date-range" 
         [class.editing]="isEditing"
         [class.error]="validationResult && !validationResult.isValid"
         [class.disabled]="config.disabled"
         [class.required]="config.required">
      
      <!-- Display Mode -->
      <div *ngIf="!isEditing" 
           class="date-range-display"
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
        
        <div class="date-range-content">
          <div class="date-display" [class.empty]="!hasValidDates">
            <div *ngIf="hasValidDates; else emptyState" class="date-info">
              <div class="date-range-text">
                <span class="start-date">{{ formatDate(dateRange.startDate) }}</span>
                <span class="date-separator">-</span>
                <span class="end-date" [class.current]="dateRange.isCurrent">
                  {{ dateRange.isCurrent ? 'Actual' : formatDate(dateRange.endDate) }}
                </span>
              </div>
              <div class="duration-info">
                <i class="fas fa-clock" aria-hidden="true"></i>
                {{ calculateDuration() }}
              </div>
            </div>
            <ng-template #emptyState>
              <span class="empty-text">Clic para agregar fechas</span>
            </ng-template>
          </div>
        </div>
      </div>

      <!-- Edit Mode -->
      <div *ngIf="isEditing" class="date-range-edit">
        <div class="edit-header">
          <span *ngIf="config.icon" class="field-icon">{{ config.icon }}</span>
          <label class="field-label">{{ config.label }}</label>
        </div>
        
        <div class="date-inputs">
          <!-- Start Date -->
          <div class="date-input-group">
            <label class="input-label">Fecha de inicio</label>
            <input 
              type="date"
              [(ngModel)]="editStartDate"
              [min]="formatDateForInput(config.minStartDate)"
              [max]="formatDateForInput(editEndDate || config.maxEndDate)"
              (change)="onDateChange()"
              class="date-input"
              [attr.aria-label]="'Fecha de inicio de ' + config.label"
              [attr.aria-required]="config.required">
          </div>
          
          <!-- End Date -->
          <div class="date-input-group" [class.disabled]="editIsCurrent">
            <label class="input-label">Fecha de fin</label>
            <input 
              type="date"
              [(ngModel)]="editEndDate"
              [min]="formatDateForInput(editStartDate)"
              [max]="formatDateForInput(config.maxEndDate)"
              [disabled]="editIsCurrent"
              (change)="onDateChange()"
              class="date-input"
              [attr.aria-label]="'Fecha de fin de ' + config.label">
          </div>
        </div>
        
        <!-- Current checkbox -->
        <div *ngIf="config.allowCurrent" class="current-checkbox">
          <label class="checkbox-label">
            <input 
              type="checkbox"
              [(ngModel)]="editIsCurrent"
              (change)="onCurrentChange()"
              class="checkbox-input">
            <span class="checkbox-text">
              <i class="fas fa-check" aria-hidden="true"></i>
              Posición actual
            </span>
          </label>
        </div>
        
        <!-- Duration preview -->
        <div *ngIf="hasValidEditDates" class="duration-preview">
          <i class="fas fa-info-circle" aria-hidden="true"></i>
          Duración: {{ calculateEditDuration() }}
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
        <div class="date-range-actions">
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
      </div>
    </div>
  `,
  styles: [`
    .inline-date-range {
      position: relative;
      margin-bottom: 16px;
      transition: all 0.3s ease;
    }

    .date-range-display {
      padding: 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      min-height: 70px;
    }

    .date-range-display:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }

    .date-range-display:focus {
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

    .date-range-display:hover .edit-indicator {
      opacity: 1;
    }

    .date-range-content {
      display: flex;
      flex-direction: column;
    }

    .date-display.empty .empty-text {
      color: #6b7280;
      font-style: italic;
      font-size: 14px;
    }

    .date-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .date-range-text {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #f9fafb;
    }

    .start-date, .end-date {
      font-weight: 500;
    }

    .end-date.current {
      color: #10b981;
      font-weight: 600;
    }

    .date-separator {
      color: #9ca3af;
    }

    .duration-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #9ca3af;
    }

    .date-range-edit {
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
      margin-bottom: 20px;
    }

    .date-inputs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .date-input-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .date-input-group.disabled {
      opacity: 0.5;
    }

    .input-label {
      font-size: 12px;
      font-weight: 500;
      color: #d1d5db;
    }

    .date-input {
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: #f9fafb;
      font-size: 14px;
      transition: all 0.3s ease;
    }

    .date-input:focus {
      outline: none;
      border-color: #3b82f6;
      background: rgba(255, 255, 255, 0.15);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    .date-input:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .current-checkbox {
      margin-bottom: 16px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 14px;
      color: #f9fafb;
    }

    .checkbox-input {
      appearance: none;
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.1);
      cursor: pointer;
      position: relative;
      transition: all 0.3s ease;
    }

    .checkbox-input:checked {
      background: #10b981;
      border-color: #10b981;
    }

    .checkbox-input:checked + .checkbox-text .fas {
      opacity: 1;
    }

    .checkbox-text {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .checkbox-text .fas {
      opacity: 0;
      color: white;
      font-size: 10px;
      position: absolute;
      left: 4px;
      top: 2px;
      transition: opacity 0.3s ease;
    }

    .duration-preview {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: rgba(59, 130, 246, 0.1);
      border-radius: 6px;
      font-size: 12px;
      color: #93c5fd;
      margin-bottom: 16px;
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

    .date-range-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
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

    .inline-date-range.disabled .date-range-display {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .inline-date-range.error .date-range-display {
      border-color: #ef4444;
    }

    .inline-date-range.required .field-label::after {
      content: ' *';
      color: #ef4444;
    }

    @media (max-width: 768px) {
      .date-inputs {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .date-range-display {
        padding: 12px;
        min-height: 60px;
      }

      .date-range-edit {
        padding: 16px;
      }

      .date-range-actions {
        justify-content: center;
      }
    }
  `]
})
export class InlineDateRangeComponent implements OnInit, OnDestroy {
  @Input() dateRange: DateRange = { startDate: null, endDate: null, isCurrent: false };
  @Input() config!: InlineDateRangeConfig;
  
  @Output() dateRangeChange = new EventEmitter<DateRange>();
  @Output() save = new EventEmitter<DateRange>();
  @Output() cancel = new EventEmitter<void>();
  @Output() validationChange = new EventEmitter<ValidationResult>();

  isEditing = false;
  editStartDate: string = '';
  editEndDate: string = '';
  editIsCurrent = false;
  validationResult: ValidationResult | null = null;
  
  private destroy$ = new Subject<void>();
  private validationSubject = new Subject<DateRange>();

  get hasValidDates(): boolean {
    return !!(this.dateRange.startDate || this.dateRange.endDate);
  }

  get hasValidEditDates(): boolean {
    return !!(this.editStartDate || this.editEndDate);
  }

  ngOnInit() {
    // Setup real-time validation with debouncing
    this.validationSubject
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(dateRange => {
        this.validateDateRange(dateRange);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  startEdit() {
    if (this.config.disabled) return;
    
    this.isEditing = true;
    this.editStartDate = this.formatDateForInput(this.dateRange.startDate);
    this.editEndDate = this.formatDateForInput(this.dateRange.endDate);
    this.editIsCurrent = this.dateRange.isCurrent;
  }

  onDateChange() {
    const dateRange = this.getEditDateRange();
    this.validationSubject.next(dateRange);
  }

  onCurrentChange() {
    if (this.editIsCurrent) {
      this.editEndDate = '';
    }
    this.onDateChange();
  }

  save() {
    if (!this.isEditing) return;
    
    const dateRange = this.getEditDateRange();
    this.validateDateRange(dateRange);
    
    if (this.validationResult && !this.validationResult.isValid) {
      return; // Don't save if validation fails
    }

    this.dateRange = dateRange;
    this.isEditing = false;
    
    this.dateRangeChange.emit(dateRange);
    this.save.emit(dateRange);
  }

  cancel() {
    this.isEditing = false;
    this.editStartDate = this.formatDateForInput(this.dateRange.startDate);
    this.editEndDate = this.formatDateForInput(this.dateRange.endDate);
    this.editIsCurrent = this.dateRange.isCurrent;
    this.validationResult = null;
    this.cancel.emit();
  }

  formatDate(date: Date | null): string {
    if (!date) return '';
    
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long'
    }).format(date);
  }

  formatDateForInput(date: Date | null): string {
    if (!date) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  calculateDuration(): string {
    const start = this.dateRange.startDate;
    const end = this.dateRange.isCurrent ? new Date() : this.dateRange.endDate;
    
    if (!start || !end) return '';
    
    return this.getDurationText(start, end);
  }

  calculateEditDuration(): string {
    const start = this.editStartDate ? new Date(this.editStartDate) : null;
    const end = this.editIsCurrent ? new Date() : (this.editEndDate ? new Date(this.editEndDate) : null);
    
    if (!start || !end) return '';
    
    return this.getDurationText(start, end);
  }

  private getEditDateRange(): DateRange {
    return {
      startDate: this.editStartDate ? new Date(this.editStartDate) : null,
      endDate: this.editIsCurrent ? null : (this.editEndDate ? new Date(this.editEndDate) : null),
      isCurrent: this.editIsCurrent
    };
  }

  private getDurationText(start: Date, end: Date): string {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffMonths / 12);
    
    if (diffYears > 0) {
      const remainingMonths = diffMonths % 12;
      if (remainingMonths > 0) {
        return `${diffYears} año${diffYears > 1 ? 's' : ''} y ${remainingMonths} mes${remainingMonths > 1 ? 'es' : ''}`;
      }
      return `${diffYears} año${diffYears > 1 ? 's' : ''}`;
    } else if (diffMonths > 0) {
      return `${diffMonths} mes${diffMonths > 1 ? 'es' : ''}`;
    } else {
      return `${diffDays} día${diffDays > 1 ? 's' : ''}`;
    }
  }

  private validateDateRange(dateRange: DateRange) {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required validation
    if (this.config.required && !dateRange.startDate) {
      errors.push('La fecha de inicio es requerida');
    }

    // Date logic validation
    if (dateRange.startDate && dateRange.endDate && !dateRange.isCurrent) {
      if (dateRange.startDate > dateRange.endDate) {
        errors.push('La fecha de inicio no puede ser posterior a la fecha de fin');
      }
    }

    // Future date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dateRange.startDate && dateRange.startDate > today) {
      warnings.push('La fecha de inicio es en el futuro');
    }

    if (dateRange.endDate && dateRange.endDate > today && !dateRange.isCurrent) {
      warnings.push('La fecha de fin es en el futuro');
    }

    // Min/max date validation
    if (this.config.minStartDate && dateRange.startDate && dateRange.startDate < this.config.minStartDate) {
      errors.push(`La fecha de inicio no puede ser anterior a ${this.formatDate(this.config.minStartDate)}`);
    }

    if (this.config.maxEndDate && dateRange.endDate && dateRange.endDate > this.config.maxEndDate) {
      errors.push(`La fecha de fin no puede ser posterior a ${this.formatDate(this.config.maxEndDate)}`);
    }

    this.validationResult = {
      isValid: errors.length === 0,
      errors,
      warnings
    };

    this.validationChange.emit(this.validationResult);
  }
}
