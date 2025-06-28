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
  ScientificActivityRole
} from '@core/services/cv';
import { DocumentosService } from '@core/services/documentos/documentos.service';

import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomSelectComponent } from '@shared/components/custom-form/custom-select/custom-select.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomDatepickerComponent } from '@shared/components/custom-form/custom-datepicker/custom-datepicker.component';
import { CustomNumberInputComponent } from '@shared/components/custom-form/custom-number-input/custom-number-input.component';
import { CvDocumentUploaderComponent, ExistingCvDocument as UploaderCvDocument, DocumentValidationState } from './cv-document-uploader/cv-document-uploader.component';

interface EducationDynamicField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'checkbox' | 'select' | 'number' | 'chips';
  required: boolean;
  placeholder?: string;
  helpText?: string;
  showForTypes?: EducationType[];
  showWhen?: (formValue: any) => boolean;
  options?: { value: any; label: string }[];
  min?: number;
  max?: number;
}

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
  public readonly selectedType = signal<EducationType>(EducationType.UNIVERSITY_DEGREE);
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

  public readonly visibleFields = computed(() => {
    // Incluir el trigger para forzar re-evaluación
    this.fieldVisibilityTrigger();
    return this.dynamicFields.filter(field => this.shouldShowField(field));
  });

  public readonly educationTypeOptions = [
    { value: EducationType.UNIVERSITY_DEGREE, label: 'Título Universitario' },
    { value: EducationType.POSTGRADUATE_SPECIALIZATION, label: 'Especialización' },
    { value: EducationType.MASTER_DEGREE, label: 'Maestría' },
    { value: EducationType.DOCTORATE, label: 'Doctorado' },
    { value: EducationType.DIPLOMA, label: 'Diplomatura' },
    { value: EducationType.CERTIFICATION, label: 'Curso de Capacitación' },
    { value: EducationType.SCIENTIFIC_ACTIVITY, label: 'Actividad Científica' }
  ];

  public readonly educationStatusOptions = [
    { value: EducationStatus.IN_PROGRESS, label: 'En Curso' },
    { value: EducationStatus.COMPLETED, label: 'Completado' }
  ];
  
  public readonly scientificActivityTypeOptions = Object.values(ScientificActivityType).map(v => ({ value: v, label: v }));
  public readonly scientificActivityRoleOptions = Object.values(ScientificActivityRole).map(v => ({ value: v, label: v }));

  public readonly dynamicFields: EducationDynamicField[] = [
      { name: 'type', label: 'Tipo de Educación', type: 'select', required: true, helpText: 'Selecciona el tipo de educación', options: this.educationTypeOptions },
      { name: 'title', label: 'Título o Nombre', type: 'text', required: true, placeholder: 'Ej: Abogacía', helpText: 'Nombre completo del título' },
      { name: 'institution', label: 'Institución', type: 'text', required: true, placeholder: 'Ej: Universidad de Buenos Aires', helpText: 'Nombre de la institución' },
      { name: 'status', label: 'Estado', type: 'select', required: true, helpText: 'Estado actual', options: this.educationStatusOptions },
      { name: 'startDate', label: 'Fecha de Inicio', type: 'date', required: true, helpText: 'Fecha de comienzo' },
      { name: 'isOngoing', label: 'En Curso', type: 'checkbox', required: false, helpText: 'Marcar si está en curso', showWhen: form => form.status === EducationStatus.IN_PROGRESS },
      { name: 'endDate', label: 'Fecha de Fin', type: 'date', required: true, helpText: 'Fecha de finalización', showWhen: form => form.status === EducationStatus.COMPLETED || form.status === EducationStatus.SUSPENDED || form.status === EducationStatus.ABANDONED || (form.status === EducationStatus.IN_PROGRESS && !form.isOngoing) },
      { name: 'durationYears', label: 'Duración (años)', type: 'number', required: false, placeholder: '5', helpText: 'Duración de la carrera', showForTypes: [EducationType.UNIVERSITY_DEGREE] },
      { name: 'average', label: 'Promedio', type: 'number', required: false, min: 1, max: 10, placeholder: '8,50', helpText: 'Promedio general (usar coma como separador decimal)', showForTypes: [EducationType.UNIVERSITY_DEGREE] },
      { name: 'thesisTopic', label: 'Tema de Tesis', type: 'text', required: false, placeholder: 'Tema de tesis', helpText: 'Tema de la tesis o trabajo final', showForTypes: [EducationType.POSTGRADUATE_SPECIALIZATION, EducationType.MASTER_DEGREE, EducationType.DOCTORATE] },
      { name: 'hourlyLoad', label: 'Carga Horaria (hs)', type: 'number', required: false, placeholder: '120', helpText: 'Carga horaria total', showForTypes: [EducationType.DIPLOMA, EducationType.CERTIFICATION] },
      { name: 'activityType', label: 'Tipo de Actividad', type: 'select', required: true, helpText: 'Tipo de actividad científica', showForTypes: [EducationType.SCIENTIFIC_ACTIVITY], options: this.scientificActivityTypeOptions },
      { name: 'role', label: 'Rol', type: 'select', required: true, helpText: 'Rol en la actividad', showForTypes: [EducationType.SCIENTIFIC_ACTIVITY], options: this.scientificActivityRoleOptions },
      { name: 'comments', label: 'Comentarios', type: 'textarea', required: false, helpText: 'Información adicional' }
  ];
  
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly validationService: CvValidationService,
    private readonly transformService: CvTransformService,
    private readonly notificationService: CvNotificationService,
    private readonly documentosService: DocumentosService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupFormWatchers();
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
      form.reset({ type: EducationType.UNIVERSITY_DEGREE, status: EducationStatus.IN_PROGRESS }, { emitEvent: false });
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

  shouldShowField(field: EducationDynamicField): boolean {
    const form = this.form();
    if (!form) return false;
    const formValue = form.getRawValue();
    if (field.showForTypes && !field.showForTypes.includes(formValue.type)) return false;
    if (field.showWhen && !field.showWhen(formValue)) return false;
    return true;
  }

  /**
   * TrackBy function para campos dinámicos
   */
  trackByFieldName = (index: number, field: EducationDynamicField): string => {
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
    const field = this.dynamicFields.find(f => f.name === fieldName);
    return field?.label || fieldName;
  }

  /**
   * Obtiene las opciones para un campo select
   */
  getSelectOptions(fieldName: string): { value: any; label: string }[] {
    const field = this.dynamicFields.find(f => f.name === fieldName);
    return field?.options || [];
  }

  /**
   * Obtiene un FormControl de forma segura
   */
  getFormControl(fieldName: string): any {
    const form = this.form();
    return form?.get(fieldName) || null;
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
    this.cdr.markForCheck();
  }

  onDocumentValidationChange(validation: DocumentValidationState): void {
    this.documentValidation = validation;
    this.form()?.updateValueAndValidity();
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

    newForm.markAsPristine();
    newForm.markAsUntouched();
    this.form.set(newForm);
    this.updateFormValidators();

    if (this.isEditing) {
      this.runValidation(newForm.getRawValue());
    } else {
      this.validationState.set({ isValid: true, errors: [], warnings: [] });
    }
    this.cdr.markForCheck();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      type: [EducationType.UNIVERSITY_DEGREE, Validators.required],
      title: ['', [Validators.required, Validators.maxLength(255)]],
      institution: ['', [Validators.required, Validators.maxLength(255)]],
      status: [EducationStatus.COMPLETED, Validators.required],
      startDate: ['', Validators.required],
      endDate: [''],
      isOngoing: [false],
      comments: ['', [Validators.maxLength(2000)]],
      durationYears: [null],
      average: [null],
      thesisTopic: [''],
      hourlyLoad: [null],
      activityType: [null],
      role: [null],
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
      this.runValidation(value);
    });

    form.get('type')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(type => {
      this.selectedType.set(type);
      this.updateFormValidators();
    });

    // Watcher para sincronizar estado con isOngoing
    form.get('status')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(status => {
      const isOngoingControl = form.get('isOngoing');
      const endDateControl = form.get('endDate');

      if (status === EducationStatus.IN_PROGRESS) {
        // Si el estado es "En Curso", marcar isOngoing y limpiar fecha de fin
        isOngoingControl?.setValue(true, { emitEvent: false });
        endDateControl?.setValue(null, { emitEvent: false });
      } else if (status === EducationStatus.COMPLETED) {
        // Si el estado es "Completado", desmarcar isOngoing
        isOngoingControl?.setValue(false, { emitEvent: false });
      }

      // Forzar re-evaluación de campos visibles
      this.fieldVisibilityTrigger.set(this.fieldVisibilityTrigger() + 1);
      this.updateFormValidators();
    });

    form.get('isOngoing')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(isOngoing => {
        const endDateControl = form.get('endDate');
        const statusControl = form.get('status');

        if(isOngoing) {
            endDateControl?.setValue(null, { emitEvent: false });
            // Si se marca "En Curso", cambiar el estado automáticamente
            if (statusControl?.value !== EducationStatus.IN_PROGRESS) {
              statusControl?.setValue(EducationStatus.IN_PROGRESS, { emitEvent: false });
            }
        }

        // Forzar re-evaluación de campos visibles
        this.fieldVisibilityTrigger.set(this.fieldVisibilityTrigger() + 1);
        this.updateFormValidators();
    });
  }

  private runValidation(value: any): void {
    const form = this.form();
    if (!form) return;

    const validationResult = this.validationService.validateEducation(value);
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
  
  private updateFormValidators(): void {
    const form = this.form();
    if (!form) return;
    
    const type = form.get('type')?.value;
    const isOngoing = form.get('isOngoing')?.value;
    
    this.clearConditionalValidators();

    form.get('endDate')?.setValidators(!isOngoing ? [Validators.required] : null);

    if (type === EducationType.UNIVERSITY_DEGREE) {
        form.get('durationYears')?.setValidators([Validators.required, Validators.min(1), Validators.max(10)]);
        form.get('average')?.setValidators([Validators.min(1), Validators.max(10)]);
    } else if (type === EducationType.DIPLOMA || type === EducationType.CERTIFICATION) {
        form.get('hourlyLoad')?.setValidators([Validators.required, Validators.min(1)]);
    } else if (type === EducationType.SCIENTIFIC_ACTIVITY) {
        form.get('activityType')?.setValidators(Validators.required);
        form.get('role')?.setValidators(Validators.required);
    }
    
    Object.keys(form.controls).forEach(key => {
        form.get(key)?.updateValueAndValidity({ emitEvent: false });
    });
  }
  
  private clearConditionalValidators(): void {
      const form = this.form();
      if (!form) return;
      
      form.get('durationYears')?.clearValidators();
      form.get('average')?.clearValidators();
      form.get('hourlyLoad')?.clearValidators();
      form.get('activityType')?.clearValidators();
      form.get('role')?.clearValidators();
      form.get('endDate')?.clearValidators();
  }

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
}
