import { Component, OnInit, OnDestroy, Inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl } from '@angular/forms'; // Import ValidatorFn, AbstractControl
import { Subject, forkJoin } from 'rxjs'; // Import forkJoin
import { takeUntil, finalize, tap } from 'rxjs/operators'; // Import finalize, tap

import { AdminConcursosService, ConcursoCreateRequest, ConcursoUpdateRequest } from '../../../../../../core/services/admin/admin-concursos.service';
import { Concurso, ContestStatus } from '@shared/interfaces/concurso/concurso.interface';
import { NotificationService } from '@shared/services/notification.service';
import { UnifiedDialogRef, DIALOG_DATA } from '@shared/services/dialog/unified-dialog.service';
import { LoggingService } from '../../../../../../core/services/logging/logging.service'; // Import LoggingService

// Custom Components
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomSelectComponent } from '@shared/components/custom-form/custom-select/custom-select.component';
import { CustomDatepickerComponent } from '@shared/components/custom-form/custom-datepicker/custom-datepicker.component';
import { CustomTabsComponent } from '@shared/components/custom-form/custom-tabs/custom-tabs.component';
import { CustomTabComponent } from '@shared/components/custom-form/custom-tabs/custom-tab.component';
import { CustomSpinnerComponent } from '@shared/components/custom-form/custom-spinner/custom-spinner.component';
import { CustomTextareaComponent } from '@shared/components/custom-form/custom-textarea/custom-textarea.component';

/**
 * Custom validator to check if startDate is not after endDate.
 */
const dateRangeValidator: ValidatorFn = (control: AbstractControl): { [key: string]: any } | null => {
  const startDate = control.get('startDate')?.value;
  const endDate = control.get('endDate')?.value;

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    return { dateRangeInvalid: true };
  }
  return null;
};


interface DialogData {
  mode: 'create' | 'edit';
  concurso?: Concurso;
}

@Component({
  selector: 'app-concurso-form-dialog',
  templateUrl: './concurso-form-dialog.component.html',
  styleUrls: ['./concurso-form-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CustomButtonComponent,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomDatepickerComponent,
    CustomTabsComponent,
    CustomTabComponent,
    CustomSpinnerComponent,
    CustomTextareaComponent
  ]
})
export class ConcursoFormDialogComponent implements OnInit, OnDestroy {
  concursoForm: FormGroup;
  isLoading = false; // For initial data loading
  isSubmitting = false; // For form submission

  // Property for edit mode
  get isEditMode(): boolean {
    return this.data.mode === 'edit';
  }

  // Options for selects
  departmentOptions: { value: string, label: string }[] = [];
  categoryOptions: { value: string, label: string }[] = [];

  statusOptions: { value: ContestStatus, label: string }[] = [
    { value: 'DRAFT', label: 'Borrador' },
    { value: 'SCHEDULED', label: 'Programado' },
    { value: 'ACTIVE', label: 'Activo' },
    { value: 'CLOSED', label: 'Cerrado' },
    { value: 'IN_EVALUATION', label: 'En Evaluación' },
    { value: 'CANCELLED', label: 'Cancelado' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private concursosService: AdminConcursosService,
    private notificationService: NotificationService,
    public dialogRef: UnifiedDialogRef<Concurso>, // Public so it can be accessed in template
    @Inject(DIALOG_DATA) public data: DialogData,
    private loggingService: LoggingService // Inject LoggingService
  ) {
    this.loggingService.debug('[ConcursoFormDialogComponent] Constructor: Initializing contest form.', undefined, 'ConcursoFormDialog');
    this.concursoForm = this.fb.group({
      title: ['', [Validators.required]],
      description: [''],
      position: ['', [Validators.required]],
      category: ['', [Validators.required]],
      class: [''],
      functions: [''],
      department: ['', [Validators.required]],
      dependencia: ['', [Validators.required]], // Assuming 'dependencia' is an actual field
      status: ['DRAFT', [Validators.required]],
      startDate: [null, [Validators.required]],
      endDate: [null, [Validators.required]],
      termsUrl: [''],
      profileUrl: ['']
    }, { validators: dateRangeValidator }); // Apply custom validator at form group level
  }

  ngOnInit(): void {
    this.loggingService.info('[ConcursoFormDialogComponent] OnInit: Component initialized.', undefined, 'ConcursoFormDialog');
    this.loadFilterOptions();

    if (this.data.mode === 'edit' && this.data.concurso) {
      this.loggingService.debug('[ConcursoFormDialogComponent] Edit mode detected. Loading contest data.', this.data.concurso, 'ConcursoFormDialog');
      this.loadConcursoData();
    } else {
      this.loggingService.debug('[ConcursoFormDialogComponent] Create mode detected. Form ready for new contest.', undefined, 'ConcursoFormDialog');
    }
  }

  ngOnDestroy(): void {
    this.loggingService.info('[ConcursoFormDialogComponent] OnDestroy: Component destroyed. Unsubscribing from observables.', undefined, 'ConcursoFormDialog');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Loads options for department and category selects.
   */
  loadFilterOptions(): void {
    this.isLoading = true;
    this.loggingService.info('[ConcursoFormDialogComponent] Loading filter options (departments and categories).', undefined, 'ConcursoFormDialog');

    forkJoin([
      this.concursosService.getDepartments().pipe(
        tap(departments => {
          this.departmentOptions = departments.map(dept => ({ value: dept, label: dept }));
          this.loggingService.debug('[ConcursoFormDialogComponent] Departments loaded:', departments, 'ConcursoFormDialog');
        })
      ),
      this.concursosService.getCategories().pipe(
        tap(categories => {
          this.categoryOptions = categories.map(cat => ({ value: cat, label: cat }));
          this.loggingService.debug('[ConcursoFormDialogComponent] Categories loaded:', categories, 'ConcursoFormDialog');
        })
      )
    ]).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false) // Ensure isLoading is false once all calls complete
    ).subscribe({
      next: () => {
        this.loggingService.info('[ConcursoFormDialogComponent] All filter options loaded successfully.', undefined, 'ConcursoFormDialog');
      },
      error: (error) => {
        this.loggingService.error('[ConcursoFormDialogComponent] Error loading filter options:', error, 'ConcursoFormDialog');
        this.notificationService.error('Error cargando algunas opciones de formulario. Por favor, intente de nuevo.');
        // Optionally set default options if API call fails entirely
      }
    });
  }

  /**
   * Populates the form with existing contest data in edit mode.
   */
  loadConcursoData(): void {
    if (!this.data.concurso) {
      this.loggingService.warn('[ConcursoFormDialogComponent] loadConcursoData called but no concurso data provided.', undefined, 'ConcursoFormDialog');
      return;
    }

    const concurso = this.data.concurso;
    this.concursoForm.patchValue({
      title: concurso.title,
      description: concurso.description,
      position: concurso.position,
      category: concurso.category,
      class: concurso.class,
      functions: concurso.functions,
      department: concurso.department,
      dependencia: concurso.dependencia,
      status: concurso.status,
      // Convert date strings to Date objects for datepickers
      startDate: concurso.startDate ? new Date(concurso.startDate) : null,
      endDate: concurso.endDate ? new Date(concurso.endDate) : null,
      termsUrl: concurso.termsUrl,
      profileUrl: concurso.profileUrl
    });
    this.loggingService.debug('[ConcursoFormDialogComponent] Contest data patched to form.', this.concursoForm.value, 'ConcursoFormDialog');
  }

  /**
   * Handles form submission for creating or updating a contest.
   */
  onSubmit(): void {
    this.concursoForm.markAllAsTouched(); // Mark all controls as touched to show validation errors
    if (this.concursoForm.invalid) {
      this.loggingService.warn('[ConcursoFormDialogComponent] Form is invalid on submission. Showing error notification.', this.concursoForm.errors, 'ConcursoFormDialog');
      this.notificationService.error('Por favor complete todos los campos requeridos y corrija los errores.');
      return;
    }

    this.isSubmitting = true;
    this.isLoading = true; // Use isLoading during submission as well
    this.loggingService.info('[ConcursoFormDialogComponent] Submitting contest form.', this.concursoForm.value, 'ConcursoFormDialog');

    if (this.isEditMode) {
      this.updateConcurso();
    } else {
      this.createConcurso();
    }
  }

  /**
   * Creates a new contest.
   */
  createConcurso(): void {
    const formValue = this.concursoForm.value;

    const request: ConcursoCreateRequest = {
      title: formValue.title,
      description: formValue.description,
      position: formValue.position,
      category: formValue.category,
      class: formValue.class,
      functions: formValue.functions,
      department: formValue.department,
      dependencia: formValue.dependencia,
      status: formValue.status,
      // Ensure dates are sent as ISO strings if backend expects them that way
      startDate: formValue.startDate ? new Date(formValue.startDate).toISOString() : '',
      endDate: formValue.endDate ? new Date(formValue.endDate).toISOString() : '',
      termsUrl: formValue.termsUrl,
      profileUrl: formValue.profileUrl
    };

    this.loggingService.debug('[ConcursoFormDialogComponent] Sending create contest request:', request, 'ConcursoFormDialog');
    this.concursosService.createConcurso(request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { // Ensure submitting and loading states are reset
          this.isLoading = false;
          this.isSubmitting = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.notificationService.success('Concurso creado correctamente');
          this.loggingService.info('[ConcursoFormDialogComponent] Contest created successfully.', response, 'ConcursoFormDialog');
          this.dialogRef.close(response); // Close dialog with the new contest data
        },
        error: (error) => {
          this.loggingService.error('[ConcursoFormDialogComponent] Error creating contest:', error, 'ConcursoFormDialog');
          this.notificationService.error('Error al crear el concurso. Por favor, intente de nuevo.');
        }
      });
  }

  /**
   * Updates an existing contest.
   */
  updateConcurso(): void {
    if (!this.data.concurso?.id) {
      this.loggingService.warn('[ConcursoFormDialogComponent] Attempted to update contest without contest ID.', undefined, 'ConcursoFormDialog');
      this.notificationService.error('Error: No se pudo actualizar el concurso sin un ID válido.');
      this.isLoading = false;
      this.isSubmitting = false;
      return;
    }

    const formValue = this.concursoForm.value;

    const request: ConcursoUpdateRequest = {
      id: this.data.concurso.id,
      title: formValue.title,
      description: formValue.description,
      position: formValue.position,
      category: formValue.category,
      class: formValue.class,
      functions: formValue.functions,
      department: formValue.department,
      dependencia: formValue.dependencia,
      status: formValue.status,
      // Ensure dates are sent as ISO strings if backend expects them that way
      startDate: formValue.startDate ? new Date(formValue.startDate).toISOString() : '',
      endDate: formValue.endDate ? new Date(formValue.endDate).toISOString() : '',
      termsUrl: formValue.termsUrl,
      profileUrl: formValue.profileUrl
    };

    this.loggingService.debug(`[ConcursoFormDialogComponent] Sending update contest request for ID ${request.id}:`, request, 'ConcursoFormDialog');
    this.concursosService.updateConcurso(request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { // Ensure submitting and loading states are reset
          this.isLoading = false;
          this.isSubmitting = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.notificationService.success('Concurso actualizado correctamente');
          this.loggingService.info('[ConcursoFormDialogComponent] Contest updated successfully.', response, 'ConcursoFormDialog');
          this.dialogRef.close(response); // Close dialog with the updated contest data
        },
        error: (error) => {
          this.loggingService.error('[ConcursoFormDialogComponent] Error updating contest:', error, 'ConcursoFormDialog');
          this.notificationService.error('Error al actualizar el concurso. Por favor, intente de nuevo.');
        }
      });
  }

  /**
   * Handles the cancel action, closing the dialog without a result (or with false).
   */
  onCancel(): void {
    this.loggingService.info('[ConcursoFormDialogComponent] Cancel button clicked. Closing dialog.', undefined, 'ConcursoFormDialog');
    this.dialogRef.close(); // Close dialog without result to indicate cancellation
  }

  /**
   * Gets error messages for specific form controls based on validation rules.
   * @param controlName The name of the form control.
   * @returns The error message string, or an empty string if no error.
   */
  getErrorMessage(controlName: string): string {
    const control = this.concursoForm.get(controlName);

    if (!control) return '';

    // Only show errors if the control has been touched and has errors
    if (control.invalid && (control.touched || control.dirty)) {
      if (control.hasError('required')) {
        return 'Este campo es requerido';
      }
      if (control.hasError('dateRangeInvalid')) {
        return 'La fecha de inicio no puede ser posterior a la fecha de fin';
      }
      // Add more specific error messages for other validators if needed
    }
    return '';
  }

  /**
   * Recursively marks all controls in a FormGroup as touched.
   * Useful for displaying validation errors on submission without user interaction.
   * @param formGroup The FormGroup to mark as touched.
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    this.loggingService.debug('[ConcursoFormDialogComponent] Marking form group as touched.', undefined, 'ConcursoFormDialog');
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if ((control as FormGroup).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }
}
