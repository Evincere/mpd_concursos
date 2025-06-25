/**
 * Componente de Formulario Inteligente para Experiencias Laborales
 * 
 * @description Formulario adaptativo con validación en tiempo real y sanitización XSS
 * @author Augment Agent
 * @date 2025-06-20
 * @version 2.1.0
 */

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, signal, computed } from '@angular/core';
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
  FormValidationResult,
  ValidationResult,
  CvValidationService,
  CvTransformService,
  CvNotificationService
} from '@core/services/cv';

// Servicios
import { DocumentosService } from '@core/services/documentos/documentos.service';

// Componentes compartidos
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomSelectComponent } from '@shared/components/custom-form/custom-select/custom-select.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomDatepickerComponent } from '@shared/components/custom-form/custom-datepicker/custom-datepicker.component';

// Componente uploader CV
import { CvDocumentUploaderComponent, CvDocument as UploaderCvDocument, DocumentValidationState } from './cv-document-uploader/cv-document-uploader.component';

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
  showWhen?: (formValue: any) => boolean;
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

  @ViewChild(CvDocumentUploaderComponent) documentUploader!: CvDocumentUploaderComponent;

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
  public documents: UploaderCvDocument[] = [];
  public documentValidation: DocumentValidationState = {
    isValid: false,
    hasRequiredDocuments: false,
    errors: [],
    warnings: []
  };

  // ===== SIGNALS =====
  public readonly form = signal<FormGroup | null>(null);
  public readonly validationState = signal<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: []
  });

  // ===== COMPUTED SIGNALS =====
  public readonly canSave = computed(() => {
    const form = this.form();
    if (!form) return false;
    return form.valid && form.dirty && !this.isLoading && this.documentValidation.isValid;
  });

  public readonly hasErrors = computed(() => {
    const form = this.form();
    if (!form) return false;
    return form.invalid && (form.dirty || form.touched);
  });

  public readonly hasWarnings = computed(() => {
    const state = this.validationState();
    return state.warnings.length > 0 && (this.form()?.dirty || this.form()?.touched);
  });

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
      label: 'Herramientas y Sistemas Jurídicos',
      type: 'chips',
      required: false,
      helpText: 'Sistemas jurídicos, software legal, bases de datos o herramientas especializadas (máximo 20)',
      placeholder: 'Ej: Lex Doctor, Themis, SAE, etc.'
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
    if (!form) return;

    form.markAllAsTouched();
    this.runValidation(form.getRawValue());

    if (form.valid && this.documentValidation.isValid) {
      const validationResult = this.validationState();
      if (validationResult.isValid && validationResult.sanitizedData) {
        this.save.emit(validationResult.sanitizedData as WorkExperienceDto);
      } else {
        this.notificationService.showError('Error de validación inesperado al guardar.');
        this.cdr.markForCheck();
      }
    } else {
      this.notificationService.showError('Por favor, corrige los errores y adjunta la documentación requerida.');
      this.cdr.markForCheck();
    }
  }

  /**
   * Cancela la edición
   */
  onCancel(): void {
    const form = this.form();
    if (form && form.dirty && !confirm('¿Estás seguro de cancelar? Se perderán los cambios no guardados.')) {
      return;
    }
    this.resetForm();
    this.cancel.emit();
  }

  /**
   * Resetea el formulario
   */
  onReset(): void {
    this.resetForm();
  }

  public resetForm(): void {
    const form = this.form();
    if (form) {
      form.reset({
        position: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        isCurrentJob: false,
        description: ''
      }, { emitEvent: false });

      // Limpiar los FormArray
      const technologiesArray = form.get('technologies') as FormArray;
      const achievementsArray = form.get('achievements') as FormArray;

      technologiesArray.clear();
      achievementsArray.clear();

      form.markAsPristine();
      form.markAsUntouched();

      this.validationState.set({ isValid: true, errors: [], warnings: [] });
      this.validationErrors = [];
      this.documents = [];
      this.documentValidation = { isValid: false, hasRequiredDocuments: false, errors: [], warnings: [] };

      // Limpiar también el componente de documentos
      if (this.documentUploader) {
        this.documentUploader.clearDocuments();
      }

      this.cdr.markForCheck();
    }
  }

  /**
   * Valida el formulario completo
   * @returns {boolean} - True si el formulario es válido
   */
  validateForm(): boolean {
    const form = this.form();
    if (!form) {
      this.validationState.set({ isValid: false, errors: ['Formulario no inicializado.'], warnings: [] });
      return false;
    }

    this.runValidation(form.getRawValue());
    
    // El estado de validez del formulario es la combinación de sus controles Y la validación de documentos.
    return form.valid && this.documentValidation.isValid;
  }

  /**
   * Verifica si un campo debe mostrarse
   */
  shouldShowField(field: DynamicField): boolean {
    if (!field.showWhen) return true;
    const form = this.form();
    return form ? field.showWhen(form.value) : true;
  }

  /**
   * Obtiene los errores de un campo específico
   */
  getFieldErrors(fieldName: string): string[] {
    const form = this.form();
    if (!form) return [];

    const control = form.get(fieldName);
    // Solo mostrar errores si el campo ha sido tocado Y tiene errores Y el formulario está dirty
    if (!control || !control.errors || (!control.touched && !form.dirty)) return [];

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

    endDateControl?.updateValueAndValidity({ emitEvent: false });
    this.cdr.markForCheck();
  }

  /**
   * Maneja la adición de chips (tecnologías/logros)
   */
  onAddChip(fieldName: string, value: string): void {
    if (!value.trim()) return;

    const form = this.form();
    if (!form) return;

    const control = form.get(fieldName) as FormArray;
    if (!control) return;

    const currentValues = control.value || [];

    // Validar límites
    const maxItems = fieldName === 'technologies' ? 20 : 10;
    if (currentValues.length >= maxItems) {
      this.notificationService.showWarning(`Máximo ${maxItems} elementos permitidos`);
      return;
    }

    // Sanitizar y agregar
    const sanitizedValue = this.validationService.sanitizeInput(value.trim());

    if (sanitizedValue && !currentValues.includes(sanitizedValue)) {
      control.push(this.fb.control(sanitizedValue));
      control.markAsTouched();
      this.cdr.markForCheck();
    }
  }

  /**
   * Maneja la eliminación de chips
   */
  onRemoveChip(fieldName: string, index: number): void {
    const form = this.form();
    if (!form) return;

    const control = form.get(fieldName) as FormArray;
    if (!control) return;

    control.removeAt(index);
    control.markAsTouched();
    this.cdr.markForCheck();
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
    const value = inputElement.value.trim();
    if (value) {
      this.onAddChip(fieldName, value);
      inputElement.value = '';
    }
  }

  /**
   * Maneja el clic del botón de agregar chip
   */
  handleChipButtonClick(input: HTMLInputElement, fieldName: string): void {
    const value = input.value.trim();
    if (value) {
      this.onAddChip(fieldName, value);
      input.value = '';
    }
  }

  /**
   * Verifica si el formulario está sucio
   */
  isDirty(): boolean {
    const form = this.form();
    return form ? form.dirty : false;
  }

  /**
   * Verifica si el formulario es válido
   */
  isFormValid(): boolean {
    const form = this.form();
    return form ? form.valid : false;
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Inicializa el formulario
   */
  private initializeForm(): void {
    this.isEditing = this.mode === 'edit' && !!this.experience;
    const newForm = this.createForm();
    
    if (this.isEditing && this.experience) {
      const formData = this.transformService.workExperienceEntityToDto(this.experience);

      // Poblar campos básicos
      newForm.patchValue({
        position: formData.position,
        company: formData.company,
        location: formData.location,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isCurrentJob: formData.isCurrentJob,
        description: formData.description
      }, { emitEvent: false });

      // Poblar FormArray de technologies
      const technologiesArray = newForm.get('technologies') as FormArray;
      if (formData.technologies && Array.isArray(formData.technologies)) {
        formData.technologies.forEach(tech => {
          technologiesArray.push(this.fb.control(tech));
        });
      }

      // Poblar FormArray de achievements
      const achievementsArray = newForm.get('achievements') as FormArray;
      if (formData.achievements && Array.isArray(formData.achievements)) {
        formData.achievements.forEach(achievement => {
          achievementsArray.push(this.fb.control(achievement));
        });
      }

      if (this.experience.document) {
        const modelDoc = this.experience.document;
        const uploaderDoc: UploaderCvDocument = {
          id: modelDoc.id,
          fileName: modelDoc.fileName,
          originalName: modelDoc.originalFileName,
          fileSize: modelDoc.fileSize,
          mimeType: modelDoc.mimeType,
          documentType: 'work_experience',
          uploadDate: modelDoc.uploadDate,
          status: modelDoc.isValidated ? 'validated' : 'pending',
          entityId: this.experience.id
        };
        this.documents = [uploaderDoc];
      }

      if (this.documents.length > 0) {
        this.documentValidation = { isValid: true, hasRequiredDocuments: true, errors: [], warnings: [] };
      }
    }
    
    newForm.markAsPristine();
    newForm.markAsUntouched();
    this.form.set(newForm);
    
    if (this.isEditing) {
      this.runValidation(newForm.getRawValue());
    } else {
      this.validationState.set({ isValid: true, errors: [], warnings: [] });
    }
    
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
      comments: ['', [Validators.maxLength(500)]], // AGREGADO: Control para comentarios adicionales
      technologies: this.fb.array([]),
      achievements: this.fb.array([])
    });
  }

  /**
   * Configura los observadores del formulario
   */
  private setupFormWatchers(): void {
    const form = this.form();
    if (!form) return;

    form.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(400),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    ).subscribe(value => {
      this.runValidation(value);
    });

    form.get('isCurrentJob')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isCurrentJob => {
        const endDateControl = form.get('endDate');
        if (isCurrentJob) {
            endDateControl?.setValue(null, { emitEvent: false });
            endDateControl?.clearValidators();
        } else {
            endDateControl?.setValidators([Validators.required]);
        }
        endDateControl?.updateValueAndValidity({ emitEvent: false });
    });
  }

  /**
   * Ejecuta la validación y actualiza el estado.
   */
  private runValidation(value: any): void {
    const form = this.form();
    if (!form) return;

    const validationResult = this.validationService.validateWorkExperience(value);
    this.validationState.set(validationResult);
    this.validationErrors = validationResult.errors;

    if (!validationResult.isValid) {
      form.setErrors({ customValidation: true });
    } else {
      form.setErrors(null);
    }
    
    const errors = this.groupErrorsByField(validationResult.errors);
    const warnings = this.groupErrorsByField(validationResult.warnings);
    this.validationChange.emit({ isValid: form.valid, errors, warnings });
    this.cdr.markForCheck();
  }

  /**
   * Agrupa los errores por campo
   */
  private groupErrorsByField(errors: string[]): Record<string, string[]> {
    const errorMap: Record<string, string[]> = {};
    this.dynamicFields.forEach(field => errorMap[field.name] = []);
    errorMap['general'] = [];

    errors.forEach(error => {
      let assigned = false;
      for (const fieldName of this.dynamicFields.map(f => f.name)) {
        if (error.toLowerCase().includes(fieldName.toLowerCase())) {
          errorMap[fieldName].push(error);
          assigned = true;
          break;
        }
      }
      if (!assigned) {
        errorMap['general'].push(error);
      }
    });
    return errorMap;
  }
  
  /**
   * Gestiona el cambio en los documentos
   */
  onDocumentsChange(documents: UploaderCvDocument[]): void {
    this.documents = documents;
    this.cdr.markForCheck();
  }

  /**
   * Gestiona el cambio en la validación de documentos
   */
  onDocumentValidationChange(validation: DocumentValidationState): void {
    this.documentValidation = validation;
    this.form()?.updateValueAndValidity();
    this.cdr.markForCheck();
  }
}
