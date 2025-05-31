import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Componentes personalizados
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { StatCardComponent } from '../../../admin-dashboard/components/stat-card/stat-card.component';

// Servicios
import { AdminConcursosService } from '@core/services/admin/admin-concursos.service';

interface ImportantDate {
  id: string;
  contestId: number;
  contestTitle: string;
  type: string;
  label: string;
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

      <!-- Indicador de carga -->
      <div class="loading-container" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>Cargando fechas importantes...</p>
      </div>

      <ng-container *ngIf="!isLoading">
        <!-- Tarjetas de estadísticas principales -->
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

        <!-- Filtros -->
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

        <!-- Tabla de fechas importantes -->
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
                    <i class="fas fa-sort sort-icon" aria-hidden="true"></i>
                  </th>
                  <th (click)="sortBy('type')" class="sortable">
                    <span>Tipo</span>
                    <i class="fas fa-sort sort-icon" aria-hidden="true"></i>
                  </th>
                  <th (click)="sortBy('date')" class="sortable">
                    <span>Fecha</span>
                    <i class="fas fa-sort sort-icon" aria-hidden="true"></i>
                  </th>
                  <th (click)="sortBy('status')" class="sortable">
                    <span>Estado</span>
                    <i class="fas fa-sort sort-icon" aria-hidden="true"></i>
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
    private concursosService: AdminConcursosService
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      type: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    this.loadImportantDates();
    this.setupFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadImportantDates(): void {
    this.isLoading = true;

    // Por ahora, datos simulados - en una implementación real se cargarían desde el servicio
    setTimeout(() => {
      this.importantDates = this.generateMockDates();
      this.filteredDates = [...this.importantDates];
      this.calculateStats();
      this.isLoading = false;
    }, 1000);
  }

  private generateMockDates(): ImportantDate[] {
    const today = new Date();
    const dates: ImportantDate[] = [];

    // Generar fechas de ejemplo
    for (let i = 1; i <= 10; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + (Math.random() * 60 - 30)); // ±30 días

      const daysUntil = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      let status: 'upcoming' | 'today' | 'overdue' | 'completed';

      if (daysUntil > 0) status = 'upcoming';
      else if (daysUntil === 0) status = 'today';
      else status = 'overdue';

      dates.push({
        id: `date-${i}`,
        contestId: i,
        contestTitle: `Concurso de Defensor/a ${i}`,
        type: ['inscription', 'exam', 'results', 'other'][Math.floor(Math.random() * 4)],
        label: ['Inicio de Inscripción', 'Fin de Inscripción', 'Examen', 'Resultados'][Math.floor(Math.random() * 4)],
        date: date,
        isImportant: Math.random() > 0.5,
        daysUntil: daysUntil,
        status: status
      });
    }

    return dates.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private setupFilters(): void {
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });
  }

  applyFilters(): void {
    const filters = this.filterForm.value;

    this.filteredDates = this.importantDates.filter(date => {
      const matchesSearch = !filters.search ||
        date.contestTitle.toLowerCase().includes(filters.search.toLowerCase());
      const matchesType = !filters.type || date.type === filters.type;
      const matchesStatus = !filters.status || date.status === filters.status;

      return matchesSearch && matchesType && matchesStatus;
    });

    this.calculateStats();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.filteredDates = [...this.importantDates];
    this.calculateStats();
  }

  private calculateStats(): void {
    this.stats = {
      upcoming: this.filteredDates.filter(d => d.status === 'upcoming').length,
      today: this.filteredDates.filter(d => d.status === 'today').length,
      overdue: this.filteredDates.filter(d => d.status === 'overdue').length,
      total: this.filteredDates.length
    };
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getDaysUntilText(daysUntil: number, status: string): string {
    if (status === 'today') return 'Hoy';
    if (status === 'overdue') return `${Math.abs(daysUntil)} días vencida`;
    if (status === 'upcoming') return `En ${daysUntil} días`;
    return '';
  }

  getStatusClass(status: string): string {
    return status;
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'upcoming': return 'fas fa-clock';
      case 'today': return 'fas fa-calendar-day';
      case 'overdue': return 'fas fa-exclamation-triangle';
      case 'completed': return 'fas fa-check-circle';
      default: return 'fas fa-calendar';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'upcoming': return 'Próxima';
      case 'today': return 'Hoy';
      case 'overdue': return 'Vencida';
      case 'completed': return 'Completada';
      default: return 'Desconocido';
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'inscription': return 'fas fa-user-plus';
      case 'exam': return 'fas fa-file-alt';
      case 'results': return 'fas fa-trophy';
      case 'other': return 'fas fa-calendar-alt';
      default: return 'fas fa-calendar';
    }
  }

  trackByDate(index: number, date: ImportantDate): string {
    return date.id;
  }

  sortBy(field: string): void {
    // Implementar ordenamiento si es necesario
    console.log('Ordenar por:', field);
  }
}
