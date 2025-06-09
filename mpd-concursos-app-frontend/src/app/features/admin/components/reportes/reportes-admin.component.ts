import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AdminReportsService, SystemStats } from '@core/services/admin/admin-reports.service';
import { ExportService } from '@core/services/admin/export.service';
import { NotificationService } from '@shared/services/notification.service'; // Assuming NotificationService path
import { LoggingService } from '@core/services/logging/logging.service'; // Import LoggingService

@Component({
  selector: 'app-reportes-admin',
  templateUrl: './reportes-admin.component.html',
  styleUrls: ['./reportes-admin.component.scss'],
  standalone: true, // Mark component as standalone
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule // Make sure RouterModule is imported if using routerLink
  ]
})
export class ReportesAdminComponent implements OnInit, OnDestroy {
  // Expose global Object for use in template
  Object = Object;

  // Expose router for template debugging (if needed)
  router: Router;

  // Loading state
  isLoading = false;

  // System statistics
  systemStats?: SystemStats;

  // For cleaning up subscriptions
  private destroy$ = new Subject<void>();

  // Custom tab control
  activeTab: 'examenes' | 'usuarios' | 'sistema' | 'constructor' = 'examenes';

  // Display mode: analytical dashboard vs. predefined reports
  isDashboardMode = false;

  // Data for reports (mock data for demonstration)
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

  // Data for charts (mock data for demonstration)
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

  // User data (mock data for demonstration)
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

  // Role data for charts (mock data for demonstration)
  roleStats = [
    { name: 'Participantes', count: 1188, percentage: 95.4, color: '#4CAF50' },
    { name: 'Evaluadores', count: 45, percentage: 3.6, color: '#2196F3' },
    { name: 'Administradores', count: 12, percentage: 1.0, color: '#FF9800' }
  ];

  // Recent activity data (mock data for demonstration)
  actividad = [
    { tipo: 'login', cantidad: 1245, porcentaje: 35 },
    { tipo: 'examen_iniciado', cantidad: 892, porcentaje: 25 },
    { tipo: 'examen_finalizado', cantidad: 756, porcentaje: 21 },
    { tipo: 'perfil_actualizado', cantidad: 423, porcentaje: 12 },
    { tipo: 'postulacion', cantidad: 234, porcentaje: 7 }
  ];

  selectedExamen: unknown = null;

  // Selected export format
  selectedExportFormat: 'excel' | 'csv' | 'pdf' = 'excel';

  constructor(
    private reportsService: AdminReportsService,
    private exportService: ExportService,
    router: Router, // Injected Router
    private route: ActivatedRoute, // Injected ActivatedRoute
    private notificationService: NotificationService, // Injected NotificationService
    private loggingService: LoggingService // Injected LoggingService
  ) {
    this.router = router; // Assign router to component property
    this.loggingService.debug('[ReportesAdminComponent] Constructor: Component initialized.', undefined, 'ReportsAdmin');
  }

  ngOnInit(): void {
    this.loggingService.info('[ReportesAdminComponent] OnInit: Component initialized.', undefined, 'ReportsAdmin');
    this.checkRouteForDashboard();
    this.loadSystemStats();

    // Subscribe to router events to react to route changes
    this.router.events.pipe(
      takeUntil(this.destroy$) // Ensure subscription is unsubscribed on destroy
    ).subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.loggingService.debug('[ReportesAdminComponent] NavigationEnd event received. Checking route for dashboard mode.', event.urlAfterRedirects, 'ReportsAdmin');
        this.checkRouteForDashboard();
      }
    });
  }

  /**
   * Checks the current route to determine if the dashboard interface should be displayed.
   */
  private checkRouteForDashboard(): void {
    const url = this.router.url;
    this.loggingService.debug(`[ReportesAdminComponent] Current URL for dashboard check: ${url}`, undefined, 'ReportsAdmin');

    // Check if the URL ends with '/dashboard' or contains '/reportes/dashboard'
    this.isDashboardMode = url.endsWith('/dashboard') || url.includes('/reportes/dashboard');

    if (this.isDashboardMode) {
      // If it's analytical dashboard, show 'examenes' tab by default
      this.activeTab = 'examenes';
      this.loggingService.info('[ReportesAdminComponent] Dashboard mode activated. Defaulting to "examenes" tab.', undefined, 'ReportsAdmin');
    } else {
      // If it's predefined reports, show 'constructor' tab by default
      this.activeTab = 'constructor';
      this.loggingService.info('[ReportesAdminComponent] Predefined reports mode activated. Defaulting to "constructor" tab.', undefined, 'ReportsAdmin');
    }
  }

  ngOnDestroy(): void {
    this.loggingService.info('[ReportesAdminComponent] OnDestroy: Component destroyed. Unsubscribing from observables.', undefined, 'ReportsAdmin');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Loads system statistics.
   */
  loadSystemStats(): void {
    this.isLoading = true;
    this.loggingService.info('[ReportesAdminComponent] Loading system statistics.', undefined, 'ReportsAdmin');

    this.reportsService.getSystemStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats: SystemStats) => {
          this.systemStats = stats;
          this.isLoading = false;
          this.loggingService.debug('[ReportesAdminComponent] System statistics loaded successfully:', stats, 'ReportsAdmin');
        },
        error: (error: unknown) => {
          this.loggingService.error('[ReportesAdminComponent] Error loading system statistics:', error, 'ReportsAdmin');
          this.notificationService.error('Error al cargar estadísticas del sistema. Por favor, intente de nuevo.');
          this.isLoading = false;
        }
      });
  }

  /**
   * Navigates to the main report builder (glassmorphism premium).
   */
  navigateToReportBuilder(): void {
    this.loggingService.info('[ReportesAdminComponent] Navigating to report builder.', undefined, 'ReportsAdmin');
    this.router.navigate(['/admin/reportes/constructor']);
  }

  /**
   * Calculates the total number of participants from the mock exams data.
   * @returns Total number of participants.
   */
  getTotalParticipantes(): number {
    return this.examenes.reduce((sum, examen) => sum + examen.participantes, 0);
  }

  /**
   * Calculates the total number of completed exams from the mock exams data.
   * @returns Total number of completed exams.
   */
  getTotalCompletados(): number {
    return this.examenes.reduce((sum, examen) => sum + examen.completados, 0);
  }

  /**
   * Calculates the average score of all exams.
   * @returns Average score formatted as a string with percentage.
   */
  getPromedioCalificacion(): string {
    if (this.examenes.length === 0) {
      this.loggingService.warn('[ReportesAdminComponent] No examenes to calculate average score. Returning "0.0%".', undefined, 'ReportsAdmin');
      return '0.0%';
    }
    const promedio = this.examenes.reduce((sum, examen) => sum + examen.promedioCalificacion, 0) / this.examenes.length;
    return promedio.toFixed(1) + '%';
  }

  /**
   * Exports a report based on the active tab and selected format.
   * In a real implementation, this would involve fetching data based on active filters and tab.
   * @param formato The desired export format ('excel', 'csv', 'pdf').
   */
  exportarReporte(formato: 'excel' | 'csv' | 'pdf'): void {
    this.isLoading = true;
    this.loggingService.info(`[ReportesAdminComponent] Exporting report in ${formato} format.`, undefined, 'ReportsAdmin');

    let dataToExport: Record<string, unknown>[] = [];
    let fileName = 'reporte';

    // In a real implementation, this would be based on the active tab
    // and filters applied by the user.
    // For now, it exports the 'examenes' mock data.
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

    fileName = 'reporte_examenes'; // Specific filename for exam report

    // Export the data using ExportService
    this.exportService.exportData(dataToExport, {
      format: formato,
      fileName: fileName,
      includeHeaders: true
    });

    this.isLoading = false;
    this.notificationService.success(`Reporte exportado como ${fileName}.${formato}`);
    this.loggingService.info(`[ReportesAdminComponent] Report exported successfully as ${fileName}.${formato}.`, undefined, 'ReportsAdmin');
  }

  /**
   * Sets the currently selected exam for detail display.
   * @param examen The selected exam object.
   */
  selectExamen(examen: unknown): void {
    this.selectedExamen = examen;
    this.loggingService.debug('[ReportesAdminComponent] Selected examen for detail:', examen, 'ReportsAdmin');
  }

  /**
   * Gets the human-readable text for an exam type.
   * @param tipo The exam type string.
   * @returns The descriptive text.
   */
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
   * Calculates the total number of new users from systemStats.
   * @returns Total number of new users.
   */
  calculateTotalNewUsers(): number {
    if (!this.systemStats?.users?.newByPeriod) {
      this.loggingService.warn('[ReportesAdminComponent] systemStats.users.newByPeriod is not available. Returning 0 for total new users.', undefined, 'ReportsAdmin');
      return 0;
    }
    return Object.values(this.systemStats.users.newByPeriod).reduce((total, count) => total + count, 0);
  }

  /**
   * Calculates the number of inactive users.
   * @returns Number of inactive users.
   */
  calculateInactiveUsers(): number {
    if (!this.systemStats?.users?.total || this.systemStats.users.active === undefined) {
      this.loggingService.warn('[ReportesAdminComponent] systemStats.users.total or active is not available. Returning 0 for inactive users.', undefined, 'ReportsAdmin');
      return 0;
    }
    return this.systemStats.users.total - this.systemStats.users.active;
  }

  /**
   * Gets the server load value for ngClass expressions.
   * @returns Server load value.
   */
  getServerLoad(): number {
    return this.systemStats?.performance?.serverLoad || 0;
  }

  /**
   * Gets the error rate value for ngClass expressions.
   * @returns Error rate value.
   */
  getErrorRate(): number {
    return this.systemStats?.performance?.errorRate || 0;
  }

  /**
   * Gets the response time value for ngClass expressions.
   * @returns Response time value.
   */
  getResponseTime(): number {
    return this.systemStats?.performance?.averageResponseTime || 0;
  }

  /**
   * Gets the count of system administrators.
   * @returns Number of administrators.
   */
  getAdminCount(): number {
    if (!this.systemStats?.users?.byRole) {
      this.loggingService.warn('[ReportesAdminComponent] systemStats.users.byRole is not available. Returning 0 for admin count.', undefined, 'ReportsAdmin');
      return 0;
    }
    return this.systemStats.users.byRole['ROLE_ADMIN'] || 0;
  }

  /**
   * TrackBy function for ngFor to optimize rendering.
   * @param index Index of the element.
   * @returns The index as identifier.
   */
  trackByIndex(index: number): number {
    return index;
  }

  /**
   * Gets the title of the selected exam.
   * @returns Exam title or default text.
   */
  getTituloExamen(): string {
    if (!this.selectedExamen) {
      return 'Examen seleccionado';
    }
    const examen = this.selectedExamen as Record<string, unknown>;
    return examen['titulo'] as string || 'Examen seleccionado';
  }

  // ===== METHODS FOR PREDEFINED REPORTS =====

  /**
   * Generates a quick report.
   * @param reportType Type of report to generate.
   */
  generateQuickReport(reportType: string): void {
    this.isLoading = true;
    this.loggingService.info(`[ReportesAdminComponent] Generating quick report: ${reportType}.`, undefined, 'ReportsAdmin');

    // Simulate async operation for report generation
    setTimeout(() => {
      this.isLoading = false;
      this.notificationService.success(`Reporte "${reportType}" generado exitosamente`);
      this.loggingService.debug(`[ReportesAdminComponent] Quick report "${reportType}" simulated generation success.`, undefined, 'ReportsAdmin');

      // Real logic for report download would go here
      this.downloadReport(reportType);
    }, 2000);
  }

  /**
   * Gets the count for quick reports (mock data).
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
   * Uses a report template.
   * @param templateId ID of the template to use.
   */
  useTemplate(templateId: string): void {
    this.isLoading = true;
    this.loggingService.info(`[ReportesAdminComponent] Using report template: ${templateId}.`, undefined, 'ReportsAdmin');

    // Simulate async operation for template loading
    setTimeout(() => {
      this.isLoading = false;
      this.notificationService.success(`Plantilla "${templateId}" cargada exitosamente`);
      this.loggingService.debug(`[ReportesAdminComponent] Template "${templateId}" simulated loading success. Navigating to constructor.`, undefined, 'ReportsAdmin');

      // Navigate to the constructor with the template query parameter
      this.router.navigate(['/admin/reportes/constructor'], {
        queryParams: { template: templateId }
      });
    }, 1500);
  }

  // ===== METHODS FOR ANALYTICAL DASHBOARD =====

  /**
   * Gets active users count (mock data).
   */
  getUsuariosActivos(): number {
    return this.usuarios.activos;
  }

  /**
   * Gets pending users count (mock data - simulated from inactive).
   */
  getUsuariosPendientes(): number {
    // Simulate pending users as a percentage of inactive users
    return Math.round(this.usuarios.inactivos * 0.3);
  }

  /**
   * Gets user activation rate (mock data).
   */
  getTasaActivacion(): number {
    const activos = this.usuarios.activos;
    const total = this.usuarios.total;
    if (total === 0) {
      this.loggingService.warn('[ReportesAdminComponent] Total users is 0 when calculating activation rate. Returning 0.', undefined, 'ReportsAdmin');
      return 0;
    }
    return Math.round((activos / total) * 100);
  }

  /**
   * Gets the icon for an activity type.
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
   * Gets the descriptive text for an activity type.
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
   * Creates a quick report from the builder (mock function).
   */
  createQuickReport(): void {
    this.loggingService.info('[ReportesAdminComponent] "Create Quick Report" function triggered (placeholder).', undefined, 'ReportsAdmin');
    this.notificationService.info('Función de reporte rápido en desarrollo');
  }

  /**
   * Downloads a report (mock logic).
   * In a real scenario, this would likely involve an API call to get a file stream.
   * @param reportType Type of report.
   */
  private downloadReport(reportType: string): void {
    this.loggingService.debug(`[ReportesAdminComponent] Simulating report download for type: ${reportType}.`, undefined, 'ReportsAdmin');
    // Real download logic would go here, e.g., using a service to fetch a blob and trigger download.
    const mockData = `This is a mock report for ${reportType}.\nGenerated at: ${new Date().toLocaleString()}`;
    const blob = new Blob([mockData], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportType}_${new Date().toISOString().split('T')[0]}.txt`; // Change extension based on real format
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    this.loggingService.info(`[ReportesAdminComponent] Mock report "${reportType}" download triggered.`, undefined, 'ReportsAdmin');
  }

  /**
   * Sets the active tab
   * @param tab The tab to set as active
   */
  setActiveTab(tab: 'examenes' | 'usuarios' | 'sistema' | 'constructor'): void {
    this.activeTab = tab;
    this.loggingService.debug(`[ReportesAdminComponent] Active tab changed to: ${tab}`, undefined, 'ReportsAdmin');
  }
}
