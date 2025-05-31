import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, timeout, catchError } from 'rxjs/operators';

// Componentes personalizados
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomSelectComponent } from '@shared/components/custom-form/custom-select/custom-select.component';
import { CustomCheckboxComponent } from '@shared/components/custom-form/custom-checkbox/custom-checkbox.component';
import { CustomSpinnerComponent } from '@shared/components/custom-form/custom-spinner/custom-spinner.component';
import { CustomTextareaComponent } from '@shared/components/custom-form/custom-textarea/custom-textarea.component';

// Servicios
import { DialogService } from '@shared/services/dialog/dialog.service';
import { NotificationService } from '@shared/services/notification.service';

import { AdminContestRequirementsService, ContestRequirement, ContestRequirementCreateRequest, ContestRequirementUpdateRequest, RequirementTemplate } from '../../../../../../core/services/admin/admin-contest-requirements.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

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
    DragDropModule
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
    private notificationService: NotificationService
  ) {
    this.requirementForm = this.fb.group({
      description: ['', [Validators.required]],
      category: ['', [Validators.required]],
      required: [true],
      priority: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
      documentType: ['']
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.isLoading = true;

    // Cargar datos en paralelo con timeouts y fallbacks
    forkJoin({
      categories: this.requisitosService.getRequirementCategories().pipe(
        timeout(10000),
        catchError(() => of(['EDUCACION', 'PROFESIONAL', 'ANTECEDENTES', 'EXPERIENCIA', 'CONOCIMIENTOS', 'CAPACITACION', 'CERTIFICACIONES']))
      ),
      documentTypes: this.requisitosService.getDocumentTypes().pipe(
        timeout(10000),
        catchError(() => of(['titulo-universitario', 'certificado-profesional', 'antecedentes-penales', 'certificado-ley-micaela', 'dni-frente', 'dni-dorso', 'cuil', 'curriculum-vitae']))
      ),
      templates: this.requisitosService.getRequirementTemplates().pipe(
        timeout(10000),
        catchError(() => of([]))
      )
    }).pipe(
      takeUntil(this.destroy$),
      timeout(15000),
      catchError((error) => {
        console.error('Error cargando datos iniciales:', error);
        // Devolver datos por defecto en caso de error
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

        this.documentTypes = data.documentTypes;
        this.documentTypeOptions = [
          { label: 'Ninguno', value: '' },
          ...data.documentTypes.map(type => ({
            label: this.getDocumentTypeLabel(type),
            value: type
          }))
        ];

        this.templates = data.templates;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error final cargando datos iniciales:', error);
        // Asegurar que siempre se desactive el loading
        this.isLoading = false;
        // Configurar datos por defecto
        this.categories = ['EDUCACION', 'PROFESIONAL', 'ANTECEDENTES', 'EXPERIENCIA', 'CONOCIMIENTOS', 'CAPACITACION', 'CERTIFICACIONES'];
        this.categoryOptions = this.categories.map(category => ({
          label: this.getCategoryLabel(category),
          value: category
        }));
        this.documentTypes = ['titulo-universitario', 'certificado-profesional', 'antecedentes-penales', 'certificado-ley-micaela', 'dni-frente', 'dni-dorso', 'cuil', 'curriculum-vitae'];
        this.documentTypeOptions = [
          { label: 'Ninguno', value: '' },
          ...this.documentTypes.map(type => ({
            label: this.getDocumentTypeLabel(type),
            value: type
          }))
        ];
        this.templates = [];
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }



  onSubmit(): void {
    if (this.requirementForm.invalid) {
      this.markFormGroupTouched(this.requirementForm);
      this.notificationService.mostrarError('Por favor complete todos los campos requeridos');
      return;
    }

    this.isLoading = true;

    if (this.isEditing && this.editingRequirementId) {
      this.updateRequirement();
    } else {
      this.createRequirement();
    }
  }

  createRequirement(): void {
    const formValue = this.requirementForm.value;

    const request: ContestRequirementCreateRequest = {
      contestId: this.contestId,
      description: formValue.description,
      category: formValue.category,
      required: formValue.required,
      priority: formValue.priority,
      documentType: formValue.documentType
    };

    this.requisitosService.createRequirement(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.resetForm();
          this.requisitosUpdated.emit();
          this.notificationService.mostrarExito('Requisito creado correctamente');
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error creando requisito:', error);
          this.notificationService.mostrarError('Error al crear el requisito');
          this.isLoading = false;
        }
      });
  }

  updateRequirement(): void {
    if (!this.editingRequirementId) return;

    const formValue = this.requirementForm.value;

    const request: ContestRequirementUpdateRequest = {
      id: this.editingRequirementId,
      contestId: this.contestId,
      description: formValue.description,
      category: formValue.category,
      required: formValue.required,
      priority: formValue.priority,
      documentType: formValue.documentType
    };

    this.requisitosService.updateRequirement(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.resetForm();
          this.requisitosUpdated.emit();
          this.notificationService.mostrarExito('Requisito actualizado correctamente');
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error actualizando requisito:', error);
          this.notificationService.mostrarError('Error al actualizar el requisito');
          this.isLoading = false;
        }
      });
  }

  editRequirement(requirement: ContestRequirement): void {
    this.isEditing = true;
    this.editingRequirementId = requirement.id;

    this.requirementForm.patchValue({
      description: requirement.description,
      category: requirement.category,
      required: requirement.required,
      priority: requirement.priority,
      documentType: requirement.documentType || ''
    });
  }

  deleteRequirement(requirement: ContestRequirement): void {
    this.dialogService.confirm({
      title: 'Eliminar Requisito',
      message: `¿Está seguro que desea eliminar el requisito "${requirement.description}"?`,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'warn',
      size: 'small'
    }).afterClosed$.subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.requisitosService.deleteRequirement(this.contestId, requirement.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.requisitosUpdated.emit();
              this.notificationService.mostrarExito('Requisito eliminado correctamente');
              this.isLoading = false;
            },
            error: (error) => {
              console.error('Error eliminando requisito:', error);
              this.notificationService.mostrarError('Error al eliminar el requisito');
              this.isLoading = false;
            }
          });
      }
    });
  }

  applyTemplate(templateId: number | string): void {
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
        this.requisitosService.applyTemplate(this.contestId, templateId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.requisitosUpdated.emit();
              this.notificationService.mostrarExito('Plantilla aplicada correctamente');
              this.isLoading = false;
            },
            error: (error) => {
              console.error('Error aplicando plantilla:', error);
              this.notificationService.mostrarError('Error al aplicar la plantilla');
              this.isLoading = false;
            }
          });
      }
    });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.requirementForm.reset({
      description: '',
      category: '',
      required: true,
      priority: 1,
      documentType: ''
    });
    this.isEditing = false;
    this.editingRequirementId = null;
  }

  getCategoryLabel(category: string): string {
    switch (category) {
      case 'DOCUMENTACION': return 'Documentación';
      case 'EXPERIENCIA': return 'Experiencia';
      case 'FORMACION': return 'Formación';
      case 'IDIOMAS': return 'Idiomas';
      case 'INFORMATICA': return 'Informática';
      case 'OTRO': return 'Otro';
      default: return category;
    }
  }

  getDocumentTypeLabel(type: string): string {
    switch (type) {
      case 'DNI': return 'DNI';
      case 'CURRICULUM': return 'Curriculum Vitae';
      case 'TITULO': return 'Título';
      case 'CERTIFICADO_ANTECEDENTES': return 'Certificado de Antecedentes';
      case 'CERTIFICADO_DOMICILIO': return 'Certificado de Domicilio';
      case 'OTRO': return 'Otro';
      default: return type;
    }
  }

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

  drop(event: CdkDragDrop<ContestRequirement[]>, requirements: ContestRequirement[]): void {
    if (event.previousIndex === event.currentIndex) return;

    moveItemInArray(requirements, event.previousIndex, event.currentIndex);

    // Actualizar prioridades
    requirements.forEach((req, index) => {
      const newPriority = index + 1;
      if (req.priority !== newPriority) {
        this.updateRequirementPriority(req, newPriority);
      }
    });
  }

  updateRequirementPriority(requirement: ContestRequirement, newPriority: number): void {
    const request: ContestRequirementUpdateRequest = {
      id: requirement.id,
      contestId: this.contestId,
      description: requirement.description,
      category: requirement.category,
      required: requirement.required,
      priority: newPriority,
      documentType: requirement.documentType
    };

    this.requisitosService.updateRequirement(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Actualizar localmente sin recargar
          requirement.priority = newPriority;
        },
        error: (error) => {
          console.error('Error actualizando prioridad:', error);
          this.notificationService.mostrarError('Error al actualizar la prioridad');
        }
      });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.requirementForm.get(fieldName);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) {
        switch (fieldName) {
          case 'description': return 'La descripción es requerida';
          case 'category': return 'La categoría es requerida';
          case 'priority': return 'La prioridad es requerida';
          default: return 'Este campo es requerido';
        }
      }
      if (control.errors['min']) {
        return 'La prioridad debe ser mayor a 0';
      }
      if (control.errors['max']) {
        return 'La prioridad debe ser menor a 11';
      }
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
