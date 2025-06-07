import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { 
  SystemEventsService, 
  SystemEvent, 
  EventConfiguration,
  EventStats,
  EventFilters
} from '@core/services/messaging/system-events.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';
import { CustomDialogService } from '@shared/components/custom-dialog/custom-dialog.service';

/**
 * Vista activa del gestor de eventos
 */
type EventView = 'events' | 'configurations' | 'stats' | 'realtime';

/**
 * Componente de gestión de eventos del sistema
 */
@Component({
  selector: 'app-system-events',
  templateUrl: './system-events.component.html',
  styleUrls: ['./system-events.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class SystemEventsComponent implements OnInit, OnDestroy {

  // Estados del componente
  events: SystemEvent[] = [];
  filteredEvents: SystemEvent[] = [];
  configurations: EventConfiguration[] = [];
  eventStats: EventStats | null = null;
  realTimeEvents: SystemEvent[] = [];
  selectedConfiguration: EventConfiguration | null = null;

  // Estados de UI
  activeView: EventView = 'events';
  loading = false;
  saving = false;
  realTimeEnabled = false;

  // Formularios
  filtersForm: FormGroup;
  configForm: FormGroup;

  // Configuración
  currentFilters: EventFilters = {};

  // Opciones
  eventCategories = [
    { value: 'user', label: 'Usuario', icon: 'fas fa-user', color: '#3b82f6' },
    { value: 'contest', label: 'Concurso', icon: 'fas fa-trophy', color: '#10b981' },
    { value: 'inscription', label: 'Inscripción', icon: 'fas fa-file-signature', color: '#f59e0b' },
    { value: 'document', label: 'Documento', icon: 'fas fa-file-pdf', color: '#ef4444' },
    { value: 'exam', label: 'Examen', icon: 'fas fa-clipboard-check', color: '#8b5cf6' },
    { value: 'system', label: 'Sistema', icon: 'fas fa-cogs', color: '#6b7280' },
    { value: 'notification', label: 'Notificación', icon: 'fas fa-bell', color: '#ec4899' }
  ];

  dataTypes = [
    { value: 'string', label: 'Texto' },
    { value: 'number', label: 'Número' },
    { value: 'boolean', label: 'Booleano' },
    { value: 'object', label: 'Objeto' },
    { value: 'array', label: 'Array' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private systemEventsService: SystemEventsService,
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
    this.stopRealTime();
  }

  /**
   * Inicializa los formularios
   */
  private initializeForms(): void {
    this.filtersForm = this.fb.group({
      type: [''],
      category: [''],
      source: [''],
      processed: [''],
      search: [''],
      dateFrom: [''],
      dateTo: ['']
    });

    this.configForm = this.fb.group({
      type: ['', [Validators.required]],
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      category: ['user', Validators.required],
      isActive: [true],
      retentionDays: [365, [Validators.required, Validators.min(1), Validators.max(3650)]],
      settings: this.fb.group({
        enableLogging: [true],
        enableMetrics: [true],
        enableTriggers: [true],
        maxRetries: [3, [Validators.min(0), Validators.max(10)]],
        retryDelay: [5000, [Validators.min(1000), Validators.max(60000)]],
        batchSize: [10, [Validators.min(1), Validators.max(100)]]
      })
    });
  }

  /**
   * Configura las suscripciones
   */
  private setupSubscriptions(): void {
    // Suscribirse a eventos
    this.systemEventsService.events$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(events => {
      this.events = events;
      this.applyFilters();
    });

    // Suscribirse a configuraciones
    this.systemEventsService.configurations$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(configurations => {
      this.configurations = configurations;
    });

    // Suscribirse a estadísticas
    this.systemEventsService.stats$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(stats => {
      this.eventStats = stats;
    });

    // Suscribirse a eventos en tiempo real
    this.systemEventsService.realTimeEvents$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(event => {
      if (this.realTimeEnabled) {
        this.realTimeEvents.unshift(event);
        // Mantener solo los últimos 50 eventos
        if (this.realTimeEvents.length > 50) {
          this.realTimeEvents = this.realTimeEvents.slice(0, 50);
        }
      }
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

    // Cargar eventos
    this.systemEventsService.getEvents({ limit: 100 }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.loading = false;
      }
    });

    // Cargar configuraciones
    this.systemEventsService.getEventConfigurations().pipe(
      takeUntil(this.destroy$)
    ).subscribe();

    // Cargar estadísticas
    this.systemEventsService.getEventStats().pipe(
      takeUntil(this.destroy$)
    ).subscribe();
  }

  /**
   * Aplica filtros a los eventos
   */
  private applyFilters(formFilters?: any): void {
    const filters = formFilters || this.filtersForm.value;
    let filtered = [...this.events];

    if (filters.type) {
      filtered = filtered.filter(e => e.type === filters.type);
    }

    if (filters.category) {
      const config = this.configurations.find(c => c.type === filters.type);
      if (config) {
        filtered = filtered.filter(e => config.category === filters.category);
      }
    }

    if (filters.source) {
      filtered = filtered.filter(e => e.source === filters.source);
    }

    if (filters.processed !== '') {
      filtered = filtered.filter(e => e.processed === filters.processed);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(e => 
        e.type.toLowerCase().includes(search) ||
        e.source.toLowerCase().includes(search) ||
        JSON.stringify(e.data).toLowerCase().includes(search)
      );
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(e => e.timestamp >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      filtered = filtered.filter(e => e.timestamp <= toDate);
    }

    this.filteredEvents = filtered;
  }

  /**
   * Cambia la vista activa
   */
  setActiveView(view: EventView): void {
    this.activeView = view;
    
    if (view === 'realtime') {
      this.startRealTime();
    } else {
      this.stopRealTime();
    }
  }

  /**
   * Inicia monitoreo en tiempo real
   */
  startRealTime(): void {
    this.realTimeEnabled = true;
    this.realTimeEvents = [];
  }

  /**
   * Detiene monitoreo en tiempo real
   */
  stopRealTime(): void {
    this.realTimeEnabled = false;
  }

  /**
   * Publica un evento de prueba
   */
  async publishTestEvent(): Promise<void> {
    const eventTypes = this.configurations.map(c => c.type);
    
    const result = await this.dialogService.showInputDialog({
      title: 'Publicar Evento de Prueba',
      message: 'Selecciona el tipo de evento a publicar:',
      inputType: 'select',
      options: eventTypes.map(type => ({ value: type, label: type })),
      placeholder: 'Selecciona un tipo de evento'
    }).toPromise();

    if (!result) return;

    const testData = this.generateTestData(result);
    
    this.systemEventsService.publishEvent(result, testData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (event) => {
        this.notificationService.showSuccess('Evento de prueba publicado exitosamente');
      },
      error: (error) => {
        console.error('Error publishing test event:', error);
        this.notificationService.showError('Error al publicar evento de prueba');
      }
    });
  }

  /**
   * Genera datos de prueba para un tipo de evento
   */
  private generateTestData(eventType: string): any {
    const testData: Record<string, any> = {
      user_registered: {
        userId: 'test_user_' + Date.now(),
        email: 'test@example.com',
        name: 'Usuario de Prueba',
        role: 'user',
        registrationMethod: 'email'
      },
      inscription_submitted: {
        inscriptionId: 'test_insc_' + Date.now(),
        contestId: 'test_contest_123',
        userId: 'test_user_123',
        status: 'submitted',
        completionPercentage: 85
      },
      document_uploaded: {
        documentId: 'test_doc_' + Date.now(),
        inscriptionId: 'test_insc_123',
        userId: 'test_user_123',
        documentType: 'dni_frente',
        fileName: 'dni_frente_test.pdf',
        fileSize: 1024000
      },
      exam_scheduled: {
        examId: 'test_exam_' + Date.now(),
        contestId: 'test_contest_123',
        examDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Aula de Prueba',
        duration: 120,
        participantCount: 25
      },
      deadline_approaching: {
        deadlineType: 'inscription_end',
        contestId: 'test_contest_123',
        deadlineDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        daysRemaining: 3,
        affectedUsers: ['test_user_123', 'test_user_456']
      }
    };

    return testData[eventType] || { message: 'Evento de prueba', timestamp: new Date().toISOString() };
  }

  /**
   * Edita configuración de evento
   */
  editConfiguration(config: EventConfiguration): void {
    this.selectedConfiguration = config;
    this.populateConfigForm(config);
    // Aquí podrías abrir un modal o cambiar a una vista de edición
  }

  /**
   * Guarda configuración de evento
   */
  saveConfiguration(): void {
    if (this.configForm.invalid) {
      this.markFormGroupTouched(this.configForm);
      return;
    }

    if (!this.selectedConfiguration) return;

    this.saving = true;
    const formValue = this.configForm.value;

    this.systemEventsService.updateEventConfiguration(this.selectedConfiguration.type, formValue).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (config) => {
        this.notificationService.showSuccess('Configuración actualizada exitosamente');
        this.selectedConfiguration = null;
        this.saving = false;
      },
      error: (error) => {
        console.error('Error saving configuration:', error);
        this.notificationService.showError('Error al guardar la configuración');
        this.saving = false;
      }
    });
  }

  /**
   * Reprocesa eventos fallidos
   */
  async reprocessFailedEvents(): Promise<void> {
    const confirmed = await this.dialogService.showConfirmDialog({
      title: 'Reprocesar Eventos Fallidos',
      message: '¿Deseas reprocesar todos los eventos que fallaron?',
      confirmText: 'Reprocesar',
      cancelText: 'Cancelar',
      type: 'info'
    }).toPromise();

    if (!confirmed) return;

    this.systemEventsService.reprocessFailedEvents().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        this.notificationService.showSuccess(
          `Reprocesados: ${result.processed}, Fallidos: ${result.failed}`
        );
        this.loadInitialData();
      },
      error: (error) => {
        console.error('Error reprocessing events:', error);
        this.notificationService.showError('Error al reprocesar eventos');
      }
    });
  }

  /**
   * Limpia eventos antiguos
   */
  async cleanupOldEvents(): Promise<void> {
    const result = await this.dialogService.showInputDialog({
      title: 'Limpiar Eventos Antiguos',
      message: 'Ingresa el número de días para mantener los eventos:',
      inputType: 'number',
      placeholder: '90',
      defaultValue: '90'
    }).toPromise();

    if (!result) return;

    const days = parseInt(result);
    if (isNaN(days) || days < 1) {
      this.notificationService.showError('Número de días inválido');
      return;
    }

    this.systemEventsService.cleanupOldEvents(days).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        this.notificationService.showSuccess(`${result.deleted} eventos eliminados`);
        this.loadInitialData();
      },
      error: (error) => {
        console.error('Error cleaning up events:', error);
        this.notificationService.showError('Error al limpiar eventos');
      }
    });
  }

  /**
   * Rellena formulario con datos de configuración
   */
  private populateConfigForm(config: EventConfiguration): void {
    this.configForm.patchValue({
      type: config.type,
      name: config.name,
      description: config.description,
      category: config.category,
      isActive: config.isActive,
      retentionDays: config.retentionDays,
      settings: config.settings
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
      if (field.errors['min']) return `Valor mínimo: ${field.errors['min'].min}`;
      if (field.errors['max']) return `Valor máximo: ${field.errors['max'].max}`;
    }
    return '';
  }

  /**
   * Obtiene ícono de categoría
   */
  getCategoryIcon(category: string): string {
    const categoryConfig = this.eventCategories.find(c => c.value === category);
    return categoryConfig?.icon || 'fas fa-question';
  }

  /**
   * Obtiene color de categoría
   */
  getCategoryColor(category: string): string {
    const categoryConfig = this.eventCategories.find(c => c.value === category);
    return categoryConfig?.color || '#6b7280';
  }

  /**
   * Obtiene configuración de evento por tipo
   */
  getEventConfiguration(eventType: string): EventConfiguration | undefined {
    return this.configurations.find(c => c.type === eventType);
  }

  /**
   * Formatea datos de evento para mostrar
   */
  formatEventData(data: any): string {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }

  /**
   * Limpia filtros
   */
  clearFilters(): void {
    this.filtersForm.reset();
  }

  /**
   * Cancela edición
   */
  cancelEdit(): void {
    this.selectedConfiguration = null;
  }
}
