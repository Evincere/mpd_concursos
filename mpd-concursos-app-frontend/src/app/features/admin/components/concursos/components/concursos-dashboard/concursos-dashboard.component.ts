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
import { StatsChartComponent, ApexChartData } from '../../../admin-dashboard/components/stats-chart/stats-chart.component';
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
  statusChartData!: ApexChartData;
  departmentChartData!: ApexChartData;
  categoryChartData!: ApexChartData;

  // Pestaña activa
  activeTab = 0;

  // Para limpieza de suscripciones
  private destroy$ = new Subject<void>();

  constructor(
    private concursosService: AdminConcursosService,
    private dashboardService: AdminDashboardService
  ) {}

  ngOnInit(): void {
    // Initialize with test data first to ensure charts have data
    this.initializeTestData();
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
          console.log('Stats received from service:', stats);
          this.stats = stats;

          // Only update charts if we have valid data
          if (this.hasValidStats(stats)) {
            this.prepareChartData(stats);
          } else {
            console.warn('Invalid stats received, keeping test data');
          }

          this.isLoading = false;
        },
        error: (error: unknown) => {
          console.error('Error cargando estadísticas de concursos:', error);
          console.log('Using test data due to service error');
          this.isLoading = false;
          // Keep test data when service fails
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

  /**
   * Initialize test data for development
   */
  initializeTestData(): void {
    console.log('Initializing test data for concursos dashboard');

    const testStats: ConcursoStats = {
      total: 19, // Sum of all status counts
      active: 5,
      draft: 3,
      inProgress: 2,
      closed: 8,
      cancelled: 1,
      byDepartment: {
        'Recursos Humanos': 4,
        'Tecnología': 6,
        'Administración': 3,
        'Legal': 2,
        'Finanzas': 4
      },
      byCategory: {
        'Profesional': 8,
        'Técnico': 6,
        'Administrativo': 5
      }
    };

    this.prepareChartData(testStats);
  }

  /**
   * Check if stats contain valid data
   */
  private hasValidStats(stats: ConcursoStats): boolean {
    if (!stats) return false;

    // Check if at least one numeric field has a value > 0
    const hasNumericData = stats.active > 0 || stats.draft > 0 ||
                          stats.inProgress > 0 || stats.closed > 0 ||
                          stats.cancelled > 0;

    // Check if department and category data exist
    const hasDepartmentData = stats.byDepartment && Object.keys(stats.byDepartment).length > 0;
    const hasCategoryData = stats.byCategory && Object.keys(stats.byCategory).length > 0;

    return hasNumericData || hasDepartmentData || hasCategoryData;
  }

  prepareChartData(stats: ConcursoStats): void {
    console.log('Preparing chart data with stats:', stats);

    // Gráfico de concursos por estado (donut chart)
    const statusSeries = [
      Number(stats.active) || 0,
      Number(stats.draft) || 0,
      Number(stats.inProgress) || 0,
      Number(stats.closed) || 0,
      Number(stats.cancelled) || 0
    ];

    this.statusChartData = {
      labels: ['Activos', 'Borradores', 'En Proceso', 'Cerrados', 'Cancelados'],
      series: statusSeries,
      colors: [
        '#4caf50', // Verde - Activos
        '#2196f3', // Azul - Borradores
        '#ff9800', // Naranja - En Proceso
        '#9e9e9e', // Gris - Cerrados
        '#f44336'  // Rojo - Cancelados
      ]
    };

    // Gráfico de concursos por departamento (pie chart)
    const departmentLabels = stats.byDepartment ? Object.keys(stats.byDepartment) : [];
    const departmentData = departmentLabels.map(dept => Number(stats.byDepartment[dept]) || 0);

    this.departmentChartData = {
      labels: departmentLabels.length > 0 ? departmentLabels : ['Sin datos'],
      series: departmentData.length > 0 ? departmentData : [1],
      colors: this.generateColors(Math.max(departmentLabels.length, 1))
    };

    // Gráfico de concursos por categoría (pie chart)
    const categoryLabels = stats.byCategory ? Object.keys(stats.byCategory) : [];
    const categoryData = categoryLabels.map(cat => Number(stats.byCategory[cat]) || 0);

    this.categoryChartData = {
      labels: categoryLabels.length > 0 ? categoryLabels : ['Sin datos'],
      series: categoryData.length > 0 ? categoryData : [1],
      colors: this.generateColors(Math.max(categoryLabels.length, 1), true)
    };

    console.log('Chart data prepared:', {
      status: this.statusChartData,
      department: this.departmentChartData,
      category: this.categoryChartData
    });
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
