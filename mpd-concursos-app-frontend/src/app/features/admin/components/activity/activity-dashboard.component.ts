import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from  '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { AdminActivityService, ActivityLog, ActivityFilter, ActivityStats } from '@core/services/admin/admin-activity.service';
import { ActivityDetailDialogComponent } from './components/activity-detail-dialog/activity-detail-dialog.component';
import { ActivityChartComponent } from './components/activity-chart/activity-chart.component';

// Custom interfaces to replace Material UI types
interface PageEvent {
  pageIndex: number;
  pageSize: number;
  length: number;
}

interface Sort {
  active: string;
  direction: 'asc' | 'desc' | '';
}

@Component({
  selector: 'app-activity-dashboard',
  templateUrl: './activity-dashboard.component.html',
  styleUrls: ['./activity-dashboard.component.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    ActivityChartComponent
  ]
})
export class ActivityDashboardComponent implements OnInit, OnDestroy {
  // Exponer el objeto Object global para usarlo en la plantilla
  Object = Object;
  displayedColumns: string[] = ['timestamp', 'username', 'action', 'module', 'details', 'actions'];
  dataSource: ActivityLog[] = [];

  isLoading = false;
  isStatsLoading = false;
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  filterForm: FormGroup;

  moduleOptions: string[] = [];
  actionOptions: string[] = [];

  stats: ActivityStats | null = null;
  activeTab = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private activityService: AdminActivityService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      module: [''],
      action: [''],
      startDate: [null],
      endDate: [null]
    });
  }

  ngOnInit(): void {
    this.loadModulesAndActions();
    this.setupFilterListeners();
    this.loadActivityLogs();
    this.loadActivityStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadModulesAndActions(): void {
    this.activityService.getAvailableModules()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (modules) => {
          this.moduleOptions = modules;
        },
        error: (error) => {
          console.error('Error cargando módulos:', error);
        }
      });

    this.activityService.getAvailableActions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (actions) => {
          this.actionOptions = actions;
        },
        error: (error) => {
          console.error('Error cargando acciones:', error);
        }
      });
  }

  setupFilterListeners(): void {
    // Aplicar debounce al campo de búsqueda
    this.filterForm.get('search')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadActivityLogs();
      });

    // Escuchar cambios en los demás filtros
    this.filterForm.get('module')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadActivityLogs();
      });

    this.filterForm.get('action')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadActivityLogs();
      });

    this.filterForm.get('startDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadActivityLogs();
      });

    this.filterForm.get('endDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadActivityLogs();
      });
  }

  loadActivityLogs(): void {
    this.isLoading = true;

    const filters: ActivityFilter = {
      search: this.filterForm.get('search')?.value,
      module: this.filterForm.get('module')?.value,
      action: this.filterForm.get('action')?.value,
      startDate: this.filterForm.get('startDate')?.value,
      endDate: this.filterForm.get('endDate')?.value,
      page: this.pageIndex,
      size: this.pageSize,
      sort: 'timestamp',
      direction: 'desc'
    };

    this.activityService.getActivityLogs(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.logs;
          this.totalItems = response.total;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando registros de actividad:', error);
          this.snackBar.open('Error al cargar los registros de actividad', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }

  loadActivityStats(): void {
    this.isStatsLoading = true;

    this.activityService.getActivityStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
          this.isStatsLoading = false;
        },
        error: (error) => {
          console.error('Error cargando estadísticas de actividad:', error);
          this.snackBar.open('Error al cargar las estadísticas de actividad', 'Cerrar', { duration: 3000 });
          this.isStatsLoading = false;
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadActivityLogs();
  }

  onSort(_sort: Sort): void {
    // Implementar ordenamiento
    this.loadActivityLogs();
  }

  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      module: '',
      action: '',
      startDate: null,
      endDate: null
    });
    this.pageIndex = 0;
    this.loadActivityLogs();
  }

  openActivityDetailDialog(log: ActivityLog): void {
    this.dialog.open(ActivityDetailDialogComponent, {
      width: '700px',
      data: { logId: log.id }
    });
  }

  getActionIcon(action: string): string {
    switch (action) {
      case 'LOGIN': return 'login';
      case 'LOGOUT': return 'logout';
      case 'CREATE': return 'add_circle';
      case 'UPDATE': return 'edit';
      case 'DELETE': return 'delete';
      case 'READ': return 'visibility';
      case 'DOWNLOAD': return 'download';
      case 'UPLOAD': return 'upload';
      default: return 'info';
    }
  }

  getActionClass(action: string): string {
    switch (action) {
      case 'LOGIN':
      case 'CREATE':
        return 'action-success';
      case 'DELETE':
        return 'action-error';
      case 'UPDATE':
        return 'action-warning';
      case 'READ':
      case 'DOWNLOAD':
        return 'action-info';
      case 'LOGOUT':
        return 'action-secondary';
      default:
        return 'action-default';
    }
  }

  getModuleIcon(module: string): string {
    switch (module) {
      case 'AUTH': return 'security';
      case 'USERS': return 'people';
      case 'ROLES': return 'admin_panel_settings';
      case 'PROFILE': return 'person';
      case 'CONTESTS': return 'gavel';
      case 'INSCRIPTIONS': return 'assignment';
      case 'DOCUMENTS': return 'description';
      case 'SYSTEM': return 'settings';
      default: return 'folder';
    }
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleString();
  }

  formatDateShort(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }

  formatTime(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleTimeString();
  }

  // Custom Paginator Methods
  getPaginatorInfo(): string {
    const start = this.pageIndex * this.pageSize + 1;
    const end = Math.min((this.pageIndex + 1) * this.pageSize, this.totalItems);
    return `${start} - ${end} de ${this.totalItems} registros`;
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  goToFirstPage(): void {
    if (this.pageIndex !== 0) {
      this.pageIndex = 0;
      this.loadActivityLogs();
    }
  }

  goToPreviousPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      this.loadActivityLogs();
    }
  }

  goToNextPage(): void {
    if (this.pageIndex < this.getTotalPages() - 1) {
      this.pageIndex++;
      this.loadActivityLogs();
    }
  }

  goToLastPage(): void {
    const lastPage = this.getTotalPages() - 1;
    if (this.pageIndex !== lastPage) {
      this.pageIndex = lastPage;
      this.loadActivityLogs();
    }
  }

  onPageSizeChange(): void {
    this.pageIndex = 0;
    this.loadActivityLogs();
  }

  /**
   * Establece el tab activo
   */
  setActiveTab(tabIndex: number): void {
    this.activeTab = tabIndex;
  }
}
