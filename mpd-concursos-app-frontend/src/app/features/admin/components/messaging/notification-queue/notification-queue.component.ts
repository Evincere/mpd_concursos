import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, timer } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { 
  NotificationQueueService, 
  QueuedNotification, 
  QueueConfiguration,
  QueueStats,
  QueueFilters,
  NotificationPriority,
  QueuedNotificationStatus,
  NotificationType
} from '@core/services/messaging/notification-queue.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';
import { CustomDialogService } from '@shared/components/custom-dialog/custom-dialog.service';

/**
 * Vista activa del gestor de cola
 */
type QueueView = 'queue' | 'configurations' | 'stats' | 'monitoring';

/**
 * Componente de gestión de cola de notificaciones
 */
@Component({
  selector: 'app-notification-queue',
  templateUrl: './notification-queue.component.html',
  styleUrls: ['./notification-queue.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class NotificationQueueComponent implements OnInit, OnDestroy {

  // Estados del componente
  queuedNotifications: QueuedNotification[] = [];
  filteredNotifications: QueuedNotification[] = [];
  configurations: QueueConfiguration[] = [];
  queueStats: QueueStats | null = null;
  selectedNotification: QueuedNotification | null = null;
  selectedConfiguration: QueueConfiguration | null = null;

  // Estados de UI
  activeView: QueueView = 'queue';
  loading = false;
  processing = false;
  realTimeEnabled = false;

  // Formularios
  filtersForm: FormGroup;
  configForm: FormGroup;
  enqueueForm: FormGroup;

  // Configuración
  currentFilters: QueueFilters = {};

  // Opciones
  notificationTypes: Array<{ value: NotificationType; label: string; icon: string; color: string }> = [
    { value: 'email', label: 'Email', icon: 'fas fa-envelope', color: '#3b82f6' },
    { value: 'sms', label: 'SMS', icon: 'fas fa-sms', color: '#10b981' },
    { value: 'push', label: 'Push', icon: 'fas fa-mobile-alt', color: '#f59e0b' },
    { value: 'in_app', label: 'In-App', icon: 'fas fa-bell', color: '#8b5cf6' },
    { value: 'webhook', label: 'Webhook', icon: 'fas fa-link', color: '#ef4444' },
    { value: 'system', label: 'Sistema', icon: 'fas fa-cogs', color: '#6b7280' }
  ];

  priorities: Array<{ value: NotificationPriority; label: string; color: string; weight: number }> = [
    { value: 'critical', label: 'Crítica', color: '#dc2626', weight: 100 },
    { value: 'urgent', label: 'Urgente', color: '#ea580c', weight: 80 },
    { value: 'high', label: 'Alta', color: '#d97706', weight: 60 },
    { value: 'normal', label: 'Normal', color: '#059669', weight: 40 },
    { value: 'low', label: 'Baja', color: '#0284c7', weight: 20 }
  ];

  statuses: Array<{ value: QueuedNotificationStatus; label: string; color: string; icon: string }> = [
    { value: 'pending', label: 'Pendiente', color: '#f59e0b', icon: 'fas fa-clock' },
    { value: 'processing', label: 'Procesando', color: '#3b82f6', icon: 'fas fa-spinner' },
    { value: 'sent', label: 'Enviada', color: '#10b981', icon: 'fas fa-check' },
    { value: 'failed', label: 'Fallida', color: '#ef4444', icon: 'fas fa-times' },
    { value: 'cancelled', label: 'Cancelada', color: '#6b7280', icon: 'fas fa-ban' },
    { value: 'scheduled', label: 'Programada', color: '#8b5cf6', icon: 'fas fa-calendar' },
    { value: 'retry', label: 'Reintentando', color: '#f59e0b', icon: 'fas fa-redo' }
  ];

  // Métricas en tiempo real
  realTimeMetrics: any = {};
  healthStatus: any = {};

  private destroy$ = new Subject<void>();
  private realTimeTimer?: any;

  constructor(
    private fb: FormBuilder,
    private notificationQueueService: NotificationQueueService,
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
    this.notificationQueueService.stopPolling();
  }

  /**
   * Inicializa los formularios
   */
  private initializeForms(): void {
    this.filtersForm = this.fb.group({
      type: [''],
      status: [''],
      priority: [''],
      createdBy: [''],
      source: [''],
      search: [''],
      dateFrom: [''],
      dateTo: ['']
    });

    this.configForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      type: ['email', Validators.required],
      isActive: [true],
      processing: this.fb.group({
        maxConcurrentJobs: [5, [Validators.required, Validators.min(1), Validators.max(50)]],
        batchSize: [10, [Validators.required, Validators.min(1), Validators.max(1000)]],
        processingInterval: [5000, [Validators.required, Validators.min(1000)]],
        maxRetries: [3, [Validators.required, Validators.min(0), Validators.max(10)]],
        retryDelay: [30000, [Validators.required, Validators.min(1000)]],
        jobTimeout: [60000, [Validators.required, Validators.min(5000)]]
      }),
      limits: this.fb.group({
        maxQueueSize: [50000, [Validators.required, Validators.min(100)]],
        maxDailyNotifications: [100000, [Validators.required, Validators.min(100)]],
        maxHourlyNotifications: [10000, [Validators.required, Validators.min(10)]],
        maxNotificationsPerUser: [100, [Validators.required, Validators.min(1)]]
      })
    });

    this.enqueueForm = this.fb.group({
      type: ['email', Validators.required],
      priority: ['normal', Validators.required],
      subject: [''],
      content: ['', Validators.required],
      recipients: ['', Validators.required],
      scheduledAt: [''],
      maxRetries: [3, [Validators.min(0), Validators.max(10)]]
    });
  }

  /**
   * Configura las suscripciones
   */
  private setupSubscriptions(): void {
    // Suscribirse a notificaciones en cola
    this.notificationQueueService.notifications$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(notifications => {
      this.queuedNotifications = notifications;
      this.applyFilters();
    });

    // Suscribirse a configuraciones
    this.notificationQueueService.configurations$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(configurations => {
      this.configurations = configurations;
    });

    // Suscribirse a estadísticas
    this.notificationQueueService.stats$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(stats => {
      this.queueStats = stats;
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

    // Cargar notificaciones en cola
    this.notificationQueueService.getQueuedNotifications({ limit: 100 }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading queued notifications:', error);
        this.loading = false;
      }
    });

    // Cargar configuraciones
    this.notificationQueueService.getQueueConfigurations().pipe(
      takeUntil(this.destroy$)
    ).subscribe();

    // Cargar estadísticas
    this.notificationQueueService.getQueueStats().pipe(
      takeUntil(this.destroy$)
    ).subscribe();

    // Verificar salud de la cola
    this.checkQueueHealth();
  }

  /**
   * Aplica filtros a las notificaciones
   */
  private applyFilters(formFilters?: any): void {
    const filters = formFilters || this.filtersForm.value;
    let filtered = [...this.queuedNotifications];

    if (filters.type) {
      filtered = filtered.filter(n => n.type === filters.type);
    }

    if (filters.status) {
      filtered = filtered.filter(n => n.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter(n => n.priority === filters.priority);
    }

    if (filters.createdBy) {
      filtered = filtered.filter(n => n.metadata.createdBy.includes(filters.createdBy));
    }

    if (filters.source) {
      filtered = filtered.filter(n => n.metadata.source === filters.source);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(n => 
        n.subject?.toLowerCase().includes(search) ||
        n.content.toLowerCase().includes(search) ||
        n.id.toLowerCase().includes(search)
      );
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(n => n.metadata.createdAt >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      filtered = filtered.filter(n => n.metadata.createdAt <= toDate);
    }

    this.filteredNotifications = filtered;
  }

  /**
   * Cambia la vista activa
   */
  setActiveView(view: QueueView): void {
    this.activeView = view;
    
    if (view === 'monitoring') {
      this.startRealTime();
    } else {
      this.stopRealTime();
    }
  }

  /**
   * Agrega notificación a la cola
   */
  enqueueNotification(): void {
    if (this.enqueueForm.invalid) {
      this.markFormGroupTouched(this.enqueueForm);
      return;
    }

    this.processing = true;
    const formValue = this.enqueueForm.value;

    // Parsear destinatarios
    const recipients = formValue.recipients.split(',').map((email: string) => ({
      email: email.trim()
    }));

    const notification: Partial<QueuedNotification> = {
      type: formValue.type,
      priority: formValue.priority,
      subject: formValue.subject,
      content: formValue.content,
      recipients,
      scheduledAt: formValue.scheduledAt ? new Date(formValue.scheduledAt) : undefined,
      settings: {
        maxRetries: formValue.maxRetries,
        retryDelay: 30000,
        batchSize: 1,
        enableTracking: true,
        requireDeliveryConfirmation: false,
        allowDuplicates: true
      }
    };

    this.notificationQueueService.enqueueNotification(notification).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (queuedNotification) => {
        this.notificationService.showSuccess('Notificación agregada a la cola exitosamente');
        this.enqueueForm.reset({
          type: 'email',
          priority: 'normal',
          maxRetries: 3
        });
        this.processing = false;
      },
      error: (error) => {
        console.error('Error enqueuing notification:', error);
        this.notificationService.showError('Error al agregar notificación a la cola');
        this.processing = false;
      }
    });
  }

  /**
   * Cancela notificación
   */
  async cancelNotification(notification: QueuedNotification): Promise<void> {
    const reason = await this.dialogService.showInputDialog({
      title: 'Cancelar Notificación',
      message: 'Ingresa la razón para cancelar esta notificación:',
      inputType: 'text',
      placeholder: 'Razón de cancelación...',
      required: true
    }).toPromise();

    if (!reason) return;

    this.notificationQueueService.cancelNotification(notification.id, reason).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.notificationService.showSuccess('Notificación cancelada exitosamente');
      },
      error: (error) => {
        console.error('Error cancelling notification:', error);
        this.notificationService.showError('Error al cancelar notificación');
      }
    });
  }

  /**
   * Reintenta notificación
   */
  retryNotification(notification: QueuedNotification): void {
    this.notificationQueueService.retryNotification(notification.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.notificationService.showSuccess('Notificación reintentada exitosamente');
      },
      error: (error) => {
        console.error('Error retrying notification:', error);
        this.notificationService.showError('Error al reintentar notificación');
      }
    });
  }

  /**
   * Reintenta todas las notificaciones fallidas
   */
  async retryAllFailed(): Promise<void> {
    const confirmed = await this.dialogService.showConfirmDialog({
      title: 'Reintentar Todas las Fallidas',
      message: '¿Deseas reintentar todas las notificaciones fallidas?',
      confirmText: 'Reintentar',
      cancelText: 'Cancelar',
      type: 'info'
    }).toPromise();

    if (!confirmed) return;

    this.notificationQueueService.retryAllFailed().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        this.notificationService.showSuccess(
          `${result.retried} notificaciones reintentadas, ${result.failed} fallaron`
        );
      },
      error: (error) => {
        console.error('Error retrying all failed:', error);
        this.notificationService.showError('Error al reintentar notificaciones');
      }
    });
  }

  /**
   * Pausa la cola
   */
  async pauseQueue(type?: NotificationType): Promise<void> {
    const confirmed = await this.dialogService.showConfirmDialog({
      title: 'Pausar Cola',
      message: `¿Deseas pausar ${type ? `la cola de ${type}` : 'todas las colas'}?`,
      confirmText: 'Pausar',
      cancelText: 'Cancelar',
      type: 'warning'
    }).toPromise();

    if (!confirmed) return;

    this.notificationQueueService.pauseQueue(type).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.notificationService.showSuccess('Cola pausada exitosamente');
      },
      error: (error) => {
        console.error('Error pausing queue:', error);
        this.notificationService.showError('Error al pausar cola');
      }
    });
  }

  /**
   * Reanuda la cola
   */
  async resumeQueue(type?: NotificationType): Promise<void> {
    const confirmed = await this.dialogService.showConfirmDialog({
      title: 'Reanudar Cola',
      message: `¿Deseas reanudar ${type ? `la cola de ${type}` : 'todas las colas'}?`,
      confirmText: 'Reanudar',
      cancelText: 'Cancelar',
      type: 'info'
    }).toPromise();

    if (!confirmed) return;

    this.notificationQueueService.resumeQueue(type).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.notificationService.showSuccess('Cola reanudada exitosamente');
      },
      error: (error) => {
        console.error('Error resuming queue:', error);
        this.notificationService.showError('Error al reanudar cola');
      }
    });
  }

  /**
   * Limpia notificaciones antiguas
   */
  async cleanupOldNotifications(): Promise<void> {
    const days = await this.dialogService.showInputDialog({
      title: 'Limpiar Notificaciones Antiguas',
      message: 'Ingresa el número de días para mantener las notificaciones:',
      inputType: 'number',
      placeholder: '30',
      defaultValue: '30'
    }).toPromise();

    if (!days) return;

    const daysNumber = parseInt(days);
    if (isNaN(daysNumber) || daysNumber < 1) {
      this.notificationService.showError('Número de días inválido');
      return;
    }

    this.notificationQueueService.cleanupOldNotifications(daysNumber).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        this.notificationService.showSuccess(
          `${result.deleted} notificaciones eliminadas, ${result.archived} archivadas`
        );
      },
      error: (error) => {
        console.error('Error cleaning up notifications:', error);
        this.notificationService.showError('Error al limpiar notificaciones');
      }
    });
  }

  /**
   * Verifica salud de la cola
   */
  checkQueueHealth(): void {
    this.notificationQueueService.checkQueueHealth().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (health) => {
        this.healthStatus = health;
      },
      error: (error) => {
        console.error('Error checking queue health:', error);
      }
    });
  }

  /**
   * Inicia monitoreo en tiempo real
   */
  startRealTime(): void {
    this.realTimeEnabled = true;
    this.realTimeTimer = timer(0, 2000).pipe(
      switchMap(() => this.notificationQueueService.getRealTimeMetrics()),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (metrics) => {
        this.realTimeMetrics = metrics;
      },
      error: (error) => {
        console.error('Error getting real-time metrics:', error);
      }
    });
  }

  /**
   * Detiene monitoreo en tiempo real
   */
  stopRealTime(): void {
    this.realTimeEnabled = false;
    if (this.realTimeTimer) {
      this.realTimeTimer.unsubscribe();
    }
  }

  /**
   * Obtiene configuración de tipo
   */
  getTypeConfig(type: NotificationType): any {
    return this.notificationTypes.find(t => t.value === type);
  }

  /**
   * Obtiene configuración de prioridad
   */
  getPriorityConfig(priority: NotificationPriority): any {
    return this.priorities.find(p => p.value === priority);
  }

  /**
   * Obtiene configuración de estado
   */
  getStatusConfig(status: QueuedNotificationStatus): any {
    return this.statuses.find(s => s.value === status);
  }

  /**
   * Formatea duración
   */
  formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) return `${milliseconds}ms`;
    if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(1)}s`;
    return `${(milliseconds / 60000).toFixed(1)}m`;
  }

  /**
   * Formatea fecha relativa
   */
  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Hace menos de 1 minuto';
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} minutos`;
    if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} horas`;
    return `Hace ${Math.floor(diff / 86400000)} días`;
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
   * Limpia filtros
   */
  clearFilters(): void {
    this.filtersForm.reset();
  }
}
