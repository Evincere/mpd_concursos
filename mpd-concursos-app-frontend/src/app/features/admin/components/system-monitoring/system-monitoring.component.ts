import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'; // Import Validators
import { ActivatedRoute } from '@angular/router';
import { Subject, forkJoin } from 'rxjs'; // Import forkJoin
import { takeUntil, tap } from 'rxjs/operators'; // Import tap

// Custom Services
import { NotificationService } from '@shared/services/notification.service';
import { LoggingService } from '@core/services/logging/logging.service'; // Import LoggingService

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
  // Monitoring Data
  appPerformanceMetrics: AppPerformanceMetrics | null = null;
  databaseMetrics: DatabaseMetrics | null = null;
  systemAlerts: SystemAlert[] = [];
  alertThresholds: AlertThreshold[] = [];

  // UI State
  isLoading = false;
  activeTab: string = 'performance'; // Default active tab

  // Component mode (monitoring, audit, backup)
  mode: 'monitoring' | 'audit' | 'backup' = 'monitoring';
  filter: string | null = null; // Specific filter based on route data (e.g., 'users' for audit)

  // Filter Form
  filterForm: FormGroup;

  // Predefined time intervals
  timeIntervals = [
    { value: 'last-hour', label: 'Última hora' },
    { value: 'last-day', label: 'Último día' },
    { value: 'last-week', label: 'Última semana' },
    { value: 'last-month', label: 'Último mes' },
    { value: 'custom', label: 'Personalizado' }
  ];

  // Tab configuration per mode
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

  // Active tabs based on the current mode
  activeTabs: any[] = [];

  // Titles per mode
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

  // For cleaning up subscriptions
  private destroy$ = new Subject<void>();

  // Automatic refresh interval
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private monitoringService: SystemMonitoringService,
    private notificationService: NotificationService,
    private loggingService: LoggingService // Inject LoggingService
  ) {
    this.loggingService.debug('[SystemMonitoringComponent] Constructor: Initializing filter form.', undefined, 'SystemMonitoring');
    // Initialize filter form
    this.filterForm = this.fb.group({
      timeInterval: ['last-hour'],
      dateRange: this.fb.group({
        startDate: [null],
        endDate: [null]
      }),
      category: [''],
      severity: ['']
    });

    // Disable custom date fields by default
    this.filterForm.get('dateRange')?.disable();

    // Listen for changes in time interval
    this.filterForm.get('timeInterval')?.valueChanges.pipe(
      takeUntil(this.destroy$) // Ensure subscription is unsubscribed on destroy
    ).subscribe(value => {
      this.loggingService.debug(`[SystemMonitoringComponent] Time interval changed to: ${value}`, undefined, 'SystemMonitoring');
      if (value === 'custom') {
        this.filterForm.get('dateRange')?.enable();
        // Add validators for custom date range if needed, e.g., Validators.required
        this.filterForm.get('dateRange.startDate')?.setValidators(Validators.required);
        this.filterForm.get('dateRange.endDate')?.setValidators(Validators.required);
      } else {
        this.filterForm.get('dateRange')?.disable();
        // Clear validators if not in custom mode
        this.filterForm.get('dateRange.startDate')?.clearValidators();
        this.filterForm.get('dateRange.endDate')?.clearValidators();
        // Reset values to null when switching from custom
        this.filterForm.get('dateRange.startDate')?.setValue(null);
        this.filterForm.get('dateRange.endDate')?.setValue(null);
      }
      this.filterForm.get('dateRange.startDate')?.updateValueAndValidity();
      this.filterForm.get('dateRange.endDate')?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.loggingService.info('[SystemMonitoringComponent] Component initialized.', undefined, 'SystemMonitoring');
    try {
      // Detect mode based on route data
      this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
        this.loggingService.debug('[SystemMonitoringComponent] Route data received:', data, 'SystemMonitoring');
        if (data['mode']) {
          this.mode = data['mode'];
          this.filter = data['filter'] || null;
          this.loggingService.info(`[SystemMonitoringComponent] Mode set to: ${this.mode}, Filter: ${this.filter}`, undefined, 'SystemMonitoring');
        }

        // Configure tabs based on mode
        this.configureTabsForMode();
      });

      this.loadData(); // Initial data load

      // Configure automatic refresh every 30 seconds
      this.refreshInterval = setInterval(() => {
        this.loggingService.debug('[SystemMonitoringComponent] Auto-refresh triggered.', undefined, 'SystemMonitoring');
        this.loadData(false); // Load without showing full loading indicator
      }, 30000);
    } catch (error) {
      this.loggingService.error('[SystemMonitoringComponent] Error during ngOnInit:', error, 'SystemMonitoring');
      this.notificationService.error('Error al inicializar el componente de monitoreo');
    }
  }

  ngOnDestroy(): void {
    this.loggingService.info('[SystemMonitoringComponent] Component destroyed. Cleaning up resources.', undefined, 'SystemMonitoring');
    this.destroy$.next();
    this.destroy$.complete();

    // Clear refresh interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      this.loggingService.debug('[SystemMonitoringComponent] Auto-refresh interval cleared.', undefined, 'SystemMonitoring');
    }
  }

  /**
   * Configures the tabs based on the current mode.
   */
  configureTabsForMode(): void {
    this.activeTabs = this.tabsConfig[this.mode] || this.tabsConfig.monitoring;
    this.loggingService.debug(`[SystemMonitoringComponent] Active tabs configured for mode "${this.mode}".`, this.activeTabs, 'SystemMonitoring');

    // Set the first tab as active if none is selected
    if (this.activeTabs.length > 0 && !this.activeTab) {
      this.activeTab = this.activeTabs[0].id;
      this.loggingService.debug(`[SystemMonitoringComponent] Default active tab set to: ${this.activeTab}`, undefined, 'SystemMonitoring');
    }
  }

  /**
   * Gets the configuration for the current mode (title and description).
   */
  getCurrentModeConfig() {
    return this.modeConfig[this.mode] || this.modeConfig.monitoring;
  }

  /**
   * Changes the active tab.
   * @param tab The ID of the tab to activate.
   */
  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.loggingService.debug(`[SystemMonitoringComponent] Active tab changed to: ${tab}`, undefined, 'SystemMonitoring');
  }

  /**
   * Loads monitoring data from various services.
   * Uses forkJoin to manage simultaneous API calls and update loading state consistently.
   * @param showLoading Indicates whether to show the loading indicator (defaults to true).
   */
  loadData(showLoading = true): void {
    this.loggingService.info(`[SystemMonitoringComponent] Loading data (showLoading: ${showLoading}).`, undefined, 'SystemMonitoring');
    try {
      if (showLoading) {
        this.isLoading = true;
      }

      // Get current filters
      const filter = this.getMonitoringFilter();
      this.loggingService.debug('[SystemMonitoringComponent] Current monitoring filters:', filter, 'SystemMonitoring');

      // Create an array of observables for all data fetching calls
      forkJoin([
        this.monitoringService.getAppPerformanceMetrics(filter).pipe(
          tap(data => this.appPerformanceMetrics = data),
          tap(() => this.loggingService.debug('[SystemMonitoringComponent] App performance metrics loaded.', undefined, 'SystemMonitoring')),
          // Catch individual errors without failing the whole forkJoin, returning null/empty for that observable
          // This allows other data to still load even if one fails
          // If you want forkJoin to fail on first error, remove this catchError here.
          // The outer catchError of the forkJoin below will handle it.
        ),
        this.monitoringService.getDatabaseMetrics(filter).pipe(
          tap(data => this.databaseMetrics = data),
          tap(() => this.loggingService.debug('[SystemMonitoringComponent] Database metrics loaded.', undefined, 'SystemMonitoring'))
        ),
        this.monitoringService.getSystemAlerts(filter).pipe(
          tap(data => this.systemAlerts = data),
          tap(() => this.loggingService.debug('[SystemMonitoringComponent] System alerts loaded.', undefined, 'SystemMonitoring'))
        ),
        this.monitoringService.getAlertThresholds().pipe(
          tap(data => this.alertThresholds = data),
          tap(() => this.loggingService.debug('[SystemMonitoringComponent] Alert thresholds loaded.', undefined, 'SystemMonitoring'))
        )
      ]).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.loggingService.info('[SystemMonitoringComponent] All monitoring data loaded successfully.', undefined, 'SystemMonitoring');
          this.isLoading = false; // Reset loading state once all data is fetched
        },
        error: (error) => {
          this.loggingService.error('[SystemMonitoringComponent] Error loading one or more monitoring data sources:', error, 'SystemMonitoring');
          this.notificationService.error('Error al cargar algunos datos de monitoreo. Verifique la consola para más detalles.');
          this.isLoading = false; // Reset loading state on error
        }
      });
    } catch (error) {
      this.loggingService.error('[SystemMonitoringComponent] Error in loadData method:', error, 'SystemMonitoring');
      this.notificationService.error('Error al iniciar la carga de datos de monitoreo.');
      if (showLoading) {
        this.isLoading = false;
      }
    }
  }

  /**
   * Constructs the monitoring filter object from the form values.
   */
  getMonitoringFilter(): MonitoringFilter {
    const filter: MonitoringFilter = {};

    const timeInterval = this.filterForm.get('timeInterval')?.value;
    const now = new Date();

    if (timeInterval === 'custom') {
      const startDate = this.filterForm.get('dateRange.startDate')?.value;
      const endDate = this.filterForm.get('dateRange.endDate')?.value;

      // Basic validation for custom dates
      if (startDate && endDate && new Date(startDate) <= new Date(endDate)) {
        filter.startDate = new Date(startDate);
        filter.endDate = new Date(endDate);
      } else if (startDate || endDate) {
        this.notificationService.warning('Las fechas personalizadas son inválidas. Se ignorarán los filtros de fecha.');
        this.loggingService.warn('[SystemMonitoringComponent] Invalid custom date range, ignoring date filters.', { startDate, endDate }, 'SystemMonitoring');
      }
    } else {
      // Calculate dates based on selected interval
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
      this.loggingService.debug(`[SystemMonitoringComponent] Calculated date range for "${timeInterval}":`, { startDate: filter.startDate, endDate: filter.endDate }, 'SystemMonitoring');
    }

    // Add category and severity filters if they have values
    const category = this.filterForm.get('category')?.value;
    if (category) {
      filter.category = category;
    }
    const severity = this.filterForm.get('severity')?.value;
    if (severity) {
      filter.severity = severity;
    }

    return filter;
  }

  /**
   * Applies the selected filters and reloads data.
   */
  applyFilters(): void {
    this.loggingService.info('[SystemMonitoringComponent] Applying filters. Reloading data.', undefined, 'SystemMonitoring');
    this.loadData();
  }

  /**
   * Resets all filters to their default values and reloads data.
   */
  resetFilters(): void {
    this.loggingService.info('[SystemMonitoringComponent] Resetting filters. Reloading data.', undefined, 'SystemMonitoring');
    this.filterForm.reset({
      timeInterval: 'last-hour',
      dateRange: {
        startDate: null,
        endDate: null
      },
      category: '',
      severity: ''
    });

    // Manually trigger valueChanges for timeInterval to ensure dateRange is disabled
    this.filterForm.get('timeInterval')?.setValue('last-hour', { emitEvent: true });

    this.loadData();
  }

  /**
   * Handles tab change.
   * @param tabId The ID of the selected tab.
   */
  onTabChange(tabId: string): void {
    this.activeTab = tabId;
    this.loggingService.debug(`[SystemMonitoringComponent] Tab changed to: ${tabId}`, undefined, 'SystemMonitoring');
  }

  /**
   * Acknowledges a system alert.
   * @param alertId The ID of the alert to acknowledge.
   */
  acknowledgeAlert(alertId: string): void { // Expecting only string ID now
    this.loggingService.info(`[SystemMonitoringComponent] Acknowledging alert with ID: ${alertId}`, undefined, 'SystemMonitoring');
    if (!alertId) {
      this.loggingService.error('[SystemMonitoringComponent] Invalid alert ID for acknowledgment.', undefined, 'SystemMonitoring');
      this.notificationService.error('Error: ID de alerta no válido para acusar recibo.');
      return;
    }

    this.monitoringService.acknowledgeAlert(alertId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.loggingService.info(`[SystemMonitoringComponent] Alert ${alertId} acknowledged successfully. Refreshing data.`, undefined, 'SystemMonitoring');
        this.notificationService.success('Alerta acusada correctamente');
        this.loadData(false); // Refresh data without showing full loading
      },
      error: (error) => {
        this.loggingService.error(`[SystemMonitoringComponent] Error acknowledging alert ${alertId}:`, error, 'SystemMonitoring');
        this.notificationService.error('Error al acusar alerta. Intente de nuevo.');
      }
    });
  }

  /**
   * Marks a system alert as resolved.
   * @param alertId The ID of the alert to resolve.
   */
  resolveAlert(alertId: string): void { // Expecting only string ID now
    this.loggingService.info(`[SystemMonitoringComponent] Resolving alert with ID: ${alertId}`, undefined, 'SystemMonitoring');
    if (!alertId) {
      this.loggingService.error('[SystemMonitoringComponent] Invalid alert ID for resolution.', undefined, 'SystemMonitoring');
      this.notificationService.error('Error: ID de alerta no válido para resolver.');
      return;
    }

    this.monitoringService.resolveAlert(alertId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.loggingService.info(`[SystemMonitoringComponent] Alert ${alertId} resolved successfully. Refreshing data.`, undefined, 'SystemMonitoring');
        this.notificationService.success('Alerta resuelta correctamente');
        this.loadData(false); // Refresh data without showing full loading
      },
      error: (error) => {
        this.loggingService.error(`[SystemMonitoringComponent] Error resolving alert ${alertId}:`, error, 'SystemMonitoring');
        this.notificationService.error('Error al resolver alerta. Intente de nuevo.');
      }
    });
  }

  /**
   * Updates an alert threshold configuration.
   * @param threshold The AlertThreshold object to update.
   */
  updateAlertThreshold(threshold: AlertThreshold): void { // Expecting AlertThreshold object directly
    this.loggingService.info(`[SystemMonitoringComponent] Updating alert threshold for ID: ${threshold?.id}`, threshold, 'SystemMonitoring');
    if (!threshold || !threshold.id) {
      this.loggingService.error('[SystemMonitoringComponent] Invalid alert threshold object for update.', threshold, 'SystemMonitoring');
      this.notificationService.error('Error: Umbral de alerta no válido para actualizar.');
      return;
    }

    this.monitoringService.updateAlertThreshold(threshold).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.loggingService.info(`[SystemMonitoringComponent] Alert threshold ${threshold.id} updated successfully. Refreshing data.`, undefined, 'SystemMonitoring');
        this.notificationService.success('Umbral de alerta actualizado correctamente');
        this.loadData(false); // Refresh data without showing full loading
      },
      error: (error) => {
        this.loggingService.error(`[SystemMonitoringComponent] Error updating alert threshold ${threshold.id}:`, error, 'SystemMonitoring');
        this.notificationService.error('Error al actualizar umbral de alerta. Intente de nuevo.');
      }
    });
  }
}
