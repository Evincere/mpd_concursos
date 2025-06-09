import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; // Import Router
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, tap } from 'rxjs/operators'; // Import tap

import { SupportTicketService } from '../../../../../core/services/support/support-ticket.service';
import { SLAConfigurationService } from '../../../../../core/services/support/sla-configuration.service';
import { CustomNotificationService } from '../../../../../shared/components/custom-notification/custom-notification.service';
import { CustomDialogService } from '../../../../../shared/components/custom-dialog/custom-dialog.service';
import { LoggingService } from '../../../../../core/services/logging/logging.service'; // Import LoggingService

import {
  SupportTicket,
  TicketStatistics,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketFilters
} from '../../../../../core/models/support-ticket.model';

/**
 * Active dashboard view
 */
type DashboardView = 'overview' | 'tickets' | 'analytics' | 'sla';

/**
 * Main component for the support dashboard
 */
@Component({
  selector: 'app-support-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule
  ],
  templateUrl: './support-dashboard.component.html',
  styleUrls: ['./support-dashboard.component.scss']
})
export class SupportDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Component states
  activeView: DashboardView = 'overview';
  loading = false;

  // Data
  tickets: SupportTicket[] = []; // Used for the 'tickets' view when filters are applied
  statistics: TicketStatistics | null = null;
  recentTickets: SupportTicket[] = [];
  overdueTickets: SupportTicket[] = [];
  myAssignedTickets: SupportTicket[] = [];

  // Forms
  filtersForm!: FormGroup;

  // View configuration
  viewOptions = [
    { value: 'overview', label: 'Resumen General', icon: 'fas fa-chart-pie' },
    { value: 'tickets', label: 'Gestión de Tickets', icon: 'fas fa-ticket-alt' },
    { value: 'analytics', label: 'Análisis y Métricas', icon: 'fas fa-chart-line' },
    { value: 'sla', label: 'Configuración SLA', icon: 'fas fa-clock' }
  ];

  // Enums for template
  TicketStatus = TicketStatus;
  TicketPriority = TicketPriority;
  TicketCategory = TicketCategory;

  // Status configuration
  statusOptions = [
    { value: TicketStatus.OPEN, label: 'Abierto', color: 'blue', icon: 'fas fa-folder-open' },
    { value: TicketStatus.IN_PROGRESS, label: 'En Progreso', color: 'orange', icon: 'fas fa-spinner' },
    { value: TicketStatus.PENDING_USER, label: 'Pendiente Usuario', color: 'yellow', icon: 'fas fa-user-clock' },
    { value: TicketStatus.PENDING_INTERNAL, label: 'Pendiente Interno', color: 'purple', icon: 'fas fa-clock' },
    { value: TicketStatus.RESOLVED, label: 'Resuelto', color: 'green', icon: 'fas fa-check-circle' },
    { value: TicketStatus.CLOSED, label: 'Cerrado', color: 'gray', icon: 'fas fa-times-circle' },
    { value: TicketStatus.CANCELLED, label: 'Cancelado', color: 'red', icon: 'fas fa-ban' }
  ];

  priorityOptions = [
    { value: TicketPriority.LOW, label: 'Baja', color: 'green', icon: 'fas fa-arrow-down' },
    { value: TicketPriority.NORMAL, label: 'Normal', color: 'blue', icon: 'fas fa-minus' },
    { value: TicketPriority.HIGH, label: 'Alta', color: 'orange', icon: 'fas fa-arrow-up' },
    { value: TicketPriority.URGENT, label: 'Urgente', color: 'red', icon: 'fas fa-exclamation' },
    { value: TicketPriority.CRITICAL, label: 'Crítica', color: 'red', icon: 'fas fa-exclamation-triangle' }
  ];

  categoryOptions = [
    { value: TicketCategory.TECHNICAL, label: 'Técnico', icon: 'fas fa-cog' },
    { value: TicketCategory.ACCOUNT, label: 'Cuenta', icon: 'fas fa-user' },
    { value: TicketCategory.INSCRIPTION, label: 'Inscripción', icon: 'fas fa-file-signature' },
    { value: TicketCategory.DOCUMENTS, label: 'Documentos', icon: 'fas fa-file-alt' },
    { value: TicketCategory.PAYMENT, label: 'Pagos', icon: 'fas fa-credit-card' },
    { value: TicketCategory.GENERAL, label: 'General', icon: 'fas fa-question-circle' },
    { value: TicketCategory.BUG_REPORT, label: 'Reporte de Bug', icon: 'fas fa-bug' },
    { value: TicketCategory.FEATURE_REQUEST, label: 'Solicitud de Función', icon: 'fas fa-lightbulb' }
  ];

  constructor(
    private fb: FormBuilder,
    private supportTicketService: SupportTicketService,
    private slaConfigurationService: SLAConfigurationService,
    private notificationService: CustomNotificationService,
    private dialogService: CustomDialogService, // Assuming CustomDialogService is correctly imported
    private loggingService: LoggingService, // Inject LoggingService
    private router: Router // Inject Router
  ) {
    this.loggingService.debug('[SupportDashboardComponent] Constructor: Initializing forms.', undefined, 'SupportDashboard');
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loggingService.info('[SupportDashboardComponent] Component initialized.', undefined, 'SupportDashboard');
    this.loadDashboardData();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.loggingService.info('[SupportDashboardComponent] Component destroyed. Cleaning up subscriptions.', undefined, 'SupportDashboard');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Crea un nuevo ticket de soporte
   */
  createNewTicket(): void {
    console.log('Creando nuevo ticket de soporte');
    // TODO: Implementar lógica para crear nuevo ticket
    this.notificationService.success('Funcionalidad de crear ticket en desarrollo');
  }

  /**
   * Ejecuta reglas de escalamiento
   */
  executeEscalationRules(): void {
    console.log('Ejecutando reglas de escalamiento');
    // TODO: Implementar lógica para ejecutar reglas de escalamiento
    this.notificationService.success('Funcionalidad de escalamiento en desarrollo');
  }

  /**
   * Initializes the filter forms.
   */
  private initializeForms(): void {
    this.filtersForm = this.fb.group({
      status: [[]], // Array for multiple selections
      priority: [[]],
      category: [[]],
      assignedToId: [''],
      dateRange: [''], // Consider more granular controls for date range (e.g., startDate, endDate)
      searchText: ['']
    });
    this.loggingService.debug('[SupportDashboardComponent] Filters form initialized.', undefined, 'SupportDashboard');
  }

  /**
   * Configures subscriptions to the filter form for automatic data loading.
   */
  private setupFormSubscriptions(): void {
    this.filtersForm.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)) // Deep comparison for form changes
    ).subscribe(() => {
      this.loggingService.debug('[SupportDashboardComponent] Filters form value changed. Applying filters.', this.filtersForm.value, 'SupportDashboard');
      this.applyFilters();
    });
    this.loggingService.debug('[SupportDashboardComponent] Filter form subscriptions set up.', undefined, 'SupportDashboard');
  }

  /**
   * Loads all necessary data for the dashboard overview.
   * Uses `combineLatest` to load multiple data streams concurrently.
   */
  private loadDashboardData(): void {
    this.loading = true;
    this.loggingService.info('[SupportDashboardComponent] Loading dashboard data.', undefined, 'SupportDashboard');

    combineLatest([
      this.supportTicketService.getStatistics().pipe(
        tap(stats => this.loggingService.debug('[SupportDashboardComponent] Statistics loaded:', stats, 'SupportDashboard')),
        // Example: Add catchError here if you want to handle individual stream errors gracefully
        // catchError(error => { this.loggingService.error('Error loading stats:', error); return of(null); })
      ),
      this.supportTicketService.getTickets({}, 1, 10).pipe( // Get recent tickets (page 1, size 10)
        tap(response => this.loggingService.debug('[SupportDashboardComponent] Recent tickets loaded:', response.tickets, 'SupportDashboard')),
      ),
      this.supportTicketService.getAssignedTickets().pipe(
        tap(tickets => this.loggingService.debug('[SupportDashboardComponent] My assigned tickets loaded:', tickets, 'SupportDashboard')),
      )
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ([statistics, ticketsResponse, assignedTickets]) => {
        this.statistics = statistics;
        this.recentTickets = ticketsResponse.tickets;
        this.myAssignedTickets = assignedTickets;
        this.loggingService.info('[SupportDashboardComponent] Initial dashboard data loaded successfully.', undefined, 'SupportDashboard');
        this.loadOverdueTickets(); // Load overdue tickets after initial data
        this.loading = false;
      },
      error: (error) => {
        this.loggingService.error('[SupportDashboardComponent] Error loading dashboard data:', error, 'SupportDashboard');
        this.notificationService.error('Error al cargar los datos del dashboard. Por favor, intente de nuevo.');
        this.loading = false;
      }
    });
  }

  /**
   * Loads overdue tickets based on SLA.
   */
  private loadOverdueTickets(): void {
    this.loggingService.info('[SupportDashboardComponent] Loading overdue tickets.', undefined, 'SupportDashboard');
    const filters: TicketFilters = {
      status: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.PENDING_USER, TicketStatus.PENDING_INTERNAL]
    };

    this.supportTicketService.getTickets(filters).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        // Filter overdue tickets based on SLA properties
        this.overdueTickets = response.tickets.filter(ticket =>
          ticket.sla?.isResponseOverdue || ticket.sla?.isResolutionOverdue
        );
        this.loggingService.debug('[SupportDashboardComponent] Overdue tickets loaded:', this.overdueTickets, 'SupportDashboard');
      },
      error: (error) => {
        this.loggingService.error('[SupportDashboardComponent] Error loading overdue tickets:', error, 'SupportDashboard');
        // Do not show full notification here, as it's a sub-component of overall dashboard load
      }
    });
  }

  /**
   * Changes the active view of the dashboard.
   * @param view The view to activate.
   */
  setActiveView(view: DashboardView | string): void {
    this.activeView = view as DashboardView;
    this.loggingService.info(`[SupportDashboardComponent] Active view changed to: ${this.activeView}`, undefined, 'SupportDashboard');

    if (this.activeView === 'tickets') {
      this.loadTicketsData();
    } else if (this.activeView === 'analytics') {
      this.loadAnalyticsData();
    } else if (this.activeView === 'sla') {
      this.loadSLAData();
    }
  }

  /**
   * Loads ticket-specific data for the 'tickets' view.
   */
  private loadTicketsData(): void {
    this.loggingService.info('[SupportDashboardComponent] Loading tickets data for "tickets" view.', undefined, 'SupportDashboard');
    this.applyFilters(); // Apply current filters to populate the 'tickets' array
  }

  /**
   * Loads analytics data for the 'analytics' view.
   */
  private loadAnalyticsData(): void {
    this.loggingService.info('[SupportDashboardComponent] Loading analytics data for "analytics" view.', undefined, 'SupportDashboard');
    // Load additional metrics for analytics
    this.slaConfigurationService.getSLAMetrics().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (metrics) => {
        // Process metrics for charts (e.g., assign to properties used by chart components)
        this.loggingService.debug('[SupportDashboardComponent] SLA Metrics loaded for analytics:', metrics, 'SupportDashboard');
      },
      error: (error) => {
        this.loggingService.error('[SupportDashboardComponent] Error loading SLA metrics for analytics:', error, 'SupportDashboard');
        this.notificationService.error('Error al cargar las métricas de análisis.');
      }
    });
  }

  /**
   * Loads SLA configuration data for the 'sla' view.
   */
  private loadSLAData(): void {
    this.loggingService.info('[SupportDashboardComponent] Loading SLA configuration data for "SLA" view.', undefined, 'SupportDashboard');
    this.slaConfigurationService.getSLAConfigurations().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (configurations) => {
        // Assign configurations to a property for display in the template
        this.loggingService.debug('[SupportDashboardComponent] SLA Configurations loaded:', configurations, 'SupportDashboard');
      },
      error: (error) => {
        this.loggingService.error('[SupportDashboardComponent] Error loading SLA configurations:', error, 'SupportDashboard');
        this.notificationService.error('Error al cargar la configuración de SLA.');
      }
    });
  }

  /**
   * Applies filters to the list of tickets displayed in the 'tickets' view.
   */
  private applyFilters(): void {
    this.loggingService.info('[SupportDashboardComponent] Applying filters to ticket list.', this.filtersForm.value, 'SupportDashboard');
    const formValue = this.filtersForm.value;
    const filters: TicketFilters = {};

    if (formValue.status?.length) {
      filters.status = formValue.status;
    }
    if (formValue.priority?.length) {
      filters.priority = formValue.priority;
    }
    if (formValue.category?.length) {
      filters.category = formValue.category;
    }
    if (formValue.assignedToId) {
      filters.assignedToId = formValue.assignedToId;
    }
    if (formValue.searchText) {
      filters.searchText = formValue.searchText;
    }
    // Handle dateRange if it's a specific format (e.g., 'today', 'last-week' or actual dates)
    // You might need to parse formValue.dateRange into startDate and endDate properties for TicketFilters
    // if (formValue.dateRange) { /* parse and assign to filters.startDate, filters.endDate */ }

    this.supportTicketService.getTickets(filters).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.tickets = response.tickets;
        this.loggingService.debug('[SupportDashboardComponent] Tickets filtered and loaded successfully:', this.tickets, 'SupportDashboard');
      },
      error: (error) => {
        this.loggingService.error('[SupportDashboardComponent] Error applying filters to tickets:', error, 'SupportDashboard');
        this.notificationService.error('Error al filtrar tickets. Por favor, intente de nuevo.');
      }
    });
  }

  /**
   * Clears all filters in the form and reloads ticket data.
   */
  clearFilters(): void {
    this.loggingService.info('[SupportDashboardComponent] Clearing all filters and reloading ticket data.', undefined, 'SupportDashboard');
    this.filtersForm.reset({
      status: [],
      priority: [],
      category: [],
      assignedToId: '',
      dateRange: '',
      searchText: ''
    });
    // Trigger filter application if the reset doesn't automatically fire valueChanges
    this.applyFilters();
  }

  /**
   * Refreshes all dashboard data.
   */
  refreshDashboard(): void {
    this.loggingService.info('[SupportDashboardComponent] Refreshing dashboard data.', undefined, 'SupportDashboard');
    this.loadDashboardData();
    this.notificationService.success('Dashboard actualizado correctamente.');
  }

  /**
   * Gets the color associated with a ticket status.
   * @param status The ticket status.
   * @returns The color string.
   */
  getStatusColor(status: TicketStatus): string {
    const option = this.statusOptions.find(opt => opt.value === status);
    return option?.color || 'gray';
  }

  /**
   * Gets the color associated with a ticket priority.
   * @param priority The ticket priority.
   * @returns The color string.
   */
  getPriorityColor(priority: TicketPriority): string {
    const option = this.priorityOptions.find(opt => opt.value === priority);
    return option?.color || 'gray';
  }

  /**
   * Gets the label for a ticket status.
   * @param status The ticket status.
   * @returns The human-readable label.
   */
  getStatusLabel(status: TicketStatus): string {
    const option = this.statusOptions.find(opt => opt.value === status);
    return option?.label || status;
  }

  /**
   * Gets the label for a ticket priority.
   * @param priority The ticket priority.
   * @returns The human-readable label.
   */
  getPriorityLabel(priority: TicketPriority): string {
    const option = this.priorityOptions.find(opt => opt.value === priority);
    return option?.label || priority;
  }

  /**
   * Gets the label for a ticket category.
   * @param category The ticket category.
   * @returns The human-readable label.
   */
  getCategoryLabel(category: TicketCategory): string {
    const option = this.categoryOptions.find(opt => opt.value === category);
    return option?.label || category;
  }

  /**
   * Navigates to the detail view of a specific ticket.
   * @param ticketId The ID of the ticket to view.
   */
  viewTicketDetail(ticketId: string): void {
    this.loggingService.info(`[SupportDashboardComponent] Navigating to ticket detail for ID: ${ticketId}`, undefined, 'SupportDashboard');
    // Example: Navigate using Angular Router
    this.router.navigate(['/support/tickets', ticketId]);
  }

  /**
   * Executes escalation rules for tickets.
   * This typically involves a backend call to trigger the escalation logic.
   */
  escalateTicket(): void {
    this.loggingService.info('[SupportDashboardComponent] Executing escalation rules for tickets.', undefined, 'SupportDashboard');
    this.slaConfigurationService.executeEscalationRules().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        this.loggingService.info('[SupportDashboardComponent] Escalation rules executed successfully. Refreshing dashboard.', result, 'SupportDashboard');
        this.notificationService.success(`Reglas de escalamiento ejecutadas correctamente. ${result.processed} tickets procesados, ${result.escalated} escalados.`);
        this.refreshDashboard(); // Refresh dashboard to show any changes due to escalation
      },
      error: (error: any) => {
        this.loggingService.error('[SupportDashboardComponent] Error executing escalation rules:', error, 'SupportDashboard');
        this.notificationService.error('Error al ejecutar reglas de escalamiento. Por favor, intente de nuevo.');
      }
    });
  }

  /**
   * Formats time in minutes into a human-readable string (min, h, d).
   * @param minutes Time in minutes.
   * @returns Formatted time string.
   */
  formatTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    } else if (minutes < 1440) { // Less than a day
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes > 0 ? remainingMinutes + 'min' : ''}`.trim();
    } else { // Days
      const days = Math.floor(minutes / 1440);
      const remainingHours = Math.floor((minutes % 1440) / 60);
      return `${days}d ${remainingHours > 0 ? remainingHours + 'h' : ''}`.trim();
    }
  }

  /**
   * Calculates the percentage for progress bars.
   * @param value The current value.
   * @param total The total value.
   * @returns The calculated percentage (rounded).
   */
  calculatePercentage(value: number, total: number): number {
    if (total === 0) {
      this.loggingService.warn('[SupportDashboardComponent] Attempted to calculate percentage with total 0. Returning 0.', { value, total }, 'SupportDashboard');
      return 0;
    }
    return Math.round((value / total) * 100);
  }
}
