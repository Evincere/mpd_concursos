/**
 * Experience Inline Component - Complete inline editing for work experiences
 * 
 * This component replaces the complex 4-step wizard with a streamlined inline
 * editing experience that allows users to edit all fields directly in place.
 */

import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { InlineFieldComponent, InlineFieldConfig } from '../inline-field/inline-field.component';
import { InlineTextareaComponent, InlineTextareaConfig } from '../inline-textarea/inline-textarea.component';
import { InlineDateRangeComponent, InlineDateRangeConfig, DateRange } from '../inline-date-range/inline-date-range.component';

import { Experience, CvOperationResult } from '../../../core/models/cv';
import { CvValidators } from '../../../core/validators';
import { ExperienceCvService } from '../../../core/services/cv';

export interface ExperienceInlineConfig {
  allowEdit?: boolean;
  allowDelete?: boolean;
  showDocuments?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

@Component({
  selector: 'app-experience-inline',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    InlineFieldComponent,
    InlineTextareaComponent,
    InlineDateRangeComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="experience-inline" 
         [class.editing]="isEditing()"
         [class.saving]="isSaving()"
         [class.error]="hasErrors()">
      
      <!-- Experience Card -->
      <div class="experience-card">
        
        <!-- Header with quick actions -->
        <div class="experience-header">
          <div class="experience-title">
            <h4>{{ experience().position || 'Nueva Experiencia' }}</h4>
            <span class="experience-company">{{ experience().company }}</span>
          </div>
          
          <div class="quick-actions" *ngIf="!isEditing()">
            <button *ngIf="config.allowEdit" 
                    class="action-btn edit-btn"
                    (click)="startEdit()"
                    [attr.aria-label]="'Editar experiencia ' + experience().position">
              <i class="fas fa-edit" aria-hidden="true"></i>
            </button>
            <button *ngIf="config.allowDelete" 
                    class="action-btn delete-btn"
                    (click)="confirmDelete()"
                    [attr.aria-label]="'Eliminar experiencia ' + experience().position">
              <i class="fas fa-trash" aria-hidden="true"></i>
            </button>
          </div>
        </div>

        <!-- Position and Company -->
        <div class="field-row">
          <app-inline-field
            [value]="experience().position"
            [config]="positionConfig"
            (save)="updateField('position', $event)"
            (validationChange)="onValidationChange('position', $event)">
          </app-inline-field>
          
          <app-inline-field
            [value]="experience().company"
            [config]="companyConfig"
            (save)="updateField('company', $event)"
            (validationChange)="onValidationChange('company', $event)">
          </app-inline-field>
        </div>

        <!-- Date Range -->
        <app-inline-date-range
          [dateRange]="getDateRange()"
          [config]="dateRangeConfig"
          (save)="updateDateRange($event)"
          (validationChange)="onValidationChange('dateRange', $event)">
        </app-inline-date-range>

        <!-- Location -->
        <app-inline-field
          [value]="experience().location || ''"
          [config]="locationConfig"
          (save)="updateField('location', $event)"
          (validationChange)="onValidationChange('location', $event)">
        </app-inline-field>

        <!-- Description -->
        <app-inline-textarea
          [value]="experience().description || ''"
          [config]="descriptionConfig"
          (save)="updateField('description', $event)"
          (validationChange)="onValidationChange('description', $event)">
        </app-inline-textarea>

        <!-- Documents Section -->
        <div *ngIf="config.showDocuments" class="documents-section">
          <div class="section-header">
            <h5>
              <i class="fas fa-paperclip" aria-hidden="true"></i>
              Documentos
            </h5>
          </div>
          
          <div class="document-upload">
            <input 
              type="file"
              #fileInput
              (change)="onFileSelected($event)"
              accept=".pdf,.doc,.docx"
              multiple
              class="file-input"
              [attr.aria-label]="'Subir documentos para ' + experience().position">
            
            <button class="upload-btn" 
                    (click)="fileInput.click()"
                    [disabled]="isUploading()">
              <i class="fas fa-upload" aria-hidden="true"></i>
              {{ isUploading() ? 'Subiendo...' : 'Subir Documentos' }}
            </button>
          </div>
          
          <!-- Document list -->
          <div *ngIf="experience().documents && experience().documents.length > 0" 
               class="document-list">
            <div *ngFor="let doc of experience().documents" 
                 class="document-item">
              <i class="fas fa-file-pdf" aria-hidden="true"></i>
              <span class="document-name">{{ doc.name }}</span>
              <button class="remove-doc-btn" 
                      (click)="removeDocument(doc)"
                      [attr.aria-label]="'Eliminar documento ' + doc.name">
                <i class="fas fa-times" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Validation Summary -->
        <div *ngIf="hasErrors()" class="validation-summary">
          <div class="error-header">
            <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
            Hay errores que corregir:
          </div>
          <ul class="error-list">
            <li *ngFor="let error of getAllErrors()">{{ error }}</li>
          </ul>
        </div>

        <!-- Auto-save indicator -->
        <div *ngIf="config.autoSave && hasChanges()" class="auto-save-indicator">
          <div class="save-status" [class.saving]="isSaving()">
            <i class="fas" 
               [class.fa-save]="!isSaving()"
               [class.fa-spinner]="isSaving()"
               [class.fa-spin]="isSaving()"
               aria-hidden="true"></i>
            {{ isSaving() ? 'Guardando...' : 'Cambios guardados automáticamente' }}
          </div>
        </div>

        <!-- Manual save actions -->
        <div *ngIf="!config.autoSave && hasChanges()" class="save-actions">
          <button class="action-btn save-btn" 
                  [disabled]="hasErrors() || isSaving()"
                  (click)="saveChanges()">
            <i class="fas fa-check" aria-hidden="true"></i>
            {{ isSaving() ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
          <button class="action-btn cancel-btn" 
                  (click)="discardChanges()">
            <i class="fas fa-undo" aria-hidden="true"></i>
            Descartar Cambios
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .experience-inline {
      margin-bottom: 24px;
      transition: all 0.3s ease;
    }

    .experience-card {
      padding: 24px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    }

    .experience-inline.editing .experience-card {
      background: rgba(255, 255, 255, 0.08);
      border-color: #3b82f6;
      box-shadow: 0 8px 32px rgba(59, 130, 246, 0.1);
    }

    .experience-inline.saving .experience-card {
      opacity: 0.8;
    }

    .experience-inline.error .experience-card {
      border-color: #ef4444;
    }

    .experience-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .experience-title h4 {
      margin: 0 0 4px 0;
      font-size: 18px;
      font-weight: 600;
      color: #f9fafb;
    }

    .experience-company {
      font-size: 14px;
      color: #9ca3af;
    }

    .quick-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      transition: all 0.3s ease;
    }

    .edit-btn {
      background: rgba(59, 130, 246, 0.2);
      color: #3b82f6;
    }

    .edit-btn:hover {
      background: rgba(59, 130, 246, 0.3);
      transform: scale(1.05);
    }

    .delete-btn {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }

    .delete-btn:hover {
      background: rgba(239, 68, 68, 0.3);
      transform: scale(1.05);
    }

    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 16px;
    }

    .documents-section {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .section-header {
      margin-bottom: 16px;
    }

    .section-header h5 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #d1d5db;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .document-upload {
      margin-bottom: 16px;
    }

    .file-input {
      display: none;
    }

    .upload-btn {
      padding: 8px 16px;
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 6px;
      color: #10b981;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      transition: all 0.3s ease;
    }

    .upload-btn:hover:not(:disabled) {
      background: rgba(16, 185, 129, 0.3);
      transform: translateY(-1px);
    }

    .upload-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .document-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .document-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
      font-size: 13px;
      color: #d1d5db;
    }

    .document-name {
      flex: 1;
    }

    .remove-doc-btn {
      width: 20px;
      height: 20px;
      border: none;
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      transition: all 0.3s ease;
    }

    .remove-doc-btn:hover {
      background: rgba(239, 68, 68, 0.3);
    }

    .validation-summary {
      margin-top: 20px;
      padding: 16px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 8px;
    }

    .error-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #ef4444;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .error-list {
      margin: 0;
      padding-left: 20px;
      color: #fca5a5;
      font-size: 13px;
    }

    .auto-save-indicator {
      margin-top: 16px;
      display: flex;
      justify-content: center;
    }

    .save-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: rgba(16, 185, 129, 0.1);
      border-radius: 6px;
      font-size: 12px;
      color: #10b981;
      transition: all 0.3s ease;
    }

    .save-status.saving {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    .save-actions {
      margin-top: 20px;
      display: flex;
      gap: 12px;
      justify-content: center;
      padding-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .save-btn {
      padding: 10px 20px;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s ease;
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
      padding: 10px 20px;
      background: #6b7280;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .cancel-btn:hover {
      background: #4b5563;
      transform: translateY(-1px);
    }

    @media (max-width: 768px) {
      .experience-card {
        padding: 16px;
      }

      .field-row {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .experience-header {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }

      .quick-actions {
        justify-content: center;
      }

      .save-actions {
        flex-direction: column;
      }
    }
  `]
})
export class ExperienceInlineComponent implements OnInit, OnDestroy {
  private readonly experienceService = inject(ExperienceCvService);

  @Input() experience = signal<Experience>({
    id: '',
    userId: '',
    position: '',
    company: '',
    startDate: new Date(),
    endDate: null,
    description: '',
    location: ''
  });

  @Input() config: ExperienceInlineConfig = {
    allowEdit: true,
    allowDelete: true,
    showDocuments: true,
    autoSave: false,
    autoSaveDelay: 2000
  };

  @Output() updated = new EventEmitter<Experience>();
  @Output() deleted = new EventEmitter<string>();
  @Output() validationChange = new EventEmitter<boolean>();

  // Signals for reactive state management
  private originalExperience = signal<Experience | null>(null);
  private fieldValidations = signal<{ [key: string]: any }>({});
  private saveState = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');
  private uploadState = signal<'idle' | 'uploading'>('idle');

  // Computed signals
  isEditing = computed(() => this.originalExperience() !== null);
  hasChanges = computed(() => {
    const original = this.originalExperience();
    const current = this.experience();
    return original && JSON.stringify(original) !== JSON.stringify(current);
  });
  hasErrors = computed(() => {
    const validations = this.fieldValidations();
    return Object.values(validations).some((v: any) => v && !v.isValid);
  });
  isSaving = computed(() => this.saveState() === 'saving');
  isUploading = computed(() => this.uploadState() === 'uploading');

  // Field configurations
  positionConfig: InlineFieldConfig = {
    label: 'Cargo o Puesto',
    placeholder: 'Ej: Desarrollador Senior',
    icon: '💼',
    required: true,
    maxLength: 100,
    validators: [Validators.required, Validators.minLength(2)]
  };

  companyConfig: InlineFieldConfig = {
    label: 'Empresa',
    placeholder: 'Ej: Tech Corporation',
    icon: '🏢',
    required: true,
    maxLength: 100,
    validators: [Validators.required, Validators.minLength(2)]
  };

  locationConfig: InlineFieldConfig = {
    label: 'Ubicación',
    placeholder: 'Ej: Buenos Aires, Argentina',
    icon: '📍',
    maxLength: 100
  };

  dateRangeConfig: InlineDateRangeConfig = {
    label: 'Período',
    icon: '📅',
    required: true,
    allowCurrent: true
  };

  descriptionConfig: InlineTextareaConfig = {
    label: 'Descripción',
    placeholder: 'Describe tus responsabilidades y logros principales...',
    icon: '📝',
    maxLength: 1000,
    minRows: 3,
    maxRows: 8,
    autoExpand: true,
    validators: [Validators.minLength(10)]
  };

  private destroy$ = new Subject<void>();
  private autoSaveSubject = new Subject<void>();

  ngOnInit() {
    // Setup auto-save if enabled
    if (this.config.autoSave) {
      this.autoSaveSubject
        .pipe(
          debounceTime(this.config.autoSaveDelay || 2000),
          distinctUntilChanged(),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          if (this.hasChanges() && !this.hasErrors()) {
            this.saveChanges();
          }
        });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  startEdit() {
    this.originalExperience.set({ ...this.experience() });
  }

  updateField(field: keyof Experience, value: any) {
    const current = this.experience();
    this.experience.set({ ...current, [field]: value });
    
    if (this.config.autoSave) {
      this.autoSaveSubject.next();
    }
  }

  updateDateRange(dateRange: DateRange) {
    const current = this.experience();
    this.experience.set({
      ...current,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
    
    if (this.config.autoSave) {
      this.autoSaveSubject.next();
    }
  }

  onValidationChange(field: string, validation: any) {
    const current = this.fieldValidations();
    this.fieldValidations.set({ ...current, [field]: validation });
    
    this.validationChange.emit(!this.hasErrors());
  }

  getDateRange(): DateRange {
    const exp = this.experience();
    return {
      startDate: exp.startDate,
      endDate: exp.endDate,
      isCurrent: !exp.endDate
    };
  }

  getAllErrors(): string[] {
    const validations = this.fieldValidations();
    const errors: string[] = [];
    
    Object.values(validations).forEach((validation: any) => {
      if (validation && !validation.isValid) {
        errors.push(...validation.errors);
      }
    });
    
    return errors;
  }

  async saveChanges() {
    if (this.hasErrors() || this.isSaving()) return;
    
    this.saveState.set('saving');
    
    try {
      const exp = this.experience();
      let result: CvOperationResult<Experience>;
      
      if (exp.id) {
        result = await this.experienceService.update(exp.id, exp).toPromise();
      } else {
        result = await this.experienceService.create(exp.userId, exp).toPromise();
      }
      
      if (result?.success && result.data) {
        this.experience.set(result.data);
        this.originalExperience.set({ ...result.data });
        this.saveState.set('saved');
        this.updated.emit(result.data);
        
        // Reset save state after delay
        setTimeout(() => this.saveState.set('idle'), 2000);
      } else {
        throw new Error(result?.message || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error saving experience:', error);
      this.saveState.set('error');
      setTimeout(() => this.saveState.set('idle'), 3000);
    }
  }

  discardChanges() {
    const original = this.originalExperience();
    if (original) {
      this.experience.set({ ...original });
      this.originalExperience.set(null);
      this.fieldValidations.set({});
    }
  }

  confirmDelete() {
    if (confirm('¿Estás seguro de que quieres eliminar esta experiencia?')) {
      this.deleteExperience();
    }
  }

  async deleteExperience() {
    const exp = this.experience();
    if (!exp.id) return;
    
    try {
      const result = await this.experienceService.delete(exp.id).toPromise();
      if (result?.success) {
        this.deleted.emit(exp.id);
      }
    } catch (error) {
      console.error('Error deleting experience:', error);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadDocuments(Array.from(input.files));
    }
  }

  async uploadDocuments(files: File[]) {
    const exp = this.experience();
    if (!exp.id) return;
    
    this.uploadState.set('uploading');
    
    try {
      for (const file of files) {
        await this.experienceService.uploadDocument(exp.id, file).toPromise();
      }
      
      // Refresh experience data to get updated documents
      // This would typically be handled by the service state management
      this.uploadState.set('idle');
    } catch (error) {
      console.error('Error uploading documents:', error);
      this.uploadState.set('idle');
    }
  }

  removeDocument(document: any) {
    // Implementation for removing documents
    console.log('Remove document:', document);
  }
}
