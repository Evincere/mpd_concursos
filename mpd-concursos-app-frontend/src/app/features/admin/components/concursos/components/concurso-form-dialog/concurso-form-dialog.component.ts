import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { AdminConcursosService, ConcursoCreateRequest, ConcursoUpdateRequest } from '../../../../../../core/services/admin/admin-concursos.service';
import { Concurso, ContestStatus } from '@shared/interfaces/concurso/concurso.interface';
import { NotificationService } from '@shared/services/notification.service';

// Componentes personalizados
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomSelectComponent } from '@shared/components/custom-form/custom-select/custom-select.component';
import { CustomDatepickerComponent } from '@shared/components/custom-form/custom-datepicker/custom-datepicker.component';
import { CustomTabsComponent } from '@shared/components/custom-form/custom-tabs/custom-tabs.component';
import { CustomTabComponent } from '@shared/components/custom-form/custom-tabs/custom-tab.component';
import { CustomSpinnerComponent } from '@shared/components/custom-form/custom-spinner/custom-spinner.component';
import { CustomTextareaComponent } from '@shared/components/custom-form/custom-textarea/custom-textarea.component';

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
  isLoading = false;
  isSubmitting = false;

  // Propiedades para el modo de edición
  get isEditMode(): boolean {
    return this.data.mode === 'edit';
  }

  // Opciones para los selects
  departmentOptions: { value: string, label: string }[] = [];
  categoryOptions: { value: string, label: string }[] = [];

  statusOptions: { value: ContestStatus, label: string }[] = [
    { value: 'DRAFT', label: 'Borrador' },
    { value: 'ACTIVE', label: 'Activo' },
    { value: 'IN_PROGRESS', label: 'En Proceso' },
    { value: 'CLOSED', label: 'Cerrado' },
    { value: 'CANCELLED', label: 'Cancelado' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private concursosService: AdminConcursosService,
    private notificationService: NotificationService,
    public dialogRef: MatDialogRef<ConcursoFormDialogComponent, Concurso>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.concursoForm = this.fb.group({
      title: ['', [Validators.required]],
      description: [''],
      position: ['', [Validators.required]],
      category: ['', [Validators.required]],
      class: [''],
      functions: [''],
      department: ['', [Validators.required]],
      dependencia: ['', [Validators.required]],
      status: ['DRAFT', [Validators.required]],
      startDate: [null, [Validators.required]],
      endDate: [null, [Validators.required]],
      termsUrl: [''],
      profileUrl: ['']
    });
  }

  ngOnInit(): void {
    this.loadFilterOptions();

    if (this.data.mode === 'edit' && this.data.concurso) {
      this.loadConcursoData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFilterOptions(): void {
    this.isLoading = true;

    this.concursosService.getDepartments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (departments) => {
          this.departmentOptions = departments.map(dept => ({ value: dept, label: dept }));
        },
        error: (error) => {
          console.error('Error cargando departamentos:', error);
          this.notificationService.mostrarError('Error cargando opciones de departamentos');
        }
      });

    this.concursosService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categoryOptions = categories.map(cat => ({ value: cat, label: cat }));
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando categorías:', error);
          this.notificationService.mostrarError('Error cargando opciones de categorías');
          this.isLoading = false;
        }
      });
  }

  loadConcursoData(): void {
    if (!this.data.concurso) return;

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
      startDate: concurso.startDate ? new Date(concurso.startDate) : null,
      endDate: concurso.endDate ? new Date(concurso.endDate) : null,
      termsUrl: concurso.termsUrl,
      profileUrl: concurso.profileUrl
    });
  }

  onSubmit(): void {
    if (this.concursoForm.invalid) {
      this.markFormGroupTouched(this.concursoForm);
      this.notificationService.mostrarError('Por favor complete todos los campos requeridos');
      return;
    }

    this.isSubmitting = true;
    this.isLoading = true;

    if (this.isEditMode) {
      this.updateConcurso();
    } else {
      this.createConcurso();
    }
  }

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
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      termsUrl: formValue.termsUrl,
      profileUrl: formValue.profileUrl
    };

    this.concursosService.createConcurso(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.isSubmitting = false;
          this.notificationService.mostrarExito('Concurso creado correctamente');
          this.dialogRef.close(response);
        },
        error: (error) => {
          console.error('Error creando concurso:', error);
          this.notificationService.mostrarError('Error al crear el concurso');
          this.isLoading = false;
          this.isSubmitting = false;
        }
      });
  }

  updateConcurso(): void {
    if (!this.data.concurso) return;

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
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      termsUrl: formValue.termsUrl,
      profileUrl: formValue.profileUrl
    };

    this.concursosService.updateConcurso(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.isSubmitting = false;
          this.notificationService.mostrarExito('Concurso actualizado correctamente');
          this.dialogRef.close(response);
        },
        error: (error) => {
          console.error('Error actualizando concurso:', error);
          this.notificationService.mostrarError('Error al actualizar el concurso');
          this.isLoading = false;
          this.isSubmitting = false;
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getErrorMessage(controlName: string): string {
    const control = this.concursoForm.get(controlName);

    if (!control) return '';

    if (control.hasError('required')) {
      return 'Este campo es requerido';
    }

    return '';
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if ((control as FormGroup).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }
}
