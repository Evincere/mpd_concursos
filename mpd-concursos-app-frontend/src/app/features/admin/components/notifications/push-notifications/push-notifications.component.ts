import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PushNotificationService, PushNotificationState, PushNotificationConfig } from '@core/services/pwa/push-notification.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';
import { CustomDialogService } from '@shared/components/custom-dialog/custom-dialog.service';

/**
 * Plantilla de notificación predefinida
 */
interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  icon?: string;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: any;
}

/**
 * Componente para gestión de notificaciones push
 */
@Component({
  selector: 'app-push-notifications',
  templateUrl: './push-notifications.component.html',
  styleUrls: ['./push-notifications.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class PushNotificationsComponent implements OnInit, OnDestroy {

  // Estados del componente
  pushState: PushNotificationState | null = null;
  pushConfig: PushNotificationConfig | null = null;
  notificationStats: any = null;
  supportInfo: any = null;
  
  // Estados de UI
  activeTab: 'overview' | 'templates' | 'send' | 'config' = 'overview';
  loading = false;
  sending = false;

  // Formularios
  notificationForm: FormGroup;
  configForm: FormGroup;

  // Plantillas predefinidas
  templates: NotificationTemplate[] = [
    {
      id: 'contest-new',
      name: 'Nuevo Concurso',
      title: 'Nuevo concurso disponible',
      body: 'Se ha publicado un nuevo concurso que puede interesarte',
      icon: '/icons/icon-192x192.png',
      category: 'contest',
      priority: 'normal',
      actions: [
        { action: 'view', title: 'Ver concurso', icon: '/icons/icon-72x72.png' },
        { action: 'dismiss', title: 'Descartar' }
      ]
    },
    {
      id: 'inscription-reminder',
      name: 'Recordatorio de Inscripción',
      title: 'Recordatorio: Inscripción próxima a vencer',
      body: 'Tu inscripción vence en 24 horas. No olvides completar la documentación.',
      icon: '/icons/icon-192x192.png',
      category: 'reminder',
      priority: 'high',
      actions: [
        { action: 'complete', title: 'Completar', icon: '/icons/icon-72x72.png' },
        { action: 'dismiss', title: 'Más tarde' }
      ]
    },
    {
      id: 'exam-schedule',
      name: 'Cronograma de Examen',
      title: 'Cronograma de examen publicado',
      body: 'Ya está disponible el cronograma para tu examen. Revisa fecha y horario.',
      icon: '/icons/icon-192x192.png',
      category: 'exam',
      priority: 'high',
      actions: [
        { action: 'view', title: 'Ver cronograma', icon: '/icons/icon-72x72.png' }
      ]
    },
    {
      id: 'results-available',
      name: 'Resultados Disponibles',
      title: '¡Resultados publicados!',
      body: 'Los resultados de tu examen ya están disponibles.',
      icon: '/icons/icon-192x192.png',
      category: 'results',
      priority: 'urgent',
      actions: [
        { action: 'view', title: 'Ver resultados', icon: '/icons/icon-72x72.png' }
      ]
    },
    {
      id: 'system-maintenance',
      name: 'Mantenimiento del Sistema',
      title: 'Mantenimiento programado',
      body: 'El sistema estará en mantenimiento el {date} de {time_start} a {time_end}.',
      icon: '/icons/icon-192x192.png',
      category: 'system',
      priority: 'normal'
    }
  ];

  // Opciones para selects
  priorityOptions = [
    { value: 'low', label: 'Baja', color: '#6b7280' },
    { value: 'normal', label: 'Normal', color: '#3b82f6' },
    { value: 'high', label: 'Alta', color: '#f59e0b' },
    { value: 'urgent', label: 'Urgente', color: '#ef4444' }
  ];

  categoryOptions = [
    { value: 'contest', label: 'Concursos', icon: 'fas fa-trophy' },
    { value: 'inscription', label: 'Inscripciones', icon: 'fas fa-user-plus' },
    { value: 'exam', label: 'Exámenes', icon: 'fas fa-file-alt' },
    { value: 'results', label: 'Resultados', icon: 'fas fa-chart-line' },
    { value: 'reminder', label: 'Recordatorios', icon: 'fas fa-bell' },
    { value: 'system', label: 'Sistema', icon: 'fas fa-cog' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private pushNotificationService: PushNotificationService,
    private notificationService: CustomNotificationService,
    private dialogService: CustomDialogService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.setupSubscriptions();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa los formularios
   */
  private initializeForms(): void {
    this.notificationForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      body: ['', [Validators.required, Validators.maxLength(300)]],
      icon: ['/icons/icon-192x192.png'],
      category: ['system', Validators.required],
      priority: ['normal', Validators.required],
      url: [''],
      requireInteraction: [false],
      silent: [false],
      vibrate: [false],
      actions: this.fb.array([])
    });

    this.configForm = this.fb.group({
      enabled: [true],
      autoSubscribe: [false],
      showPermissionPrompt: [true],
      retryFailedSubscriptions: [true]
    });
  }

  /**
   * Configura las suscripciones
   */
  private setupSubscriptions(): void {
    this.pushNotificationService.state$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(state => {
      this.pushState = state;
    });

    this.pushNotificationService.config$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(config => {
      this.pushConfig = config;
      this.populateConfigForm(config);
    });
  }

  /**
   * Carga los datos iniciales
   */
  private loadData(): void {
    this.loading = true;

    // Cargar estadísticas
    this.pushNotificationService.getNotificationStats().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (stats) => {
        this.notificationStats = stats;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading notification stats:', error);
        this.loading = false;
      }
    });

    // Cargar información de soporte
    this.supportInfo = this.pushNotificationService.getSupportInfo();
  }

  /**
   * Rellena el formulario de configuración
   */
  private populateConfigForm(config: PushNotificationConfig): void {
    this.configForm.patchValue({
      enabled: config.enabled,
      autoSubscribe: config.autoSubscribe,
      showPermissionPrompt: config.showPermissionPrompt,
      retryFailedSubscriptions: config.retryFailedSubscriptions
    });
  }

  /**
   * Cambia la pestaña activa
   */
  setActiveTab(tab: 'overview' | 'templates' | 'send' | 'config'): void {
    this.activeTab = tab;
  }

  /**
   * Suscribe a notificaciones push
   */
  async subscribeToPush(): Promise<void> {
    try {
      this.loading = true;
      await this.pushNotificationService.subscribe();
      this.notificationService.showSuccess('Suscripción a notificaciones activada');
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      this.notificationService.showError('Error al activar las notificaciones');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Cancela la suscripción a notificaciones
   */
  async unsubscribeFromPush(): Promise<void> {
    const confirmed = await this.dialogService.showConfirmDialog({
      title: 'Cancelar Notificaciones',
      message: '¿Estás seguro de que quieres cancelar las notificaciones push?',
      confirmText: 'Cancelar suscripción',
      cancelText: 'Mantener',
      type: 'warning'
    }).toPromise();

    if (confirmed) {
      try {
        this.loading = true;
        await this.pushNotificationService.unsubscribe();
        this.notificationService.showSuccess('Suscripción a notificaciones cancelada');
      } catch (error) {
        console.error('Error unsubscribing from push notifications:', error);
        this.notificationService.showError('Error al cancelar las notificaciones');
      } finally {
        this.loading = false;
      }
    }
  }

  /**
   * Envía notificación de prueba
   */
  async sendTestNotification(): Promise<void> {
    try {
      this.sending = true;
      await this.pushNotificationService.sendTestNotification();
      this.notificationService.showSuccess('Notificación de prueba enviada');
    } catch (error) {
      console.error('Error sending test notification:', error);
      this.notificationService.showError('Error al enviar la notificación de prueba');
    } finally {
      this.sending = false;
    }
  }

  /**
   * Aplica una plantilla al formulario
   */
  applyTemplate(template: NotificationTemplate): void {
    this.notificationForm.patchValue({
      title: template.title,
      body: template.body,
      icon: template.icon,
      category: template.category,
      priority: template.priority
    });

    this.setActiveTab('send');
  }

  /**
   * Envía notificación personalizada
   */
  async sendCustomNotification(): Promise<void> {
    if (this.notificationForm.invalid) {
      this.markFormGroupTouched(this.notificationForm);
      return;
    }

    const formValue = this.notificationForm.value;
    
    try {
      this.sending = true;
      
      const template = {
        title: formValue.title,
        body: formValue.body,
        icon: formValue.icon,
        tag: `custom-${Date.now()}`,
        data: {
          category: formValue.category,
          priority: formValue.priority,
          url: formValue.url
        },
        requireInteraction: formValue.requireInteraction,
        silent: formValue.silent,
        vibrate: formValue.vibrate ? [200, 100, 200] : undefined
      };

      await this.pushNotificationService.showLocalNotification(template);
      this.notificationService.showSuccess('Notificación enviada exitosamente');
      
      // Limpiar formulario
      this.notificationForm.reset({
        icon: '/icons/icon-192x192.png',
        category: 'system',
        priority: 'normal'
      });
      
    } catch (error) {
      console.error('Error sending custom notification:', error);
      this.notificationService.showError('Error al enviar la notificación');
    } finally {
      this.sending = false;
    }
  }

  /**
   * Guarda la configuración
   */
  saveConfiguration(): void {
    if (this.configForm.invalid) {
      this.markFormGroupTouched(this.configForm);
      return;
    }

    const formValue = this.configForm.value;
    
    this.pushNotificationService.updateConfig(formValue);
    this.notificationService.showSuccess('Configuración guardada exitosamente');
  }

  /**
   * Obtiene el color de la prioridad
   */
  getPriorityColor(priority: string): string {
    const option = this.priorityOptions.find(p => p.value === priority);
    return option?.color || '#6b7280';
  }

  /**
   * Obtiene el ícono de la categoría
   */
  getCategoryIcon(category: string): string {
    const option = this.categoryOptions.find(c => c.value === category);
    return option?.icon || 'fas fa-bell';
  }

  /**
   * Obtiene el estado de una capacidad
   */
  getCapabilityStatus(supported: boolean): { icon: string; color: string; text: string } {
    if (supported) {
      return {
        icon: 'fas fa-check-circle',
        color: '#4CAF50',
        text: 'Soportado'
      };
    } else {
      return {
        icon: 'fas fa-times-circle',
        color: '#ef4444',
        text: 'No soportado'
      };
    }
  }

  /**
   * Obtiene el estado del permiso
   */
  getPermissionStatus(): { icon: string; color: string; text: string } {
    if (!this.pushState) {
      return { icon: 'fas fa-question-circle', color: '#6b7280', text: 'Desconocido' };
    }

    switch (this.pushState.permission) {
      case 'granted':
        return { icon: 'fas fa-check-circle', color: '#4CAF50', text: 'Concedido' };
      case 'denied':
        return { icon: 'fas fa-times-circle', color: '#ef4444', text: 'Denegado' };
      case 'default':
        return { icon: 'fas fa-question-circle', color: '#f59e0b', text: 'No solicitado' };
      default:
        return { icon: 'fas fa-question-circle', color: '#6b7280', text: 'Desconocido' };
    }
  }

  /**
   * Verifica si puede enviar notificaciones
   */
  canSendNotifications(): boolean {
    return this.pushState?.isSupported && 
           this.pushState?.permission === 'granted' && 
           this.pushState?.isSubscribed;
  }

  /**
   * Marca todos los campos del formulario como tocados
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Verifica si un campo del formulario es inválido
   */
  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Obtiene el mensaje de error para un campo
   */
  getFieldError(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} es requerido`;
      if (field.errors['maxlength']) return `${fieldName} excede la longitud máxima`;
    }
    return '';
  }

  /**
   * Formatea números grandes
   */
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  /**
   * Calcula el porcentaje de click rate
   */
  getClickRatePercentage(): number {
    if (!this.notificationStats || this.notificationStats.totalSent === 0) {
      return 0;
    }
    return Math.round((this.notificationStats.totalClicked / this.notificationStats.totalSent) * 100);
  }
}
