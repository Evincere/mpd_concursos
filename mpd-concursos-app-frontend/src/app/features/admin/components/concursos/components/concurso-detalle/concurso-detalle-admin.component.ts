import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError, finalize, tap } from 'rxjs/operators'; // Added tap

// Custom Components
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomTabsComponent } from '@shared/components/custom-form/custom-tabs/custom-tabs.component';
import { CustomTabComponent } from '@shared/components/custom-form/custom-tabs/custom-tab.component';
import { CustomSpinnerComponent } from '@shared/components/custom-form/custom-spinner/custom-spinner.component';
import { CustomMenuComponent } from '@shared/components/custom-form/custom-menu/custom-menu.component';
import { CustomMenuItemComponent } from '@shared/components/custom-form/custom-menu/custom-menu-item.component';
import { CustomMenuTriggerDirective } from '@shared/components/custom-form/custom-menu/custom-menu-trigger.directive';

// Services
import { DialogService } from '@shared/services/dialog/dialog.service';
import { NotificationService } from '@shared/services/notification.service';
import { LoggingService } from '@core/services/logging/logging.service'; // Import LoggingService

import { AdminConcursosService } from '@core/services/admin/admin-concursos.service';
import { AdminContestDatesService } from '@core/services/admin/admin-contest-dates.service';
import { AdminContestRequirementsService } from '@core/services/admin/admin-contest-requirements.service';

import { Concurso, ContestStatus } from '@shared/interfaces/concurso/concurso.interface';
import { ContestDate } from '@shared/interfaces/concurso/contest-date.interface';
import { ContestRequirement } from '@core/services/admin/admin-contest-requirements.service';
import { ConcursoFormDialogComponent } from '../concurso-form-dialog/concurso-form-dialog.component';
// ConfirmDialogComponent is likely used via DialogService, not directly imported for template use
// import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ConcursoFechasComponent } from '../concurso-fechas/concurso-fechas.component';
import { ConcursoRequisitosComponent } from '../concurso-requisitos/concurso-requisitos.component';
import { ConcursoInscripcionesComponent } from '../concurso-inscripciones/concurso-inscripciones.component';

@Component({
  selector: 'app-concurso-detalle-admin',
  templateUrl: './concurso-detalle-admin.component.html',
  styleUrls: ['./concurso-detalle-admin.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CustomButtonComponent,
    CustomCardComponent,
    CustomTabsComponent,
    CustomTabComponent,
    CustomSpinnerComponent,
    CustomMenuComponent,
    CustomMenuItemComponent,
    CustomMenuTriggerDirective,
    ConcursoFechasComponent,
    ConcursoRequisitosComponent,
    ConcursoInscripcionesComponent
  ]
})
export class ConcursoDetalleAdminComponent implements OnInit, OnDestroy, AfterViewInit {
  concursoId!: number | string;
  concurso: Concurso | null = null;
  fechas: ContestDate[] = [];
  requisitos: ContestRequirement[] = [];

  isLoading = false;
  activeTab = 0; // Default active tab index

  statusOptions: { value: ContestStatus, label: string }[] = [
    { value: 'DRAFT', label: 'Borrador' },
    { value: 'SCHEDULED', label: 'Programado' },
    { value: 'ACTIVE', label: 'Activo' },
    { value: 'CLOSED', label: 'Cerrado' },
    { value: 'IN_EVALUATION', label: 'En Evaluación' },
    { value: 'CANCELLED', label: 'Cancelado' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    public router: Router, // Public for template access if needed
    private concursosService: AdminConcursosService,
    private fechasService: AdminContestDatesService,
    private requisitosService: AdminContestRequirementsService,
    private dialogService: DialogService,
    private notificationService: NotificationService,
    private loggingService: LoggingService // Inject LoggingService
  ) {}

  ngOnInit(): void {
    this.loggingService.info('[ConcursoDetalleAdminComponent] OnInit: Component initialized.', undefined, 'ConcursoDetalleAdmin');

    this.route.paramMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.concursoId = params.get('id') as string;
      if (this.concursoId) {
        this.loggingService.debug(`[ConcursoDetalleAdminComponent] Concurso ID obtained from route: ${this.concursoId}`, undefined, 'ConcursoDetalleAdmin');
        // Ensure scroll to top before loading content
        this.scrollToTop();
        this.loadConcurso(); // Load main contest data
      } else {
        this.loggingService.warn('🔍 [ConcursoDetalleAdmin] No contest ID found in route parameters. Redirecting to /admin/concursos.', undefined, 'ConcursoDetalleAdmin');
        this.router.navigate(['/admin/concursos']);
      }
    });
  }

  ngAfterViewInit(): void {
    this.loggingService.info('[ConcursoDetalleAdminComponent] AfterViewInit: View has been initialized.', undefined, 'ConcursoDetalleAdmin');
    // Execute scroll after the view is fully rendered to ensure it's effective
    setTimeout(() => {
      this.scrollToTop();
    }, 100);
  }

  ngOnDestroy(): void {
    this.loggingService.info('[ConcursoDetalleAdminComponent] OnDestroy: Component destroyed. Cleaning up subscriptions.', undefined, 'ConcursoDetalleAdmin');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Loads the main contest data using the ID from the route.
   */
  loadConcurso(): void {
    this.isLoading = true; // Set loading true for overall data fetch
    this.loggingService.info(`[ConcursoDetalleAdminComponent] Loading contest data for ID: ${this.concursoId}.`, undefined, 'ConcursoDetalleAdmin');

    this.concursosService.getConcursoById(this.concursoId)
      .pipe(
        takeUntil(this.destroy$),
        tap(concurso => {
          this.concurso = concurso;
          this.loggingService.debug('[ConcursoDetalleAdminComponent] Main contest data loaded successfully:', concurso, 'ConcursoDetalleAdmin');
        }),
        finalize(() => {
          // isLoading will be turned off after loadAdditionalData() completes
          // or if loadConcurso fails without additional data load
        })
      )
      .subscribe({
        next: () => {
          this.loadAdditionalData(); // Load related data after main contest is loaded
        },
        error: (error: unknown) => {
          this.loggingService.error(`[ConcursoDetalleAdminComponent] Error loading contest with ID ${this.concursoId}:`, error, 'ConcursoDetalleAdmin');
          this.notificationService.error('Error al cargar el concurso. Por favor, intente de nuevo.');
          this.isLoading = false; // Turn off loading here if additional data won't be loaded
        }
      });
  }

  /**
   * Loads additional data (dates and requirements) for the contest in parallel.
   */
  private loadAdditionalData(): void {
    this.loggingService.info(`[ConcursoDetalleAdminComponent] Loading additional data (dates and requirements) for contest ID: ${this.concursoId}.`, undefined, 'ConcursoDetalleAdmin');
    forkJoin({
      fechas: this.fechasService.getContestDates(this.concursoId).pipe(
        tap(dates => this.loggingService.debug('[ConcursoDetalleAdminComponent] Contest dates loaded:', dates, 'ConcursoDetalleAdmin')),
        catchError((error) => {
          this.loggingService.error(`[ConcursoDetalleAdminComponent] Error loading contest dates for ID ${this.concursoId}:`, error, 'ConcursoDetalleAdmin');
          this.notificationService.warning('Error al cargar las fechas del concurso.');
          return of([]); // Return empty array on error
        })
      ),
      requisitos: this.requisitosService.getContestRequirements(this.concursoId).pipe(
        tap(reqs => this.loggingService.debug('[ConcursoDetalleAdminComponent] Contest requirements loaded:', reqs, 'ConcursoDetalleAdmin')),
        catchError((error) => {
          this.loggingService.error(`[ConcursoDetalleAdminComponent] Error loading contest requirements for ID ${this.concursoId}:`, error, 'ConcursoDetalleAdmin');
          this.notificationService.warning('Error al cargar los requisitos del concurso.');
          return of([]); // Return empty array on error
        })
      )
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.isLoading = false; // Set loading to false once all parallel calls are done
        this.loggingService.info('[ConcursoDetalleAdminComponent] All contest data loading finalized.', undefined, 'ConcursoDetalleAdmin');
      })
    ).subscribe({
      next: (data) => {
        this.fechas = data.fechas;
        this.requisitos = data.requisitos;
        this.loggingService.info('[ConcursoDetalleAdminComponent] Additional contest data loaded successfully.', undefined, 'ConcursoDetalleAdmin');
      },
      error: (error) => {
        this.loggingService.error('[ConcursoDetalleAdminComponent] Unhandled error in loadAdditionalData forkJoin:', error, 'ConcursoDetalleAdmin');
        // Specific error handling for each observable in forkJoin should prevent this,
        // but included for robustness.
      }
    });
  }

  /**
   * Reloads only the dates for the current contest.
   * Useful when a child component modifies dates.
   */
  loadFechas(): void {
    if (!this.concursoId) {
      this.loggingService.warn('[ConcursoDetalleAdminComponent] Attempted to load dates without contest ID.', undefined, 'ConcursoDetalleAdmin');
      return;
    }
    this.loggingService.info(`[ConcursoDetalleAdminComponent] Reloading dates for contest ID: ${this.concursoId}.`, undefined, 'ConcursoDetalleAdmin');
    this.fechasService.getContestDates(this.concursoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (fechas: ContestDate[]) => {
          this.fechas = fechas;
          this.loggingService.debug('[ConcursoDetalleAdminComponent] Dates reloaded successfully.', fechas, 'ConcursoDetalleAdmin');
        },
        error: (error: unknown) => {
          this.loggingService.error(`[ConcursoDetalleAdminComponent] Error reloading dates for contest ID ${this.concursoId}:`, error, 'ConcursoDetalleAdmin');
          this.notificationService.error('Error al recargar las fechas del concurso.');
        }
      });
  }

  /**
   * Reloads only the requirements for the current contest.
   * Useful when a child component modifies requirements.
   */
  loadRequisitos(): void {
    if (!this.concursoId) {
      this.loggingService.warn('[ConcursoDetalleAdminComponent] Attempted to load requirements without contest ID.', undefined, 'ConcursoDetalleAdmin');
      return;
    }
    this.loggingService.info(`[ConcursoDetalleAdminComponent] Reloading requirements for contest ID: ${this.concursoId}.`, undefined, 'ConcursoDetalleAdmin');
    this.requisitosService.getContestRequirements(this.concursoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (requisitos: ContestRequirement[]) => {
          this.requisitos = requisitos;
          this.loggingService.debug('[ConcursoDetalleAdminComponent] Requirements reloaded successfully.', requisitos, 'ConcursoDetalleAdmin');
          // No need to set isLoading=false here as it's typically set by loadAdditionalData or parent loadConcurso
        },
        error: (error: unknown) => {
          this.loggingService.error(`[ConcursoDetalleAdminComponent] Error reloading requirements for contest ID ${this.concursoId}:`, error, 'ConcursoDetalleAdmin');
          this.notificationService.error('Error al recargar los requisitos del concurso.');
          // this.isLoading = false; // Only if this is the sole loading operation
        }
      });
  }

  /**
   * Opens a dialog to edit the current contest.
   */
  editConcurso(): void {
    this.loggingService.info('[ConcursoDetalleAdminComponent] Opening dialog to edit contest.', this.concurso, 'ConcursoDetalleAdmin');
    if (!this.concurso) {
      this.loggingService.warn('[ConcursoDetalleAdminComponent] No contest data available to edit.', undefined, 'ConcursoDetalleAdmin');
      this.notificationService.warning('No hay datos del concurso para editar.');
      return;
    }

    this.dialogService.open(ConcursoFormDialogComponent, {
      title: 'Editar Concurso',
      icon: 'edit',
      size: 'large',
      data: { mode: 'edit', concurso: this.concurso },
      panelClass: ['glassmorphism-dialog', 'concurso-form-dialog-container'],
      showCloseButton: true,
      showFooter: false, // Assuming the dialog handles its own footer buttons
      showCancelButton: false,
      showConfirmButton: false
    }).afterClosed$.subscribe((result: Concurso | false | undefined) => { // Result can be Concurso, false (cancelled), or undefined
      if (result && typeof result !== 'boolean') { // Check if result is a contest object, not just a boolean
        this.loadConcurso(); // Reload contest data after successful update
        this.notificationService.success('Concurso actualizado correctamente');
        this.loggingService.info('[ConcursoDetalleAdminComponent] Contest edit dialog closed successfully. Reloading data.', result, 'ConcursoDetalleAdmin');
      } else {
        this.loggingService.debug('[ConcursoDetalleAdminComponent] Contest edit dialog cancelled or closed without saving.', result, 'ConcursoDetalleAdmin');
      }
    });
  }

  /**
   * Deletes the current contest after user confirmation.
   */
  deleteConcurso(): void {
    this.loggingService.info('[ConcursoDetalleAdminComponent] Attempting to delete contest.', this.concurso, 'ConcursoDetalleAdmin');
    if (!this.concurso) {
      this.loggingService.warn('[ConcursoDetalleAdminComponent] No contest data available to delete.', undefined, 'ConcursoDetalleAdmin');
      this.notificationService.warning('No hay datos del concurso para eliminar.');
      return;
    }

    this.dialogService.confirm({
      title: 'Eliminar Concurso',
      message: `¿Está seguro que desea eliminar el concurso "${this.concurso.title}"? Esta acción es irreversible.`,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'warn',
      size: 'small'
    }).afterClosed$.subscribe((result: boolean) => {
      if (result) { // User confirmed deletion
        this.isLoading = true;
        this.loggingService.debug(`[ConcursoDetalleAdminComponent] User confirmed deletion for contest ID: ${this.concursoId}.`, undefined, 'ConcursoDetalleAdmin');
        this.concursosService.deleteConcurso(this.concursoId)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => this.isLoading = false) // Ensure loading is turned off
          )
          .subscribe({
            next: () => {
              this.notificationService.success('Concurso eliminado correctamente');
              this.loggingService.info(`[ConcursoDetalleAdminComponent] Contest ID: ${this.concursoId} deleted successfully. Navigating to contest list.`, undefined, 'ConcursoDetalleAdmin');
              this.router.navigate(['/admin/concursos']); // Navigate back to contest list
            },
            error: (error: unknown) => {
              this.loggingService.error(`[ConcursoDetalleAdminComponent] Error deleting contest ID ${this.concursoId}:`, error, 'ConcursoDetalleAdmin');
              this.notificationService.error('Error al eliminar el concurso. Por favor, intente de nuevo.');
            }
          });
      } else {
        this.loggingService.debug('[ConcursoDetalleAdminComponent] Contest deletion cancelled by user.', undefined, 'ConcursoDetalleAdmin');
      }
    });
  }

  /**
   * Changes the status of the current contest.
   * @param newStatus The new status to set.
   */
  changeStatus(newStatus: ContestStatus): void {
    this.loggingService.info(`[ConcursoDetalleAdminComponent] Attempting to change status for contest ID ${this.concursoId} to: ${newStatus}.`, undefined, 'ConcursoDetalleAdmin');
    if (!this.concurso) {
      this.loggingService.warn('[ConcursoDetalleAdminComponent] No contest data to change status.', undefined, 'ConcursoDetalleAdmin');
      this.notificationService.warning('No hay datos del concurso para cambiar el estado.');
      return;
    }
    if (this.concurso.status === newStatus) {
      this.loggingService.debug(`[ConcursoDetalleAdminComponent] Contest already in status: ${newStatus}. No change needed.`, undefined, 'ConcursoDetalleAdmin');
      this.notificationService.info(`El concurso ya se encuentra en estado "${this.getStatusLabel(newStatus)}".`);
      return;
    }

    this.isLoading = true; // Set loading true during status change operation
    this.concursosService.changeStatus(this.concursoId, newStatus)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false) // Ensure loading is turned off
      )
      .subscribe({
        next: () => {
          this.loadConcurso(); // Reload contest data to reflect new status
          this.notificationService.success(`Estado del concurso cambiado a "${this.getStatusLabel(newStatus)}" correctamente.`);
          this.loggingService.info(`[ConcursoDetalleAdminComponent] Status for contest ID ${this.concursoId} changed to ${newStatus} successfully.`, undefined, 'ConcursoDetalleAdmin');
        },
        error: (error: unknown) => {
          this.loggingService.error(`[ConcursoDetalleAdminComponent] Error changing status for contest ID ${this.concursoId}:`, error, 'ConcursoDetalleAdmin');
          this.notificationService.error('Error al cambiar el estado del concurso. Por favor, intente de nuevo.');
        }
      });
  }

  /**
   * Gets the human-readable label for a contest status.
   * @param status The ContestStatus value.
   * @returns The descriptive label.
   */
  getStatusLabel(status: ContestStatus): string {
    const statusOption = this.statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.label : status;
  }

  /**
   * Gets the CSS class associated with a contest status for styling.
   * @param status The ContestStatus value.
   * @returns The CSS class string.
   */
  getStatusClass(status: ContestStatus): string {
    switch (status) {
      case 'DRAFT': return 'status-draft';
      case 'SCHEDULED': return 'status-scheduled';
      case 'ACTIVE': return 'status-active';
      case 'CLOSED': return 'status-closed';
      case 'IN_EVALUATION': return 'status-in-evaluation';
      case 'CANCELLED': return 'status-cancelled';
      default: return '';
    }
  }

  /**
   * Formats a date string or Date object into a localized date string.
   * @param date The date to format.
   * @returns Formatted date string or 'Fecha inválida' if an error occurs.
   */
  formatDate(date: string | Date | undefined): string {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('es-ES'); // Specify locale for consistency
    } catch (error) {
      this.loggingService.warn(`[ConcursoDetalleAdminComponent] Error formatting date: ${date}`, error, 'ConcursoDetalleAdmin');
      return 'Fecha inválida';
    }
  }

  /**
   * Callback when contest dates are updated by a child component.
   * Triggers a reload of dates from the service.
   * @param _id Optional ID, not used in this context but common for event emitters.
   */
  onFechasUpdated(_id?: string): void {
    this.loggingService.info('[ConcursoDetalleAdminComponent] Dates updated event received from child. Reloading dates.', undefined, 'ConcursoDetalleAdmin');
    this.loadFechas();
  }

  /**
   * Callback when contest requirements are updated by a child component.
   * Triggers a reload of requirements from the service.
   * @param _id Optional ID, not used in this context but common for event emitters.
   */
  onRequisitosUpdated(_id?: string): void {
    this.loggingService.info('[ConcursoDetalleAdminComponent] Requirements updated event received from child. Reloading requirements.', undefined, 'ConcursoDetalleAdmin');
    this.loadRequisitos();
  }

  /**
   * Scrolls the view to the top of the page.
   * Addresses initial scroll position issues on navigation.
   */
  private scrollToTop(): void {
    this.loggingService.debug('[ConcursoDetalleAdminComponent] Attempting to scroll to top.', undefined, 'ConcursoDetalleAdmin');

    const forceScrollToTop = () => {
      // Scroll document body and html element to top
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      this.loggingService.debug('[ConcursoDetalleAdminComponent] Document and body scrolled to top.', undefined, 'ConcursoDetalleAdmin');

      // Reset scroll of specific admin layout elements
      const adminElements = document.querySelectorAll(
        '.admin-layout, .admin-content, .main-content, .router-outlet, ' +
        '.concurso-detalle-container, .content, .scrollable, ' +
        '[style*="overflow"], [style*="scroll"]' // Select elements with overflow/scroll styles
      );

      adminElements.forEach((element: Element) => {
        if (element instanceof HTMLElement) {
          if (element.scrollTop > 0 || element.scrollLeft > 0) {
            element.scrollTop = 0;
            element.scrollLeft = 0;
            this.loggingService.debug(`[ConcursoDetalleAdminComponent] Reset scroll for element: ${element.className || element.tagName}.`, undefined, 'ConcursoDetalleAdmin');
          }
        }
      });
    };

    // Execute immediately
    forceScrollToTop();

    // Execute after micro-delay to ensure DOM is ready
    setTimeout(forceScrollToTop, 0);

    // Execute after a longer delay for slow loading cases
    setTimeout(forceScrollToTop, 50);

    // Final verification after everything is rendered
    setTimeout(() => {
      forceScrollToTop();
      this.loggingService.debug('[ConcursoDetalleAdminComponent] Final scroll to top check completed.', undefined, 'ConcursoDetalleAdmin');
    }, 100); // Increased delay to ensure rendering is complete
  }

  /**
   * Sets the active tab by index.
   * @param tabIndex The index of the tab to activate.
   */
  setActiveTab(tabIndex: number): void {
    this.activeTab = tabIndex;
    this.loggingService.info(`[ConcursoDetalleAdminComponent] Active tab changed to index: ${tabIndex}.`, undefined, 'ConcursoDetalleAdmin');
    // Optionally trigger data reload for the new tab if data is not eagerly loaded
    // For example, if activeTab === 1 (Fechas), call loadFechas()
  }
}
