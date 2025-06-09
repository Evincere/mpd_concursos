import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { 
  NotificationTriggersService, 
  NotificationTrigger, 
  TriggerExecution,
  TriggerStats,
  TriggerFilters,
  TriggerType,
  SystemEvent,
  TriggerCondition,
  TriggerAction
} from '@core/services/messaging/notification-triggers.service';
import { MessageTemplatesService } from '@core/services/messaging/message-templates.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';
import { CustomDialogService } from '@shared/components/custom-dialog/custom-dialog.service';

/**
 * Vista activa del gestor de triggers
 */
type TriggerView = 'list' | 'create' | 'edit' | 'executions' | 'stats';

/**
 * Componente de gestión de triggers automáticos
 */
@Component({
  selector: 'app-notification-triggers',
  templateUrl: './notification-triggers.component.html',
  styleUrls: ['./notification-triggers.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class NotificationTriggersComponent implements OnInit, OnDestroy {

  // Estados del componente
  triggers: NotificationTrigger[] = [];
  filteredTriggers: NotificationTrigger[] = [];
  executions: TriggerExecution[] = [];
  triggerStats: TriggerStats | null = null;
  selectedTrigger: NotificationTrigger | null = null;
  availableTemplates: any[] = [];

  // Estados de UI
  activeView: TriggerView = 'list';
  loading = false;
  saving = false;
  executing = false;

  // Formularios
  filtersForm!: FormGroup;
  triggerForm!: FormGroup;

  // Configuración
  currentFilters: TriggerFilters = {};

  // Opciones
  triggerTypes: Array<{ value: TriggerType; label: string; icon: string }> = [
    { value: 'event', label: 'Evento del Sistema', icon: 'fas fa-bolt' },
    { value: 'schedule', label: 'Programado', icon: 'fas fa-clock' },
    { value: 'condition', label: 'Condición', icon: 'fas fa-code-branch' },
    { value: 'manual', label: 'Manual', icon: 'fas fa-hand-pointer' },
    { value: 'webhook', label: 'Webhook', icon: 'fas fa-link' },
    { value: 'api', label: 'API', icon: 'fas fa-code' }
  ];

  systemEvents: Array<{ value: SystemEvent; label: string; description: string }> = [
    { value: 'user_registered', label: 'Usuario Registrado', description: 'Cuando un nuevo usuario se registra' },
    { value: 'inscription_submitted', label: 'Inscripción Enviada', description: 'Cuando se envía una inscripción' },
    { value: 'inscription_approved', label: 'Inscripción Aprobada', description: 'Cuando se aprueba una inscripción' },
    { value: 'inscription_rejected', label: 'Inscripción Rechazada', description: 'Cuando se rechaza una inscripción' },
    { value: 'document_uploaded', label: 'Documento Subido', description: 'Cuando se sube un documento' },
    { value: 'document_approved', label: 'Documento Aprobado', description: 'Cuando se aprueba un documento' },
    { value: 'document_rejected', label: 'Documento Rechazado', description: 'Cuando se rechaza un documento' },
    { value: 'exam_scheduled', label: 'Examen Programado', description: 'Cuando se programa un examen' },
    { value: 'exam_completed', label: 'Examen Completado', description: 'Cuando se completa un examen' },
    { value: 'results_published', label: 'Resultados Publicados', description: 'Cuando se publican resultados' },
    { value: 'deadline_approaching', label: 'Fecha Límite Próxima', description: 'Cuando se acerca una fecha límite' },
    { value: 'contest_created', label: 'Concurso Creado', description: 'Cuando se crea un nuevo concurso' },
    { value: 'contest_published', label: 'Concurso Publicado', description: 'Cuando se publica un concurso' },
    { value: 'contest_closed', label: 'Concurso Cerrado', description: 'Cuando se cierra un concurso' }
  ];

  priorityOptions = [
    { value: 'low', label: 'Baja', color: '#6b7280' },
    { value: 'normal', label: 'Normal', color: '#3b82f6' },
    { value: 'high', label: 'Alta', color: '#f59e0b' },
    { value: 'urgent', label: 'Urgente', color: '#ef4444' }
  ];

  actionTypes = [
    { value: 'send_notification', label: 'Enviar Notificación', icon: 'fas fa-bell' },
    { value: 'send_email', label: 'Enviar Email', icon: 'fas fa-envelope' },
    { value: 'create_task', label: 'Crear Tarea', icon: 'fas fa-tasks' },
    { value: 'update_status', label: 'Actualizar Estado', icon: 'fas fa-edit' },
    { value: 'call_webhook', label: 'Llamar Webhook', icon: 'fas fa-link' },
    { value: 'execute_script', label: 'Ejecutar Script', icon: 'fas fa-code' }
  ];

  conditionOperators: any[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private notificationTriggersService: NotificationTriggersService,
    private messageTemplatesService: MessageTemplatesService,
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
    this.notificationTriggersService.stopPolling();
  }

  /**
   * Inicializa los formularios
   */
  private initializeForms(): void {
    this.filtersForm = this.fb.group({
      type: [''],
      event: [''],
      isActive: [''],
      priority: [''],
      search: ['']
    });

    this.triggerForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      type: ['event', Validators.required],
      priority: ['normal'],
      isActive: [true],
      
      // Configuración específica por tipo
      event: [''],
      conditions: this.fb.array([]),
      schedule: this.fb.group({
        type: ['once'],
        startDate: [''],
        endDate: [''],
        time: [''],
        timezone: ['America/Argentina/Buenos_Aires'],
        recurring: this.fb.group({
          frequency: ['daily'],
          interval: [1],
          daysOfWeek: [[]],
          dayOfMonth: [''],
          monthOfYear: ['']
        })
      }),
      
      // Acciones
      actions: this.fb.array([]),
      
      // Configuración avanzada
      settings: this.fb.group({
        maxExecutions: [''],
        cooldownPeriod: [0],
        requireApproval: [false],
        logExecution: [true],
        enableRetry: [true],
        retryDelay: [5],
        maxRetries: [3]
      }),
      
      // Filtros
      filters: this.fb.group({
        contestIds: [[]],
        userRoles: [[]],
        categories: [[]],
        tags: [[]]
      })
    });
  }

  /**
   * Configura las suscripciones
   */
  private setupSubscriptions(): void {
    // Suscribirse a triggers
    this.notificationTriggersService.triggers$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(triggers => {
      this.triggers = triggers;
      this.applyFilters();
    });

    // Suscribirse a ejecuciones
    this.notificationTriggersService.executions$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(executions => {
      this.executions = executions;
    });

    // Suscribirse a estadísticas
    this.notificationTriggersService.stats$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(stats => {
      this.triggerStats = stats;
    });

    // Configurar filtros en tiempo real
    this.filtersForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(filters => {
      this.applyFilters(filters);
    });

    // Reaccionar a cambios en el tipo de trigger
    this.triggerForm.get('type')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(type => {
      this.onTriggerTypeChange(type);
    });
  }

  /**
   * Carga datos iniciales
   */
  private loadInitialData(): void {
    this.loading = true;

    // Cargar triggers
    this.notificationTriggersService.getTriggers().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading triggers:', error);
        this.loading = false;
      }
    });

    // Cargar estadísticas
    this.notificationTriggersService.getTriggerStats().pipe(
      takeUntil(this.destroy$)
    ).subscribe();

    // Cargar ejecuciones
    this.notificationTriggersService.getExecutions().pipe(
      takeUntil(this.destroy$)
    ).subscribe();

    // Cargar plantillas disponibles
    this.messageTemplatesService.getTemplates().pipe(
      takeUntil(this.destroy$)
    ).subscribe(templates => {
      this.availableTemplates = templates;
    });

    // Cargar operadores de condición
    this.conditionOperators = this.notificationTriggersService.getConditionOperators();
  }

  /**
   * Aplica filtros a los triggers
   */
  private applyFilters(formFilters?: any): void {
    const filters = formFilters || this.filtersForm.value;
    let filtered = [...this.triggers];

    if (filters.type) {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    if (filters.event) {
      filtered = filtered.filter(t => t.event === filters.event);
    }

    if (filters.isActive !== '') {
      filtered = filtered.filter(t => t.isActive === filters.isActive);
    }

    if (filters.priority) {
      filtered = filtered.filter(t => t.priority === filters.priority);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search)
      );
    }

    this.filteredTriggers = filtered;
  }

  /**
   * Cambia la vista activa
   */
  setActiveView(view: TriggerView): void {
    this.activeView = view;
    
    if (view === 'create') {
      this.selectedTrigger = null;
      this.resetTriggerForm();
    } else if (view === 'executions') {
      this.loadExecutions();
    }
  }

  /**
   * Crea nuevo trigger
   */
  createTrigger(): void {
    this.setActiveView('create');
  }

  /**
   * Edita trigger existente
   */
  editTrigger(trigger: NotificationTrigger): void {
    this.selectedTrigger = trigger;
    this.populateTriggerForm(trigger);
    this.setActiveView('edit');
  }

  /**
   * Guarda trigger (crear o actualizar)
   */
  saveTrigger(): void {
    if (this.triggerForm.invalid) {
      this.markFormGroupTouched(this.triggerForm);
      return;
    }

    this.saving = true;
    const formValue = this.triggerForm.value;

    const triggerData: Partial<NotificationTrigger> = {
      name: formValue.name,
      description: formValue.description,
      type: formValue.type,
      priority: formValue.priority,
      isActive: formValue.isActive,
      event: formValue.event || undefined,
      conditions: formValue.conditions || [],
      schedule: formValue.type === 'schedule' ? formValue.schedule : undefined,
      actions: formValue.actions || [],
      settings: formValue.settings,
      filters: formValue.filters
    };

    const operation = this.selectedTrigger 
      ? this.notificationTriggersService.updateTrigger(this.selectedTrigger.id, triggerData)
      : this.notificationTriggersService.createTrigger(triggerData);

    operation.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (trigger) => {
        this.notificationService.showSuccess(
          this.selectedTrigger ? 'Trigger actualizado exitosamente' : 'Trigger creado exitosamente'
        );
        this.setActiveView('list');
        this.saving = false;
      },
      error: (error) => {
        console.error('Error saving trigger:', error);
        this.notificationService.showError('Error al guardar el trigger');
        this.saving = false;
      }
    });
  }

  /**
   * Elimina trigger
   */
  async deleteTrigger(trigger: NotificationTrigger): Promise<void> {
    const dialogRef = this.dialogService.showConfirmDialog({
      title: 'Eliminar Trigger',
      message: `¿Estás seguro de que deseas eliminar el trigger "${trigger.name}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());

    if (!confirmed) return;

    this.notificationTriggersService.deleteTrigger(trigger.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.notificationService.showSuccess('Trigger eliminado exitosamente');
      },
      error: (error) => {
        console.error('Error deleting trigger:', error);
        this.notificationService.showError('Error al eliminar el trigger');
      }
    });
  }

  /**
   * Activa/desactiva trigger
   */
  toggleTrigger(trigger: NotificationTrigger): void {
    this.notificationTriggersService.toggleTrigger(trigger.id, !trigger.isActive).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        const action = trigger.isActive ? 'desactivado' : 'activado';
        this.notificationService.showSuccess(`Trigger ${action} exitosamente`);
      },
      error: (error) => {
        console.error('Error toggling trigger:', error);
        this.notificationService.showError('Error al cambiar estado del trigger');
      }
    });
  }

  /**
   * Ejecuta trigger manualmente
   */
  async executeTrigger(trigger: NotificationTrigger): Promise<void> {
    const dialogRef = this.dialogService.showConfirmDialog({
      title: 'Ejecutar Trigger',
      message: `¿Deseas ejecutar manualmente el trigger "${trigger.name}"?`,
      confirmText: 'Ejecutar',
      cancelText: 'Cancelar'
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());

    if (!confirmed) return;

    this.executing = true;
    this.notificationTriggersService.executeTrigger(trigger.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (execution) => {
        this.notificationService.showSuccess('Trigger ejecutado exitosamente');
        this.executing = false;
        this.loadExecutions();
      },
      error: (error) => {
        console.error('Error executing trigger:', error);
        this.notificationService.showError('Error al ejecutar el trigger');
        this.executing = false;
      }
    });
  }

  /**
   * Carga ejecuciones
   */
  private loadExecutions(): void {
    this.notificationTriggersService.getExecutions().pipe(
      takeUntil(this.destroy$)
    ).subscribe();
  }

  /**
   * Maneja cambio de tipo de trigger
   */
  private onTriggerTypeChange(type: TriggerType): void {
    // Limpiar campos específicos del tipo anterior
    this.triggerForm.get('event')?.setValue('');
    this.clearFormArray('conditions');
    
    // Configurar validaciones según el tipo
    const eventControl = this.triggerForm.get('event');
    const scheduleControl = this.triggerForm.get('schedule');
    
    if (type === 'event') {
      eventControl?.setValidators([Validators.required]);
    } else {
      eventControl?.clearValidators();
    }
    
    eventControl?.updateValueAndValidity();
  }

  /**
   * Obtiene FormArray de condiciones
   */
  get conditionsArray(): FormArray {
    return this.triggerForm.get('conditions') as FormArray;
  }

  /**
   * Obtiene FormArray de acciones
   */
  get actionsArray(): FormArray {
    return this.triggerForm.get('actions') as FormArray;
  }

  /**
   * Agrega nueva condición
   */
  addCondition(): void {
    const conditionGroup = this.fb.group({
      field: ['', Validators.required],
      operator: ['equals', Validators.required],
      value: ['', Validators.required],
      dataType: ['string', Validators.required]
    });
    
    this.conditionsArray.push(conditionGroup);
  }

  /**
   * Elimina condición
   */
  removeCondition(index: number): void {
    this.conditionsArray.removeAt(index);
  }

  /**
   * Agrega nueva acción
   */
  addAction(): void {
    const actionGroup = this.fb.group({
      type: ['send_notification', Validators.required],
      config: this.fb.group({
        templateId: [''],
        recipients: [[]],
        subject: [''],
        priority: ['normal'],
        delay: [0],
        retryAttempts: [3]
      })
    });
    
    this.actionsArray.push(actionGroup);
  }

  /**
   * Elimina acción
   */
  removeAction(index: number): void {
    this.actionsArray.removeAt(index);
  }

  /**
   * Limpia FormArray
   */
  private clearFormArray(arrayName: string): void {
    const array = this.triggerForm.get(arrayName) as FormArray;
    while (array.length !== 0) {
      array.removeAt(0);
    }
  }

  /**
   * Rellena formulario con datos de trigger
   */
  private populateTriggerForm(trigger: NotificationTrigger): void {
    this.triggerForm.patchValue({
      name: trigger.name,
      description: trigger.description,
      type: trigger.type,
      priority: trigger.priority,
      isActive: trigger.isActive,
      event: trigger.event,
      schedule: trigger.schedule,
      settings: trigger.settings,
      filters: trigger.filters
    });

    // Cargar condiciones
    this.clearFormArray('conditions');
    trigger.conditions?.forEach(condition => {
      const conditionGroup = this.fb.group({
        field: [condition.field],
        operator: [condition.operator],
        value: [condition.value],
        dataType: [condition.dataType]
      });
      this.conditionsArray.push(conditionGroup);
    });

    // Cargar acciones
    this.clearFormArray('actions');
    trigger.actions.forEach(action => {
      const actionGroup = this.fb.group({
        type: [action.type],
        config: [action.config]
      });
      this.actionsArray.push(actionGroup);
    });
  }

  /**
   * Resetea formulario de trigger
   */
  private resetTriggerForm(): void {
    this.triggerForm.reset({
      type: 'event',
      priority: 'normal',
      isActive: true,
      settings: {
        cooldownPeriod: 0,
        requireApproval: false,
        logExecution: true,
        enableRetry: true,
        retryDelay: 5,
        maxRetries: 3
      }
    });
    
    this.clearFormArray('conditions');
    this.clearFormArray('actions');
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
    }
    return '';
  }

  /**
   * Obtiene ícono de tipo de trigger
   */
  getTypeIcon(type: TriggerType): string {
    const typeConfig = this.triggerTypes.find(t => t.value === type);
    return typeConfig?.icon || 'fas fa-question';
  }

  /**
   * Obtiene color de prioridad
   */
  getPriorityColor(priority: string): string {
    const option = this.priorityOptions.find(p => p.value === priority);
    return option?.color || '#3b82f6';
  }

  /**
   * Obtiene estado de ejecución con color
   */
  getExecutionStatusColor(status: string): string {
    const colors = {
      pending: '#f59e0b',
      running: '#3b82f6',
      completed: '#10b981',
      failed: '#ef4444',
      cancelled: '#6b7280'
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  }

  /**
   * Limpia filtros
   */
  clearFilters(): void {
    this.filtersForm.reset();
    this.notificationTriggersService.clearFilters();
  }

  /**
   * Cancela edición
   */
  cancelEdit(): void {
    this.setActiveView('list');
    this.selectedTrigger = null;
  }

  /**
   * Obtiene el estilo para el item de tipo
   */
  getTypeItemStyle(type: any): any {
    if (!this.triggerStats) return {};

    const percentage = (this.triggerStats.byType[type.value as keyof typeof this.triggerStats.byType] || 0) / this.triggerStats.totalTriggers * 100;
    return {
      '--percentage': `${percentage}%`
    };
  }

  /**
   * Obtiene el color según la tasa de éxito
   */
  getSuccessRateColor(successRate: number): string {
    if (successRate >= 90) return '#10b981';
    if (successRate >= 70) return '#f59e0b';
    return '#ef4444';
  }

  /**
   * Obtiene label del tipo de trigger
   */
  getTypeLabel(type: TriggerType): string {
    const typeConfig = this.triggerTypes.find(t => t.value === type);
    return typeConfig?.label || type;
  }

  /**
   * Obtiene FormArray de acciones
   */
  getActionsFormArray(): FormArray {
    return this.triggerForm.get('actions') as FormArray;
  }


}
