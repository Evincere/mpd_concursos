import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Material UI imports
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DashboardStats, ActivityItem, QuickAccessWidget, AdminDashboardService } from '../../../../core/services/admin/admin-dashboard.service';
import { StatCardComponent } from './components/stat-card/stat-card.component';
import { QuickAccessWidgetComponent } from './components/quick-access-widget/quick-access-widget.component';
import { ActivityFeedComponent } from './components/activity-feed/activity-feed.component';
import { StatsChartComponent, ApexChartData } from './components/stats-chart/stats-chart.component';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  description: string;
}

interface TabItem {
  label: string;
  icon: string;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    StatCardComponent,
    QuickAccessWidgetComponent,
    ActivityFeedComponent,
    StatsChartComponent
  ]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  // Configuración de tabs
  tabs: TabItem[] = [
    { label: 'Resumen', icon: 'chart-pie' },
    { label: 'Navegación Rápida', icon: 'th-large' },
    { label: 'Estadísticas', icon: 'chart-bar' }
  ];

  // Menú de navegación rápida
  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/admin/dashboard',
      description: 'Vista general del sistema'
    },
    {
      label: 'Usuarios',
      icon: 'users',
      route: '/admin/usuarios',
      description: 'Gestión de usuarios del sistema'
    },
    {
      label: 'Concursos',
      icon: 'trophy',
      route: '/admin/concursos',
      description: 'Administración de concursos'
    },
    {
      label: 'Inscripciones',
      icon: 'clipboard-list',
      route: '/admin/inscripciones',
      description: 'Gestión de inscripciones'
    },
    {
      label: 'Documentos',
      icon: 'file-text',
      route: '/admin/documentos',
      description: 'Gestión de documentos'
    },
    {
      label: 'Reportes',
      icon: 'chart-bar',
      route: '/admin/reportes',
      description: 'Reportes y estadísticas'
    },
    {
      label: 'Configuración',
      icon: 'cog',
      route: '/admin/configuracion',
      description: 'Configuración del sistema'
    }
  ];

  // Datos del dashboard
  isLoading = true;
  dashboardStats!: DashboardStats;
  recentActivities: ActivityItem[] = [];
  quickAccessWidgets: QuickAccessWidget[] = [];

  // Datos para gráficos
  inscripcionesChartData!: ApexChartData;
  concursosChartData!: ApexChartData;
  usuariosChartData!: ApexChartData;

  // Pestaña activa
  activeTab = 0;

  // Para limpieza de suscripciones
  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: AdminDashboardService,
    private router: Router
  ) {}


  ngOnInit(): void {
    this.loadDashboardData();
    this.initializeTestChartData(); // Datos de prueba para desarrollo
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.isLoading = true;

    // Cargar estadísticas
    this.dashboardService.getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats: DashboardStats) => {
          this.dashboardStats = stats;
          this.prepareChartData(stats);
          this.isLoading = false;
        },
        error: (error: Error) => {
          console.error('Error cargando estadísticas:', error);
          this.isLoading = false;
        }
      });

    // Cargar actividad reciente
    this.dashboardService.getRecentActivity(10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (activities: ActivityItem[]) => {
          this.recentActivities = activities;
        },
        error: (error: Error) => {
          console.error('Error cargando actividad reciente:', error);
        }
      });

    // Cargar widgets de acceso rápido
    this.dashboardService.getQuickAccessWidgets()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (widgets: QuickAccessWidget[]) => {
          this.quickAccessWidgets = widgets;
        },
        error: (error: Error) => {
          console.error('Error cargando widgets de acceso rápido:', error);
        }
      });
  }

  /**
   * Inicializa datos de prueba para los gráficos durante desarrollo
   */
  initializeTestChartData(): void {
    // Gráfico de inscripciones (pie chart)
    this.inscripcionesChartData = {
      labels: ['Pendientes', 'Aprobadas', 'Rechazadas'],
      series: [45, 120, 15], // Ensure these are numbers
      colors: ['#ff9800', '#4caf50', '#f44336']
    };

    // Gráfico de concursos (donut chart)
    this.concursosChartData = {
      labels: ['Activos', 'Próximos', 'Finalizados'],
      series: [8, 12, 25], // Ensure these are numbers
      colors: ['#2196f3', '#9c27b0', '#607d8b']
    };

    // Gráfico de usuarios por rol (pie chart)
    this.usuariosChartData = {
      labels: ['Administradores', 'Usuarios'],
      series: [5, 150], // Ensure these are numbers
      colors: ['#9c27b0', '#2196f3']
    };

    console.log('Test chart data initialized:', {
      inscripciones: this.inscripcionesChartData,
      concursos: this.concursosChartData,
      usuarios: this.usuariosChartData
    });
  }

  prepareChartData(stats: DashboardStats): void {
    // Gráfico de inscripciones (pie chart) - Ensure numbers
    this.inscripcionesChartData = {
      labels: ['Pendientes', 'Aprobadas', 'Rechazadas'],
      series: [
        Number(stats.inscripciones.pendientes) || 0,
        Number(stats.inscripciones.aprobadas) || 0,
        Number(stats.inscripciones.rechazadas) || 0
      ],
      colors: ['#ff9800', '#4caf50', '#f44336']
    };

    // Gráfico de concursos (donut chart) - Ensure numbers
    this.concursosChartData = {
      labels: ['Activos', 'Próximos', 'Finalizados'],
      series: [
        Number(stats.concursos.activos) || 0,
        Number(stats.concursos.proximos) || 0,
        Number(stats.concursos.finalizados) || 0
      ],
      colors: ['#2196f3', '#9c27b0', '#607d8b']
    };

    // Gráfico de usuarios por rol (pie chart) - Ensure numbers
    const roles = Object.keys(stats.usuarios.porRol);
    const usuariosPorRol = roles.map(role => Number(stats.usuarios.porRol[role]) || 0);

    this.usuariosChartData = {
      labels: roles.map(role => role.replace('ROLE_', '')),
      series: usuariosPorRol,
      colors: ['#9c27b0', '#2196f3']
    };

    console.log('Chart data prepared from stats:', {
      inscripciones: this.inscripcionesChartData,
      concursos: this.concursosChartData,
      usuarios: this.usuariosChartData
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  /**
   * Establece el tab activo
   */
  setActiveTab(tabIndex: number): void {
    this.activeTab = tabIndex;
  }

  /**
   * TrackBy function para widgets
   */
  trackByWidgetId(index: number, widget: QuickAccessWidget): string {
    return widget.id || index.toString();
  }

  /**
   * TrackBy function para menu items
   */
  trackByMenuRoute(index: number, item: MenuItem): string {
    return item.route;
  }
}
