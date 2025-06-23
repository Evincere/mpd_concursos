/**
 * Componente de Formulario Inteligente para Experiencias Laborales
 * 
 * @description Formulario adaptativo con validación en tiempo real y sanitización XSS
 * @author Augment Agent
 * @date 2025-06-20
 * @version 2.0.0
 */

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Modelos y servicios del CV
import {
  WorkExperience,
  WorkExperienceDto,
  ICvFormComponent,
  FormMode,
  FormValidationResult
} from '@core/services/cv';

// Servicios
import { CvValidationService, ValidationResult } from '@core/services/cv/cv-validation.service';
import { CvTransformService } from '@core/services/cv/cv-transform.service';
import { CvNotificationService } from '@core/services/cv/cv-notification.service';

// Componentes compartidos
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomSelectComponent } from '@shared/components/custom-form/custom-select/custom-select.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomDatepickerComponent } from '@shared/components/custom-form/custom-datepicker/custom-datepicker.component';

// Componente uploader CV
import { CvDocumentUploaderComponent, CvDocument, DocumentValidationState } from './cv-document-uploader/cv-document-uploader.component';

/**
 * Configuración de campo dinámico
 */
interface DynamicField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'checkbox' | 'select' | 'chips';
  required: boolean;
  placeholder?: string;
  helpText?: string;
  validation?: any;
  showWhen?: (formValue: any) => boolean;
  options?: { value: any; label: string }[];
}

@Component({
  selector: 'app-experience-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomButtonComponent,
    CustomDatepickerComponent,
    CvDocumentUploaderComponent
  ],
  templateUrl: './experience-form.component.html',
  styleUrls: ['./experience-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperienceFormComponent implements OnInit, OnDestroy, ICvFormComponent<WorkExperienceDto> {

  // ===== INPUTS Y OUTPUTS =====
  @Input() experience: WorkExperience | null = null;
  @Input() mode: FormMode = 'create';
  @Input() isLoading = false;
  @Input() isInModal = false;

  @Output() save = new EventEmitter<WorkExperienceDto>();
  @Output() cancel = new EventEmitter<void>();
  @Output() validationChange = new EventEmitter<FormValidationResult>();

  // ===== PROPIEDADES DE LA INTERFAZ =====
  public formData: WorkExperienceDto = {} as WorkExperienceDto;
  public isEditing = false;
  public validationErrors: string[] = [];

  // ===== PROPIEDADES DEL UPLOADER =====
  public documents: CvDocument[] = [];
  public documentValidation: DocumentValidationState = {
    isValid: false,
    hasRequiredDocuments: false,
    errors: [],
    warnings: []
  };

  // ===== SIGNALS =====
  public readonly form = signal<FormGroup>(new FormGroup({}));
  public readonly isFormValid = signal<boolean>(false);
  public readonly isDirty = signal<boolean>(false);
  public readonly validationState = signal<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: []
  });

  // ===== COMPUTED SIGNALS =====
  public readonly canSave = computed(() =>
    this.isFormValid() && !this.isLoading && this.isDirty() && this.documentValidation.isValid
  );

  public readonly hasErrors = computed(() =>
    this.validationState().errors.length > 0
  );

  public readonly hasWarnings = computed(() =>
    this.validationState().warnings.length > 0
  );

  // ===== CONFIGURACIÓN DE CAMPOS DINÁMICOS =====
  public readonly dynamicFields: DynamicField[] = [
    {
      name: 'position',
      label: 'Puesto de Trabajo',
      type: 'text',
      required: true,
      helpText: 'Especifica tu rol o posición en la empresa'
    },
    {
      name: 'company',
      label: 'Empresa',
      type: 'text',
      required: true,
      helpText: 'Nombre completo de la empresa u organización'
    },
    {
      name: 'location',
      label: 'Ubicación',
      type: 'text',
      required: false,
      helpText: 'Ciudad y país donde trabajaste'
    },
    {
      name: 'startDate',
      label: 'Fecha de Inicio',
      type: 'date',
      required: true,
      helpText: 'Fecha en que comenzaste en este puesto'
    },
    {
      name: 'isCurrentJob',
      label: 'Trabajo Actual',
      type: 'checkbox',
      required: false,
      helpText: 'Marca si actualmente trabajas en esta empresa'
    },
    {
      name: 'endDate',
      label: 'Fecha de Fin',
      type: 'date',
      required: false,
      helpText: 'Fecha en que terminaste en este puesto',
      showWhen: (formValue) => !formValue.isCurrentJob
    },
    {
      name: 'description',
      label: 'Descripción del Puesto',
      type: 'textarea',
      required: true,
      helpText: 'Detalla qué hacías en este puesto (máximo 2000 caracteres)'
    },
    {
      name: 'technologies',
      label: 'Tecnologías Utilizadas',
      type: 'chips',
      required: false,
      helpText: 'Tecnologías, herramientas o lenguajes que usaste (máximo 20)'
    },
    {
      name: 'achievements',
      label: 'Logros Destacados',
      type: 'chips',
      required: false,
      helpText: 'Logros específicos y cuantificables (máximo 10)'
    }
  ];

  // ===== SUBJECTS =====
  private readonly destroy$ = new Subject<void>();

  // ===== CONSTRUCTOR =====
  constructor(
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly validationService: CvValidationService,
    private readonly transformService: CvTransformService,
    private readonly notificationService: CvNotificationService
  ) { }

  // ===== LIFECYCLE =====
  ngOnInit(): void {
    this.initializeForm();
    this.setupValidation();
    this.setupFormWatchers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== MÉTODOS PÚBLICOS =====

  /**
   * Guarda la experiencia
   */
  onSave(): void {
    if (!this.validateForm()) {
      this.notificationService.showValidationErrors(this.validationState().errors);
      return;
    }

    const formValue = this.form().value;
    const validationResult = this.validationService.validateWorkExperience(formValue);

    if (!validationResult.isValid) {
      this.notificationService.showValidationErrors(validationResult.errors);
      return;
    }

    // Usar datos sanitizados
    const sanitizedData = validationResult.sanitizedData as WorkExperienceDto;
    this.formData = sanitizedData;
    this.save.emit(sanitizedData);
  }

  /**
   * Cancela la edición
   */
  onCancel(): void {
    if (this.isDirty() && !confirm('¿Estás seguro de cancelar? Se perderán los cambios no guardados.')) {
      return;
    }
    this.cancel.emit();
  }

  /**
   * Resetea el formulario
   */
  onReset(): void {
    if (!confirm('¿Estás seguro de resetear el formulario?')) {
      return;
    }
    this.form().reset();
    this.initializeForm();
  }

  /**
   * Valida el formulario completo
   */
  validateForm(): boolean {
    const formValue = this.form().value;
    const validationResult = this.validationService.validateWorkExperience(formValue);

    this.validationState.set(validationResult);
    this.validationErrors = validationResult.errors;

    // Emitir cambio de validación
    this.validationChange.emit({
      isValid: validationResult.isValid,
      errors: this.groupErrorsByField(validationResult.errors),
      warnings: this.groupErrorsByField(validationResult.warnings)
    });

    return validationResult.isValid;
  }

  /**
   * Verifica si un campo debe mostrarse
   */
  shouldShowField(field: DynamicField): boolean {
    if (!field.showWhen) return true;
    return field.showWhen(this.form().value);
  }

  /**
   * Obtiene los errores de un campo específico
   */
  getFieldErrors(fieldName: string): string[] {
    const control = this.form().get(fieldName);
    if (!control || !control.errors || !control.touched) return [];

    const errors: string[] = [];
    const fieldErrors = control.errors;

    if (fieldErrors['required']) {
      errors.push(`${this.getFieldLabel(fieldName)} es obligatorio`);
    }
    if (fieldErrors['minlength']) {
      errors.push(`${this.getFieldLabel(fieldName)} debe tener al menos ${fieldErrors['minlength'].requiredLength} caracteres`);
    }
    if (fieldErrors['maxlength']) {
      errors.push(`${this.getFieldLabel(fieldName)} no puede exceder ${fieldErrors['maxlength'].requiredLength} caracteres`);
    }
    if (fieldErrors['pattern']) {
      errors.push(`${this.getFieldLabel(fieldName)} tiene un formato inválido`);
    }

    return errors;
  }

  /**
   * Obtiene la etiqueta de un campo
   */
  getFieldLabel(fieldName: string): string {
    const field = this.dynamicFields.find(f => f.name === fieldName);
    return field?.label || fieldName;
  }

  /**
   * Maneja el cambio en el checkbox de trabajo actual
   */
  onCurrentJobChange(isCurrentJob: boolean): void {
    const endDateControl = this.form().get('endDate');

    if (isCurrentJob) {
      endDateControl?.setValue(null);
      endDateControl?.clearValidators();
    } else {
      endDateControl?.setValidators([Validators.required]);
    }

    endDateControl?.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  /**
   * Maneja la adición de chips (tecnologías/logros)
   */
  onAddChip(fieldName: string, value: string): void {
    if (!value.trim()) return;

    const control = this.form().get(fieldName);
    const currentValues = control?.value || [];

    // Validar límites
    const maxItems = fieldName === 'technologies' ? 20 : 10;
    if (currentValues.length >= maxItems) {
      this.notificationService.showWarning(`Máximo ${maxItems} elementos permitidos`);
      return;
    }

    // Sanitizar y agregar
    const sanitizedValue = this.validationService.sanitizeInput(value.trim());
    if (sanitizedValue && !currentValues.includes(sanitizedValue)) {
      control?.setValue([...currentValues, sanitizedValue]);
    }
  }

  /**
   * Maneja la eliminación de chips
   */
  onRemoveChip(fieldName: string, index: number): void {
    const control = this.form().get(fieldName);
    const currentValues = control?.value || [];
    currentValues.splice(index, 1);
    control?.setValue([...currentValues]);
  }

  /**
   * TrackBy function para campos dinámicos
   */
  trackByFieldName(_index: number, field: DynamicField): string {
    return field.name;
  }

  /**
   * Maneja el evento Enter en el input de chips
   */
  onChipInputEnter(event: KeyboardEvent, fieldName: string, inputElement: HTMLInputElement): void {
    event.preventDefault();
    if (inputElement && inputElement.value.trim()) {
      this.onAddChip(fieldName, inputElement.value.trim());
      inputElement.value = '';
    }
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Inicializa el formulario
   */
  private initializeForm(): void {
    const formGroup = this.createForm();

    if (this.experience && this.mode !== 'create') {
      const dto = this.transformService.workExperienceEntityToDto(this.experience);
      formGroup.patchValue(dto);
      this.isEditing = true;
    }

    this.form.set(formGroup);
    this.cdr.markForCheck();
  }

  /**
   * Crea el FormGroup
   */
  private createForm(): FormGroup {
    return this.fb.group({
      position: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      company: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      location: ['', [Validators.maxLength(100)]],
      startDate: ['', [Validators.required]],
      endDate: [''],
      isCurrentJob: [false],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
      technologies: [[]],
      achievements: [[]],
      comments: ['', [Validators.maxLength(500)]]
    });
  }

  /**
   * Configura la validación en tiempo real
   */
  private setupValidation(): void {
    this.form().statusChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(status => {
      this.isFormValid.set(status === 'VALID');
      this.cdr.markForCheck();
    });
  }

  /**
   * Configura los watchers del formulario
   */
  private setupFormWatchers(): void {
    // Watcher para detectar cambios
    this.form().valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.isDirty.set(this.form().dirty);
      this.validateForm();
    });

    // Watcher específico para trabajo actual
    this.form().get('isCurrentJob')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isCurrentJob => {
      this.onCurrentJobChange(isCurrentJob);
    });
  }

  /**
   * Agrupa errores por campo
   */
  private groupErrorsByField(errors: string[]): Record<string, string[]> {
    const grouped: Record<string, string[]> = {};

    errors.forEach(error => {
      // Extraer el nombre del campo del mensaje de error
      const fieldMatch = error.match(/^([^:]+):/);
      const fieldName = fieldMatch ? fieldMatch[1].toLowerCase() : 'general';

      if (!grouped[fieldName]) {
        grouped[fieldName] = [];
      }
      grouped[fieldName].push(error);
    });

    return grouped;
  }

  // ===== MÉTODOS DEL UPLOADER =====

  /**
   * Maneja el cambio de documentos
   */
  onDocumentsChange(documents: CvDocument[]): void {
    this.documents = documents;
    this.cdr.markForCheck();
  }

  /**
   * Maneja el cambio de validación de documentos
   */
  onDocumentValidationChange(validation: DocumentValidationState): void {
    this.documentValidation = validation;
    this.cdr.markForCheck();
  }


}
