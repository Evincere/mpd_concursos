import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { UserActivityService } from '@core/services/audit/user-activity.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';
import { CustomDialogService } from '@shared/components/custom-dialog/custom-dialog.service';

import { 
  UserActivity, 
  ActivityFilters, 
  ActivityStatistics,
  UserActivitySummary,
  UserSession,
  UserAction,
  ActivityCategory,
  ActivitySeverity,
  ActivityUtils
} from '@shared/interfaces/audit/user-activity.interface';

import { HasPermissionDirective } from '@shared/directives/has-permission.directive';
import { TooltipDirective } from '@shared/directives/tooltip.directive';
import { AnimateDirective } from '@shared/directives/animate.directive';

/**
 * Componente para visualización y gestión de actividades de usuario
 */
@Component({
  selector: 'app-user-activity',
  templateUrl: './user-activity.component.html',
  styleUrls: ['./user-activity.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HasPermissionDirective,
    TooltipDirective,
    AnimateDirective
  ]
})
export class UserActivityComponent implements OnInit, OnDestroy {

  // Estados del componente
  activities: UserActivity[] = [];
  filteredActivities: UserActivity[] = [];
  statistics: ActivityStatistics | null = null;
  selectedActivity: UserActivity | null = null;
  
  // Estados de UI
  loading = false;
  realtimeEnabled = false;
  showFilters = false;
  showStatistics = true;
  viewMode: 'list' | 'timeline' | 'chart' = 'list';

  // Formularios
  filtersForm: FormGroup;
  searchForm: FormGroup;

  // Filtros
  currentFilters: ActivityFilters = {};

  // Opciones para selects
  actionOptions: { value: UserAction; label: string }[] = [
    { value: 'LOGIN', label: 'Inicio de Sesión' },
    { value: 'LOGOUT', label: 'Cierre de Sesión' },
    { value: 'PAGE_VIEW', label: 'Vista de Página' },
    { value: 'CREATE', label: 'Crear' },
    { value: 'READ', label: 'Leer' },
    { value: 'UPDATE', label: 'Actualizar' },
    { value: 'DELETE', label: 'Eliminar' },
    { value: 'SEARCH', label: 'Buscar' },
    { value: 'EXPORT_DATA', label: 'Exportar Datos' },
    { value: 'IMPORT_DATA', label: 'Importar Datos' },
    { value: 'ERROR_OCCURRED', label: 'Error Ocurrido' }
  ];

  categoryOptions: { value: ActivityCategory; label: string }[] = [
    { value: 'AUTHENTICATION', label: 'Autenticación' },
    { value: 'NAVIGATION', label: 'Navegación' },
    { value: 'DATA_MODIFICATION', label: 'Modificación de Datos' },
    { value: 'ADMINISTRATION', label: 'Administración' },
    { value: 'SECURITY', label: 'Seguridad' },
    { value: 'SYSTEM', label: 'Sistema' },
    { value: 'USER_INTERACTION', label: 'Interacción de Usuario' }
  ];

  severityOptions: { value: ActivitySeverity; label: string }[] = [
    { value: 'LOW', label: 'Bajo' },
    { value: 'MEDIUM', label: 'Medio' },
    { value: 'HIGH', label: 'Alto' },
    { value: 'CRITICAL', label: 'Crítico' }
  ];

  // Paginación
  currentPage = 1;
  pageSize = 25;
  totalItems = 0;

  // Utilidades
  ActivityUtils = ActivityUtils;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private activityService: UserActivityService,
    private notificationService: CustomNotificationService,
    private dialogService: CustomDialogService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadData();
    this.setupFilters();
    this.setupRealtime();
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
      userId: [''],
      actions: [[]],
      categories: [[]],
      severities: [[]],
      resources: [[]],
      dateFrom: [''],
      dateTo: [''],
      success: [null],
      sortBy: ['timestamp'],
      sortOrder: ['DESC']
    });

    this.searchForm = this.fb.group({
      search: ['']
    });
  }

  /**
   * Carga los datos iniciales
   */
  private loadData(): void {
    this.loading = true;

    combineLatest([
      this.activityService.getActivities(this.currentFilters),
      this.activityService.getStatistics(this.currentFilters)
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ([activities, statistics]) => {
        this.activities = activities;
        this.statistics = statistics;
        this.applyLocalFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.notificationService.showError('Error al cargar los datos de actividad');
        this.loading = false;
      }
    });
  }

  /**
   * Configura los filtros reactivos
   */
  private setupFilters(): void {
    // Filtros del formulario principal
    this.filtersForm.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(filters => {
      this.currentFilters = this.buildFiltersFromForm(filters);
      this.loadData();
    });

    // Búsqueda en tiempo real
    this.searchForm.get('search')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.applySearchFilter(searchTerm);
    });
  }

  /**
   * Configura las actualizaciones en tiempo real
   */
  private setupRealtime(): void {
    // Implementar cuando el usuario habilite tiempo real
  }

  /**
   * Construye los filtros desde el formulario
   */
  private buildFiltersFromForm(formValue: any): ActivityFilters {
    const filters: ActivityFilters = {
      limit: this.pageSize,
      offset: (this.currentPage - 1) * this.pageSize,
      sortBy: formValue.sortBy || 'timestamp',
      sortOrder: formValue.sortOrder || 'DESC'
    };

    if (formValue.userId) filters.userId = formValue.userId;
    if (formValue.actions?.length) filters.actions = formValue.actions;
    if (formValue.categories?.length) filters.categories = formValue.categories;
    if (formValue.severities?.length) filters.severities = formValue.severities;
    if (formValue.resources?.length) filters.resources = formValue.resources;
    if (formValue.dateFrom) filters.dateFrom = formValue.dateFrom;
    if (formValue.dateTo) filters.dateTo = formValue.dateTo;
    if (formValue.success !== null) filters.success = formValue.success;

    return filters;
  }

  /**
   * Aplica filtros locales (búsqueda)
   */
  private applyLocalFilters(): void {
    let filtered = [...this.activities];
    
    const searchTerm = this.searchForm.get('search')?.value;
    if (searchTerm) {
      filtered = this.filterBySearch(filtered, searchTerm);
    }

    this.filteredActivities = filtered;
    this.totalItems = filtered.length;
  }

  /**
   * Aplica filtro de búsqueda
   */
  private applySearchFilter(searchTerm: string): void {
    if (!searchTerm) {
      this.filteredActivities = [...this.activities];
    } else {
      this.filteredActivities = this.filterBySearch(this.activities, searchTerm);
    }
    this.totalItems = this.filteredActivities.length;
    this.currentPage = 1;
  }

  /**
   * Filtra actividades por término de búsqueda
   */
  private filterBySearch(activities: UserActivity[], searchTerm: string): UserActivity[] {
    const term = searchTerm.toLowerCase();
    return activities.filter(activity => 
      activity.userName?.toLowerCase().includes(term) ||
      activity.userEmail?.toLowerCase().includes(term) ||
      activity.action.toLowerCase().includes(term) ||
      activity.resource.toLowerCase().includes(term) ||
      activity.details.description.toLowerCase().includes(term) ||
      activity.ipAddress.includes(term)
    );
  }

  /**
   * Obtiene las actividades paginadas
   */
  getPaginatedActivities(): UserActivity[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredActivities.slice(startIndex, endIndex);
  }

  /**
   * Cambia la página
   */
  onPageChange(page: number): void {
    this.currentPage = page;
  }

  /**
   * Selecciona una actividad
   */
  selectActivity(activity: UserActivity): void {
    this.selectedActivity = activity;
  }

  /**
   * Cierra el detalle de actividad
   */
  closeActivityDetail(): void {
    this.selectedActivity = null;
  }

  /**
   * Cambia el modo de vista
   */
  setViewMode(mode: 'list' | 'timeline' | 'chart'): void {
    this.viewMode = mode;
  }

  /**
   * Activa/desactiva tiempo real
   */
  toggleRealtime(): void {
    this.realtimeEnabled = !this.realtimeEnabled;
    
    if (this.realtimeEnabled) {
      this.activityService.getRealtimeActivities().pipe(
        takeUntil(this.destroy$)
      ).subscribe(activities => {
        this.activities = activities;
        this.applyLocalFilters();
      });
      this.notificationService.showSuccess('Actualizaciones en tiempo real activadas');
    } else {
      this.notificationService.showInfo('Actualizaciones en tiempo real desactivadas');
    }
  }

  /**
   * Muestra/oculta filtros
   */
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  /**
   * Muestra/oculta estadísticas
   */
  toggleStatistics(): void {
    this.showStatistics = !this.showStatistics;
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters(): void {
    this.filtersForm.reset({
      sortBy: 'timestamp',
      sortOrder: 'DESC'
    });
    this.searchForm.reset();
    this.currentPage = 1;
  }

  /**
   * Exporta actividades
   */
  exportActivities(): void {
    const data = this.activityService.exportActivities(this.filteredActivities);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `user-activities-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    this.notificationService.showSuccess('Actividades exportadas exitosamente');
  }

  /**
   * Genera reporte
   */
  generateReport(): void {
    this.loading = true;
    
    this.activityService.generateReport('USER_ACTIVITY', this.currentFilters, 'PDF').pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (report) => {
        this.notificationService.showSuccess('Reporte generado exitosamente');
        if (report.downloadUrl) {
          window.open(report.downloadUrl, '_blank');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error generating report:', error);
        this.notificationService.showError('Error al generar el reporte');
        this.loading = false;
      }
    });
  }

  /**
   * Obtiene el color para el nivel de severidad
   */
  getSeverityColor(severity: ActivitySeverity): string {
    return ActivityUtils.getSeverityColor(severity);
  }

  /**
   * Obtiene el icono para el tipo de acción
   */
  getActionIcon(action: UserAction): string {
    return ActivityUtils.getActionIcon(action);
  }

  /**
   * Formatea la duración
   */
  formatDuration(milliseconds: number): string {
    return ActivityUtils.formatDuration(milliseconds);
  }

  /**
   * Obtiene el color del badge según el éxito de la operación
   */
  getSuccessColor(success: boolean): string {
    return success ? '#10b981' : '#ef4444';
  }

  /**
   * Obtiene el texto del badge según el éxito de la operación
   */
  getSuccessText(success: boolean): string {
    return success ? 'Exitoso' : 'Fallido';
  }

  /**
   * Formatea la fecha de forma relativa
   */
  formatRelativeDate(date: Date | string): string {
    const now = new Date();
    const activityDate = new Date(date);
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    
    return activityDate.toLocaleDateString();
  }

  /**
   * Obtiene el resumen de una actividad
   */
  getActivitySummary(activity: UserActivity): string {
    const action = this.actionOptions.find(a => a.value === activity.action)?.label || activity.action;
    return `${action} en ${activity.resource}`;
  }
}
