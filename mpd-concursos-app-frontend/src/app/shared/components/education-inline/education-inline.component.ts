/**
 * Education Inline Component - Complete inline editing for education records
 *
 * This component provides inline editing for education with:
 * - Education types and status management
 * - Scientific activities support
 * - Institution and degree validation
 * - Document upload functionality
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

import {
  Education,
  EducationType,
  EducationStatus,
  ScientificActivityType,
  ScientificActivityRole,
  CvOperationResult
} from '../../../core/models/cv';
import { CvValidators } from '../../../core/validators';
import { EducationCvService } from '../../../core/services/cv';

export interface EducationInlineConfig {
  allowEdit?: boolean;
  allowDelete?: boolean;
  showDocuments?: boolean;
  showScientificActivities?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

@Component({
  selector: 'app-education-inline',
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
    <div class="education-inline"
         [class.editing]="isEditing()"
         [class.saving]="isSaving()"
         [class.error]="hasErrors()">

      <!-- Education Card -->
      <div class="education-card">

        <!-- Header with quick actions -->
        <div class="education-header">
          <div class="education-title">
            <h4>{{ education().title || 'Nueva Educación' }}</h4>
            <div class="education-meta">
              <span class="education-institution">{{ education().institution }}</span>
              <span class="education-type" [class]="getTypeClass()">
                {{ getTypeLabel() }}
              </span>
              <span class="education-status" [class]="getStatusClass()">
                {{ getStatusLabel() }}
              </span>
            </div>
          </div>

          <div class="quick-actions" *ngIf="!isEditing()">
            <button *ngIf="config.allowEdit"
                    class="action-btn edit-btn"
                    (click)="startEdit()"
                    [attr.aria-label]="'Editar educación ' + education().title">
              <i class="fas fa-edit" aria-hidden="true"></i>
            </button>
            <button *ngIf="config.allowDelete"
                    class="action-btn delete-btn"
                    (click)="confirmDelete()"
                    [attr.aria-label]="'Eliminar educación ' + education().title">
              <i class="fas fa-trash" aria-hidden="true"></i>
            </button>
          </div>
        </div>

        <!-- Type and Status Selection -->
        <div class="field-row">
          <div class="select-field">
            <label class="field-label">Tipo de Educación *</label>
            <select
              [(ngModel)]="education().type"
              (change)="updateField('type', $event)"
              class="select-input"
              [disabled]="!isEditing()">
              <option value="">Seleccionar tipo</option>
              <option *ngFor="let type of educationTypes" [value]="type.value">
                {{ type.label }}
              </option>
            </select>
          </div>

          <div class="select-field">
            <label class="field-label">Estado</label>
            <select
              [(ngModel)]="education().status"
              (change)="updateField('status', $event)"
              class="select-input"
              [disabled]="!isEditing()">
              <option value="">Seleccionar estado</option>
              <option *ngFor="let status of educationStatuses" [value]="status.value">
                {{ status.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Institution and Title -->
        <div class="field-row">
          <app-inline-field
            [value]="education().institution"
            [config]="institutionConfig"
            (save)="updateField('institution', $event)"
            (validationChange)="onValidationChange('institution', $event)">
          </app-inline-field>

          <app-inline-field
            [value]="education().title"
            [config]="titleConfig"
            (save)="updateField('title', $event)"
            (validationChange)="onValidationChange('title', $event)">
          </app-inline-field>
        </div>

        <!-- Date Range -->
        <app-inline-date-range
          [dateRange]="getDateRange()"
          [config]="dateRangeConfig"
          (save)="updateDateRange($event)"
          (validationChange)="onValidationChange('dateRange', $event)">
        </app-inline-date-range>

        <!-- Description -->
        <app-inline-textarea
          [value]="education().description || ''"
          [config]="descriptionConfig"
          (save)="updateField('description', $event)"
          (validationChange)="onValidationChange('description', $event)">
        </app-inline-textarea>

        <!-- Scientific Activities Section -->
        <div *ngIf="config.showScientificActivities && isUniversityLevel()"
             class="scientific-activities-section">
          <div class="section-header">
            <h5>
              <i class="fas fa-flask" aria-hidden="true"></i>
              Actividades Científicas
            </h5>
            <button class="add-activity-btn"
                    (click)="addScientificActivity()"
                    [disabled]="!isEditing()">
              <i class="fas fa-plus" aria-hidden="true"></i>
              Agregar Actividad
            </button>
          </div>

          <div *ngFor="let activity of education().scientificActivities; let i = index"
               class="activity-item">
            <div class="activity-header">
              <select [(ngModel)]="activity.type"
                      class="activity-type-select"
                      [disabled]="!isEditing()">
                <option *ngFor="let type of scientificActivityTypes" [value]="type.value">
                  {{ type.label }}
                </option>
              </select>

              <select [(ngModel)]="activity.role"
                      class="activity-role-select"
                      [disabled]="!isEditing()">
                <option *ngFor="let role of scientificActivityRoles" [value]="role.value">
                  {{ role.label }}
                </option>
              </select>

              <button *ngIf="isEditing()"
                      class="remove-activity-btn"
                      (click)="removeScientificActivity(i)">
                <i class="fas fa-times" aria-hidden="true"></i>
              </button>
            </div>

            <input [(ngModel)]="activity.title"
                   placeholder="Título de la actividad"
                   class="activity-title-input"
                   [disabled]="!isEditing()">

            <textarea [(ngModel)]="activity.description"
                      placeholder="Descripción de la actividad"
                      class="activity-description-input"
                      rows="2"
                      [disabled]="!isEditing()">
            </textarea>
          </div>
        </div>

        <!-- Documents Section -->
        <div *ngIf="config.showDocuments" class="documents-section">
          <div class="section-header">
            <h5>
              <i class="fas fa-certificate" aria-hidden="true"></i>
              Certificados y Documentos
            </h5>
          </div>

          <div class="document-upload">
            <input
              type="file"
              #fileInput
              (change)="onFileSelected($event)"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              multiple
              class="file-input"
              [attr.aria-label]="'Subir documentos para ' + education().title">

            <button class="upload-btn"
                    (click)="fileInput.click()"
                    [disabled]="isUploading()">
              <i class="fas fa-upload" aria-hidden="true"></i>
              {{ isUploading() ? 'Subiendo...' : 'Subir Certificados' }}
            </button>
          </div>

          <!-- Document list -->
          <div *ngIf="education().documents && education().documents.length > 0"
               class="document-list">
            <div *ngFor="let doc of education().documents"
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
    .education-inline {
      margin-bottom: 24px;
      transition: all 0.3s ease;
    }

    .education-card {
      padding: 24px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    }

    .education-inline.editing .education-card {
      background: rgba(255, 255, 255, 0.08);
      border-color: #3b82f6;
      box-shadow: 0 8px 32px rgba(59, 130, 246, 0.1);
    }

    .education-inline.saving .education-card {
      opacity: 0.8;
    }

    .education-inline.error .education-card {
      border-color: #ef4444;
    }

    .education-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .education-title h4 {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
      color: #f9fafb;
    }

    .education-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }

    .education-institution {
      font-size: 14px;
      color: #9ca3af;
    }

    .education-type, .education-status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .education-type.university { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
    .education-type.secondary { background: rgba(16, 185, 129, 0.2); color: #10b981; }
    .education-type.technical { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
    .education-type.certification { background: rgba(139, 92, 246, 0.2); color: #8b5cf6; }

    .education-status.completed { background: rgba(16, 185, 129, 0.2); color: #10b981; }
    .education-status.in-progress { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
    .education-status.suspended { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
    .education-status.abandoned { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

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

    .select-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field-label {
      font-size: 12px;
      font-weight: 500;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .select-input {
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: #f9fafb;
      font-size: 14px;
      transition: all 0.3s ease;
    }

    .select-input:focus {
      outline: none;
      border-color: #3b82f6;
      background: rgba(255, 255, 255, 0.15);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    .select-input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .scientific-activities-section, .documents-section {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
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

    .add-activity-btn {
      padding: 6px 12px;
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 6px;
      color: #10b981;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      transition: all 0.3s ease;
    }

    .add-activity-btn:hover:not(:disabled) {
      background: rgba(16, 185, 129, 0.3);
      transform: translateY(-1px);
    }

    .add-activity-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .activity-item {
      margin-bottom: 16px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .activity-header {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
      align-items: center;
    }

    .activity-type-select, .activity-role-select {
      flex: 1;
      padding: 6px 8px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      color: #f9fafb;
      font-size: 12px;
    }

    .remove-activity-btn {
      width: 24px;
      height: 24px;
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

    .remove-activity-btn:hover {
      background: rgba(239, 68, 68, 0.3);
    }

    .activity-title-input, .activity-description-input {
      width: 100%;
      margin-bottom: 8px;
      padding: 8px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      color: #f9fafb;
      font-size: 13px;
    }

    .activity-title-input:focus, .activity-description-input:focus {
      outline: none;
      border-color: #3b82f6;
      background: rgba(255, 255, 255, 0.15);
    }

    .activity-description-input {
      resize: vertical;
      font-family: inherit;
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
      .education-card {
        padding: 16px;
      }

      .field-row {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .education-header {
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

      .activity-header {
        flex-direction: column;
        gap: 8px;
      }

      .activity-type-select, .activity-role-select {
        flex: none;
      }
    }
  `]
})
export class EducationInlineComponent implements OnInit, OnDestroy {
  private readonly educationService = inject(EducationCvService);

  @Input() education = signal<Education>({
    id: '',
    userId: '',
    type: EducationType.UNIVERSITY_DEGREE,
    institution: '',
    title: '',
    startDate: new Date(),
    endDate: null,
    status: EducationStatus.COMPLETED,
    description: '',
    scientificActivities: []
  });

  @Input() config: EducationInlineConfig = {
    allowEdit: true,
    allowDelete: true,
    showDocuments: true,
    showScientificActivities: true,
    autoSave: false,
    autoSaveDelay: 2000
  };

  @Output() updated = new EventEmitter<Education>();
  @Output() deleted = new EventEmitter<string>();
  @Output() validationChange = new EventEmitter<boolean>();

  // Signals for reactive state management
  private originalEducation = signal<Education | null>(null);
  private fieldValidations = signal<{ [key: string]: any }>({});
  private saveState = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');
  private uploadState = signal<'idle' | 'uploading'>('idle');

  // Computed signals
  isEditing = computed(() => this.originalEducation() !== null);
  hasChanges = computed(() => {
    const original = this.originalEducation();
    const current = this.education();
    return original && JSON.stringify(original) !== JSON.stringify(current);
  });
  hasErrors = computed(() => {
    const validations = this.fieldValidations();
    return Object.values(validations).some((v: any) => v && !v.isValid);
  });
  isSaving = computed(() => this.saveState() === 'saving');
  isUploading = computed(() => this.uploadState() === 'uploading');

  // Education type options
  educationTypes = [
    { value: EducationType.PRIMARY_EDUCATION, label: 'Educación Primaria' },
    { value: EducationType.SECONDARY_EDUCATION, label: 'Educación Secundaria' },
    { value: EducationType.TECHNICAL_EDUCATION, label: 'Educación Técnica' },
    { value: EducationType.UNIVERSITY_DEGREE, label: 'Título Universitario' },
    { value: EducationType.POSTGRADUATE, label: 'Posgrado' },
    { value: EducationType.MASTER_DEGREE, label: 'Maestría' },
    { value: EducationType.DOCTORATE, label: 'Doctorado' },
    { value: EducationType.CERTIFICATION, label: 'Certificación' },
    { value: EducationType.COURSE, label: 'Curso' },
    { value: EducationType.WORKSHOP, label: 'Taller' }
  ];

  // Education status options
  educationStatuses = [
    { value: EducationStatus.COMPLETED, label: 'Completado' },
    { value: EducationStatus.IN_PROGRESS, label: 'En Progreso' },
    { value: EducationStatus.SUSPENDED, label: 'Suspendido' },
    { value: EducationStatus.ABANDONED, label: 'Abandonado' }
  ];

  // Scientific activity types
  scientificActivityTypes = [
    { value: ScientificActivityType.RESEARCH_PROJECT, label: 'Proyecto de Investigación' },
    { value: ScientificActivityType.PUBLICATION, label: 'Publicación' },
    { value: ScientificActivityType.CONFERENCE, label: 'Conferencia' },
    { value: ScientificActivityType.PATENT, label: 'Patente' },
    { value: ScientificActivityType.AWARD, label: 'Premio' }
  ];

  // Scientific activity roles
  scientificActivityRoles = [
    { value: ScientificActivityRole.PRINCIPAL_INVESTIGATOR, label: 'Investigador Principal' },
    { value: ScientificActivityRole.CO_INVESTIGATOR, label: 'Co-investigador' },
    { value: ScientificActivityRole.RESEARCH_ASSISTANT, label: 'Asistente de Investigación' },
    { value: ScientificActivityRole.AUTHOR, label: 'Autor' },
    { value: ScientificActivityRole.CO_AUTHOR, label: 'Co-autor' },
    { value: ScientificActivityRole.PRESENTER, label: 'Presentador' },
    { value: ScientificActivityRole.PARTICIPANT, label: 'Participante' }
  ];

  // Field configurations
  institutionConfig: InlineFieldConfig = {
    label: 'Institución',
    placeholder: 'Ej: Universidad Nacional de Buenos Aires',
    icon: '🏛️',
    required: true,
    maxLength: 150,
    validators: [Validators.required, Validators.minLength(2)]
  };

  titleConfig: InlineFieldConfig = {
    label: 'Título o Carrera',
    placeholder: 'Ej: Licenciatura en Derecho',
    icon: '🎓',
    required: true,
    maxLength: 150,
    validators: [Validators.required, Validators.minLength(2)]
  };

  dateRangeConfig: InlineDateRangeConfig = {
    label: 'Período de Estudios',
    icon: '📅',
    required: true,
    allowCurrent: true
  };

  descriptionConfig: InlineTextareaConfig = {
    label: 'Descripción',
    placeholder: 'Describe especialidades, materias destacadas, logros académicos...',
    icon: '📝',
    maxLength: 800,
    minRows: 2,
    maxRows: 6,
    autoExpand: true
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
    this.originalEducation.set({ ...this.education() });
  }

  updateField(field: keyof Education, value: any) {
    const current = this.education();
    this.education.set({ ...current, [field]: value });

    if (this.config.autoSave) {
      this.autoSaveSubject.next();
    }
  }

  updateDateRange(dateRange: DateRange) {
    const current = this.education();
    this.education.set({
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
    const edu = this.education();
    return {
      startDate: edu.startDate,
      endDate: edu.endDate,
      isCurrent: !edu.endDate
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

  getTypeLabel(): string {
    const type = this.educationTypes.find(t => t.value === this.education().type);
    return type?.label || '';
  }

  getTypeClass(): string {
    const type = this.education().type;
    if (type === EducationType.UNIVERSITY_DEGREE || type === EducationType.POSTGRADUATE ||
        type === EducationType.MASTER_DEGREE || type === EducationType.DOCTORATE) {
      return 'university';
    }
    if (type === EducationType.SECONDARY_EDUCATION || type === EducationType.PRIMARY_EDUCATION) {
      return 'secondary';
    }
    if (type === EducationType.TECHNICAL_EDUCATION) {
      return 'technical';
    }
    return 'certification';
  }

  getStatusLabel(): string {
    const status = this.educationStatuses.find(s => s.value === this.education().status);
    return status?.label || '';
  }

  getStatusClass(): string {
    const status = this.education().status;
    switch (status) {
      case EducationStatus.COMPLETED: return 'completed';
      case EducationStatus.IN_PROGRESS: return 'in-progress';
      case EducationStatus.SUSPENDED: return 'suspended';
      case EducationStatus.ABANDONED: return 'abandoned';
      default: return '';
    }
  }

  isUniversityLevel(): boolean {
    const type = this.education().type;
    return type === EducationType.UNIVERSITY_DEGREE ||
           type === EducationType.POSTGRADUATE ||
           type === EducationType.MASTER_DEGREE ||
           type === EducationType.DOCTORATE;
  }

  addScientificActivity() {
    const current = this.education();
    const newActivity = {
      type: ScientificActivityType.RESEARCH_PROJECT,
      role: ScientificActivityRole.PARTICIPANT,
      title: '',
      description: ''
    };

    this.education.set({
      ...current,
      scientificActivities: [...(current.scientificActivities || []), newActivity]
    });

    if (this.config.autoSave) {
      this.autoSaveSubject.next();
    }
  }

  removeScientificActivity(index: number) {
    const current = this.education();
    const activities = [...(current.scientificActivities || [])];
    activities.splice(index, 1);

    this.education.set({
      ...current,
      scientificActivities: activities
    });

    if (this.config.autoSave) {
      this.autoSaveSubject.next();
    }
  }

  async saveChanges() {
    if (this.hasErrors() || this.isSaving()) return;

    this.saveState.set('saving');

    try {
      const edu = this.education();
      let result: CvOperationResult<Education>;

      if (edu.id) {
        result = await this.educationService.update(edu.id, edu).toPromise();
      } else {
        result = await this.educationService.create(edu.userId, edu).toPromise();
      }

      if (result?.success && result.data) {
        this.education.set(result.data);
        this.originalEducation.set({ ...result.data });
        this.saveState.set('saved');
        this.updated.emit(result.data);

        // Reset save state after delay
        setTimeout(() => this.saveState.set('idle'), 2000);
      } else {
        throw new Error(result?.message || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error saving education:', error);
      this.saveState.set('error');
      setTimeout(() => this.saveState.set('idle'), 3000);
    }
  }

  discardChanges() {
    const original = this.originalEducation();
    if (original) {
      this.education.set({ ...original });
      this.originalEducation.set(null);
      this.fieldValidations.set({});
    }
  }

  confirmDelete() {
    if (confirm('¿Estás seguro de que quieres eliminar este registro de educación?')) {
      this.deleteEducation();
    }
  }

  async deleteEducation() {
    const edu = this.education();
    if (!edu.id) return;

    try {
      const result = await this.educationService.delete(edu.id).toPromise();
      if (result?.success) {
        this.deleted.emit(edu.id);
      }
    } catch (error) {
      console.error('Error deleting education:', error);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadDocuments(Array.from(input.files));
    }
  }

  async uploadDocuments(files: File[]) {
    const edu = this.education();
    if (!edu.id) return;

    this.uploadState.set('uploading');

    try {
      for (const file of files) {
        await this.educationService.uploadDocument(edu.id, file).toPromise();
      }

      // Refresh education data to get updated documents
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