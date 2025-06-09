import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  SystemConfigService,
  ConfigChangeHistoryItem,
  ConfigHistoryFilter
} from '@core/services/admin/system-config.service';
import { NotificationService } from '@core/services/notification/notification.service';

@Component({
  selector: 'app-config-history',
  templateUrl: './config-history.component.html',
  styleUrls: ['./config-history.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class ConfigHistoryComponent implements OnInit, OnDestroy {
  // Datos
  configHistory: ConfigChangeHistoryItem[] = [];

  // Estado de la UI
  isLoading = false;

  // Paginación y ordenamiento
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  // Columnas para la tabla
  displayedColumns: string[] = ['timestamp', 'user', 'category', 'changes', 'reason', 'actions'];

  // Formulario de filtros
  filterForm: FormGroup;

  // Categorías de configuración para los filtros
  configCategories = [
    { value: 'general', label: 'General' },
    { value: 'security', label: 'Seguridad' },
    { value: 'notifications', label: 'Notificaciones' },
    { value: 'backup', label: 'Respaldo' },
    { value: 'integrations', label: 'Integraciones' },
    { value: 'limits', label: 'Límites y Cuotas' },
    { value: 'policies', label: 'Políticas' }
  ];

  // Para limpieza de suscripciones
  private destroy$ = new Subject<void>();

  // Exponer Math para el template
  Math = Math;

  constructor(
    private fb: FormBuilder,
    private systemConfigService: SystemConfigService,
    private notificationService: NotificationService
  ) {
    this.filterForm = this.fb.group({
      dateRange: this.fb.group({
        start: [null],
        end: [null]
      }),
      category: [''],
      user: ['']
    });
  }

  ngOnInit(): void {
    this.loadConfigHistory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga el historial de cambios de configuración
   */
  loadConfigHistory(): void {
    this.isLoading = true;

    const filter: ConfigHistoryFilter = {
      startDate: this.filterForm.get('dateRange.start')?.value,
      endDate: this.filterForm.get('dateRange.end')?.value,
      category: this.filterForm.get('category')?.value,
      userId: this.filterForm.get('user')?.value,
      page: this.pageIndex,
      size: this.pageSize
    };

    this.systemConfigService.getConfigHistory(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (history) => {
          this.configHistory = history;
          this.totalItems = history.length; // En una implementación real, esto vendría del backend
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando historial de configuración:', error);
          this.notificationService.showError('Error al cargar historial de configuración');
          this.isLoading = false;
        }
      });
  }

  /**
   * Aplica los filtros de búsqueda
   */
  applyFilter(): void {
    this.pageIndex = 0;
    this.loadConfigHistory();
  }

  /**
   * Reinicia los filtros
   */
  resetFilters(): void {
    this.filterForm.reset({
      dateRange: {
        start: null,
        end: null
      },
      category: '',
      user: ''
    });
    this.pageIndex = 0;
    this.loadConfigHistory();
  }

  /**
   * Maneja el cambio de página
   * @param event Evento de cambio de página
   */
  onPageChange(event: unknown): void {
    const eventObj = event as { pageIndex: number; pageSize: number };
    this.pageIndex = eventObj.pageIndex;
    this.pageSize = eventObj.pageSize;
    this.loadConfigHistory();
  }

  /**
   * Obtiene el nombre de una categoría
   * @param category Categoría
   * @returns Nombre de la categoría
   */
  getCategoryName(category: string): string {
    const found = this.configCategories.find(c => c.value === category);
    return found ? found.label : category;
  }

  /**
   * Formatea los cambios para mostrarlos en la tabla
   * @param changes Cambios
   * @returns Texto formateado
   */
  formatChanges(changes: { key: string, oldValue: unknown, newValue: unknown }[]): string {
    if (changes.length === 0) {
      return 'Sin cambios';
    }

    if (changes.length === 1) {
      const change = changes[0];
      return `${change.key}: ${this.formatValue(change.oldValue)} → ${this.formatValue(change.newValue)}`;
    }

    return `${changes.length} cambios`;
  }

  /**
   * Formatea un valor para mostrarlo en la tabla
   * @param value Valor
   * @returns Valor formateado
   */
  formatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  /**
   * Formatea una fecha
   * @param date Fecha
   * @returns Fecha formateada
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }

  /**
   * Muestra los detalles de un cambio
   * @param item Elemento del historial
   */
  showDetails(item: ConfigChangeHistoryItem): void {
    // En una implementación real, esto abriría un diálogo con los detalles
    // Logging implementado con LoggingService;
  }

  /**
   * Revierte un cambio de configuración
   * @param item Elemento del historial a revertir
   */
  revertChange(item: ConfigChangeHistoryItem): void {
    if (confirm('¿Está seguro de que desea revertir este cambio? Esta acción no se puede deshacer.')) {
      this.isLoading = true;

      this.systemConfigService.revertConfigChange(item.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccess('Cambio revertido exitosamente');
            this.loadConfigHistory(); // Recargar el historial
          },
          error: (error: any) => {
            console.error('Error revirtiendo cambio:', error);
            this.notificationService.showError('Error al revertir el cambio');
            this.isLoading = false;
          }
        });
    }
  }
}
