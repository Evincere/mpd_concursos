import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, timer, combineLatest } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

import { 
  MonitoringService, 
  SystemMetrics, 
  SystemAlert,
  MonitoringDashboard,
  AlertConfiguration,
  HistoricalData
} from '@core/services/messaging/monitoring.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';
import { CustomDialogService } from '@shared/components/custom-dialog/custom-dialog.service';

/**
 * Vista activa del dashboard
 */
type DashboardView = 'overview' | 'metrics' | 'alerts' | 'performance' | 'settings';

/**
 * Tipo de widget
 */
type WidgetType = 'metric' | 'chart' | 'table' | 'alert' | 'status';

/**
 * Configuración de widget
 */
interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  dataSource: string;
  refreshInterval: number;
  chartType?: 'line' | 'bar' | 'pie' | 'gauge' | 'number';
  timeRange?: string;
  metrics?: string[];
  size: 'small' | 'medium' | 'large';
}

/**
 * Componente del dashboard de monitoreo
 */
@Component({
  selector: 'app-monitoring-dashboard',
  templateUrl: './monitoring-dashboard.component.html',
  styleUrls: ['./monitoring-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class MonitoringDashboardComponent implements OnInit, OnDestroy {

  // Estados del componente
  systemMetrics: SystemMetrics | null = null;
  activeAlerts: SystemAlert[] = [];
  dashboards: MonitoringDashboard[] = [];
  alertConfigurations: AlertConfiguration[] = [];
  selectedDashboard: MonitoringDashboard | null = null;
  historicalData: Record<string, HistoricalData> = {};

  // Estados de UI
  activeView: DashboardView = 'overview';
  loading = false;
  autoRefreshEnabled = true;
  refreshInterval = 30; // segundos
  selectedTimeRange = '24h';

  // Formularios
  alertForm!: FormGroup;
  dashboardForm!: FormGroup;

  // Configuración de widgets
  availableWidgets: WidgetConfig[] = [
    {
      id: 'system-health',
      type: 'status',
      title: 'Estado del Sistema',
      dataSource: 'system.health',
      refreshInterval: 30,
      size: 'small'
    },
    {
      id: 'active-alerts',
      type: 'alert',
      title: 'Alertas Activas',
      dataSource: 'alerts.active',
      refreshInterval: 30,
      size: 'small'
    },
    {
      id: 'messages-chart',
      type: 'chart',
      title: 'Mensajes por Hora',
      dataSource: 'messaging.hourly',
      refreshInterval: 60,
      chartType: 'line',
      timeRange: '24h',
      size: 'medium'
    },
    {
      id: 'notifications-chart',
      type: 'chart',
      title: 'Notificaciones por Tipo',
      dataSource: 'notifications.byType',
      refreshInterval: 60,
      chartType: 'pie',
      size: 'medium'
    },
    {
      id: 'queue-status',
      type: 'chart',
      title: 'Estado de Colas',
      dataSource: 'queue.status',
      refreshInterval: 30,
      chartType: 'bar',
      size: 'medium'
    },
    {
      id: 'performance-metrics',
      type: 'chart',
      title: 'Rendimiento del Sistema',
      dataSource: 'performance.overview',
      refreshInterval: 30,
      chartType: 'line',
      timeRange: '1h',
      metrics: ['cpu', 'memory', 'responseTime'],
      size: 'large'
    },
    {
      id: 'trigger-executions',
      type: 'metric',
      title: 'Ejecuciones de Triggers',
      dataSource: 'triggers.executions',
      refreshInterval: 60,
      chartType: 'number',
      size: 'small'
    },
    {
      id: 'event-processing',
      type: 'chart',
      title: 'Procesamiento de Eventos',
      dataSource: 'events.processing',
      refreshInterval: 60,
      chartType: 'line',
      timeRange: '6h',
      size: 'medium'
    }
  ];

  // Opciones de configuración
  timeRangeOptions = [
    { value: '1h', label: '1 Hora' },
    { value: '6h', label: '6 Horas' },
    { value: '24h', label: '24 Horas' },
    { value: '7d', label: '7 Días' },
    { value: '30d', label: '30 Días' }
  ];

  refreshIntervalOptions = [
    { value: 10, label: '10 segundos' },
    { value: 30, label: '30 segundos' },
    { value: 60, label: '1 minuto' },
    { value: 300, label: '5 minutos' },
    { value: 600, label: '10 minutos' }
  ];

  alertTypes = [
    { value: 'info', label: 'Información', color: '#3b82f6' },
    { value: 'warning', label: 'Advertencia', color: '#f59e0b' },
    { value: 'error', label: 'Error', color: '#ef4444' },
    { value: 'critical', label: 'Crítico', color: '#dc2626' }
  ];

  alertCategories = [
    { value: 'messaging', label: 'Mensajería', icon: 'fas fa-comments' },
    { value: 'notifications', label: 'Notificaciones', icon: 'fas fa-bell' },
    { value: 'triggers', label: 'Triggers', icon: 'fas fa-bolt' },
    { value: 'events', label: 'Eventos', icon: 'fas fa-stream' },
    { value: 'queue', label: 'Cola', icon: 'fas fa-layer-group' },
    { value: 'performance', label: 'Rendimiento', icon: 'fas fa-tachometer-alt' },
    { value: 'system', label: 'Sistema', icon: 'fas fa-server' }
  ];

  private destroy$ = new Subject<void>();
  private refreshTimer?: any;

  constructor(
    private fb: FormBuilder,
    private monitoringService: MonitoringService,
    private notificationService: CustomNotificationService,
    private dialogService: CustomDialogService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.setupSubscriptions();
    this.loadInitialData();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopAutoRefresh();
  }

  /**
   * Inicializa los formularios
   */
  private initializeForms(): void {
    this.alertForm = this.fb.group({
      name: [''],
      description: [''],
      category: ['messaging'],
      isActive: [true],
      metric: [''],
      operator: ['gt'],
      value: [0],
      timeWindow: [5],
      consecutiveChecks: [1],
      channels: [['in_app']],
      recipients: [''],
      cooldownPeriod: [60]
    });

    this.dashboardForm = this.fb.group({
      name: [''],
      description: [''],
      isDefault: [false],
      autoRefresh: [true],
      refreshInterval: [30],
      timeRange: ['24h']
    });
  }

  /**
   * Configura las suscripciones
   */
  private setupSubscriptions(): void {
    // Suscribirse a métricas del sistema
    this.monitoringService.metrics$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(metrics => {
      this.systemMetrics = metrics;
    });

    // Suscribirse a alertas activas
    this.monitoringService.alerts$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(alerts => {
      this.activeAlerts = alerts;
    });

    // Suscribirse a dashboards
    this.monitoringService.dashboards$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(dashboards => {
      this.dashboards = dashboards;
      if (!this.selectedDashboard && dashboards.length > 0) {
        this.selectedDashboard = dashboards.find(d => d.isDefault) || dashboards[0];
      }
    });

    // Suscribirse a configuraciones de alertas
    this.monitoringService.alertConfigurations$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(configs => {
      this.alertConfigurations = configs;
    });
  }

  /**
   * Carga datos iniciales
   */
  private loadInitialData(): void {
    this.loading = true;

    // Cargar métricas del sistema
    this.monitoringService.getSystemMetrics().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading system metrics:', error);
        this.loading = false;
      }
    });

    // Cargar alertas activas
    this.monitoringService.getActiveAlerts().pipe(
      takeUntil(this.destroy$)
    ).subscribe();

    // Cargar dashboards
    this.monitoringService.getDashboards().pipe(
      takeUntil(this.destroy$)
    ).subscribe();

    // Cargar configuraciones de alertas
    this.monitoringService.getAlertConfigurations().pipe(
      takeUntil(this.destroy$)
    ).subscribe();

    // Cargar datos históricos para gráficos
    this.loadHistoricalData();
  }

  /**
   * Carga datos históricos
   */
  private loadHistoricalData(): void {
    const metrics = [
      'messaging.messagesLast24h',
      'notifications.notificationsLast24h',
      'performance.cpuUsage',
      'performance.memoryUsage',
      'performance.responseTime',
      'queue.totalQueued',
      'triggers.triggersExecutedLast24h',
      'events.eventsLast24h'
    ];

    metrics.forEach(metric => {
      this.monitoringService.getHistoricalData(metric, this.selectedTimeRange).pipe(
        takeUntil(this.destroy$)
      ).subscribe(data => {
        this.historicalData[metric] = data;
      });
    });
  }

  /**
   * Cambia la vista activa
   */
  setActiveView(view: DashboardView): void {
    this.activeView = view;
  }

  /**
   * Selecciona dashboard
   */
  selectDashboard(dashboard: MonitoringDashboard): void {
    this.selectedDashboard = dashboard;
  }

  /**
   * Cambia rango de tiempo
   */
  changeTimeRange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target && target.value) {
      this.selectedTimeRange = target.value;
      this.loadHistoricalData();
    }
  }

  /**
   * Reconoce alerta
   */
  acknowledgeAlert(alert: SystemAlert): void {
    this.monitoringService.acknowledgeAlert(alert.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.notificationService.showSuccess('Alerta reconocida exitosamente');
      },
      error: (error) => {
        console.error('Error acknowledging alert:', error);
        this.notificationService.showError('Error al reconocer alerta');
      }
    });
  }

  /**
   * Resuelve alerta
   */
  async resolveAlert(alert: SystemAlert): Promise<void> {
    const resolution = await this.dialogService.showInputDialog({
      title: 'Resolver Alerta',
      message: 'Ingresa la resolución para esta alerta:',
      inputType: 'textarea',
      placeholder: 'Descripción de la resolución...',
      required: true
    }).toPromise();

    if (!resolution) return;

    this.monitoringService.resolveAlert(alert.id, resolution).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.notificationService.showSuccess('Alerta resuelta exitosamente');
      },
      error: (error) => {
        console.error('Error resolving alert:', error);
        this.notificationService.showError('Error al resolver alerta');
      }
    });
  }

  /**
   * Crea configuración de alerta
   */
  createAlertConfiguration(): void {
    if (this.alertForm.invalid) {
      this.markFormGroupTouched(this.alertForm);
      return;
    }

    const formValue = this.alertForm.value;
    const config: Partial<AlertConfiguration> = {
      name: formValue.name,
      description: formValue.description,
      category: formValue.category,
      isActive: formValue.isActive,
      conditions: [{
        metric: formValue.metric,
        operator: formValue.operator,
        value: formValue.value,
        timeWindow: formValue.timeWindow,
        consecutiveChecks: formValue.consecutiveChecks
      }],
      notification: {
        channels: formValue.channels,
        recipients: formValue.recipients.split(',').map((r: string) => r.trim()),
        template: 'default',
        cooldownPeriod: formValue.cooldownPeriod,
        escalationRules: []
      }
    };

    this.monitoringService.createAlertConfiguration(config).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.notificationService.showSuccess('Configuración de alerta creada exitosamente');
        this.alertForm.reset();
      },
      error: (error) => {
        console.error('Error creating alert configuration:', error);
        this.notificationService.showError('Error al crear configuración de alerta');
      }
    });
  }

  /**
   * Crea dashboard personalizado
   */
  createCustomDashboard(): void {
    if (this.dashboardForm.invalid) {
      this.markFormGroupTouched(this.dashboardForm);
      return;
    }

    const formValue = this.dashboardForm.value;
    const dashboard: Partial<MonitoringDashboard> = {
      name: formValue.name,
      description: formValue.description,
      isDefault: formValue.isDefault,
      layout: {
        columns: 12,
        rows: 8,
        widgets: []
      },
      settings: {
        autoRefresh: formValue.autoRefresh,
        refreshInterval: formValue.refreshInterval,
        timeRange: formValue.timeRange,
        timezone: 'America/Argentina/Buenos_Aires'
      }
    };

    this.monitoringService.createDashboard(dashboard).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (newDashboard) => {
        this.notificationService.showSuccess('Dashboard creado exitosamente');
        this.dashboardForm.reset();
        this.selectedDashboard = newDashboard;
      },
      error: (error) => {
        console.error('Error creating dashboard:', error);
        this.notificationService.showError('Error al crear dashboard');
      }
    });
  }

  /**
   * Exporta métricas
   */
  async exportMetrics(): Promise<void> {
    const format = await this.dialogService.showInputDialog({
      title: 'Exportar Métricas',
      message: 'Selecciona el formato de exportación:',
      inputType: 'select',
      options: [
        { value: 'json', label: 'JSON' },
        { value: 'csv', label: 'CSV' },
        { value: 'excel', label: 'Excel' }
      ],
      defaultValue: 'json'
    }).toPromise();

    if (!format) return;

    this.monitoringService.exportMetrics(format as any, this.selectedTimeRange).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `metrics-${new Date().toISOString().split('T')[0]}.${format}`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.notificationService.showSuccess('Métricas exportadas exitosamente');
      },
      error: (error) => {
        console.error('Error exporting metrics:', error);
        this.notificationService.showError('Error al exportar métricas');
      }
    });
  }

  /**
   * Ejecuta diagnóstico del sistema
   */
  runDiagnostics(): void {
    this.monitoringService.runSystemDiagnostics().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        this.notificationService.showSuccess('Diagnóstico completado exitosamente');
        // Mostrar resultados del diagnóstico
      },
      error: (error) => {
        console.error('Error running diagnostics:', error);
        this.notificationService.showError('Error al ejecutar diagnóstico');
      }
    });
  }

  /**
   * Configura actualización automática
   */
  toggleAutoRefresh(): void {
    this.autoRefreshEnabled = !this.autoRefreshEnabled;
    this.monitoringService.setAutoRefresh(this.autoRefreshEnabled, this.refreshInterval * 1000);
    
    if (this.autoRefreshEnabled) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }

  /**
   * Cambia intervalo de actualización
   */
  changeRefreshInterval(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target && target.value) {
      this.refreshInterval = +target.value;
      this.monitoringService.setAutoRefresh(this.autoRefreshEnabled, this.refreshInterval * 1000);
    }
    
    if (this.autoRefreshEnabled) {
      this.startAutoRefresh();
    }
  }

  /**
   * Inicia actualización automática
   */
  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    
    if (this.autoRefreshEnabled) {
      this.refreshTimer = timer(0, this.refreshInterval * 1000).pipe(
        switchMap(() => combineLatest([
          this.monitoringService.getSystemMetrics(),
          this.monitoringService.getActiveAlerts()
        ])),
        takeUntil(this.destroy$)
      ).subscribe();
    }
  }

  /**
   * Detiene actualización automática
   */
  private stopAutoRefresh(): void {
    if (this.refreshTimer) {
      this.refreshTimer.unsubscribe();
    }
  }

  /**
   * Obtiene configuración de tipo de alerta
   */
  getAlertTypeConfig(type: string): any {
    return this.alertTypes.find(t => t.value === type);
  }

  /**
   * Obtiene configuración de categoría de alerta
   */
  getAlertCategoryConfig(category: string): any {
    return this.alertCategories.find(c => c.value === category);
  }

  /**
   * Formatea número con sufijos
   */
  formatNumber(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  }

  /**
   * Formatea porcentaje
   */
  formatPercentage(value: number): string {
    return value.toFixed(1) + '%';
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
   * Obtiene color de estado de salud
   */
  getHealthColor(status: string): string {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
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
      if (field.errors['min']) return `Valor mínimo: ${field.errors['min'].min}`;
      if (field.errors['max']) return `Valor máximo: ${field.errors['max'].max}`;
    }
    return '';
  }

  /**
   * Verifica si hay top triggers disponibles
   */
  hasTopTriggers(): boolean {
    return !!(this.systemMetrics?.triggers?.topTriggers && this.systemMetrics.triggers.topTriggers.length > 0);
  }
}
