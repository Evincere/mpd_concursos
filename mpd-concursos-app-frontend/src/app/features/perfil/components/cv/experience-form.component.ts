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
import { DocumentosService } from '@core/services/documentos/documentos.service';

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
  @Input() set isLoading(value: boolean) {
    this._isLoading = value;
    this.updateFormDisabledState();
  }
  get isLoading(): boolean {
    return this._isLoading;
  }
  private _isLoading = false;
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
  public readonly form = signal<FormGroup | null>(null);
  public readonly isFormValid = signal<boolean>(false);
  public readonly isDirty = signal<boolean>(false);
  public readonly validationState = signal<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: []
  });
  public readonly uploadedDocument = signal<File | null>(null);
  public readonly isUploadingDocument = signal<boolean>(false);

  // ===== COMPUTED SIGNALS =====
  public readonly canSave = computed(() => {
    const form = this.form();
    return form !== null && this.isFormValid() && !this.isLoading && this.isDirty() && this.documentValidation.isValid;
  });

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
    private readonly notificationService: CvNotificationService,
    private readonly documentosService: DocumentosService
  ) {}

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
    const form = this.form();
    if (!form || !this.validateForm()) {
      this.notificationService.showValidationErrors(this.validationState().errors);
      return;
    }

    // VALIDACIÓN CRÍTICA: Verificar que los documentos estén válidos usando el cv-document-uploader
    if (!this.documentValidation.isValid) {
      if (this.documentValidation.errors.length > 0) {
        this.notificationService.showValidationErrors(this.documentValidation.errors);
      } else {
        this.notificationService.showError('Es obligatorio adjuntar un documento que respalde esta experiencia laboral');
      }
      return;
    }

    const formValue = form.value;
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
   * Maneja la entrada de chips con teclado
   */
  handleChipInput(event: Event, fieldName: string): void {
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    if (input.value.trim()) {
      this.onAddChip(fieldName, input.value.trim());
      input.value = '';
    }
  }

  /**
   * Maneja el clic del botón de agregar chip
   */
  handleChipButtonClick(input: HTMLInputElement, fieldName: string): void {
    if (input.value.trim()) {
      this.onAddChip(fieldName, input.value.trim());
      input.value = '';
    }
  }

  /**
   * Resetea el formulario
   */
  onReset(): void {
    if (!confirm('¿Estás seguro de resetear el formulario?')) {
      return;
    }
    const form = this.form();
    if (form) {
      form.reset();
    }
    this.initializeForm();
  }

  /**
   * Valida el formulario completo
   */
  validateForm(): boolean {
    const form = this.form();
    if (!form) {
      return false;
    }

    const formValue = form.value;
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
    const form = this.form();
    if (!form) return true;
    return field.showWhen(form.value);
  }

  /**
   * Obtiene los errores de un campo específico
   */
  getFieldErrors(fieldName: string): string[] {
    const form = this.form();
    if (!form) return [];

    const control = form.get(fieldName);
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
    const form = this.form();
    if (!form) return;

    const endDateControl = form.get('endDate');

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

    const form = this.form();
    if (!form) return;

    const control = form.get(fieldName);
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
    const form = this.form();
    if (!form) return;

    const control = form.get(fieldName);
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

  // NOTA: Los métodos de manejo de archivos se removieron porque ahora
  // se usa el cv-document-uploader component para manejar los documentos
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
      // NOTA: El documento de respaldo se maneja ahora a través del cv-document-uploader
    });
  }

  /**
   * Configura la validación en tiempo real
   */
  private setupValidation(): void {
    const form = this.form();
    if (!form) return;

    form.statusChanges.pipe(
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
    const form = this.form();
    if (!form) return;

    // Watcher para detectar cambios
    form.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      const currentForm = this.form();
      if (currentForm) {
        this.isDirty.set(currentForm.dirty);
        this.validateForm();
      }
    });

    // Watcher específico para trabajo actual
    form.get('isCurrentJob')?.valueChanges.pipe(
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

  /**
   * Actualiza el estado disabled de todos los controles del formulario
   */
  private updateFormDisabledState(): void {
    const form = this.form();
    if (!form) return;

    if (this._isLoading) {
      form.disable();
    } else {
      form.enable();
    }
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
