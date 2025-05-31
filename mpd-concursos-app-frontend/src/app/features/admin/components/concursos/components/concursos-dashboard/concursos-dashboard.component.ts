import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AdminConcursosService, ConcursoStats } from '../../../../../../core/services/admin/admin-concursos.service';
import { AdminDashboardService, ActivityItem } from '../../../../../../core/services/admin/admin-dashboard.service';
import { StatCardComponent } from '../../../admin-dashboard/components/stat-card/stat-card.component';
import { StatsChartComponent, ChartData } from '../../../admin-dashboard/components/stats-chart/stats-chart.component';
import { ActivityFeedComponent } from '../../../admin-dashboard/components/activity-feed/activity-feed.component';

@Component({
  selector: 'app-concursos-dashboard',
  templateUrl: './concursos-dashboard.component.html',
  styleUrls: ['./concursos-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTabsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    StatCardComponent,
    StatsChartComponent,
    ActivityFeedComponent
  ]
})
export class ConcursosDashboardComponent implements OnInit, OnDestroy {
  isLoading = false;
  stats!: ConcursoStats;
  recentActivities: ActivityItem[] = [];

  // Datos para gráficos
  statusChartData!: ChartData;
  departmentChartData!: ChartData;
  categoryChartData!: ChartData;

  // Pestaña activa
  activeTab = 0;

  // Para limpieza de suscripciones
  private destroy$ = new Subject<void>();

  constructor(
    private concursosService: AdminConcursosService,
    private dashboardService: AdminDashboardService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.isLoading = true;

    // Cargar estadísticas de concursos
    this.concursosService.getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats: ConcursoStats) => {
          this.stats = stats;
          this.prepareChartData(stats);
          this.isLoading = false;
        },
        error: (error: unknown) => {
          console.error('Error cargando estadísticas de concursos:', error);
          this.isLoading = false;
        }
      });

    // Cargar actividad reciente relacionada con concursos
    this.dashboardService.getRecentActivity(10, 'concurso')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (activities: ActivityItem[]) => {
          this.recentActivities = activities;
        },
        error: (error: unknown) => {
          console.error('Error cargando actividad reciente:', error);
        }
      });
  }

  prepareChartData(stats: ConcursoStats): void {
    // Gráfico de concursos por estado
    this.statusChartData = {
      labels: ['Activos', 'Borradores', 'En Proceso', 'Cerrados', 'Cancelados'],
      datasets: [{
        label: 'Concursos por Estado',
        data: [
          stats.active,
          stats.draft,
          stats.inProgress,
          stats.closed,
          stats.cancelled
        ],
        backgroundColor: [
          '#4caf50', // Verde - Activos
          '#2196f3', // Azul - Borradores
          '#ff9800', // Naranja - En Proceso
          '#9e9e9e', // Gris - Cerrados
          '#f44336'  // Rojo - Cancelados
        ],
        borderWidth: 0
      }]
    };

    // Gráfico de concursos por departamento
    const departmentLabels = Object.keys(stats.byDepartment);
    const departmentData = departmentLabels.map(dept => stats.byDepartment[dept]);

    this.departmentChartData = {
      labels: departmentLabels,
      datasets: [{
        label: 'Concursos por Departamento',
        data: departmentData,
        backgroundColor: this.generateColors(departmentLabels.length),
        borderWidth: 0
      }]
    };

    // Gráfico de concursos por categoría
    const categoryLabels = Object.keys(stats.byCategory);
    const categoryData = categoryLabels.map(cat => stats.byCategory[cat]);

    this.categoryChartData = {
      labels: categoryLabels,
      datasets: [{
        label: 'Concursos por Categoría',
        data: categoryData,
        backgroundColor: this.generateColors(categoryLabels.length, true),
        borderWidth: 0
      }]
    };
  }

  generateColors(count: number, alternate = false): string[] {
    const baseColors = alternate ? [
      '#3f51b5', // Indigo
      '#009688', // Teal
      '#9c27b0', // Púrpura
      '#ff5722', // Naranja oscuro
      '#607d8b', // Azul grisáceo
      '#795548', // Marrón
      '#e91e63', // Rosa
      '#673ab7', // Violeta profundo
      '#00bcd4', // Cian
      '#8bc34a'  // Verde claro
    ] : [
      '#42a5f5', // Azul claro
      '#66bb6a', // Verde claro
      '#ffa726', // Naranja claro
      '#ef5350', // Rojo claro
      '#ab47bc', // Púrpura claro
      '#26a69a', // Verde azulado
      '#ec407a', // Rosa claro
      '#7e57c2', // Violeta claro
      '#29b6f6', // Azul cielo
      '#d4e157'  // Lima
    ];

    // Si hay más categorías que colores, repetir los colores
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }

    return colors;
  }
}
