import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, timeout, catchError, finalize, tap } from 'rxjs/operators'; // Added finalize and tap

// Custom Components
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomSelectComponent } from '@shared/components/custom-form/custom-select/custom-select.component';
import { CustomCheckboxComponent } from '@shared/components/custom-form/custom-checkbox/custom-checkbox.component';
import { CustomSpinnerComponent } from '@shared/components/custom-form/custom-spinner/custom-spinner.component';
import { CustomTextareaComponent } from '@shared/components/custom-form/custom-textarea/custom-textarea.component';

// Services
import { DialogService } from '@shared/services/dialog/dialog.service';
import { NotificationService } from '@shared/services/notification.service';
import { LoggingService } from '../../../../../../core/services/logging/logging.service'; // Import LoggingService

import { AdminContestRequirementsService, ContestRequirement, ContestRequirementCreateRequest, ContestRequirementUpdateRequest, RequirementTemplate } from '../../../../../../core/services/admin/admin-contest-requirements.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component'; // Ensure ConfirmDialogComponent is standalone or imported correctly

@Component({
  selector: 'app-concurso-requisitos',
  templateUrl: './concurso-requisitos.component.html',
  styleUrls: ['./concurso-requisitos.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CustomButtonComponent,
    CustomCardComponent,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomCheckboxComponent,
    CustomSpinnerComponent,
    CustomTextareaComponent,
    DragDropModule,
    ConfirmDialogComponent // Make sure it's here if used
  ]
})
export class ConcursoRequisitosComponent implements OnInit, OnDestroy {
  @Input() contestId!: number | string;
  @Input() requisitos: ContestRequirement[] = [];
  @Output() requisitosUpdated = new EventEmitter<void>();

  requirementForm: FormGroup;
  isLoading = false;
  isEditing = false;
  editingRequirementId: number | string | null = null;

  categories: string[] = [];
  documentTypes: string[] = [];
  templates: RequirementTemplate[] = [];

  categoryOptions: { label: string, value: string }[] = [];
  documentTypeOptions: { label: string, value: string }[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private requisitosService: AdminContestRequirementsService,
    private dialogService: DialogService,
    private notificationService: NotificationService,
    private loggingService: LoggingService // Inject LoggingService
  ) {
    this.loggingService.debug('[ConcursoRequisitosComponent] Constructor: Initializing requirement form.', undefined, 'ContestRequirements');
    this.requirementForm = this.fb.group({
      description: ['', [Validators.required]],
      category: ['', [Validators.required]],
      required: [true], // Default to true
      priority: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
      documentType: [''] // Optional
    });
  }

  ngOnInit(): void {
    this.loggingService.info('[ConcursoRequisitosComponent] OnInit: Component initialized.', undefined, 'ContestRequirements');
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.loggingService.info('[ConcursoRequisitosComponent] OnDestroy: Component destroyed. Cleaning up subscriptions.', undefined, 'ContestRequirements');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Loads initial data for the form (categories, document types, templates).
   * Includes timeouts and fallback mock data for resilience.
   */
  private loadInitialData(): void {
    this.isLoading = true;
    this.loggingService.info('[ConcursoRequisitosComponent] Loading initial data for requirements form.', undefined, 'ContestRequirements');

    // Load data in parallel with timeouts and fallbacks
    forkJoin({
      categories: this.requisitosService.getRequirementCategories().pipe(
        timeout(10000), // 10 seconds timeout
        tap(data => this.loggingService.debug('[ConcursoRequisitosComponent] Categories loaded:', data, 'ContestRequirements')),
        catchError(error => {
          this.loggingService.error('[ConcursoRequisitosComponent] Error loading categories. Using fallback data.', error, 'ContestRequirements');
          return of(['EDUCACION', 'PROFESIONAL', 'ANTECEDENTES', 'EXPERIENCIA', 'CONOCIMIENTOS', 'CAPACITACION', 'CERTIFICACIONES']);
        })
      ),
      documentTypes: this.requisitosService.getDocumentTypes().pipe(
        timeout(10000), // 10 seconds timeout
        tap(data => this.loggingService.debug('[ConcursoRequisitosComponent] Document Types loaded:', data, 'ContestRequirements')),
        catchError(error => {
          this.loggingService.error('[ConcursoRequisitosComponent] Error loading document types. Using fallback data.', error, 'ContestRequirements');
          return of(['titulo-universitario', 'certificado-profesional', 'antecedentes-penales', 'certificado-ley-micaela', 'dni-frente', 'dni-dorso', 'cuil', 'curriculum-vitae']);
        })
      ),
      templates: this.requisitosService.getRequirementTemplates().pipe(
        timeout(10000), // 10 seconds timeout
        tap(data => this.loggingService.debug('[ConcursoRequisitosComponent] Templates loaded:', data, 'ContestRequirements')),
        catchError(error => {
          this.loggingService.error('[ConcursoRequisitosComponent] Error loading templates. Using empty array.', error, 'ContestRequirements');
          return of([]); // Return empty array on error for templates
        })
      )
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.isLoading = false; // Always set loading to false when all observables complete
        this.loggingService.info('[ConcursoRequisitosComponent] Initial data loading process finalized.', undefined, 'ContestRequirements');
      }),
      catchError((error) => {
        // This outer catchError catches errors from the forkJoin itself (e.g., if a timeout was not handled by inner catchError)
        this.loggingService.error('[ConcursoRequisitosComponent] Unexpected error during initial data loading. Setting default data.', error, 'ContestRequirements');
        this.notificationService.error('Error al cargar datos iniciales. Algunas opciones podrían no estar disponibles.');
        // Ensure default data is set even if a critical error occurs
        return of({
          categories: ['EDUCACION', 'PROFESIONAL', 'ANTECEDENTES', 'EXPERIENCIA', 'CONOCIMIENTOS', 'CAPACITACION', 'CERTIFICACIONES'],
          documentTypes: ['titulo-universitario', 'certificado-profesional', 'antecedentes-penales', 'certificado-ley-micaela', 'dni-frente', 'dni-dorso', 'cuil', 'curriculum-vitae'],
          templates: []
        });
      })
    )
    .subscribe({
      next: (data) => {
        this.categories = data.categories;
        this.categoryOptions = data.categories.map(category => ({
          label: this.getCategoryLabel(category),
          value: category
        }));
        this.loggingService.debug('[ConcursoRequisitosComponent] Category options populated.', this.categoryOptions, 'ContestRequirements');

        this.documentTypes = data.documentTypes;
        this.documentTypeOptions = [
          { label: 'Ninguno', value: '' }, // Option for no specific document type
          ...data.documentTypes.map(type => ({
            label: this.getDocumentTypeLabel(type),
            value: type
          }))
        ];
        this.loggingService.debug('[ConcursoRequisitosComponent] Document Type options populated.', this.documentTypeOptions, 'ContestRequirements');

        this.templates = data.templates;
        this.loggingService.debug('[ConcursoRequisitosComponent] Templates loaded.', this.templates, 'ContestRequirements');
      },
      error: (error) => {
        // This error block should typically not be hit if inner catchError handles,
        // but included for robustness against unhandled RxJS errors.
        this.loggingService.error('[ConcursoRequisitosComponent] Final subscription error in loadInitialData:', error, 'ContestRequirements');
      }
    });
  }

  /**
   * Handles form submission for creating or updating a requirement.
   */
  onSubmit(): void {
    this.requirementForm.markAllAsTouched(); // Mark all controls as touched to show validation errors
    if (this.requirementForm.invalid) {
      this.notificationService.error('Por favor complete todos los campos requeridos y corrija los errores.');
      this.loggingService.warn('[ConcursoRequisitosComponent] Form is invalid on submission. Showing error notification.', this.requirementForm.errors, 'ContestRequirements');
      return;
    }

    this.isLoading = true;
    this.loggingService.info('[ConcursoRequisitosComponent] Submitting requirement form.', this.requirementForm.value, 'ContestRequirements');

    if (this.isEditing && this.editingRequirementId) {
      this.updateRequirement();
    } else {
      this.createRequirement();
    }
  }

  /**
   * Creates a new contest requirement.
   */
  createRequirement(): void {
    const formValue = this.requirementForm.value;

    const request: ContestRequirementCreateRequest = {
      contestId: this.contestId,
      description: formValue.description,
      category: formValue.category,
      required: formValue.required,
      priority: formValue.priority,
      documentType: formValue.documentType || null // Send null if empty string
    };

    this.loggingService.debug('[ConcursoRequisitosComponent] Creating new requirement with request:', request, 'ContestRequirements');
    this.requisitosService.createRequirement(request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false) // Ensure loading is turned off
      )
      .subscribe({
        next: (response) => {
          this.resetForm();
          this.requisitosUpdated.emit(); // Notify parent component to reload requirements
          this.notificationService.success('Requisito creado correctamente');
          this.loggingService.info('[ConcursoRequisitosComponent] Requirement created successfully.', response, 'ContestRequirements');
        },
        error: (error) => {
          this.loggingService.error('[ConcursoRequisitosComponent] Error creating requirement:', error, 'ContestRequirements');
          this.notificationService.error('Error al crear el requisito. Por favor, intente de nuevo.');
        }
      });
  }

  /**
   * Updates an existing contest requirement.
   */
  updateRequirement(): void {
    if (!this.editingRequirementId) {
      this.loggingService.warn('[ConcursoRequisitosComponent] Attempted to update requirement without editingRequirementId.', undefined, 'ContestRequirements');
      this.notificationService.error('Error: No se pudo actualizar el requisito sin un ID válido.');
      this.isLoading = false;
      return;
    }

    const formValue = this.requirementForm.value;

    const request: ContestRequirementUpdateRequest = {
      id: this.editingRequirementId,
      contestId: this.contestId,
      description: formValue.description,
      category: formValue.category,
      required: formValue.required,
      priority: formValue.priority,
      documentType: formValue.documentType || null // Send null if empty string
    };

    this.loggingService.debug(`[ConcursoRequisitosComponent] Updating requirement with ID ${this.editingRequirementId}:`, request, 'ContestRequirements');
    this.requisitosService.updateRequirement(request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          this.resetForm();
          this.requisitosUpdated.emit(); // Notify parent component to reload requirements
          this.notificationService.success('Requisito actualizado correctamente');
          this.loggingService.info('[ConcursoRequisitosComponent] Requirement updated successfully.', response, 'ContestRequirements');
        },
        error: (error) => {
          this.loggingService.error('[ConcursoRequisitosComponent] Error updating requirement:', error, 'ContestRequirements');
          this.notificationService.error('Error al actualizar el requisito. Por favor, intente de nuevo.');
        }
      });
  }

  /**
   * Populates the form with existing requirement data for editing.
   * @param requirement The requirement to edit.
   */
  editRequirement(requirement: ContestRequirement): void {
    this.loggingService.info('[ConcursoRequisitosComponent] Editing requirement:', requirement, 'ContestRequirements');
    this.isEditing = true;
    this.editingRequirementId = requirement.id;

    this.requirementForm.patchValue({
      description: requirement.description,
      category: requirement.category,
      required: requirement.required,
      priority: requirement.priority,
      documentType: requirement.documentType || '' // Ensure empty string for select
    });
    this.loggingService.debug('[ConcursoRequisitosComponent] Form patched for editing.', this.requirementForm.value, 'ContestRequirements');
  }

  /**
   * Deletes a contest requirement after user confirmation.
   * @param requirement The requirement to delete.
   */
  deleteRequirement(requirement: ContestRequirement): void {
    this.loggingService.info('[ConcursoRequisitosComponent] Attempting to delete requirement:', requirement, 'ContestRequirements');
    this.dialogService.confirm({
      title: 'Eliminar Requisito',
      message: `¿Está seguro que desea eliminar el requisito "${requirement.description}"? Esta acción es irreversible.`,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'warn',
      size: 'small'
    }).afterClosed$.subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.loggingService.debug(`[ConcursoRequisitosComponent] User confirmed deletion for requirement ID: ${requirement.id}.`, undefined, 'ContestRequirements');
        this.requisitosService.deleteRequirement(this.contestId, requirement.id)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => this.isLoading = false)
          )
          .subscribe({
            next: () => {
              this.requisitosUpdated.emit(); // Notify parent component to reload
              this.notificationService.success('Requisito eliminado correctamente');
              this.loggingService.info(`[ConcursoRequisitosComponent] Requirement ID: ${requirement.id} deleted successfully.`, undefined, 'ContestRequirements');
            },
            error: (error) => {
              this.loggingService.error('[ConcursoRequisitosComponent] Error deleting requirement:', error, 'ContestRequirements');
              this.notificationService.error('Error al eliminar el requisito. Por favor, intente de nuevo.');
            }
          });
      } else {
        this.loggingService.debug('[ConcursoRequisitosComponent] Requirement deletion cancelled by user.', undefined, 'ContestRequirements');
      }
    });
  }

  /**
   * Applies a requirement template to the current contest after user confirmation.
   * @param templateId The ID of the template to apply.
   */
  applyTemplate(templateId: number | string): void {
    this.loggingService.info(`[ConcursoRequisitosComponent] Attempting to apply template ID: ${templateId}.`, undefined, 'ContestRequirements');
    this.dialogService.confirm({
      title: 'Aplicar Plantilla',
      message: '¿Está seguro que desea aplicar esta plantilla? Los requisitos existentes no se eliminarán, pero pueden quedar duplicados.',
      confirmButtonText: 'Aplicar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'primary',
      size: 'medium'
    }).afterClosed$.subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.loggingService.debug(`[ConcursoRequisitosComponent] User confirmed applying template ID: ${templateId}.`, undefined, 'ContestRequirements');
        this.requisitosService.applyTemplate(this.contestId, templateId)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => this.isLoading = false)
          )
          .subscribe({
            next: () => {
              this.requisitosUpdated.emit(); // Notify parent component to reload requirements
              this.notificationService.success('Plantilla aplicada correctamente');
              this.loggingService.info(`[ConcursoRequisitosComponent] Template ID: ${templateId} applied successfully.`, undefined, 'ContestRequirements');
            },
            error: (error) => {
              this.loggingService.error('[ConcursoRequisitosComponent] Error applying template:', error, 'ContestRequirements');
              this.notificationService.error('Error al aplicar la plantilla. Por favor, intente de nuevo.');
            }
          });
      } else {
        this.loggingService.debug('[ConcursoRequisitosComponent] Template application cancelled by user.', undefined, 'ContestRequirements');
      }
    });
  }

  /**
   * Cancels the current editing session and resets the form.
   */
  cancelEdit(): void {
    this.loggingService.info('[ConcursoRequisitosComponent] Cancelling edit and resetting form.', undefined, 'ContestRequirements');
    this.resetForm();
  }

  /**
   * Resets the requirement form to its default state.
   */
  resetForm(): void {
    this.loggingService.debug('[ConcursoRequisitosComponent] Resetting requirement form.', undefined, 'ContestRequirements');
    this.requirementForm.reset({
      description: '',
      category: '',
      required: true,
      priority: 1,
      documentType: ''
    });
    this.isEditing = false;
    this.editingRequirementId = null;
    this.loggingService.debug('[ConcursoRequisitosComponent] Requirement form reset to default values.', this.requirementForm.value, 'ContestRequirements');
  }

  /**
   * Gets the human-readable label for a requirement category.
   * @param category The category string.
   * @returns The formatted label.
   */
  getCategoryLabel(category: string): string {
    switch (category) {
      case 'EDUCACION': return 'Educación';
      case 'PROFESIONAL': return 'Profesional';
      case 'ANTECEDENTES': return 'Antecedentes';
      case 'EXPERIENCIA': return 'Experiencia';
      case 'CONOCIMIENTOS': return 'Conocimientos';
      case 'CAPACITACION': return 'Capacitación';
      case 'CERTIFICACIONES': return 'Certificaciones';
      case 'IDIOMAS': return 'Idiomas';
      case 'INFORMATICA': return 'Informática';
      case 'OTRO': return 'Otro';
      default: return category;
    }
  }

  /**
   * Gets the human-readable label for a document type.
   * @param type The document type string.
   * @returns The formatted label.
   */
  getDocumentTypeLabel(type: string): string {
    switch (type) {
      case 'titulo-universitario': return 'Título Universitario';
      case 'certificado-profesional': return 'Certificado Profesional';
      case 'antecedentes-penales': return 'Antecedentes Penales';
      case 'certificado-ley-micaela': return 'Certificado Ley Micaela';
      case 'dni-frente': return 'DNI Frente';
      case 'dni-dorso': return 'DNI Dorso';
      case 'cuil': return 'CUIL';
      case 'curriculum-vitae': return 'Curriculum Vitae';
      case 'OTRO': return 'Otro';
      default: return type;
    }
  }

  /**
   * Groups requirements by category for display.
   * @returns An array of objects, each containing a category and its requirements.
   */
  getRequisitosByCategory(): { category: string, requirements: ContestRequirement[] }[] {
    const groupedRequisitos: Record<string, ContestRequirement[]> = {};

    this.requisitos.forEach(requisito => {
      if (!groupedRequisitos[requisito.category]) {
        groupedRequisitos[requisito.category] = [];
      }
      groupedRequisitos[requisito.category].push(requisito);
    });

    return Object.keys(groupedRequisitos).map(category => ({
      category,
      requirements: groupedRequisitos[category].sort((a, b) => a.priority - b.priority)
    }));
  }

  /**
   * Handles the drag-and-drop event for reordering requirements.
   * Updates priorities and calls the backend for changes.
   * @param event The CdkDragDrop event.
   * @param requirements The array of requirements being reordered within a category.
   */
  drop(event: CdkDragDrop<ContestRequirement[]>, requirements: ContestRequirement[]): void {
    if (event.previousIndex === event.currentIndex) {
      this.loggingService.debug('[ConcursoRequisitosComponent] Drag drop: Item dropped at same position. No change.', undefined, 'ContestRequirements');
      return;
    }

    this.loggingService.info(`[ConcursoRequisitosComponent] Drag drop: Moving item from index ${event.previousIndex} to ${event.currentIndex}.`, undefined, 'ContestRequirements');
    moveItemInArray(requirements, event.previousIndex, event.currentIndex);

    // Update priorities and send changes to backend for affected items
    requirements.forEach((req, index) => {
      const newPriority = index + 1;
      if (req.priority !== newPriority) {
        this.loggingService.debug(`[ConcursoRequisitosComponent] Updating priority for requirement ${req.id} from ${req.priority} to ${newPriority}.`, undefined, 'ContestRequirements');
        this.updateRequirementPriority(req, newPriority);
      }
    });
    this.loggingService.debug('[ConcursoRequisitosComponent] Priorities updated locally after drag and drop.', undefined, 'ContestRequirements');
  }

  /**
   * Updates the priority of a single requirement in the backend.
   * @param requirement The requirement object.
   * @param newPriority The new priority for the requirement.
   */
  updateRequirementPriority(requirement: ContestRequirement, newPriority: number): void {
    const request: ContestRequirementUpdateRequest = {
      id: requirement.id,
      contestId: this.contestId,
      description: requirement.description, // Keep existing values
      category: requirement.category,
      required: requirement.required,
      priority: newPriority,
      documentType: requirement.documentType
    };

    this.loggingService.debug(`[ConcursoRequisitosComponent] Sending priority update for requirement ${requirement.id} to new priority: ${newPriority}.`, undefined, 'ContestRequirements');
    this.requisitosService.updateRequirement(request)
      .pipe(
        takeUntil(this.destroy$),
        // No finalize needed here as this is a background update, main isLoading should not be affected
      )
      .subscribe({
        next: () => {
          requirement.priority = newPriority; // Update locally after successful backend call
          this.notificationService.success(`Prioridad de requisito "${requirement.description}" actualizada.`);
          this.loggingService.info(`[ConcursoRequisitosComponent] Priority for requirement ${requirement.id} updated successfully to ${newPriority}.`, undefined, 'ContestRequirements');
        },
        error: (error: any) => {
          this.loggingService.error(`[ConcursoRequisitosComponent] Error updating priority for requirement ${requirement.id}:`, error, 'ContestRequirements');
          this.notificationService.error('Error al actualizar la prioridad del requisito.');
          // Optionally, revert local change if backend fails
          // this.requisitosUpdated.emit(); // Or re-fetch all to ensure sync
        }
      });
  }

  /**
   * Gets error messages for form fields based on validation rules.
   * @param fieldName The name of the form control.
   * @returns The error message string, or empty string if no error.
   */
  getErrorMessage(fieldName: string): string {
    const control = this.requirementForm.get(fieldName);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) {
        switch (fieldName) {
          case 'description': return 'La descripción es requerida.';
          case 'category': return 'La categoría es requerida.';
          case 'priority': return 'La prioridad es requerida.';
          default: return 'Este campo es requerido.';
        }
      }
      if (control.errors['min']) {
        const min = control.errors['min'].min;
        this.loggingService.debug(`[ConcursoRequisitosComponent] Validation error: ${fieldName} min value ${min} not met.`, control.errors, 'ContestRequirements');
        return `La prioridad debe ser al menos ${min}.`;
      }
      if (control.errors['max']) {
        const max = control.errors['max'].max;
        this.loggingService.debug(`[ConcursoRequisitosComponent] Validation error: ${fieldName} max value ${max} not met.`, control.errors, 'ContestRequirements');
        return `La prioridad debe ser como máximo ${max}.`;
      }
    }
    return '';
  }

  /**
   * Marks all controls in a FormGroup as touched.
   * Useful for triggering validation messages on submission.
   * @param formGroup The FormGroup to mark as touched.
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    this.loggingService.debug('[ConcursoRequisitosComponent] Marking form group as touched.', undefined, 'ContestRequirements');
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if ((control as FormGroup).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }
}
