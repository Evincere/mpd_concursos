import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
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
  activeTab = 0;

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

  // Para limpieza de suscripciones
  private destroy$ = new Subject<void>();

  // Intervalo de actualización automática
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private fb: FormBuilder,
    private monitoringService: SystemMonitoringService,
    private snackBar: MatSnackBar
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
    this.loadData();

    // Configurar actualización automática cada 30 segundos
    this.refreshInterval = setInterval(() => {
      this.loadData(false);
    }, 30000);
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
   * Carga los datos de monitoreo
   * @param showLoading Indica si se debe mostrar el indicador de carga
   */
  loadData(showLoading = true): void {
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
          this.snackBar.open('Error al cargar métricas de rendimiento', 'Cerrar', { duration: 3000 });
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
    this.activeTab = index;
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
      this.snackBar.open('Error: ID de alerta no válido', 'Cerrar', { duration: 3000 });
      return;
    }

    console.log('Acusando recibo de alerta:', alertId);

    this.monitoringService.acknowledgeAlert(alertId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (_alert) => {
          this.snackBar.open('Alerta acusada correctamente', 'Cerrar', { duration: 3000 });
          this.loadData(false);
        },
        error: (error) => {
          console.error('Error acusando alerta:', error);
          this.snackBar.open('Error al acusar alerta', 'Cerrar', { duration: 3000 });
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
      this.snackBar.open('Error: ID de alerta no válido', 'Cerrar', { duration: 3000 });
      return;
    }

    console.log('Resolviendo alerta:', alertId);

    this.monitoringService.resolveAlert(alertId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (_alert) => {
          this.snackBar.open('Alerta resuelta correctamente', 'Cerrar', { duration: 3000 });
          this.loadData(false);
        },
        error: (error) => {
          console.error('Error resolviendo alerta:', error);
          this.snackBar.open('Error al resolver alerta', 'Cerrar', { duration: 3000 });
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
      this.snackBar.open('Error: Umbral de alerta no válido', 'Cerrar', { duration: 3000 });
      return;
    }

    console.log('Actualizando umbral de alerta:', threshold.id, threshold.threshold || 'N/A');

    this.monitoringService.updateAlertThreshold(threshold)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (_updatedThreshold) => {
          this.snackBar.open('Umbral de alerta actualizado correctamente', 'Cerrar', { duration: 3000 });
          this.loadData(false);
        },
        error: (error) => {
          console.error('Error actualizando umbral de alerta:', error);
          this.snackBar.open('Error al actualizar umbral de alerta', 'Cerrar', { duration: 3000 });
        }
      });
  }
}
