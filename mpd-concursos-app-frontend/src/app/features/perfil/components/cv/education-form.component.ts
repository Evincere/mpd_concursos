/**
 * Componente de Formulario de Educación
 *
 * @description Formulario inteligente y reactivo para gestionar información educativa
 * @author Augment Agent
 * @date 2025-06-22
 * @version 1.0.0
 */

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Modelos y servicios del CV
import {
  EducationEntry,
  EducationDto,
  EducationType,
  EducationStatus,
  UniversityEducation,
  PostgraduateEducation,
  DiplomaEducation,
  ScientificActivity,
  ScientificActivityType,
  ScientificActivityRole,
  ICvFormComponent,
  FormMode,
  FormValidationResult,
  ValidationResult,
  CvValidationService,
  CvTransformService,
  CvNotificationService
} from '@core/services/cv';

// Servicios adicionales
import { DocumentosService } from '@core/services/documentos/documentos.service';

// Componentes compartidos
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomSelectComponent } from '@shared/components/custom-form/custom-select/custom-select.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomDatepickerComponent } from '@shared/components/custom-form/custom-datepicker/custom-datepicker.component';
import { CustomNumberInputComponent } from '@shared/components/custom-form/custom-number-input/custom-number-input.component';

// Componente uploader CV
import { CvDocumentUploaderComponent, CvDocument, DocumentValidationState } from './cv-document-uploader/cv-document-uploader.component';

/**
 * Configuración de campo dinámico para educación
 */
interface EducationDynamicField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'checkbox' | 'select' | 'number' | 'chips';
  required: boolean;
  placeholder?: string;
  helpText?: string;
  validation?: any;
  showForTypes?: EducationType[];
  showWhen?: (formValue: any) => boolean;
  options?: { value: any; label: string }[];
  min?: number;
  max?: number;
  step?: number;
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

  // ===== INPUTS Y OUTPUTS =====
  @Input() education: EducationEntry | null = null;
  @Input() mode: FormMode = 'create';
  @Input() isLoading = false;
  @Input() isInModal = false;

  @Output() save = new EventEmitter<EducationDto>();
  @Output() cancel = new EventEmitter<void>();
  @Output() validationChange = new EventEmitter<FormValidationResult>();

  // ===== PROPIEDADES DE LA INTERFAZ =====
  public formData: EducationDto = {} as EducationDto;
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
  public readonly selectedType = signal<EducationType>(EducationType.UNIVERSITY_DEGREE);
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
    !this.isInitializing && this.validationState().errors.length > 0
  );

  public readonly hasWarnings = computed(() =>
    !this.isInitializing && this.validationState().warnings.length > 0
  );

  public readonly visibleFields = computed(() =>
    this.dynamicFields.filter(field => this.shouldShowField(field))
  );

  // ===== OPCIONES DE SELECCIÓN =====
  public readonly educationTypeOptions = [
    { value: EducationType.SECONDARY, label: 'Educación Secundaria' },
    { value: EducationType.TECHNICAL, label: 'Título Terciario' },
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
    { value: EducationStatus.COMPLETED, label: 'Completado' },
    { value: EducationStatus.SUSPENDED, label: 'Suspendido' },
    { value: EducationStatus.ABANDONED, label: 'Abandonado' }
  ];

  public readonly scientificActivityTypeOptions = [
    { value: ScientificActivityType.CONFERENCE, label: 'Conferencia' },
    { value: ScientificActivityType.WORKSHOP, label: 'Taller' },
    { value: ScientificActivityType.SEMINAR, label: 'Seminario' },
    { value: ScientificActivityType.CONGRESS, label: 'Congreso' },
    { value: ScientificActivityType.PUBLICATION, label: 'Publicación' },
    { value: ScientificActivityType.SYMPOSIUM, label: 'Simposio' }
  ];

  public readonly scientificActivityRoleOptions = [
    { value: ScientificActivityRole.AUTHOR, label: 'Autor' },
    { value: ScientificActivityRole.CO_AUTHOR, label: 'Coautor' },
    { value: ScientificActivityRole.SPEAKER, label: 'Expositor' },
    { value: ScientificActivityRole.ORGANIZER, label: 'Organizador' },
    { value: ScientificActivityRole.ATTENDEE, label: 'Participante' },
    { value: ScientificActivityRole.MODERATOR, label: 'Moderador' }
  ];

  // ===== CONFIGURACIÓN DE CAMPOS DINÁMICOS =====
  public readonly dynamicFields: EducationDynamicField[] = [
    {
      name: 'type',
      label: 'Tipo de Educación',
      type: 'select',
      required: true,
      helpText: 'Selecciona el tipo de educación o formación'
    },
    {
      name: 'title',
      label: 'Título o Nombre',
      type: 'text',
      required: true,
      placeholder: 'Ej: Licenciatura en Sistemas de Información',
      helpText: 'Nombre completo del título, curso o actividad'
    },
    {
      name: 'institution',
      label: 'Institución',
      type: 'text',
      required: true,
      placeholder: 'Ej: Universidad Nacional de Buenos Aires',
      helpText: 'Nombre de la institución educativa'
    },
    {
      name: 'status',
      label: 'Estado',
      type: 'select',
      required: true,
      helpText: 'Estado actual de la educación'
    },
    {
      name: 'startDate',
      label: 'Fecha de Inicio',
      type: 'date',
      required: true,
      helpText: 'Fecha en que comenzaste los estudios'
    },
    {
      name: 'isOngoing',
      label: 'En Curso',
      type: 'checkbox',
      required: false,
      helpText: 'Marca si actualmente estás cursando'
    },
    {
      name: 'endDate',
      label: 'Fecha de Finalización',
      type: 'date',
      required: false,
      helpText: 'Fecha en que terminaste o esperas terminar',
      showWhen: (formValue: any) => !formValue.isOngoing
    },
    // Campos específicos para educación universitaria
    {
      name: 'durationYears',
      label: 'Duración (años)',
      type: 'number',
      required: false,
      placeholder: '5',
      helpText: 'Duración total de la carrera en años',
      showForTypes: [EducationType.UNIVERSITY_DEGREE],
      min: 1,
      max: 10
    },
    {
      name: 'average',
      label: 'Promedio Académico',
      type: 'number',
      required: false,
      placeholder: '8,5',
      helpText: 'Promedio académico (1-10). Usar coma para decimales',
      showForTypes: [EducationType.UNIVERSITY_DEGREE],
      min: 1,
      max: 10,
      step: 0.1
    },
    // Campos específicos para posgrados
    {
      name: 'thesisTopic',
      label: 'Tema de Tesis',
      type: 'textarea',
      required: false,
      placeholder: 'Título y descripción breve de la tesis...',
      helpText: 'Tema o título de la tesis de posgrado',
      showForTypes: [
        EducationType.POSTGRADUATE_SPECIALIZATION,
        EducationType.MASTER_DEGREE,
        EducationType.DOCTORATE
      ]
    },
    {
      name: 'advisor',
      label: 'Director de Tesis',
      type: 'text',
      required: false,
      placeholder: 'Dr. Juan Pérez',
      helpText: 'Nombre del director o tutor de tesis',
      showForTypes: [
        EducationType.POSTGRADUATE_SPECIALIZATION,
        EducationType.MASTER_DEGREE,
        EducationType.DOCTORATE
      ]
    },
    // Campos específicos para diplomas y certificaciones
    {
      name: 'hourlyLoad',
      label: 'Carga Horaria',
      type: 'number',
      required: false,
      placeholder: '120',
      helpText: 'Cantidad total de horas del curso',
      showForTypes: [EducationType.DIPLOMA, EducationType.CERTIFICATION],
      min: 1,
      max: 2000
    },
    // Campos específicos para actividades científicas
    {
      name: 'activityType',
      label: 'Tipo de Actividad',
      type: 'select',
      required: false,
      helpText: 'Tipo de actividad científica',
      showForTypes: [EducationType.SCIENTIFIC_ACTIVITY]
    },
    {
      name: 'role',
      label: 'Rol en la Actividad',
      type: 'select',
      required: false,
      helpText: 'Tu rol en la actividad científica',
      showForTypes: [EducationType.SCIENTIFIC_ACTIVITY]
    },
    {
      name: 'topic',
      label: 'Tema/Tópico',
      type: 'textarea',
      required: false,
      placeholder: 'Descripción del tema tratado...',
      helpText: 'Tema principal de la actividad científica',
      showForTypes: [EducationType.SCIENTIFIC_ACTIVITY]
    },
    {
      name: 'venue',
      label: 'Lugar/Evento',
      type: 'text',
      required: false,
      placeholder: 'Ej: Congreso Internacional de IA 2024',
      helpText: 'Lugar o evento donde se realizó la actividad',
      showForTypes: [EducationType.SCIENTIFIC_ACTIVITY]
    },
    {
      name: 'comments',
      label: 'Comentarios Adicionales',
      type: 'textarea',
      required: false,
      placeholder: 'Información adicional relevante...',
      helpText: 'Cualquier información adicional que consideres relevante'
    }
  ];

  // ===== SUBJECTS =====
  private readonly destroy$ = new Subject<void>();

  // ===== CONTROL DE INICIALIZACIÓN =====
  private isInitializing = true;

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
    this.isInitializing = true;
    this.initializeForm();
    this.setupValidation();
    this.setupFormWatchers();

    // Marcar como inicializado después de un breve delay para permitir que el formulario se estabilice
    setTimeout(() => {
      this.isInitializing = false;
    }, 100);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Si cambia el modo o la educación, reinicializar el formulario
    if (changes['mode'] || changes['education']) {
      if (this.form()) {
        this.initializeForm();
      }
    }
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
    const form = this.form();
    if (!form || !this.validateForm()) {
      this.notificationService.showValidationErrors(this.validationState().errors);
      return;
    }

    // VALIDACIÓN CRÍTICA: Verificar que el documento de respaldo esté presente
    if (!this.documentValidation.isValid) {
      this.notificationService.showError('Es obligatorio adjuntar un documento que respalde esta educación');
      return;
    }

    // VALIDACIÓN ADICIONAL: Verificar coherencia entre estado y fechas
    const formValue = form.value;
    const status = formValue.status;
    const isOngoing = formValue.isOngoing;
    const endDate = formValue.endDate;

    // Validar coherencia de estado
    if (status === EducationStatus.COMPLETED && !endDate) {
      this.notificationService.showError('Para estudios completados es obligatorio especificar la fecha de finalización');
      return;
    }

    if (status === EducationStatus.IN_PROGRESS && endDate) {
      this.notificationService.showError('Los estudios en curso no pueden tener fecha de finalización');
      return;
    }

    if (isOngoing && status !== EducationStatus.IN_PROGRESS) {
      this.notificationService.showError('Si los estudios están en curso, el estado debe ser "En Curso"');
      return;
    }

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
    this.resetForm();
  }

  /**
   * Resetea el formulario sin confirmación (para uso interno)
   */
  public resetForm(): void {
    // Marcar como inicializando para evitar validación prematura
    this.isInitializing = true;

    const form = this.form();
    if (form) {
      // Resetear valores pero mantener el estado pristine/untouched
      form.reset();
      form.markAsUntouched();
      form.markAsPristine();
    }

    // Resetear también el estado de documentos
    this.documentValidation = {
      isValid: false,
      hasRequiredDocuments: false,
      errors: [],
      warnings: []
    };

    this.documents = [];
    this.uploadedDocument.set(null);

    // Resetear estado de validación
    this.validationState.set({
      isValid: false,
      errors: [],
      warnings: []
    });

    // Reinicializar el formulario
    this.initializeForm();

    // Marcar como inicializado después de un breve delay
    setTimeout(() => {
      this.isInitializing = false;
    }, 100);

    this.cdr.markForCheck();
  }

  /**
   * Valida el formulario completo
   */
  validateForm(): boolean {
    const form = this.form();
    if (!form) {
      return false;
    }

    // No validar durante la inicialización
    if (this.isInitializing) {
      return false;
    }

    const formValue = form.value;
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
   * Verifica si un campo debe mostrarse según el tipo de educación
   */
  shouldShowField(field: EducationDynamicField): boolean {
    // Verificar condición showWhen primero
    if (field.showWhen && !field.showWhen(this.form()?.value || {})) {
      return false;
    }

    // Verificar showForTypes si está definido
    if (field.showForTypes && field.showForTypes.length > 0) {
      return field.showForTypes.includes(this.selectedType());
    }

    return true;
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
   * Obtiene un FormControl de forma segura para date pickers
   */
  getFormControl(fieldName: string): any {
    const form = this.form();
    if (!form) return null;

    const control = form.get(fieldName);
    return control || null;
  }

  /**
   * Obtiene un AbstractControl de forma segura para el template
   */
  getControl(fieldName: string): any {
    const form = this.form();
    if (!form) return null;

    return form.get(fieldName) || null;
  }

  /**
   * Obtiene las opciones para un campo select
   */
  getSelectOptions(fieldName: string): { value: any; label: string }[] {
    switch (fieldName) {
      case 'type':
        return this.educationTypeOptions;
      case 'status':
        return this.educationStatusOptions;
      case 'activityType':
        return this.scientificActivityTypeOptions;
      case 'role':
        return this.scientificActivityRoleOptions;
      default:
        return [];
    }
  }

  /**
   * TrackBy function para campos dinámicos
   */
  trackByFieldName(index: number, field: EducationDynamicField): string {
    return field.name;
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
   * Maneja el cambio de tipo de educación
   */
  onEducationTypeChange(type: EducationType): void {
    this.selectedType.set(type);
    this.updateFormValidators();
    this.cdr.markForCheck();
  }

  /**
   * Determina si debe mostrarse el campo de fecha de finalización
   */
  shouldShowEndDate(): boolean {
    const form = this.form();
    if (!form) return false;

    const status = form.get('status')?.value;
    const isOngoing = form.get('isOngoing')?.value;

    // No mostrar fecha de fin si está en curso
    if (isOngoing || status === EducationStatus.IN_PROGRESS) {
      return false;
    }

    // Mostrar para todos los demás estados
    return true;
  }

  /**
   * Obtiene el texto de ayuda para la fecha de finalización según el estado
   */
  getEndDateHint(): string {
    const form = this.form();
    if (!form) return 'Fecha en que terminaste los estudios';

    const status = form.get('status')?.value;

    switch (status) {
      case EducationStatus.COMPLETED:
        return 'Fecha en que completaste los estudios (obligatorio)';
      case EducationStatus.SUSPENDED:
        return 'Fecha en que suspendiste los estudios (opcional)';
      case EducationStatus.ABANDONED:
        return 'Fecha en que abandonaste los estudios (opcional)';
      default:
        return 'Fecha en que terminaste los estudios';
    }
  }

  /**
   * Maneja el cambio en el checkbox de en curso
   */
  onOngoingChange(isOngoing: boolean): void {
    const form = this.form();
    if (!form) return;

    const statusControl = form.get('status');
    const endDateControl = form.get('endDate');

    // Evitar bucles infinitos verificando si el cambio es necesario
    if (isOngoing) {
      // Si está en curso, cambiar el estado automáticamente solo si no es IN_PROGRESS
      if (statusControl?.value !== EducationStatus.IN_PROGRESS) {
        statusControl?.setValue(EducationStatus.IN_PROGRESS, { emitEvent: false });
      }
      endDateControl?.setValue(null);
      endDateControl?.clearValidators();
    } else {
      // Si no está en curso, cambiar a completado por defecto solo si era IN_PROGRESS
      if (statusControl?.value === EducationStatus.IN_PROGRESS) {
        statusControl?.setValue(EducationStatus.COMPLETED, { emitEvent: false });
      }
      this.updateEndDateValidators();
    }

    endDateControl?.updateValueAndValidity({ emitEvent: false });
    this.cdr.markForCheck();
  }

  /**
   * Maneja el cambio de documentos del uploader
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

  /**
   * Maneja el cambio de estado de educación
   */
  onEducationStatusChange(status: EducationStatus): void {
    const form = this.form();
    if (!form) return;

    const isOngoingControl = form.get('isOngoing');
    const endDateControl = form.get('endDate');

    // Evitar bucles infinitos verificando si el cambio es necesario
    const currentIsOngoing = isOngoingControl?.value;

    if (status === EducationStatus.IN_PROGRESS) {
      if (!currentIsOngoing) {
        isOngoingControl?.setValue(true, { emitEvent: false });
      }
      endDateControl?.setValue(null);
      endDateControl?.clearValidators();
    } else {
      if (currentIsOngoing) {
        isOngoingControl?.setValue(false, { emitEvent: false });
      }
      this.updateEndDateValidators();
    }

    endDateControl?.updateValueAndValidity({ emitEvent: false });
    this.cdr.markForCheck();
  }

  /**
   * Actualiza los validadores de fecha de fin según el estado
   */
  private updateEndDateValidators(): void {
    const form = this.form();
    if (!form) return;

    const status = form.get('status')?.value;
    const endDateControl = form.get('endDate');

    // Limpiar validadores existentes
    endDateControl?.clearValidators();

    // Aplicar validadores según el estado
    switch (status) {
      case EducationStatus.COMPLETED:
        // Para estudios completados, la fecha de fin es obligatoria
        endDateControl?.setValidators([Validators.required]);
        break;

      case EducationStatus.IN_PROGRESS:
        // Para estudios en curso, no se requiere fecha de fin
        break;

      case EducationStatus.SUSPENDED:
      case EducationStatus.ABANDONED:
        // Para estudios suspendidos o abandonados, la fecha de fin es opcional
        // pero si se proporciona debe ser válida
        break;
    }

    endDateControl?.updateValueAndValidity({ emitEvent: false });
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
      this.selectedType.set(this.education.type);
      this.isEditing = true;
    } else {
      // Para nuevas educaciones, resetear completamente el estado
      this.selectedType.set(EducationType.UNIVERSITY_DEGREE);
      this.isEditing = false;
      this.uploadedDocument.set(null);

      // Establecer valores por defecto coherentes
      formGroup.patchValue({
        type: EducationType.UNIVERSITY_DEGREE,
        status: EducationStatus.COMPLETED,
        isOngoing: false,
        title: '',
        institution: '',
        startDate: '',
        endDate: '',
        durationYears: '',
        average: '',
        thesisTopic: '',
        advisor: '',
        hourlyLoad: '',
        activityType: '',
        role: '',
        topic: '',
        venue: '',
        comments: ''
      });
    }

    this.form.set(formGroup);

    // Configurar validadores iniciales después de establecer el formulario
    this.updateEndDateValidators();

    this.cdr.markForCheck();
  }

  /**
   * Crea el FormGroup
   */
  private createForm(): FormGroup {
    return this.fb.group({
      type: [EducationType.UNIVERSITY_DEGREE, [Validators.required]],
      status: [EducationStatus.COMPLETED, [Validators.required]],
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      institution: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      startDate: ['', [Validators.required]],
      endDate: [''],
      isOngoing: [false],

      // Campos específicos (se validan condicionalmente)
      durationYears: [''],
      average: [''],
      thesisTopic: [''],
      advisor: [''],
      hourlyLoad: [''],
      activityType: [''],
      role: [''],
      topic: [''],
      venue: [''],
      comments: ['', [Validators.maxLength(1000)]],

      // Campos adicionales del remoto
      degree: ['', [Validators.maxLength(200)]],
      fieldOfStudy: ['', [Validators.maxLength(200)]],
      grade: ['', [Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(1000)]],
      skills: [[]]
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
        // Solo validar si no estamos inicializando
        if (!this.isInitializing) {
          this.validateForm();
        }
      }
    });

    // Watcher específico para tipo de educación
    form.get('type')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(type => {
      this.onEducationTypeChange(type);
    });

    // Watcher específico para en curso
    form.get('isOngoing')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isOngoing => {
      this.onOngoingChange(isOngoing);
    });

    // Watcher específico para estado de educación
    form.get('status')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(status => {
      this.onEducationStatusChange(status);
    });
  }

  /**
   * Actualiza validadores según el tipo de educación
   */
  private updateFormValidators(): void {
    const form = this.form();
    if (!form) return;

    const type = this.selectedType();

    // Limpiar validadores específicos
    this.clearConditionalValidators();

    // Aplicar validadores según el tipo
    switch (type) {
      case EducationType.UNIVERSITY_DEGREE:
        form.get('durationYears')?.setValidators([Validators.min(1), Validators.max(10)]);
        form.get('average')?.setValidators([Validators.min(1), Validators.max(10)]);
        break;

      case EducationType.POSTGRADUATE_SPECIALIZATION:
      case EducationType.MASTER_DEGREE:
      case EducationType.DOCTORATE:
        form.get('thesisTopic')?.setValidators([Validators.maxLength(500)]);
        form.get('advisor')?.setValidators([Validators.maxLength(100)]);
        break;

      case EducationType.DIPLOMA:
      case EducationType.CERTIFICATION:
        form.get('hourlyLoad')?.setValidators([Validators.min(1), Validators.max(2000)]);
        break;

      case EducationType.SCIENTIFIC_ACTIVITY:
        form.get('activityType')?.setValidators([Validators.required]);
        form.get('role')?.setValidators([Validators.required]);
        form.get('topic')?.setValidators([Validators.required, Validators.maxLength(500)]);
        break;
    }

    // Actualizar validación sin emitir eventos para evitar recursión
    Object.keys(form.controls).forEach(key => {
      form.get(key)?.updateValueAndValidity({ emitEvent: false });
    });
  }

  /**
   * Limpia validadores condicionales
   */
  private clearConditionalValidators(): void {
    const form = this.form();
    if (!form) return;

    const conditionalFields = [
      'durationYears', 'average', 'thesisTopic', 'advisor',
      'hourlyLoad', 'activityType', 'role', 'topic', 'venue'
    ];

    conditionalFields.forEach(field => {
      form.get(field)?.clearValidators();
      form.get(field)?.updateValueAndValidity({ emitEvent: false });
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
   * Maneja la selección de archivo de documento de respaldo
   */
  onDocumentFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    // Validar tipo de archivo
    if (!this.isValidFileType(file)) {
      this.notificationService.showError('Solo se permiten archivos PDF, DOC, DOCX o imágenes (JPG, PNG)');
      input.value = '';
      return;
    }

    // Validar tamaño de archivo (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.notificationService.showError('El archivo no puede superar los 10MB');
      input.value = '';
      return;
    }

    // Actualizar el formulario y el signal
    const form = this.form();
    if (form) {
      form.get('supportDocument')?.setValue(file);
      this.uploadedDocument.set(file);
      this.notificationService.showSuccess(`Documento "${file.name}" seleccionado correctamente`);
    }
  }

  /**
   * Elimina el documento seleccionado
   */
  onRemoveDocument(): void {
    const form = this.form();
    if (form) {
      form.get('supportDocument')?.setValue(null);
      this.uploadedDocument.set(null);

      // Limpiar el input file
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }

  /**
   * Valida el tipo de archivo
   */
  private isValidFileType(file: File): boolean {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    return allowedTypes.includes(file.type);
  }
}
