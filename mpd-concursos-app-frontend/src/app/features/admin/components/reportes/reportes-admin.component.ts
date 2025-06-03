import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AdminReportsService, SystemStats } from '@core/services/admin/admin-reports.service';
import { ExportService } from '@core/services/admin/export.service';

@Component({
  selector: 'app-reportes-admin',
  templateUrl: './reportes-admin.component.html',
  styleUrls: ['./reportes-admin.component.scss']
})
export class ReportesAdminComponent implements OnInit, OnDestroy {
  // Exponer el objeto Object global para usarlo en la plantilla
  Object = Object;

  // Exponer el router para debug en template
  router: Router;

  // Estado de carga
  isLoading = false;

  // Estadísticas del sistema
  systemStats?: SystemStats;

  // Para limpieza de suscripciones
  private destroy$ = new Subject<void>();

  // Control de pestañas personalizadas
  activeTab: 'examenes' | 'usuarios' | 'sistema' | 'constructor' = 'examenes';

  // Modo de visualización: dashboard analítico vs reportes predefinidos
  isDashboardMode = false;

  // Datos para reportes
  examenes = [
    {
      id: 1,
      titulo: 'Examen de Conocimientos Generales',
      tipo: 'general',
      fechaInicio: new Date('2024-01-15'),
      fechaFin: new Date('2024-02-15'),
      participantes: 245,
      completados: 198,
      aprobados: 156,
      promedioCalificacion: 78.5,
      tiempoPromedio: 52
    },
    {
      id: 2,
      titulo: 'Evaluación Técnica Especializada',
      tipo: 'tecnico',
      fechaInicio: new Date('2024-02-01'),
      fechaFin: new Date('2024-03-01'),
      participantes: 89,
      completados: 76,
      aprobados: 62,
      promedioCalificacion: 82.3,
      tiempoPromedio: 48
    },
    {
      id: 3,
      titulo: 'Prueba de Competencias Básicas',
      tipo: 'basico',
      fechaInicio: new Date('2024-01-20'),
      fechaFin: new Date('2024-02-20'),
      participantes: 156,
      completados: 134,
      aprobados: 98,
      promedioCalificacion: 73.2,
      tiempoPromedio: 55
    }
  ];

  // Datos para gráficos
  barChartData = {
    labels: ['Examen 1', 'Examen 2', 'Examen 3', 'Examen 4'],
    datasets: [
      {
        label: 'Participantes',
        data: [120, 95, 150, 110],
        backgroundColor: 'rgba(54, 162, 235, 0.5)'
      },
      {
        label: 'Aprobados',
        data: [85, 70, 110, 88],
        backgroundColor: 'rgba(75, 192, 192, 0.5)'
      }
    ]
  };

  pieChartData = {
    labels: ['Aprobados', 'Reprobados', 'No completados'],
    datasets: [
      {
        data: [353, 98, 74],
        backgroundColor: [
          'rgba(75, 192, 192, 0.5)',
          'rgba(255, 99, 132, 0.5)',
          'rgba(255, 205, 86, 0.5)'
        ]
      }
    ]
  };

  lineChartData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May'],
    datasets: [
      {
        label: 'Nuevos usuarios',
        data: [45, 38, 52, 35, 15],
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)'
      }
    ]
  };

  // Datos de usuarios
  usuarios = {
    total: 1245,
    nuevos: {
      enero: 45,
      febrero: 38,
      marzo: 52,
      abril: 35,
      mayo: 15
    },
    porRol: {
      admin: 12,
      evaluador: 28,
      participante: 1205
    },
    activos: 980,
    inactivos: 265
  };

  // Datos de roles para gráficos
  roleStats = [
    { name: 'Participantes', count: 1188, percentage: 95.4, color: '#4CAF50' },
    { name: 'Evaluadores', count: 45, percentage: 3.6, color: '#2196F3' },
    { name: 'Administradores', count: 12, percentage: 1.0, color: '#FF9800' }
  ];

  // Datos de actividad reciente
  actividad = [
    { tipo: 'login', cantidad: 1245, porcentaje: 35 },
    { tipo: 'examen_iniciado', cantidad: 892, porcentaje: 25 },
    { tipo: 'examen_finalizado', cantidad: 756, porcentaje: 21 },
    { tipo: 'perfil_actualizado', cantidad: 423, porcentaje: 12 },
    { tipo: 'postulacion', cantidad: 234, porcentaje: 7 }
  ];





  selectedExamen: unknown = null;

  // Formato de exportación seleccionado
  selectedExportFormat: 'excel' | 'csv' | 'pdf' = 'excel';

  constructor(
    private reportsService: AdminReportsService,
    private exportService: ExportService,
    router: Router,
    private route: ActivatedRoute
  ) {
    this.router = router;
  }

  ngOnInit(): void {
    this.checkRouteForDashboard();
    this.loadSystemStats();

    // Suscribirse a cambios de ruta
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.checkRouteForDashboard();
      }
    });
  }

  /**
   * Verifica si se accedió desde la ruta dashboard para mostrar la interfaz correcta
   */
  private checkRouteForDashboard(): void {
    const url = this.router.url;

    // Verificar si la URL termina con '/dashboard' o contiene '/dashboard'
    this.isDashboardMode = url.endsWith('/dashboard') || url.includes('/reportes/dashboard');

    if (this.isDashboardMode) {
      // Si es dashboard analítico, mostrar la pestaña de exámenes por defecto
      this.activeTab = 'examenes';
    } else {
      // Si son reportes predefinidos, mostrar la pestaña de constructor
      this.activeTab = 'constructor';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga las estadísticas del sistema
   */
  loadSystemStats(): void {
    this.isLoading = true;

    this.reportsService.getSystemStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats: SystemStats) => {
          this.systemStats = stats;
          this.isLoading = false;
        },
        error: (error: unknown) => {
          console.error('Error cargando estadísticas del sistema:', error);
          this.showNotification('Error al cargar estadísticas');
          this.isLoading = false;
        }
      });
  }

  /**
   * Muestra una notificación simple
   */
  private showNotification(message: string): void {
    // Implementación simple de notificación sin Material UI
    console.log('Notification:', message);
    // Aquí podrías implementar un sistema de notificaciones personalizado
  }

  /**
   * Establece la pestaña activa
   */
  setActiveTab(tab: 'examenes' | 'usuarios' | 'sistema' | 'constructor'): void {
    this.activeTab = tab;
  }

  /**
   * Navega al constructor de reportes principal (glassmorphism premium)
   */
  navigateToReportBuilder(): void {
    this.router.navigate(['/admin/reportes/constructor']);
  }

  getTotalParticipantes(): number {
    return this.examenes.reduce((sum, examen) => sum + examen.participantes, 0);
  }

  getTotalCompletados(): number {
    return this.examenes.reduce((sum, examen) => sum + examen.completados, 0);
  }

  getPromedioCalificacion(): string {
    const promedio = this.examenes.reduce((sum, examen) => sum + examen.promedioCalificacion, 0) / this.examenes.length;
    return promedio.toFixed(1) + '%';
  }

  // Método eliminado - reemplazado por setActiveTab

  exportarReporte(formato: 'excel' | 'csv' | 'pdf'): void {
    this.isLoading = true;

    // Determinar qué datos exportar según la pestaña activa
    let dataToExport: Record<string, unknown>[] = [];
    let fileName = 'reporte';

    // En una implementación real, esto se basaría en la pestaña activa
    // y los filtros aplicados por el usuario
    dataToExport = this.examenes.map(examen => ({
      id: examen.id,
      titulo: examen.titulo,
      tipo: this.getTipoExamenText(examen.tipo),
      fechaInicio: examen.fechaInicio.toLocaleDateString(),
      fechaFin: examen.fechaFin.toLocaleDateString(),
      participantes: examen.participantes,
      completados: examen.completados,
      aprobados: examen.aprobados,
      promedioCalificacion: examen.promedioCalificacion,
      tiempoPromedio: examen.tiempoPromedio
    }));

    fileName = 'reporte_examenes';

    // Exportar los datos
    this.exportService.exportData(dataToExport, {
      format: formato,
      fileName: fileName,
      includeHeaders: true
    });

    this.isLoading = false;
    this.showNotification(`Reporte exportado como ${fileName}.${formato}`);
  }

  selectExamen(examen: unknown): void {
    this.selectedExamen = examen;
  }

  getTipoExamenText(tipo: string): string {
    switch (tipo) {
      case 'general': return 'General';
      case 'tecnico': return 'Técnico';
      case 'basico': return 'Básico';
      case 'multiple_choice': return 'Opción múltiple';
      case 'desarrollo': return 'Desarrollo';
      case 'mixto': return 'Mixto';
      default: return tipo;
    }
  }

  /**
   * Calcula el total de usuarios nuevos a partir de los datos de systemStats
   * @returns Número total de usuarios nuevos
   */
  calculateTotalNewUsers(): number {
    if (!this.systemStats?.users?.newByPeriod) {
      return 0;
    }

    return Object.values(this.systemStats.users.newByPeriod).reduce((total, count) => total + count, 0);
  }

  /**
   * Calcula el número de usuarios inactivos
   * @returns Número de usuarios inactivos
   */
  calculateInactiveUsers(): number {
    if (!this.systemStats?.users?.total || !this.systemStats?.users?.active) {
      return 0;
    }

    return this.systemStats.users.total - this.systemStats.users.active;
  }

  /**
   * Obtiene la carga del servidor para las expresiones ngClass
   * @returns Valor de la carga del servidor
   */
  getServerLoad(): number {
    return this.systemStats?.performance?.serverLoad || 0;
  }

  /**
   * Obtiene la tasa de errores para las expresiones ngClass
   * @returns Valor de la tasa de errores
   */
  getErrorRate(): number {
    return this.systemStats?.performance?.errorRate || 0;
  }

  /**
   * Obtiene el tiempo de respuesta para las expresiones ngClass
   * @returns Valor del tiempo de respuesta
   */
  getResponseTime(): number {
    return this.systemStats?.performance?.averageResponseTime || 0;
  }

  /**
   * Obtiene el número de administradores del sistema
   * @returns Número de administradores
   */
  getAdminCount(): number {
    if (!this.systemStats?.users?.byRole) {
      return 0;
    }

    return this.systemStats.users.byRole['ROLE_ADMIN'] || 0;
  }

  /**
   * Función para trackBy en ngFor
   * @param index Índice del elemento
   * @returns El índice como identificador
   */
  trackByIndex(index: number): number {
    return index;
  }

  /**
   * Obtiene el título del examen seleccionado
   * @returns Título del examen o texto por defecto
   */
  getTituloExamen(): string {
    if (!this.selectedExamen) {
      return 'Examen seleccionado';
    }

    const examen = this.selectedExamen as Record<string, unknown>;
    return examen['titulo'] as string || 'Examen seleccionado';
  }

  // ===== MÉTODOS PARA REPORTES PREDEFINIDOS =====

  /**
   * Genera un reporte rápido
   * @param reportType Tipo de reporte a generar
   */
  generateQuickReport(reportType: string): void {
    this.isLoading = true;

    console.log(`Generando reporte rápido: ${reportType}`);

    // Simular generación de reporte
    setTimeout(() => {
      this.isLoading = false;
      this.showNotification(`Reporte "${reportType}" generado exitosamente`);

      // Aquí iría la lógica real de generación y descarga
      this.downloadReport(reportType);
    }, 2000);
  }

  /**
   * Obtiene el conteo para reportes rápidos
   */
  getQuickReportCount(type: string): number {
    switch (type) {
      case 'pendientes': return 45;
      case 'activos': return 1205;
      case 'vigentes': return 8;
      default: return 0;
    }
  }

  /**
   * Usa una plantilla de reporte
   */
  useTemplate(templateId: string): void {
    this.isLoading = true;

    console.log(`Usando plantilla: ${templateId}`);

    // Simular carga de plantilla
    setTimeout(() => {
      this.isLoading = false;
      this.showNotification(`Plantilla "${templateId}" cargada exitosamente`);

      // Navegar al constructor con la plantilla
      this.router.navigate(['/admin/reportes/constructor'], {
        queryParams: { template: templateId }
      });
    }, 1500);
  }

  // ===== MÉTODOS PARA DASHBOARD ANALÍTICO =====

  /**
   * Obtiene usuarios activos
   */
  getUsuariosActivos(): number {
    return this.usuarios.activos;
  }

  /**
   * Obtiene usuarios pendientes
   */
  getUsuariosPendientes(): number {
    // Simulamos usuarios pendientes como un porcentaje de inactivos
    return Math.round(this.usuarios.inactivos * 0.3);
  }

  /**
   * Obtiene tasa de activación
   */
  getTasaActivacion(): number {
    const activos = this.usuarios.activos;
    const total = this.usuarios.total;
    return Math.round((activos / total) * 100);
  }

  /**
   * Obtiene el icono para un tipo de actividad
   */
  getActivityIcon(tipo: string): string {
    switch (tipo) {
      case 'login': return 'fa-sign-in-alt';
      case 'examen_iniciado': return 'fa-play';
      case 'examen_finalizado': return 'fa-check';
      case 'perfil_actualizado': return 'fa-user-edit';
      case 'postulacion': return 'fa-file-upload';
      default: return 'fa-circle';
    }
  }

  /**
   * Obtiene el texto para un tipo de actividad
   */
  getActivityText(tipo: string): string {
    switch (tipo) {
      case 'login': return 'Inicios de Sesión';
      case 'examen_iniciado': return 'Exámenes Iniciados';
      case 'examen_finalizado': return 'Exámenes Finalizados';
      case 'perfil_actualizado': return 'Perfiles Actualizados';
      case 'postulacion': return 'Nuevas Postulaciones';
      default: return tipo;
    }
  }

  /**
   * Crea un reporte rápido desde el constructor
   */
  createQuickReport(): void {
    this.showNotification('Función de reporte rápido en desarrollo');
  }





  /**
   * Descarga un reporte
   * @param reportType Tipo de reporte
   */
  private downloadReport(reportType: string): void {
    // Aquí iría la lógica real de descarga
    console.log(`Descargando reporte: ${reportType}`);

    // Simular descarga
    const link = document.createElement('a');
    link.href = '#';
    link.download = `${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
  }
}
