import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators'; // Import debounceTime and distinctUntilChanged

// Custom Components
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { StatCardComponent } from '../../../admin-dashboard/components/stat-card/stat-card.component';

// Services
import { AdminConcursosService } from '@core/services/admin/admin-concursos.service';
import { LoggingService } from '@core/services/logging/logging.service'; // Import LoggingService

/**
 * Interface for important dates to be displayed.
 */
interface ImportantDate {
  id: string;
  contestId: number;
  contestTitle: string;
  type: string; // e.g., 'inscription', 'exam', 'results', 'other'
  label: string; // e.g., 'Inicio de Inscripción', 'Examen Escrito'
  date: Date;
  description?: string;
  isImportant: boolean;
  daysUntil: number;
  status: 'upcoming' | 'today' | 'overdue' | 'completed';
}

@Component({
  selector: 'app-fechas-importantes-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    CustomButtonComponent,
    CustomCardComponent,
    StatCardComponent
  ],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <div class="header">
        <h1>
          <i class="fas fa-calendar-check" aria-hidden="true"></i>
          Fechas Importantes
        </h1>
        <p class="description">
          Vista consolidada de todas las fechas importantes de los concursos activos
        </p>
      </div>

      <!-- Loading Indicator -->
      <div class="loading-container" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>Cargando fechas importantes...</p>
      </div>

      <ng-container *ngIf="!isLoading">
        <!-- Main Statistics Cards -->
        <div class="stats-cards">
          <app-stat-card
            icon="schedule"
            iconColor="#2196f3"
            title="Próximas"
            [value]="stats.upcoming"
            subtitle="Fechas por venir"
          ></app-stat-card>

          <app-stat-card
            icon="today"
            iconColor="#ff9800"
            title="Hoy"
            [value]="stats.today"
            subtitle="Fechas de hoy"
          ></app-stat-card>

          <app-stat-card
            icon="warning"
            iconColor="#f44336"
            title="Vencidas"
            [value]="stats.overdue"
            subtitle="Fechas vencidas"
          ></app-stat-card>

          <app-stat-card
            icon="event"
            iconColor="#4caf50"
            title="Total"
            [value]="stats.total"
            subtitle="Total de fechas"
          ></app-stat-card>
        </div>

        <!-- Filters -->
        <app-custom-card
          title="Filtros"
          icon="filter"
          class="filters-card">
          <form [formGroup]="filterForm" class="filters-form">
            <div class="form-row">
              <div class="filter-field">
                <label class="field-label">Buscar concurso</label>
                <input
                  type="text"
                  formControlName="search"
                  placeholder="Título del concurso..."
                  class="form-input">
              </div>

              <div class="filter-field">
                <label class="field-label">Tipo de fecha</label>
                <select formControlName="type" class="form-select">
                  <option *ngFor="let option of typeOptions" [value]="option.value">
                    {{option.label}}
                  </option>
                </select>
              </div>

              <div class="filter-field">
                <label class="field-label">Estado</label>
                <select formControlName="status" class="form-select">
                  <option *ngFor="let option of statusOptions" [value]="option.value">
                    {{option.label}}
                  </option>
                </select>
              </div>
            </div>

            <div class="filter-actions">
              <app-custom-button
                label="Filtrar"
                icon="filter"
                color="primary"
                (buttonClick)="applyFilters()">
              </app-custom-button>

              <app-custom-button
                label="Limpiar"
                icon="times"
                variant="stroked"
                (buttonClick)="clearFilters()">
              </app-custom-button>
            </div>
          </form>
        </app-custom-card>

        <!-- Important Dates Table -->
        <app-custom-card
          title="Fechas Importantes"
          icon="list"
          [subtitle]="filteredDates.length + ' fechas encontradas'"
          class="table-card">

          <div class="table-container" *ngIf="filteredDates.length > 0; else noDataTemplate">
            <table class="custom-table">
              <thead>
                <tr>
                  <th (click)="sortBy('contestTitle')" class="sortable">
                    <span>Concurso</span>
                    <i class="fas fa-sort sort-icon" [class.fa-sort-up]="sortColumn === 'contestTitle' && sortDirection === 'asc'" [class.fa-sort-down]="sortColumn === 'contestTitle' && sortDirection === 'desc'" aria-hidden="true"></i>
                  </th>
                  <th (click)="sortBy('type')" class="sortable">
                    <span>Tipo</span>
                    <i class="fas fa-sort sort-icon" [class.fa-sort-up]="sortColumn === 'type' && sortDirection === 'asc'" [class.fa-sort-down]="sortColumn === 'type' && sortDirection === 'desc'" aria-hidden="true"></i>
                  </th>
                  <th (click)="sortBy('date')" class="sortable">
                    <span>Fecha</span>
                    <i class="fas fa-sort sort-icon" [class.fa-sort-up]="sortColumn === 'date' && sortDirection === 'asc'" [class.fa-sort-down]="sortColumn === 'date' && sortDirection === 'desc'" aria-hidden="true"></i>
                  </th>
                  <th (click)="sortBy('status')" class="sortable">
                    <span>Estado</span>
                    <i class="fas fa-sort sort-icon" [class.fa-sort-up]="sortColumn === 'status' && sortDirection === 'asc'" [class.fa-sort-down]="sortColumn === 'status' && sortDirection === 'desc'" aria-hidden="true"></i>
                  </th>
                  <th class="actions-column">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let date of filteredDates; trackBy: trackByDate" class="table-row">
                  <td class="contest-cell">
                    <div class="contest-info">
                      <span class="contest-title">{{date.contestTitle}}</span>
                      <span class="contest-id">ID: {{date.contestId}}</span>
                    </div>
                  </td>
                  <td class="type-cell">
                    <span class="type-badge" [class]="'type-' + date.type">
                      <i [class]="getTypeIcon(date.type)" aria-hidden="true"></i>
                      {{date.label}}
                    </span>
                  </td>
                  <td class="date-cell">
                    <div class="date-info">
                      <span class="date-value">{{formatDate(date.date)}}</span>
                      <span class="days-until" [class]="'status-' + date.status">
                        {{getDaysUntilText(date.daysUntil, date.status)}}
                      </span>
                    </div>
                  </td>
                  <td class="status-cell">
                    <span class="status-badge" [class]="'status-' + date.status">
                      <i [class]="getStatusIcon(date.status)" aria-hidden="true"></i>
                      {{getStatusText(date.status)}}
                    </span>
                  </td>
                  <td class="actions-cell">
                    <div class="action-buttons">
                      <a
                        [routerLink]="['/admin/concursos/detalle', date.contestId]"
                        class="action-btn btn-view"
                        title="Ver detalles del concurso">
                        <i class="fas fa-eye" aria-hidden="true"></i>
                      </a>
                      <a
                        [routerLink]="['/admin/concursos/fechas', date.contestId]"
                        class="action-btn btn-edit"
                        title="Gestionar fechas">
                        <i class="fas fa-calendar-alt" aria-hidden="true"></i>
                      </a>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <ng-template #noDataTemplate>
            <div class="no-data">
              <i class="fas fa-calendar-times" aria-hidden="true"></i>
              <h4>No se encontraron fechas importantes</h4>
              <p>No hay fechas que coincidan con los filtros aplicados</p>
              <app-custom-button
                label="Limpiar filtros"
                icon="refresh"
                variant="stroked"
                (buttonClick)="clearFilters()">
              </app-custom-button>
            </div>
          </ng-template>
        </app-custom-card>
      </ng-container>
    </div>
  `,
  styleUrls: ['./fechas-importantes-admin.component.scss']
})
export class FechasImportantesAdminComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;
  importantDates: ImportantDate[] = [];
  filteredDates: ImportantDate[] = [];
  isLoading = true;

  sortColumn: string = 'date'; // Default sort column
  sortDirection: 'asc' | 'desc' = 'asc'; // Default sort direction

  stats = {
    upcoming: 0,
    today: 0,
    overdue: 0,
    total: 0
  };

  typeOptions = [
    { value: '', label: 'Todos los tipos' },
    { value: 'inscription', label: 'Inscripción' },
    { value: 'exam', label: 'Examen' },
    { value: 'results', label: 'Resultados' },
    { value: 'other', label: 'Otros' }
  ];

  statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'upcoming', label: 'Próximas' },
    { value: 'today', label: 'Hoy' },
    { value: 'overdue', label: 'Vencidas' },
    { value: 'completed', label: 'Completadas' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private concursosService: AdminConcursosService, // Injected AdminConcursosService
    private loggingService: LoggingService // Injected LoggingService
  ) {
    this.loggingService.debug('[FechasImportantesAdminComponent] Constructor: Initializing filter form.', undefined, 'ImportantDatesAdmin');
    this.filterForm = this.fb.group({
      search: [''],
      type: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    this.loggingService.info('[FechasImportantesAdminComponent] OnInit: Component initialized.', undefined, 'ImportantDatesAdmin');
    this.loadImportantDates();
    this.setupFilters();
  }

  ngOnDestroy(): void {
    this.loggingService.info('[FechasImportantesAdminComponent] OnDestroy: Component destroyed. Cleaning up subscriptions.', undefined, 'ImportantDatesAdmin');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Loads important dates.
   * In a real implementation, this would load from a service (e.g., concursosService.getImportantDates()).
   */
  private loadImportantDates(): void {
    this.isLoading = true;
    this.loggingService.info('[FechasImportantesAdminComponent] Loading important dates (simulated).', undefined, 'ImportantDatesAdmin');

    // Simulate data loading - replace with actual service call in a real app
    setTimeout(() => {
      this.importantDates = this.generateMockDates();
      this.filteredDates = [...this.importantDates]; // Initialize filteredDates with all dates
      this.applyFilters(); // Apply initial filters and sorting
      this.isLoading = false;
      this.loggingService.debug('[FechasImportantesAdminComponent] Important dates loaded (simulated).', this.importantDates, 'ImportantDatesAdmin');
    }, 1000);

    // Example of a real service call (assuming AdminConcursosService has a method to get all dates)
    /*
    this.concursosService.getImportantDates().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (dates) => {
        this.importantDates = dates.map(d => ({
          ...d,
          date: new Date(d.date), // Ensure date is a Date object
          // Recalculate daysUntil and status if needed based on current date
        }));
        this.applyFilters();
        this.isLoading = false;
        this.loggingService.info('[FechasImportantesAdminComponent] Important dates loaded from service.', dates, 'ImportantDatesAdmin');
      },
      error: (error) => {
        this.loggingService.error('[FechasImportantesAdminComponent] Error loading important dates:', error, 'ImportantDatesAdmin');
        this.isLoading = false;
      }
    });
    */
  }

  /**
   * Generates mock important dates for demonstration.
   */
  private generateMockDates(): ImportantDate[] {
    this.loggingService.debug('[FechasImportantesAdminComponent] Generating mock important dates.', undefined, 'ImportantDatesAdmin');
    const today = new Date();
    const dates: ImportantDate[] = [];

    // Generate example dates
    for (let i = 1; i <= 15; i++) { // Increased number of mock dates
      const date = new Date(today);
      const daysOffset = Math.floor(Math.random() * 90) - 45; // Dates from 45 days ago to 45 days in future
      date.setDate(today.getDate() + daysOffset);

      const daysUntil = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      let status: 'upcoming' | 'today' | 'overdue' | 'completed';

      if (daysUntil > 0) {
        status = 'upcoming';
      } else if (daysUntil === 0) {
        status = 'today';
      } else if (daysUntil < 0 && Math.abs(daysUntil) < 30) { // Considered overdue if within 30 days past
        status = 'overdue';
      } else { // Older than 30 days past are 'completed'
        status = 'completed';
      }


      dates.push({
        id: `date-${i}`,
        contestId: i,
        contestTitle: `Concurso de Defensor/a ${String.fromCharCode(64 + i)}`, // Use letters for title
        type: ['inscription', 'exam', 'results', 'other'][Math.floor(Math.random() * 4)],
        label: ['Inicio Insc.', 'Fin Insc.', 'Examen', 'Resultados', 'Entrevista'][Math.floor(Math.random() * 5)],
        date: date,
        isImportant: Math.random() > 0.5,
        daysUntil: daysUntil,
        status: status
      });
    }

    // Ensure dates are sorted by date initially
    return dates.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Sets up subscription for filter form changes.
   */
  private setupFilters(): void {
    this.loggingService.debug('[FechasImportantesAdminComponent] Setting up filter form valueChanges subscription.', undefined, 'ImportantDatesAdmin');
    this.filterForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300), // Debounce to prevent excessive calls
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)) // Only emit if value truly changed
      )
      .subscribe(() => {
        this.loggingService.debug('[FechasImportantesAdminComponent] Filter form value changed. Applying filters.', this.filterForm.value, 'ImportantDatesAdmin');
        this.applyFilters();
      });
  }

  /**
   * Applies the current filters to the important dates list and updates statistics.
   */
  applyFilters(): void {
    this.loggingService.info('[FechasImportantesAdminComponent] Applying filters to dates.', this.filterForm.value, 'ImportantDatesAdmin');
    const filters = this.filterForm.value;

    this.filteredDates = this.importantDates.filter(date => {
      const matchesSearch = !filters.search ||
        date.contestTitle.toLowerCase().includes(filters.search.toLowerCase()) ||
        date.label.toLowerCase().includes(filters.search.toLowerCase()) ||
        date.description?.toLowerCase().includes(filters.search.toLowerCase()); // Search in description too

      const matchesType = !filters.type || date.type === filters.type;
      const matchesStatus = !filters.status || date.status === filters.status;

      return matchesSearch && matchesType && matchesStatus;
    });

    this.sortBy(this.sortColumn, this.sortDirection, false); // Re-apply current sorting
    this.calculateStats();
    this.loggingService.debug(`[FechasImportantesAdminComponent] Filters applied. Found ${this.filteredDates.length} dates.`, undefined, 'ImportantDatesAdmin');
  }

  /**
   * Clears all filters and resets the displayed dates and statistics.
   */
  clearFilters(): void {
    this.loggingService.info('[FechasImportantesAdminComponent] Clearing all filters.', undefined, 'ImportantDatesAdmin');
    this.filterForm.reset({
      search: '',
      type: '',
      status: ''
    });
    // This will trigger valueChanges and call applyFilters, effectively resetting.
    // If not, explicitly call applyFilters:
    // this.applyFilters();
  }

  /**
   * Calculates statistics for upcoming, today, overdue, and total dates.
   */
  private calculateStats(): void {
    this.stats = {
      upcoming: this.filteredDates.filter(d => d.status === 'upcoming').length,
      today: this.filteredDates.filter(d => d.status === 'today').length,
      overdue: this.filteredDates.filter(d => d.status === 'overdue').length,
      total: this.filteredDates.length
    };
    this.loggingService.debug('[FechasImportantesAdminComponent] Statistics recalculated:', this.stats, 'ImportantDatesAdmin');
  }

  /**
   * Formats a Date object into a localized date string.
   * @param date The Date object to format.
   * @returns Formatted date string (e.g., "DD/MM/YYYY").
   */
  formatDate(date: Date): string {
    if (!date) {
      this.loggingService.warn('[FechasImportantesAdminComponent] Attempted to format null/undefined date. Returning empty string.', undefined, 'ImportantDatesAdmin');
      return '';
    }
    try {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      this.loggingService.error('[FechasImportantesAdminComponent] Error formatting date:', e, 'ImportantDatesAdmin');
      return 'Fecha inválida';
    }
  }

  /**
   * Generates descriptive text for days until or days overdue.
   * @param daysUntil Number of days until (positive) or days overdue (negative).
   * @param status The status of the date ('upcoming', 'today', 'overdue', 'completed').
   * @returns Descriptive text.
   */
  getDaysUntilText(daysUntil: number, status: string): string {
    if (status === 'today') return 'Hoy';
    if (status === 'overdue') return `${Math.abs(daysUntil)} día${Math.abs(daysUntil) !== 1 ? 's' : ''} vencida`;
    if (status === 'upcoming') return `En ${daysUntil} día${daysUntil !== 1 ? 's' : ''}`;
    return ''; // For 'completed' or unknown statuses
  }

  /**
   * Gets the CSS class for a date's status.
   * @param status The status of the date.
   * @returns CSS class string.
   */
  getStatusClass(status: string): string {
    return status; // Assumes CSS classes like 'upcoming', 'today', 'overdue', 'completed' exist
  }

  /**
   * Gets the Font Awesome icon for a date's status.
   * @param status The status of the date.
   * @returns Font Awesome icon class.
   */
  getStatusIcon(status: string): string {
    switch (status) {
      case 'upcoming': return 'fas fa-clock';
      case 'today': return 'fas fa-calendar-day';
      case 'overdue': return 'fas fa-exclamation-triangle';
      case 'completed': return 'fas fa-check-circle';
      default: return 'fas fa-calendar';
    }
  }

  /**
   * Gets the human-readable text for a date's status.
   * @param status The status of the date.
   * @returns Descriptive text.
   */
  getStatusText(status: string): string {
    switch (status) {
      case 'upcoming': return 'Próxima';
      case 'today': return 'Hoy';
      case 'overdue': return 'Vencida';
      case 'completed': return 'Completada';
      default: return 'Desconocido';
    }
  }

  /**
   * Gets the Font Awesome icon for a date's type.
   * @param type The type of the date.
   * @returns Font Awesome icon class.
   */
  getTypeIcon(type: string): string {
    switch (type) {
      case 'inscription': return 'fas fa-user-plus';
      case 'exam': return 'fas fa-file-alt';
      case 'results': return 'fas fa-trophy';
      case 'other': return 'fas fa-calendar-alt';
      default: return 'fas fa-calendar';
    }
  }

  /**
   * TrackBy function for ngFor to optimize rendering.
   * @param index The index of the item.
   * @param date The ImportantDate object.
   * @returns A unique identifier for the item.
   */
  trackByDate(index: number, date: ImportantDate): string {
    return date.id; // Use unique ID for tracking
  }

  /**
   * Sorts the filtered dates by a specified field and toggles direction.
   * @param field The field to sort by.
   * @param direction Optional: specific direction ('asc' | 'desc'). If not provided, it toggles.
   * @param reapplyFilters Optional: if true, it will reapply filters after sorting (defaults to true).
   */
  sortBy(field: string, direction?: 'asc' | 'desc', reapplyFilters: boolean = true): void {
    this.loggingService.info(`[FechasImportantesAdminComponent] Sorting by field: ${field}. Current direction: ${this.sortDirection}.`, undefined, 'ImportantDatesAdmin');

    if (this.sortColumn === field) {
      // If sorting by the same column, toggle direction
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // If sorting by a new column, set default direction to 'asc'
      this.sortColumn = field;
      this.sortDirection = direction || 'asc';
    }

    this.filteredDates.sort((a, b) => {
      const aValue = (a as any)[field];
      const bValue = (b as any)[field];

      if (aValue instanceof Date && bValue instanceof Date) {
        // Compare dates
        return (aValue.getTime() - bValue.getTime()) * (this.sortDirection === 'asc' ? 1 : -1);
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        // Compare strings (case-insensitive)
        return aValue.localeCompare(bValue) * (this.sortDirection === 'asc' ? 1 : -1);
      } else {
        // Compare numbers or other comparable types
        if (aValue < bValue) return (this.sortDirection === 'asc' ? -1 : 1);
        if (aValue > bValue) return (this.sortDirection === 'asc' ? 1 : -1);
        return 0;
      }
    });

    this.loggingService.debug(`[FechasImportantesAdminComponent] Dates sorted by ${this.sortColumn} ${this.sortDirection}.`, undefined, 'ImportantDatesAdmin');

    if (reapplyFilters) {
      // Re-calculate stats based on the sorted (and filtered) list
      this.calculateStats();
    }
  }
}
