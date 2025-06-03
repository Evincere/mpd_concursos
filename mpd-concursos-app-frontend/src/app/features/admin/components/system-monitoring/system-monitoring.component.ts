import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Servicios custom
import { NotificationService } from '@core/services/notification/notification.service';

import {
  SystemMonitoringService,
  AppPerformanceMetrics,
  DatabaseMetrics,
  SystemAlert,
  AlertThreshold,
  MonitoringFilter
} from '@core/services/admin/system-monitoring.service';
import { AppPerformanceComponent } from './components/app-performance/app-performance.component';
import { DatabaseMonitoringComponent } from './components/database-monitoring/database-monitoring.component';
import { SystemAlertsComponent } from './components/system-alerts/system-alerts.component';
import { AlertConfigurationComponent } from './components/alert-configuration/alert-configuration.component';

@Component({
  selector: 'app-system-monitoring',
  templateUrl: './system-monitoring.component.html',
  styleUrls: ['./system-monitoring.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AppPerformanceComponent,
    DatabaseMonitoringComponent,
    SystemAlertsComponent,
    AlertConfigurationComponent
  ]
})
export class SystemMonitoringComponent implements OnInit, OnDestroy {
  // Datos de monitoreo
  appPerformanceMetrics: AppPerformanceMetrics | null = null;
  databaseMetrics: DatabaseMetrics | null = null;
  systemAlerts: SystemAlert[] = [];
  alertThresholds: AlertThreshold[] = [];

  // Estado de la UI
  isLoading = false;
  activeTab: string = 'performance';

  // Modo del componente (monitoreo, auditoría, backups)
  mode: 'monitoring' | 'audit' | 'backup' = 'monitoring';
  filter: string | null = null;

  // Formulario de filtros
  filterForm: FormGroup;

  // Intervalos de tiempo predefinidos
  timeIntervals = [
    { value: 'last-hour', label: 'Última hora' },
    { value: 'last-day', label: 'Último día' },
    { value: 'last-week', label: 'Última semana' },
    { value: 'last-month', label: 'Último mes' },
    { value: 'custom', label: 'Personalizado' }
  ];

  // Configuración de tabs por modo
  tabsConfig = {
    monitoring: [
      { id: 'performance', label: 'Rendimiento', icon: '📊' },
      { id: 'database', label: 'Base de Datos', icon: '🗄️' },
      { id: 'alerts', label: 'Alertas', icon: '🚨' },
      { id: 'config', label: 'Configuración', icon: '⚙️' }
    ],
    audit: [
      { id: 'users', label: 'Usuarios', icon: '👥' },
      { id: 'system', label: 'Sistema', icon: '🖥️' },
      { id: 'security', label: 'Seguridad', icon: '🔒' },
      { id: 'reports', label: 'Reportes', icon: '📋' }
    ],
    backup: [
      { id: 'automatic', label: 'Automáticos', icon: '🔄' },
      { id: 'manual', label: 'Manuales', icon: '📁' },
      { id: 'schedule', label: 'Programación', icon: '⏰' },
      { id: 'restore', label: 'Restaurar', icon: '↩️' }
    ]
  };

  // Tabs activos según el modo
  activeTabs: any[] = [];

  // Títulos por modo
  modeConfig = {
    monitoring: {
      title: 'Monitoreo del Sistema',
      description: 'Supervise el rendimiento, base de datos y alertas del sistema en tiempo real.'
    },
    audit: {
      title: 'Auditoría del Sistema',
      description: 'Revise los registros de auditoría, actividad de usuarios y eventos de seguridad.'
    },
    backup: {
      title: 'Copias de Seguridad',
      description: 'Gestione las copias de seguridad automáticas y manuales del sistema.'
    }
  };

  // Para limpieza de suscripciones
  private destroy$ = new Subject<void>();

  // Intervalo de actualización automática
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private monitoringService: SystemMonitoringService,
    private notificationService: NotificationService
  ) {
    // Inicializar formulario de filtros
    this.filterForm = this.fb.group({
      timeInterval: ['last-hour'],
      dateRange: this.fb.group({
        startDate: [null],
        endDate: [null]
      }),
      category: [''],
      severity: ['']
    });

    // Deshabilitar campos de fecha personalizada por defecto
    this.filterForm.get('dateRange')?.disable();

    // Escuchar cambios en el intervalo de tiempo
    this.filterForm.get('timeInterval')?.valueChanges.subscribe(value => {
      if (value === 'custom') {
        this.filterForm.get('dateRange')?.enable();
      } else {
        this.filterForm.get('dateRange')?.disable();
      }
    });
  }

  ngOnInit(): void {
    try {
      // Detectar modo basándose en los datos de la ruta
      this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
        if (data['mode']) {
          this.mode = data['mode'];
          this.filter = data['filter'] || null;
        }

        // Configurar tabs según el modo
        this.configureTabsForMode();
      });

      this.loadData();

      // Configurar actualización automática cada 30 segundos
      this.refreshInterval = setInterval(() => {
        this.loadData(false);
      }, 30000);
    } catch (error) {
      console.error('Error initializing SystemMonitoringComponent:', error);
      this.notificationService.showError('Error al inicializar el componente de monitoreo');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Limpiar intervalo de actualización
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  /**
   * Configura las tabs según el modo actual
   */
  configureTabsForMode(): void {
    this.activeTabs = this.tabsConfig[this.mode] || this.tabsConfig.monitoring;

    // Establecer la primera tab como activa si no hay una seleccionada
    if (this.activeTabs.length > 0 && !this.activeTab) {
      this.activeTab = this.activeTabs[0].id;
    }
  }

  /**
   * Obtiene la configuración del modo actual
   */
  getCurrentModeConfig() {
    return this.modeConfig[this.mode] || this.modeConfig.monitoring;
  }

  /**
   * Cambia la pestaña activa
   */
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }



  /**
   * Carga los datos de monitoreo
   * @param showLoading Indica si se debe mostrar el indicador de carga
   */
  loadData(showLoading = true): void {
    try {
      if (showLoading) {
        this.isLoading = true;
      }

      // Obtener filtros
      const filter = this.getMonitoringFilter();

    // Cargar métricas de rendimiento de la aplicación
    this.monitoringService.getAppPerformanceMetrics(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.appPerformanceMetrics = data;
          if (showLoading) {
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.error('Error cargando métricas de rendimiento:', error);
          this.notificationService.showError('Error al cargar métricas de rendimiento');
          if (showLoading) {
            this.isLoading = false;
          }
        }
      });

    // Cargar métricas de base de datos
    this.monitoringService.getDatabaseMetrics(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.databaseMetrics = data;
        },
        error: (error) => {
          console.error('Error cargando métricas de base de datos:', error);
        }
      });

    // Cargar alertas del sistema
    this.monitoringService.getSystemAlerts(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.systemAlerts = data;
        },
        error: (error) => {
          console.error('Error cargando alertas del sistema:', error);
        }
      });

    // Cargar umbrales de alerta
    this.monitoringService.getAlertThresholds()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.alertThresholds = data;
        },
        error: (error) => {
          console.error('Error cargando umbrales de alerta:', error);
        }
      });
    } catch (error) {
      console.error('Error in loadData method:', error);
      this.notificationService.showError('Error al cargar los datos de monitoreo');
      if (showLoading) {
        this.isLoading = false;
      }
    }
  }

  /**
   * Obtiene los filtros de monitoreo a partir del formulario
   */
  getMonitoringFilter(): MonitoringFilter {
    const filter: MonitoringFilter = {};

    const timeInterval = this.filterForm.get('timeInterval')?.value;

    if (timeInterval === 'custom') {
      filter.startDate = this.filterForm.get('dateRange.startDate')?.value;
      filter.endDate = this.filterForm.get('dateRange.endDate')?.value;
    } else {
      // Calcular fechas basadas en el intervalo seleccionado
      const now = new Date();

      switch (timeInterval) {
        case 'last-hour':
          filter.startDate = new Date(now.getTime() - 60 * 60 * 1000);
          filter.endDate = now;
          filter.interval = 'minute';
          break;
        case 'last-day':
          filter.startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          filter.endDate = now;
          filter.interval = 'hour';
          break;
        case 'last-week':
          filter.startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filter.endDate = now;
          filter.interval = 'day';
          break;
        case 'last-month':
          filter.startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filter.endDate = now;
          filter.interval = 'day';
          break;
      }
    }

    filter.category = this.filterForm.get('category')?.value;
    filter.severity = this.filterForm.get('severity')?.value;

    return filter;
  }

  /**
   * Aplica los filtros seleccionados
   */
  applyFilters(): void {
    this.loadData();
  }

  /**
   * Reinicia los filtros
   */
  resetFilters(): void {
    this.filterForm.reset({
      timeInterval: 'last-hour',
      dateRange: {
        startDate: null,
        endDate: null
      },
      category: '',
      severity: ''
    });

    this.loadData();
  }

  /**
   * Maneja el cambio de pestaña
   * @param index Índice de la pestaña seleccionada
   */
  onTabChange(index: number): void {
    // Convertir índice numérico a string para compatibilidad
    const tabs = ['performance', 'database', 'alerts', 'config'];
    this.activeTab = tabs[index] || 'performance';
  }

  /**
   * Acusa recibo de una alerta
   * @param event Evento que contiene el ID de la alerta o el ID directamente
   */
  acknowledgeAlert(event: Event | string): void {
    let alertId = '';

    if (typeof event === 'string') {
      alertId = event;
    } else if (event instanceof Event) {
      // Si es un evento del DOM, intentamos obtener el ID de un atributo data-alert-id
      const target = event.target as HTMLElement;
      if (target && target.getAttribute) {
        alertId = target.getAttribute('data-alert-id') || '';
      }
    } else if (event && typeof event === 'object' && 'alertId' in event) {
      alertId = (event as { alertId: string }).alertId;
    }

    if (!alertId) {
      console.error('ID de alerta no válido');
      this.notificationService.showError('Error: ID de alerta no válido');
      return;
    }

    console.log('Acusando recibo de alerta:', alertId);

    this.monitoringService.acknowledgeAlert(alertId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (_alert) => {
          this.notificationService.showSuccess('Alerta acusada correctamente');
          this.loadData(false);
        },
        error: (error) => {
          console.error('Error acusando alerta:', error);
          this.notificationService.showError('Error al acusar alerta');
        }
      });
  }

  /**
   * Marca una alerta como resuelta
   * @param event Evento que contiene el ID de la alerta o el ID directamente
   */
  resolveAlert(event: Event | string): void {
    let alertId = '';

    if (typeof event === 'string') {
      alertId = event;
    } else if (event instanceof Event) {
      // Si es un evento del DOM, intentamos obtener el ID de un atributo data-alert-id
      const target = event.target as HTMLElement;
      if (target && target.getAttribute) {
        alertId = target.getAttribute('data-alert-id') || '';
      }
    } else if (event && typeof event === 'object' && 'alertId' in event) {
      alertId = (event as { alertId: string }).alertId;
    }

    if (!alertId) {
      console.error('ID de alerta no válido');
      this.notificationService.showError('Error: ID de alerta no válido');
      return;
    }

    console.log('Resolviendo alerta:', alertId);

    this.monitoringService.resolveAlert(alertId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (_alert) => {
          this.notificationService.showSuccess('Alerta resuelta correctamente');
          this.loadData(false);
        },
        error: (error) => {
          console.error('Error resolviendo alerta:', error);
          this.notificationService.showError('Error al resolver alerta');
        }
      });
  }

  /**
   * Actualiza un umbral de alerta
   * @param event Evento que contiene el umbral de alerta o el umbral directamente
   */
  updateAlertThreshold(event: Event | AlertThreshold): void {
    let threshold: AlertThreshold | null = null;

    if (event instanceof Event) {
      // Si es un evento del DOM, intentamos obtener el umbral de un atributo data
      const target = event.target as HTMLElement;
      if (target && target.getAttribute) {
        const thresholdId = target.getAttribute('data-threshold-id');
        const thresholdValue = target.getAttribute('data-threshold-value');
        if (thresholdId && thresholdValue) {
          threshold = {
            id: thresholdId,
            name: target.getAttribute('data-threshold-name') || '',
            description: target.getAttribute('data-threshold-description') || '',
            metricName: '',
            operator: '>' as const,
            threshold: parseFloat(thresholdValue),
            severity: 'warning' as const,
            enabled: true,
            notificationChannels: ['system'],
            cooldownMinutes: 15
          };
        }
      }
    } else if (event && typeof event === 'object') {
      if ('id' in event) {
        threshold = event as AlertThreshold;
      } else if ('threshold' in event) {
        threshold = (event as { threshold: AlertThreshold }).threshold;
      }
    }

    if (!threshold || !threshold.id) {
      console.error('Umbral de alerta no válido');
      this.notificationService.showError('Error: Umbral de alerta no válido');
      return;
    }

    console.log('Actualizando umbral de alerta:', threshold.id, threshold.threshold || 'N/A');

    this.monitoringService.updateAlertThreshold(threshold)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (_updatedThreshold) => {
          this.notificationService.showSuccess('Umbral de alerta actualizado correctamente');
          this.loadData(false);
        },
        error: (error) => {
          console.error('Error actualizando umbral de alerta:', error);
          this.notificationService.showError('Error al actualizar umbral de alerta');
        }
      });
  }
}
