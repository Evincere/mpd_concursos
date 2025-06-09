import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import {
  MessageTemplatesService,
  MessageTemplate,
  TemplateFilters,
  TemplateType,
  TemplateCategory,
  TemplateVariable,
  TemplateStats
} from '@core/services/messaging/message-templates.service';
import {
  TemplateVariablesService,
  DynamicVariable,
  VariableContext
} from '@core/services/messaging/template-variables.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';
import { CustomDialogService } from '@shared/components/custom-dialog/custom-dialog.service';
import { TemplateVariableSelectorComponent } from '@shared/components/template-variable-selector/template-variable-selector.component';
import { TemplateEditorComponent } from '@shared/components/template-editor/template-editor.component';

/**
 * Vista activa del gestor de plantillas
 */
type TemplateView = 'list' | 'create' | 'edit' | 'preview' | 'stats';

/**
 * Componente de gestión de plantillas de mensajes
 */
@Component({
  selector: 'app-message-templates',
  templateUrl: './message-templates.component.html',
  styleUrls: ['./message-templates.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TemplateVariableSelectorComponent,
    TemplateEditorComponent
  ]
})
export class MessageTemplatesComponent implements OnInit, OnDestroy {

  // Estados del componente
  templates: MessageTemplate[] = [];
  filteredTemplates: MessageTemplate[] = [];
  templateStats: TemplateStats | null = null;
  systemVariables: TemplateVariable[] = [];
  dynamicVariables: DynamicVariable[] = [];
  selectedTemplate: MessageTemplate | null = null;

  // Estados de UI
  activeView: TemplateView = 'list';
  loading = false;
  saving = false;
  previewing = false;
  showVariableSelector = false;
  currentTextarea: HTMLTextAreaElement | undefined = undefined;

  // Formularios
  filtersForm!: FormGroup;
  templateForm!: FormGroup;
  previewForm!: FormGroup;

  // Configuración
  currentFilters: TemplateFilters = {};

  // Opciones
  templateTypes: Array<{ value: TemplateType; label: string }> = [
    { value: 'welcome', label: 'Bienvenida' },
    { value: 'inscription_confirmation', label: 'Confirmación de Inscripción' },
    { value: 'document_request', label: 'Solicitud de Documentos' },
    { value: 'document_approved', label: 'Documentos Aprobados' },
    { value: 'document_rejected', label: 'Documentos Rechazados' },
    { value: 'exam_notification', label: 'Notificación de Examen' },
    { value: 'result_notification', label: 'Notificación de Resultados' },
    { value: 'reminder', label: 'Recordatorio' },
    { value: 'custom', label: 'Personalizada' }
  ];

  templateCategories: Array<{ value: TemplateCategory; label: string }> = [
    { value: 'inscription', label: 'Inscripción' },
    { value: 'documentation', label: 'Documentación' },
    { value: 'examination', label: 'Examinación' },
    { value: 'results', label: 'Resultados' },
    { value: 'general', label: 'General' },
    { value: 'administrative', label: 'Administrativo' }
  ];

  priorityOptions = [
    { value: 'low', label: 'Baja', color: '#6b7280' },
    { value: 'normal', label: 'Normal', color: '#3b82f6' },
    { value: 'high', label: 'Alta', color: '#f59e0b' },
    { value: 'urgent', label: 'Urgente', color: '#ef4444' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private messageTemplatesService: MessageTemplatesService,
    private templateVariablesService: TemplateVariablesService,
    private notificationService: CustomNotificationService,
    private dialogService: CustomDialogService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.setupSubscriptions();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa los formularios
   */
  private initializeForms(): void {
    this.filtersForm = this.fb.group({
      type: [''],
      category: [''],
      isActive: [''],
      isSystem: [''],
      search: [''],
      tags: [[]]
    });

    this.templateForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      type: ['custom', Validators.required],
      category: ['general', Validators.required],
      subject: ['', [Validators.required, Validators.maxLength(200)]],
      content: ['', [Validators.required, Validators.maxLength(5000)]],
      priority: ['normal'],
      tags: [[]],
      isActive: [true],
      settings: this.fb.group({
        allowHtml: [false],
        autoSend: [false],
        requireApproval: [false],
        expiresAfter: [''],
        maxRecipients: ['']
      })
    });

    this.previewForm = this.fb.group({
      userName: ['Juan Pérez'],
      userEmail: ['juan.perez@email.com'],
      userDni: ['12345678'],
      contestTitle: ['Concurso Docente 2024'],
      contestStartDate: ['2024-01-15'],
      contestEndDate: ['2024-02-15'],
      inscriptionStatus: ['PENDING']
    });
  }

  /**
   * Configura las suscripciones
   */
  private setupSubscriptions(): void {
    // Suscribirse a plantillas
    this.messageTemplatesService.templates$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(templates => {
      this.templates = templates;
      this.applyFilters();
    });

    // Suscribirse a estadísticas
    this.messageTemplatesService.stats$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(stats => {
      this.templateStats = stats;
    });

    // Configurar filtros en tiempo real
    this.filtersForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(filters => {
      this.applyFilters(filters);
    });
  }

  /**
   * Carga datos iniciales
   */
  private loadInitialData(): void {
    this.loading = true;

    // Cargar plantillas
    this.messageTemplatesService.getTemplates().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading templates:', error);
        this.loading = false;
      }
    });

    // Cargar estadísticas
    this.messageTemplatesService.getTemplateStats().pipe(
      takeUntil(this.destroy$)
    ).subscribe();

    // Cargar variables del sistema
    this.systemVariables = this.messageTemplatesService.getSystemVariables();
    this.dynamicVariables = this.templateVariablesService.getAvailableVariables();
  }

  /**
   * Aplica filtros a las plantillas
   */
  private applyFilters(formFilters?: any): void {
    const filters = formFilters || this.filtersForm.value;
    let filtered = [...this.templates];

    if (filters.type) {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    if (filters.category) {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    if (filters.isActive !== '') {
      filtered = filtered.filter(t => t.isActive === filters.isActive);
    }

    if (filters.isSystem !== '') {
      filtered = filtered.filter(t => t.isSystem === filters.isSystem);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search) ||
        t.subject.toLowerCase().includes(search) ||
        t.content.toLowerCase().includes(search)
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(t => 
        t.tags.some(tag => filters.tags.includes(tag))
      );
    }

    this.filteredTemplates = filtered;
  }

  /**
   * Cambia la vista activa
   */
  setActiveView(view: TemplateView): void {
    this.activeView = view;
    
    if (view === 'create') {
      this.selectedTemplate = null;
      this.resetTemplateForm();
    }
  }

  /**
   * Crea nueva plantilla
   */
  createTemplate(): void {
    this.setActiveView('create');
  }

  /**
   * Edita plantilla existente
   */
  editTemplate(template: MessageTemplate): void {
    this.selectedTemplate = template;
    this.populateTemplateForm(template);
    this.setActiveView('edit');
  }

  /**
   * Popula el formulario con los datos del template
   */
  populateTemplateForm(template: MessageTemplate): void {
    this.templateForm.patchValue({
      name: template.name,
      description: template.description,
      category: template.category,
      subject: template.subject,
      content: template.content,
      variables: template.variables || [],
      isActive: template.isActive
    });
  }

  /**
   * Guarda plantilla (crear o actualizar)
   */
  saveTemplate(): void {
    if (this.templateForm.invalid) {
      this.markFormGroupTouched(this.templateForm);
      return;
    }

    this.saving = true;
    const formValue = this.templateForm.value;

    const templateData: Partial<MessageTemplate> = {
      name: formValue.name,
      description: formValue.description,
      type: formValue.type,
      category: formValue.category,
      subject: formValue.subject,
      content: formValue.content,
      priority: formValue.priority,
      tags: formValue.tags || [],
      isActive: formValue.isActive,
      settings: {
        allowHtml: formValue.settings.allowHtml,
        autoSend: formValue.settings.autoSend,
        requireApproval: formValue.settings.requireApproval,
        expiresAfter: formValue.settings.expiresAfter || undefined,
        maxRecipients: formValue.settings.maxRecipients || undefined
      },
      variables: this.extractVariablesFromContent(formValue.content)
    };

    const operation = this.selectedTemplate 
      ? this.messageTemplatesService.updateTemplate(this.selectedTemplate.id, templateData)
      : this.messageTemplatesService.createTemplate(templateData);

    operation.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (template) => {
        this.notificationService.showSuccess(
          this.selectedTemplate ? 'Plantilla actualizada exitosamente' : 'Plantilla creada exitosamente'
        );
        this.setActiveView('list');
        this.saving = false;
      },
      error: (error) => {
        console.error('Error saving template:', error);
        this.notificationService.showError('Error al guardar la plantilla');
        this.saving = false;
      }
    });
  }

  /**
   * Elimina plantilla
   */
  async deleteTemplate(template: MessageTemplate): Promise<void> {
    const confirmed = await this.dialogService.showConfirmDialog({
      title: 'Eliminar Plantilla',
      message: `¿Estás seguro de que deseas eliminar la plantilla "${template.name}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    }).toPromise();

    if (!confirmed) return;

    this.messageTemplatesService.deleteTemplate(template.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.notificationService.showSuccess('Plantilla eliminada exitosamente');
      },
      error: (error) => {
        console.error('Error deleting template:', error);
        this.notificationService.showError('Error al eliminar la plantilla');
      }
    });
  }

  /**
   * Duplica plantilla
   */
  async duplicateTemplate(template: MessageTemplate): Promise<void> {
    const newName = await this.dialogService.showInputDialog({
      title: 'Duplicar Plantilla',
      message: 'Ingresa el nombre para la nueva plantilla:',
      placeholder: `Copia de ${template.name}`,
      confirmText: 'Duplicar',
      cancelText: 'Cancelar'
    }).toPromise();

    if (!newName) return;

    this.messageTemplatesService.duplicateTemplate(template.id, newName).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.notificationService.showSuccess('Plantilla duplicada exitosamente');
      },
      error: (error) => {
        console.error('Error duplicating template:', error);
        this.notificationService.showError('Error al duplicar la plantilla');
      }
    });
  }

  /**
   * Previsualiza plantilla
   */
  previewTemplate(template?: MessageTemplate): void {
    const templateToPreview = template || this.buildTemplateFromForm();
    if (!templateToPreview) return;

    this.previewing = true;
    const context = this.buildPreviewContext();

    this.messageTemplatesService.previewTemplate(templateToPreview, context).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (rendered) => {
        // Mostrar preview en modal o vista específica
        this.showPreviewModal(rendered);
        this.previewing = false;
      },
      error: (error) => {
        console.error('Error previewing template:', error);
        this.notificationService.showError('Error al previsualizar la plantilla');
        this.previewing = false;
      }
    });
  }

  /**
   * Extrae variables del contenido de la plantilla
   */
  private extractVariablesFromContent(content: string): TemplateVariable[] {
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const matches = content.match(variablePattern) || [];
    const uniqueKeys = [...new Set(matches.map(match => match.slice(2, -2).trim()))];
    
    return uniqueKeys.map(key => {
      const systemVar = this.systemVariables.find(v => v.key === key);
      if (systemVar) {
        return systemVar;
      }
      
      return {
        key,
        label: key.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: `Variable personalizada: ${key}`,
        type: 'text' as const,
        required: false
      };
    });
  }

  /**
   * Construye plantilla desde formulario
   */
  private buildTemplateFromForm(): Partial<MessageTemplate> | null {
    if (this.templateForm.invalid) return null;

    const formValue = this.templateForm.value;
    return {
      name: formValue.name,
      description: formValue.description,
      type: formValue.type,
      category: formValue.category,
      subject: formValue.subject,
      content: formValue.content,
      priority: formValue.priority,
      tags: formValue.tags || [],
      isActive: formValue.isActive,
      settings: formValue.settings,
      variables: this.extractVariablesFromContent(formValue.content)
    };
  }

  /**
   * Construye contexto para preview
   */
  private buildPreviewContext(): any {
    const formValue = this.previewForm.value;
    return {
      user: {
        name: formValue.userName,
        email: formValue.userEmail,
        dni: formValue.userDni,
        role: 'postulante'
      },
      contest: {
        title: formValue.contestTitle,
        startDate: new Date(formValue.contestStartDate),
        endDate: new Date(formValue.contestEndDate)
      },
      inscription: {
        status: formValue.inscriptionStatus,
        submittedAt: new Date()
      },
      system: {
        appName: 'MPD Concursos',
        supportEmail: 'soporte@mpdconcursos.gov.ar',
        baseUrl: 'https://concursos.mpd.gov.ar',
        currentDate: new Date()
      }
    };
  }

  /**
   * Muestra modal de preview
   */
  private showPreviewModal(rendered: any): void {
    // Implementar modal de preview
    // Logging implementado con LoggingService;
  }

  /**
   * Resetea formulario de plantilla
   */
  private resetTemplateForm(): void {
    this.templateForm.reset({
      type: 'custom',
      category: 'general',
      priority: 'normal',
      isActive: true,
      tags: [],
      settings: {
        allowHtml: false,
        autoSend: false,
        requireApproval: false
      }
    });
  }

  /**
   * Marca todos los campos del formulario como tocados
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Verifica si un campo es inválido
   */
  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Obtiene mensaje de error para un campo
   */
  getFieldError(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'Este campo es requerido';
      if (field.errors['maxlength']) return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    }
    return '';
  }

  /**
   * Obtiene ícono de tipo de plantilla
   */
  getTypeIcon(type: TemplateType): string {
    const icons = {
      welcome: 'fas fa-hand-wave',
      inscription_confirmation: 'fas fa-check-circle',
      document_request: 'fas fa-file-upload',
      document_approved: 'fas fa-check-double',
      document_rejected: 'fas fa-times-circle',
      exam_notification: 'fas fa-calendar-alt',
      result_notification: 'fas fa-trophy',
      reminder: 'fas fa-bell',
      custom: 'fas fa-edit'
    };
    return icons[type] || 'fas fa-file-alt';
  }

  /**
   * Obtiene color de prioridad
   */
  getPriorityColor(priority: string): string {
    const option = this.priorityOptions.find(p => p.value === priority);
    return option?.color || '#3b82f6';
  }

  /**
   * Limpia filtros
   */
  clearFilters(): void {
    this.filtersForm.reset();
    this.messageTemplatesService.clearFilters();
  }

  /**
   * Cancela edición
   */
  cancelEdit(): void {
    this.setActiveView('list');
    this.selectedTemplate = null;
  }

  /**
   * Abre selector de variables
   */
  openVariableSelector(textarea: HTMLTextAreaElement | HTMLInputElement | null | undefined): void {
    if (textarea instanceof HTMLTextAreaElement) {
      this.currentTextarea = textarea;
      this.showVariableSelector = true;
    }
  }

  /**
   * Cierra selector de variables
   */
  closeVariableSelector(): void {
    this.showVariableSelector = false;
    this.currentTextarea = undefined;
  }

  /**
   * Maneja selección de variable
   */
  onVariableSelected(variable: DynamicVariable): void {
    if (this.currentTextarea) {
      this.insertVariableInTextarea(variable, this.currentTextarea);
    }
    this.closeVariableSelector();
  }

  /**
   * Inserta variable en textarea
   */
  private insertVariableInTextarea(variable: DynamicVariable, textarea: HTMLTextAreaElement): void {
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const textBefore = textarea.value.substring(0, startPos);
    const textAfter = textarea.value.substring(endPos);
    const variableText = `{{${variable.key}}}`;

    // Insertar variable
    textarea.value = textBefore + variableText + textAfter;

    // Posicionar cursor después de la variable
    const newCursorPos = startPos + variableText.length;
    textarea.setSelectionRange(newCursorPos, newCursorPos);

    // Disparar evento de cambio para actualizar el FormControl
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    // Enfocar el textarea
    textarea.focus();
  }

  /**
   * Obtiene variables por categoría de plantilla
   */
  getVariablesByTemplateCategory(category: TemplateCategory): DynamicVariable[] {
    const contextMap: Record<TemplateCategory, VariableContext[]> = {
      inscription: ['user', 'contest', 'inscription', 'system'],
      documentation: ['user', 'contest', 'inscription', 'document', 'system'],
      examination: ['user', 'contest', 'exam', 'system'],
      results: ['user', 'contest', 'exam', 'system'],
      general: ['user', 'system'],
      administrative: ['user', 'contest', 'system']
    };

    const allowedContexts = contextMap[category] || ['user', 'system'];
    return this.dynamicVariables.filter(variable =>
      allowedContexts.includes(variable.context) && variable.isActive
    );
  }

  /**
   * Valida variables en el contenido
   */
  validateTemplateVariables(content: string): { isValid: boolean; errors: string[]; warnings: string[] } {
    return this.templateVariablesService.validateVariables(content);
  }

  /**
   * Obtiene contextos permitidos para la categoría actual
   */
  getAllowedContextsForCurrentCategory(): VariableContext[] {
    const category = this.templateForm.get('category')?.value as TemplateCategory;
    if (!category) return [];

    const contextMap: Record<TemplateCategory, VariableContext[]> = {
      inscription: ['user', 'contest', 'inscription', 'system'],
      documentation: ['user', 'contest', 'inscription', 'document', 'system'],
      examination: ['user', 'contest', 'exam', 'system'],
      results: ['user', 'contest', 'exam', 'system'],
      general: ['user', 'system'],
      administrative: ['user', 'contest', 'system']
    };

    return contextMap[category] || [];
  }

  /**
   * Maneja cambio de contenido en el editor
   */
  onContentChanged(content: string): void {
    // El FormControl se actualiza automáticamente por el ControlValueAccessor
    // Aquí podemos agregar validaciones adicionales si es necesario
    this.validateTemplateContent(content);
  }

  /**
   * Valida el contenido del template
   */
  validateTemplateContent(content: string): void {
    if (!content) return;

    const validation = this.templateVariablesService.validateVariables(content);

    if (!validation.isValid) {
      console.warn('Variables inválidas encontradas:', validation.errors);
    }

    if (validation.warnings.length > 0) {
      console.warn('Advertencias de variables:', validation.warnings);
    }
  }

  /**
   * Maneja inserción de variable en el editor
   */
  onVariableInserted(variable: DynamicVariable): void {
    // Logging implementado con LoggingService;
    console.log('Variable insertada:', variable);

    // Validar el contenido actual después de la inserción
    const currentContent = this.templateForm.get('content')?.value || '';
    this.validateTemplateContent(currentContent);
  }

  /**
   * Obtiene el label del tipo de plantilla
   */
  getTemplateTypeLabel(type: string): string {
    const typeOption = this.templateTypes.find(t => t.value === type);
    return typeOption?.label || type;
  }

  /**
   * Obtiene el label de la categoría de plantilla
   */
  getTemplateCategoryLabel(category: string): string {
    const categoryOption = this.templateCategories.find(c => c.value === category);
    return categoryOption?.label || category;
  }

  /**
   * Obtiene el label de la prioridad
   */
  getPriorityLabel(priority: string): string {
    const priorityOption = this.priorityOptions.find(p => p.value === priority);
    return priorityOption?.label || priority;
  }

  /**
   * Obtiene variables por categoría actual
   */
  getVariablesByCurrentCategory(): DynamicVariable[] {
    const category = this.templateForm.get('category')?.value;
    if (!category) return [];
    return this.getVariablesByTemplateCategory(category);
  }

  /**
   * Obtiene el modo del editor
   */
  getEditorMode(): 'html' | 'text' {
    const allowHtml = this.templateForm.get('settings.allowHtml')?.value;
    return allowHtml ? 'html' : 'text';
  }

  /**
   * Verifica si el modo HTML está habilitado
   */
  isHtmlModeEnabled(): boolean {
    return this.templateForm.get('settings.allowHtml')?.value === true;
  }

  /**
   * Maneja el toggle del selector de variables
   */
  handleVariableSelectorToggle(isOpen: boolean): void {
    this.showVariableSelector = isOpen;
  }

}
