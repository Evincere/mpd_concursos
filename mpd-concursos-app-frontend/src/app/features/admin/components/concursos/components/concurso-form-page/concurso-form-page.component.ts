import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Servicios
import { AdminConcursosService, ConcursoCreateRequest } from '@core/services/admin/admin-concursos.service';
import { NotificationService } from '@shared/services/notification.service';

// Interfaces
import { Concurso, ContestStatus } from '@shared/interfaces/concurso/concurso.interface';

// Componentes
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomSelectComponent } from '@shared/components/custom-form/custom-select/custom-select.component';
import { CustomDatepickerComponent } from '@shared/components/custom-form/custom-datepicker/custom-datepicker.component';
import { CustomTextareaComponent } from '@shared/components/custom-form/custom-textarea/custom-textarea.component';
import { CustomSpinnerComponent } from '@shared/components/custom-form/custom-spinner/custom-spinner.component';
import { CustomTabsComponent } from '@shared/components/custom-form/custom-tabs/custom-tabs.component';
import { CustomTabComponent } from '@shared/components/custom-form/custom-tabs/custom-tab.component';

@Component({
  selector: 'app-concurso-form-page',
  templateUrl: './concurso-form-page.component.html',
  styleUrls: ['./concurso-form-page.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomButtonComponent,
    CustomCardComponent,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomDatepickerComponent,
    CustomTextareaComponent,
    CustomSpinnerComponent,
    CustomTabsComponent,
    CustomTabComponent
  ]
})
export class ConcursoFormPageComponent implements OnInit, OnDestroy {
  concursoForm: FormGroup;
  isLoading = false;
  isSubmitting = false;

  // Opciones para los selects
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
    private router: Router,
    private concursosService: AdminConcursosService,
    private notificationService: NotificationService
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
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFilterOptions(): void {
    this.isLoading = true;

    // Cargar opciones de departamentos
    this.departmentOptions = [
      { value: 'INFORMATICA', label: 'Informática' },
      { value: 'RECURSOS_HUMANOS', label: 'Recursos Humanos' },
      { value: 'CONTADURIA', label: 'Contaduría' },
      { value: 'LEGAL', label: 'Legal' },
      { value: 'ADMINISTRACION', label: 'Administración' }
    ];

    // Cargar opciones de categorías
    this.categoryOptions = [
      { value: 'PROFESIONAL', label: 'Profesional' },
      { value: 'TECNICO', label: 'Técnico' },
      { value: 'ADMINISTRATIVO', label: 'Administrativo' },
      { value: 'OPERATIVO', label: 'Operativo' }
    ];

    this.isLoading = false;
  }

  onSubmit(): void {
    if (this.concursoForm.valid && !this.isSubmitting) {
      this.createConcurso();
    } else {
      this.markFormGroupTouched();
    }
  }

  createConcurso(): void {
    this.isSubmitting = true;
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
        next: (concurso: Concurso) => {
          this.notificationService.mostrarExito('Concurso creado correctamente');
          this.router.navigate(['/admin/concursos/detalle', concurso.id]);
        },
        error: (error) => {
          console.error('Error creando concurso:', error);
          this.notificationService.mostrarError('Error al crear el concurso');
          this.isSubmitting = false;
        }
      });
  }

  onCancel(): void {
    this.router.navigate(['/admin/concursos/listado']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.concursoForm.controls).forEach(key => {
      const control = this.concursoForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  // Métodos de validación para el template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.concursoForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.concursoForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
    }
    return '';
  }
}
