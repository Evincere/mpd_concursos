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
import { StatsChartComponent, ChartData } from './components/stats-chart/stats-chart.component';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  description: string;
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
  // Menú de navegación rápida
  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/admin/dashboard',
      description: 'Vista general del sistema'
    },
    {
      label: 'Users',
      icon: 'people',
      route: '/admin/users',
      description: 'User management'
    },
    {
      label: 'Documentos',
      icon: 'description',
      route: '/admin/documentos',
      description: 'Gestión de documentos'
    },
    {
      label: 'Exámenes',
      icon: 'assignment',
      route: '/admin/examenes',
      description: 'Administración de exámenes'
    },
    {
      label: 'Comunicaciones',
      icon: 'message',
      route: '/admin/comunicaciones',
      description: 'Envío de comunicaciones masivas'
    },
    {
      label: 'Reportes',
      icon: 'assessment',
      route: '/admin/reportes',
      description: 'Reportes y estadísticas'
    },
    {
      label: 'Configuración',
      icon: 'settings',
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
  inscripcionesChartData!: ChartData;
  concursosChartData!: ChartData;
  usuariosChartData!: ChartData;

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

  prepareChartData(stats: DashboardStats): void {
    // Gráfico de inscripciones
    this.inscripcionesChartData = {
      labels: ['Pendientes', 'Aprobadas', 'Rechazadas'],
      datasets: [{
        label: 'Inscripciones',
        data: [stats.inscripciones.pendientes, stats.inscripciones.aprobadas, stats.inscripciones.rechazadas],
        backgroundColor: ['#ff9800', '#4caf50', '#f44336'],
        borderWidth: 0
      }]
    };

    // Gráfico de concursos
    this.concursosChartData = {
      labels: ['Activos', 'Próximos', 'Finalizados'],
      datasets: [{
        label: 'Concursos',
        data: [stats.concursos.activos, stats.concursos.proximos, stats.concursos.finalizados],
        backgroundColor: ['#2196f3', '#9c27b0', '#607d8b'],
        borderWidth: 0
      }]
    };

    // Gráfico de usuarios por rol
    const roles = Object.keys(stats.usuarios.porRol);
    const usuariosPorRol = roles.map(role => stats.usuarios.porRol[role]);

    this.usuariosChartData = {
      labels: roles.map(role => role.replace('ROLE_', '')),
      datasets: [{
        label: 'Usuarios por Rol',
        data: usuariosPorRol,
        backgroundColor: ['#9c27b0', '#2196f3'],
        borderWidth: 0
      }]
    };
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
