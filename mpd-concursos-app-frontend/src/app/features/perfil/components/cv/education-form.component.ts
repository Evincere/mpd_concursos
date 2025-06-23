/**
 * Componente de Formulario de Educación
 * 
 * @description Formulario inteligente y reactivo para gestionar información educativa
 * @author Augment Agent
 * @date 2025-06-22
 * @version 1.0.0
 */

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Modelos y servicios del CV
import {
  EducationEntry,
  EducationDto,
  FormMode,
  ValidationResult,
  CvValidationService,
  CvTransformService,
  CvNotificationService
} from '@core/services/cv';

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

// Componentes compartidos
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomDatepickerComponent } from '@shared/components/custom-form/custom-datepicker/custom-datepicker.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';

// Componente uploader CV
import { CvDocumentUploaderComponent, CvDocument, DocumentValidationState } from './cv-document-uploader/cv-document-uploader.component';

@Component({
  selector: 'app-education-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomFormFieldComponent,
    CustomDatepickerComponent,
    CustomButtonComponent,
    CvDocumentUploaderComponent
  ],
  templateUrl: './education-form.component.html',
  styleUrls: ['./education-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EducationFormComponent implements OnInit, OnDestroy {

  // ===== INPUTS Y OUTPUTS =====
  @Input() education: EducationEntry | null = null;
  @Input() mode: FormMode = 'create';
  @Input() isLoading = false;
  @Input() isInModal = false;

  @Output() save = new EventEmitter<EducationDto>();
  @Output() cancel = new EventEmitter<void>();
  @Output() validationChange = new EventEmitter<any>();

  // ===== PROPIEDADES PÚBLICAS =====
  public formData: EducationDto | null = null;
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
      name: 'institution',
      label: 'Institución Educativa',
      type: 'text',
      required: true,
      helpText: 'Nombre completo de la institución educativa'
    },
    {
      name: 'degree',
      label: 'Título/Grado',
      type: 'text',
      required: true,
      helpText: 'Título, grado o certificación obtenida'
    },
    {
      name: 'fieldOfStudy',
      label: 'Campo de Estudio',
      type: 'text',
      required: false,
      helpText: 'Área o especialización de estudio'
    },
    {
      name: 'startDate',
      label: 'Fecha de Inicio',
      type: 'date',
      required: true,
      helpText: 'Fecha en que comenzaste los estudios'
    },
    {
      name: 'isCurrentStudy',
      label: 'Estudio Actual',
      type: 'checkbox',
      required: false,
      helpText: 'Marca si actualmente estás cursando'
    },
    {
      name: 'endDate',
      label: 'Fecha de Finalización',
      type: 'date',
      required: false,
      helpText: 'Fecha en que completaste los estudios',
      showWhen: (formValue: any) => !formValue.isCurrentStudy
    },
    {
      name: 'grade',
      label: 'Calificación/Promedio',
      type: 'text',
      required: false,
      helpText: 'Calificación final o promedio obtenido'
    },
    {
      name: 'description',
      label: 'Descripción',
      type: 'textarea',
      required: false,
      helpText: 'Información adicional sobre tus estudios (máximo 1000 caracteres)'
    },
    {
      name: 'skills',
      label: 'Habilidades Adquiridas',
      type: 'chips',
      required: false,
      helpText: 'Habilidades y conocimientos adquiridos (máximo 15)'
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
   * Guarda la educación
   */
  onSave(): void {
    if (!this.validateForm()) {
      this.notificationService.showValidationErrors(this.validationState().errors);
      return;
    }

    const formValue = this.form().value;
    const validationResult = this.validationService.validateEducation(formValue);

    if (!validationResult.isValid) {
      this.notificationService.showValidationErrors(validationResult.errors);
      return;
    }

    // Usar datos sanitizados
    const sanitizedData = validationResult.sanitizedData as EducationDto;
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
    const validationResult = this.validationService.validateEducation(formValue);

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
   * Maneja el cambio en el checkbox de estudio actual
   */
  onCurrentStudyChange(isCurrentStudy: boolean): void {
    const endDateControl = this.form().get('endDate');

    if (isCurrentStudy) {
      endDateControl?.setValue(null);
      endDateControl?.clearValidators();
    } else {
      endDateControl?.setValidators([Validators.required]);
    }

    endDateControl?.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  /**
   * Maneja la adición de chips (habilidades)
   */
  onAddChip(fieldName: string, value: string): void {
    if (!value.trim()) return;

    const control = this.form().get(fieldName);
    const currentValues = control?.value || [];

    // Validar límites
    const maxItems = 15;
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

    if (this.education && this.mode !== 'create') {
      const dto = this.transformService.educationEntityToDto(this.education);
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
      institution: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      degree: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      fieldOfStudy: ['', [Validators.maxLength(200)]],
      startDate: ['', [Validators.required]],
      endDate: [''],
      isCurrentStudy: [false],
      grade: ['', [Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(1000)]],
      skills: [[]]
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

    // Watcher específico para estudio actual
    this.form().get('isCurrentStudy')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isCurrentStudy => {
      this.onCurrentStudyChange(isCurrentStudy);
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
