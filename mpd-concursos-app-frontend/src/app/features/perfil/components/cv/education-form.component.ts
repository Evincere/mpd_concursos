/**
 * Componente de Formulario de Educación
 *
 * @description Formulario inteligente y reactivo para gestionar información educativa
 * @author Augment Agent
 * @date 2025-06-22
 * @version 2.1.0
 */

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import {
  EducationEntry,
  EducationDto,
  EducationType,
  EducationStatus,
  ICvFormComponent,
  FormMode,
  FormValidationResult,
  ValidationResult,
  CvValidationService,
  CvTransformService,
  CvNotificationService,
  ScientificActivityType,
  ScientificActivityRole,
  // Nuevos servicios especializados
  EducationValidationService,
  EducationValidationResult,
  DynamicFieldConfiguration,
  EducationDisplayService,
  // Nuevas reglas y configuraciones
  getEducationConfig,
  EDUCATION_TYPE_LABELS,
  EDUCATION_STATUS_LABELS,
  EducationFieldConfig
} from '@core/services/cv';
import { DocumentosService } from '@core/services/documentos/documentos.service';

import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomSelectComponent } from '@shared/components/custom-form/custom-select/custom-select.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomDatepickerComponent } from '@shared/components/custom-form/custom-datepicker/custom-datepicker.component';
import { CustomNumberInputComponent } from '@shared/components/custom-form/custom-number-input/custom-number-input.component';
import { CvDocumentUploaderComponent, ExistingCvDocument as UploaderCvDocument, DocumentValidationState } from './cv-document-uploader/cv-document-uploader.component';

// Interfaz obsoleta - ahora se usa EducationFieldConfig desde education-rules.model.ts

@Component({
  selector: 'app-education-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomButtonComponent,
    CustomDatepickerComponent,
    CustomNumberInputComponent,
    CvDocumentUploaderComponent
  ],
  templateUrl: './education-form.component.html',
  styleUrls: ['./education-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EducationFormComponent implements OnInit, OnChanges, OnDestroy, ICvFormComponent<EducationDto> {

  @ViewChild(CvDocumentUploaderComponent) documentUploader!: CvDocumentUploaderComponent;

  @Input() education: EducationEntry | null = null;
  @Input() mode: FormMode = 'create';
  @Input() isLoading = false;
  @Input() isInModal = false;

  @Output() save = new EventEmitter<EducationDto>();
  @Output() cancel = new EventEmitter<void>();
  @Output() validationChange = new EventEmitter<FormValidationResult>();

  public formData: EducationDto = {} as EducationDto;
  public isEditing = false;
  public validationErrors: string[] = [];

  public documents: UploaderCvDocument[] = [];
  public documentValidation: DocumentValidationState = {
    isValid: false,
    hasRequiredDocuments: false,
    errors: [],
    warnings: []
  };

  public readonly form = signal<FormGroup | null>(null);
  public readonly selectedType = signal<EducationType>(EducationType.HIGHER_EDUCATION_CAREER);
  public readonly validationState = signal<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: []
  });

  // Signal para forzar re-evaluación de campos visibles
  private readonly fieldVisibilityTrigger = signal<number>(0);

  public readonly canSave = computed(() => {
    const form = this.form();
    if (!form) return false;

    const isFormValid = form.valid;
    const isFormDirty = form.dirty || form.touched;
    const isNotLoading = !this.isLoading;
    const isDocumentValid = this.documentValidation.isValid;

    return isFormValid && isFormDirty && isNotLoading && isDocumentValid;
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

  public readonly visibleFields = computed((): EducationFieldConfig[] => {
    // Incluir el trigger para forzar re-evaluación
    this.fieldVisibilityTrigger();

    const config = this.dynamicFieldsConfig();
    if (!config) {
      return this.baseFields; // Solo mostrar campos base si no hay configuración
    }

    // Combinar campos base con campos específicos del tipo/estado
    return [...this.baseFields, ...config.fields];
  });

  public readonly educationTypeOptions = Object.entries(EDUCATION_TYPE_LABELS).map(([value, label]) => ({
    value: value as EducationType,
    label
  }));

  public readonly educationStatusOptions = Object.entries(EDUCATION_STATUS_LABELS).map(([value, label]) => {
    const option = {
      value: value as EducationStatus,
      label
    };
    console.log('[EducationForm] Status option created:', option);
    return option;
  });

  public readonly scientificActivityTypeOptions = [
    { value: ScientificActivityType.RESEARCH, label: 'investigación' },
    { value: ScientificActivityType.PRESENTATION, label: 'ponencia' },
    { value: ScientificActivityType.PUBLICATION, label: 'publicación' }
  ];

  public readonly scientificActivityRoleOptions = [
    { value: ScientificActivityRole.ASSISTANT_PARTICIPANT, label: 'ayudante-participante' },
    { value: ScientificActivityRole.AUTHOR_SPEAKER_PANELIST_PRESENTER, label: 'autor-disertante-panelista-exponente' }
  ];

  // Campos dinámicos basados en las nuevas reglas
  public readonly dynamicFieldsConfig = signal<DynamicFieldConfiguration | null>(null);

  // Campos base que siempre se muestran
  private readonly baseFields: EducationFieldConfig[] = [
    {
      name: 'type',
      label: 'Tipo de Educación',
      type: 'select',
      required: true,
      helpText: 'Selecciona el tipo de educación',
      options: this.educationTypeOptions
    },
    {
      name: 'status',
      label: 'Estado',
      type: 'select',
      required: true,
      helpText: 'Estado actual del estudio',
      options: this.educationStatusOptions
    }
  ];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly validationService: CvValidationService,
    private readonly transformService: CvTransformService,
    private readonly notificationService: CvNotificationService,
    private readonly documentosService: DocumentosService,
    // Nuevos servicios especializados
    private readonly educationValidationService: EducationValidationService,
    private readonly educationDisplayService: EducationDisplayService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupFormWatchers();

    // Forzar actualización de configuración dinámica después de que todo esté configurado
    // Usar un timeout más largo para asegurar que todo esté inicializado
    setTimeout(() => {
      console.log('[EducationForm] Forcing initial dynamic configuration update');
      this.updateDynamicFieldsConfiguration();
      this.cdr.markForCheck();
    }, 100);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['education'] && !changes['education'].firstChange) {
      this.resetForm();
      this.initializeForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSave(): void {
    const form = this.form();
    if (!form) return;

    form.markAllAsTouched();
    this.runValidation(form.getRawValue());

    if (form.valid && this.documentValidation.isValid) {
      const validationResult = this.validationState();
      if (validationResult.isValid && validationResult.sanitizedData) {
        this.save.emit(validationResult.sanitizedData as EducationDto);
      } else {
        this.notificationService.showError('Error de validación inesperado al guardar.');
        this.cdr.markForCheck();
      }
    } else {
      this.notificationService.showError('Por favor, corrige los errores y adjunta la documentación requerida.');
      this.cdr.markForCheck();
    }
  }

  onCancel(): void {
    const form = this.form();
    if (form && form.dirty && !confirm('¿Estás seguro de cancelar? Se perderán los cambios no guardados.')) {
      return;
    }
    this.resetForm();
    this.cancel.emit();
  }

  public resetForm(): void {
    const form = this.form();
    if (form) {
      form.reset({ type: EducationType.HIGHER_EDUCATION_CAREER, status: EducationStatus.IN_PROGRESS }, { emitEvent: false });
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

  validateForm(): boolean {
    const form = this.form();
    if (!form) {
      this.validationState.set({ isValid: false, errors: ['Formulario no inicializado.'], warnings: [] });
      return false;
    }
    this.runValidation(form.getRawValue());
    return form.valid && this.documentValidation.isValid;
  }

  /**
   * @deprecated Este método ya no es necesario. Los campos visibles se manejan en visibleFields computed.
   */
  shouldShowField(field: any): boolean {
    return true; // Siempre true porque la lógica está en visibleFields computed
  }

  /**
   * TrackBy function para campos dinámicos
   */
  trackByFieldName = (index: number, field: EducationFieldConfig): string => {
    return field.name;
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
    if (fieldErrors['min']) {
      errors.push(`${this.getFieldLabel(fieldName)} debe ser mayor a ${fieldErrors['min'].min}`);
    }
    if (fieldErrors['max']) {
      errors.push(`${this.getFieldLabel(fieldName)} debe ser menor a ${fieldErrors['max'].max}`);
    }

    return errors;
  }

  /**
   * Obtiene la etiqueta de un campo
   */
  getFieldLabel(fieldName: string): string {
    // Buscar en campos base primero
    const baseField = this.baseFields.find(f => f.name === fieldName);
    if (baseField) {
      return baseField.label;
    }

    // Buscar en configuración dinámica
    const config = this.dynamicFieldsConfig();
    if (config) {
      const field = config.fields.find(f => f.name === fieldName);
      return field?.label || fieldName;
    }

    return fieldName;
  }

  /**
   * Obtiene las opciones para un campo select
   */
  getSelectOptions(fieldName: string): { value: any; label: string }[] {
    // Buscar en campos base primero
    const baseField = this.baseFields.find(f => f.name === fieldName);
    if (baseField?.options) {
      return baseField.options;
    }

    // Buscar en configuración dinámica
    const config = this.dynamicFieldsConfig();
    if (config) {
      const field = config.fields.find(f => f.name === fieldName);
      return field?.options || [];
    }

    return [];
  }

  /**
   * Obtiene un FormControl de forma segura
   */
  getFormControl(fieldName: string): any {
    const form = this.form();
    const control = form?.get(fieldName) || null;
    console.log(`[EducationForm] getFormControl(${fieldName}):`, {
      hasForm: !!form,
      hasControl: !!control,
      controlValue: control?.value,
      controlType: typeof control?.value
    });
    return control;
  }

  /**
   * Maneja el evento Enter en el input de chips
   */
  onChipInputEnter(event: KeyboardEvent, fieldName: string, input: HTMLInputElement): void {
    event.preventDefault();
    const value = input.value.trim();
    if (value) {
      this.onAddChip(fieldName, value);
      input.value = '';
    }
  }

  /**
   * Agrega un chip al campo especificado
   */
  onAddChip(fieldName: string, value: string): void {
    const form = this.form();
    if (!form || !value.trim()) return;

    const control = form.get(fieldName);
    if (!control) return;

    const currentValues = control.value || [];
    const trimmedValue = value.trim();

    // Evitar duplicados
    if (!currentValues.includes(trimmedValue) && currentValues.length < 15) {
      const newValues = [...currentValues, trimmedValue];
      control.setValue(newValues);
      control.markAsTouched();
      this.cdr.markForCheck();
    }
  }

  /**
   * Remueve un chip del campo especificado
   */
  onRemoveChip(fieldName: string, index: number): void {
    const form = this.form();
    if (!form) return;

    const control = form.get(fieldName);
    if (!control) return;

    const currentValues = control.value || [];
    const newValues = currentValues.filter((_: any, i: number) => i !== index);
    control.setValue(newValues);
    control.markAsTouched();
    this.cdr.markForCheck();
  }

  /**
   * Resetea el formulario
   */
  onReset(): void {
    if (!confirm('¿Estás seguro de resetear el formulario?')) {
      return;
    }
    this.resetForm();
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

  onDocumentsChange(documents: UploaderCvDocument[]): void {
    this.documents = documents;
    const form = this.form();
    if (form) {
      form.markAsDirty(); // Marcar como dirty cuando se cambian los documentos
    }
    this.cdr.markForCheck();
  }

  onDocumentValidationChange(validation: DocumentValidationState): void {
    this.documentValidation = validation;
    const form = this.form();
    if (form) {
      form.markAsDirty(); // Marcar como dirty cuando se valida el documento
      form.updateValueAndValidity();
    }
    this.cdr.markForCheck();
  }

  private initializeForm(): void {
    this.isEditing = this.mode === 'edit' && !!this.education;
    const newForm = this.createForm();

    if (this.isEditing && this.education) {
      const formData = this.transformService.educationEntityToDto(this.education);
      newForm.patchValue(formData, { emitEvent: false });
      this.selectedType.set(formData.type);

      if (this.education.document) {
        const modelDoc = this.education.document;
        const uploaderDoc: UploaderCvDocument = {
          id: modelDoc.id || `doc_${Date.now()}`, // Proporcionar ID por defecto si no existe
          fileName: modelDoc.fileName,
          originalFileName: modelDoc.originalFileName,
          fileSize: modelDoc.fileSize,
          mimeType: modelDoc.mimeType,
          documentType: 'education',
          uploadDate: modelDoc.uploadDate,
          status: modelDoc.isValidated ? 'validated' : 'pending',
          entityId: this.education.id
        };
        this.documents = [uploaderDoc];
      }
      if (this.documents.length > 0) {
        this.documentValidation = { isValid: true, hasRequiredDocuments: true, errors: [], warnings: [] };
      }
    }

    if (this.isEditing) {
      newForm.markAsPristine();
      newForm.markAsUntouched();
    } else {
      // En modo "add", marcar como dirty para permitir guardar
      newForm.markAsDirty();
      newForm.markAsTouched();
    }

    this.form.set(newForm);

    // Actualizar configuración dinámica inmediatamente después de establecer el formulario
    this.updateDynamicFieldsConfiguration();

    if (this.isEditing) {
      this.runValidation(newForm.getRawValue());
    } else {
      this.validationState.set({ isValid: true, errors: [], warnings: [] });
    }
    this.cdr.markForCheck();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      type: [EducationType.HIGHER_EDUCATION_CAREER, Validators.required],
      title: [''],
      institution: [''],
      status: [EducationStatus.IN_PROGRESS, Validators.required],
      startDate: [''],
      endDate: [''],
      isOngoing: [false],
      comments: ['', [Validators.maxLength(2000)]],
      durationYears: [null],
      average: [null],
      thesisTopic: [''],
      hourlyLoad: [null],
      hadFinalEvaluation: [null],
      activityType: [null],
      role: [null],
      topic: [''],
      expositionPlaceDate: [''],
      issueDate: ['']
    });
  }

  private setupFormWatchers(): void {
    const form = this.form();
    if (!form) return;

    form.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(400),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    ).subscribe(value => {
      if (!form.dirty) {
        form.markAsDirty(); // Asegurar que se marque como dirty en cualquier cambio
      }
      this.runValidation(value);
    });

    form.get('type')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(type => {
      this.selectedType.set(type);
      this.updateDynamicFieldsConfiguration(); // Usar nuevo método
      if (!form.dirty) {
        form.markAsDirty(); // Marcar como dirty cuando cambia el tipo
      }
    });

    // Watcher para sincronizar estado con isOngoing
    form.get('status')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(status => {
      console.log('[EducationForm] ⚡ Status watcher triggered! New value:', status);
      console.log('[EducationForm] ⚡ Status watcher - FormControl current value:', form.get('status')?.value);
      this.updateDynamicFieldsConfiguration(); // Actualizar configuración cuando cambia estado

      const isOngoingControl = form.get('isOngoing');
      const endDateControl = form.get('endDate');
      console.log('[EducationForm] Current isOngoing before status logic:', isOngoingControl?.value);

      if (status === EducationStatus.IN_PROGRESS) {
        // Si el estado es "En Curso", marcar isOngoing y limpiar fecha de fin
        console.log('[EducationForm] Setting isOngoing=true due to IN_PROGRESS status');
        isOngoingControl?.setValue(true, { emitEvent: false });
        endDateControl?.setValue(null, { emitEvent: false });
      } else if (status === EducationStatus.COMPLETED) {
        // Si el estado es "Completado", desmarcar isOngoing
        console.log('[EducationForm] Setting isOngoing=false due to COMPLETED status');
        isOngoingControl?.setValue(false, { emitEvent: false });
      }

      // Forzar re-evaluación de campos visibles
      this.fieldVisibilityTrigger.set(this.fieldVisibilityTrigger() + 1);
      // updateFormValidators se llama automáticamente en updateDynamicFieldsConfiguration
    });

    form.get('isOngoing')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(isOngoing => {
        console.log('[EducationForm] isOngoing changed to:', isOngoing);
        const endDateControl = form.get('endDate');
        const statusControl = form.get('status');
        console.log('[EducationForm] Current status before isOngoing logic:', statusControl?.value);

        if(isOngoing) {
            endDateControl?.setValue(null, { emitEvent: false });
            // Si se marca "En Curso", cambiar el estado automáticamente
            if (statusControl?.value !== EducationStatus.IN_PROGRESS) {
              console.log('[EducationForm] Changing status from', statusControl?.value, 'to IN_PROGRESS due to isOngoing=true');
              statusControl?.setValue(EducationStatus.IN_PROGRESS, { emitEvent: false });
            }
        }

        // Forzar re-evaluación de campos visibles
        this.fieldVisibilityTrigger.set(this.fieldVisibilityTrigger() + 1);
        // updateFormValidators se llama automáticamente en updateDynamicFieldsConfiguration
    });
  }

  private runValidation(value: any): void {
    const form = this.form();
    if (!form) return;

    // Usar el nuevo servicio de validación especializado
    const educationValidationResult = this.educationValidationService.validateFormGroup(form);

    // Convertir resultado a formato legacy para compatibilidad
    const validationResult: ValidationResult = {
      isValid: educationValidationResult.isValid,
      errors: educationValidationResult.errors,
      warnings: educationValidationResult.warnings,
      sanitizedData: value // Mantener datos originales por ahora
    };

    this.validationState.set(validationResult);
    this.validationErrors = validationResult.errors;

    // Aplicar errores específicos por campo
    Object.keys(educationValidationResult.fieldErrors).forEach(fieldName => {
      const control = form.get(fieldName);
      if (control) {
        control.setErrors({
          customValidation: educationValidationResult.fieldErrors[fieldName]
        });
      }
    });

    if (!validationResult.isValid) {
      form.setErrors({ customValidation: true });
    } else if (Object.keys(educationValidationResult.fieldErrors).length === 0) {
      form.setErrors(null);
    }

    const errors = this.groupErrorsByField(validationResult.errors);
    const warnings = this.groupErrorsByField(validationResult.warnings);
    this.validationChange.emit({ isValid: form.valid, errors, warnings });
    this.cdr.markForCheck();
  }

  /**
   * @deprecated Método obsoleto. Ahora se usa updateFormValidators dentro de updateDynamicFieldsConfiguration
   */

  private groupErrorsByField(errors: string[]): Record<string, string[]> {
    const errorMap: Record<string, string[]> = {};

    // Inicializar con campos base
    this.baseFields.forEach(field => errorMap[field.name] = []);

    // Agregar campos de configuración dinámica
    const config = this.dynamicFieldsConfig();
    if (config) {
      config.fields.forEach(field => errorMap[field.name] = []);
    }

    errorMap['general'] = [];

    errors.forEach(error => {
      let assigned = false;
      const allFieldNames = [
        ...this.baseFields.map(f => f.name),
        ...(config?.fields.map(f => f.name) || [])
      ];

      for (const fieldName of allFieldNames) {
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
   * Actualiza la configuración de campos dinámicos basada en tipo y estado
   */
  private updateDynamicFieldsConfiguration(): void {
    const form = this.form();
    if (!form) {
      console.warn('[EducationForm] No form available for dynamic configuration update');
      return;
    }

    const type = form.get('type')?.value as EducationType;
    const status = form.get('status')?.value as EducationStatus;

    console.log('[EducationForm] Updating dynamic configuration with:', { type, status });

    if (type && status) {
      try {
        const config = this.educationValidationService.getDynamicFieldConfiguration(type, status);
        this.dynamicFieldsConfig.set(config);

        // Actualizar validadores del formulario
        this.updateFormValidators(config);

        // Forzar re-evaluación de campos visibles
        this.fieldVisibilityTrigger.set(this.fieldVisibilityTrigger() + 1);

        console.log('[EducationForm] Updated dynamic configuration successfully:', {
          type,
          status,
          fieldsCount: config.fields.length,
          requiredFields: config.requiredFields
        });
      } catch (error) {
        console.error('[EducationForm] Error updating dynamic configuration:', error);
        this.dynamicFieldsConfig.set(null);
      }
    } else {
      console.warn('[EducationForm] Missing type or status for dynamic configuration:', { type, status });
      this.dynamicFieldsConfig.set(null);
    }
  }

  /**
   * Actualiza los validadores del formulario según la configuración dinámica
   */
  private updateFormValidators(config: DynamicFieldConfiguration): void {
    const form = this.form();
    if (!form) return;

    // Limpiar validadores existentes
    Object.keys(form.controls).forEach(controlName => {
      if (!['type', 'status'].includes(controlName)) {
        form.get(controlName)?.clearValidators();
        form.get(controlName)?.updateValueAndValidity({ emitEvent: false });
      }
    });

    // Aplicar nuevos validadores según configuración
    config.fields.forEach(field => {
      const control = form.get(field.name);
      if (control) {
        const validators = [];

        if (field.required) {
          validators.push(Validators.required);
        }

        if (field.type === 'number' && field.min !== undefined) {
          validators.push(Validators.min(field.min));
        }

        if (field.type === 'number' && field.max !== undefined) {
          validators.push(Validators.max(field.max));
        }

        if (validators.length > 0) {
          control.setValidators(validators);
          control.updateValueAndValidity({ emitEvent: false });
        }
      }
    });
  }
}
