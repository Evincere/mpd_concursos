import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ViewChild, TemplateRef } from '@angular/core';
import { finalize, catchError, tap } from 'rxjs/operators'; // Import tap and catchError
import { Concurso, Contest } from '@shared/interfaces/concurso/concurso.interface';
import { CommonModule, DatePipe } from '@angular/common'; // Import DatePipe
import { Subject, BehaviorSubject, of } from 'rxjs'; // Import of
import { takeUntil } from 'rxjs/operators';
import { InscripcionButtonComponent } from '../inscripcion/inscripcion-button/inscripcion-button.component';
import { ContestStatusBadgeComponent } from '@shared/components/contest-status-badge/contest-status-badge.component';
import { ContestDate } from '@shared/interfaces/concurso/contest-date.interface';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { CustomTabsComponent, TabItem } from '@shared/components/custom-tabs/custom-tabs.component';
import { CustomIconButtonComponent } from '@shared/components/custom-icon-button/custom-icon-button.component';
import { CustomButtonComponent } from '@shared/components/custom-button/custom-button.component';

import { NotificationService } from '@core/services/notification/notification.service';
import { translateContestStatus } from '@shared/utils/state-translations.util';
import { LoggingService } from '@core/services/logging/logging.service'; // Import LoggingService

@Component({
  selector: 'app-concurso-detalle',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    InscripcionButtonComponent,
    ContestStatusBadgeComponent,
    CustomTabsComponent,
    CustomIconButtonComponent,
    CustomButtonComponent
  ],
  templateUrl: './concurso-detalle.component.html',
  styleUrls: ['./concurso-detalle.component.scss']
})
export class ConcursoDetalleComponent implements OnInit, OnDestroy {
  @Input() concurso!: Contest;
  @Output() cerrarDetalle = new EventEmitter<void>();
  @Output() inscriptionComplete = new EventEmitter<Concurso>();

  @ViewChild('infoGeneralTemplate', { static: true }) infoGeneralTemplate!: TemplateRef<any>;
  @ViewChild('documentacionTemplate', { static: true }) documentacionTemplate!: TemplateRef<any>;
  @ViewChild('fechasTemplate', { static: true }) fechasTemplate!: TemplateRef<any>;

  closing = false;
  inscripcionLoading = false;
  inscripcionState$ = new BehaviorSubject<InscripcionState>(InscripcionState.ACTIVE); // Default state
  InscripcionState = InscripcionState; // Expose enum to template
  private destroy$ = new Subject<void>();

  // Tab management
  tabItems: TabItem[] = [];
  activeTabIndex = 0;

  constructor(
    private notificationService: NotificationService,
    private inscriptionService: InscriptionService,
    private loggingService: LoggingService
  ) {}

  ngOnInit(): void {
    this.loggingService.debug('[ConcursoDetalleComponent] Componente inicializado con concurso:', this.concurso, 'ConcursoDetalle');

    if (this.concurso) {
      this.verificarInscripcion();
      // Initialize temporary URLs for documents if they don't exist
      if (!this.concurso.basesUrl) {
        this.concurso.basesUrl = '#'; // Temporary URL
        this.loggingService.debug('[ConcursoDetalleComponent] basesUrl no definida. Estableciendo URL temporal.', undefined, 'ConcursoDetalle');
      }
      if (!this.concurso.descriptionUrl) {
        this.concurso.descriptionUrl = '#'; // Temporary URL
        this.loggingService.debug('[ConcursoDetalleComponent] descriptionUrl no definida. Estableciendo URL temporal.', undefined, 'ConcursoDetalle');
      }

      // Initialize dates if they don't exist
      if (!this.concurso.dates || this.concurso.dates.length === 0) {
        this.concurso.dates = this.getDefaultDates();
        this.loggingService.debug('[ConcursoDetalleComponent] Fechas no definidas. Estableciendo fechas predeterminadas.', undefined, 'ConcursoDetalle');
      }

      // Initialize tabs
      this.initializeTabs();
    }
  }

  /**
   * Initializes the tab items with their labels, icons, and corresponding templates.
   */
  private initializeTabs(): void {
    this.tabItems = [
      {
        id: 'info-general',
        label: 'Información General',
        icon: 'info-circle',
        template: this.infoGeneralTemplate
      },
      {
        id: 'documentacion',
        label: 'Documentación',
        icon: 'file-alt',
        template: this.documentacionTemplate
      },
      {
        id: 'fechas',
        label: 'Fechas',
        icon: 'calendar-alt',
        template: this.fechasTemplate
      }
    ];
    this.loggingService.debug('[ConcursoDetalleComponent] Pestañas inicializadas.', undefined, 'ConcursoDetalle');
  }

  /**
   * Handles the tab change event, updating the active tab index.
   * @param index The index of the newly selected tab.
   */
  onTabChange(index: number): void {
    this.activeTabIndex = index;
    this.loggingService.debug(`[ConcursoDetalleComponent] Pestaña cambiada a índice: ${index}`, undefined, 'ConcursoDetalle');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.loggingService.debug('[ConcursoDetalleComponent] Componente destruido. Suscripciones limpiadas.', undefined, 'ConcursoDetalle');
  }

  /**
   * Verifies the inscription status for the current contest.
   * Updates `inscripcionState$` and `inscripcionLoading`.
   */
  verificarInscripcion(): void {
    if (!this.concurso) {
      this.loggingService.warn('[ConcursoDetalleComponent] No hay concurso para verificar inscripción.', undefined, 'ConcursoDetalle');
      return;
    }

    this.inscripcionLoading = true;
    // Ensure contest ID is a number
    const concursoId = typeof this.concurso.id === 'string' ? parseInt(this.concurso.id, 10) : this.concurso.id;

    this.loggingService.debug(`[ConcursoDetalleComponent] Verificando estado de inscripción para concurso ID: ${concursoId}`, undefined, 'ConcursoDetalle');

    this.inscriptionService.getInscriptionStatus(concursoId)
      .pipe(
        takeUntil(this.destroy$),
        tap((status: InscripcionState) => {
          this.loggingService.debug(`[ConcursoDetalleComponent] Estado de inscripción recibido: ${status}`, undefined, 'ConcursoDetalle');
          this.inscripcionState$.next(status);
        }),
        finalize(() => {
          this.inscripcionLoading = false;
          this.loggingService.debug('[ConcursoDetalleComponent] Verificación de inscripción finalizada.', undefined, 'ConcursoDetalle');
        }),
        catchError((error: Error) => {
          console.error('[ConcursoDetalleComponent] Error al verificar inscripción:', error);
          this.inscripcionState$.next(InscripcionState.ACTIVE); // Fallback to 'ACTIVE' state on error
          this.notificationService.showError('No se pudo verificar el estado de su inscripción. Por favor, intente nuevamente.');
          return of(InscripcionState.ACTIVE); // Return an observable of a default state to continue the stream
        })
      ).subscribe(); // Subscribe to trigger the observable
  }

  /**
   * Translates the contest status for display.
   * @param status The raw status string.
   * @returns The translated status string.
   */
  getEstadoConcursoLabel(status: string): string {
    return translateContestStatus(status);
  }

  /**
   * Emits the `cerrarDetalle` event after a short delay for animation.
   */
  onCerrar(): void {
    this.loggingService.debug('[ConcursoDetalleComponent] Solicitando cierre del detalle del concurso.', undefined, 'ConcursoDetalle');
    this.closing = true;
    setTimeout(() => {
      this.cerrarDetalle.emit();
      this.loggingService.debug('[ConcursoDetalleComponent] Detalle del concurso cerrado.', undefined, 'ConcursoDetalle');
    }, 300); // Match this with any CSS animation duration for closing
  }

  /**
   * Handles the `inscriptionComplete` event from the inscription button.
   * Re-verifies inscription status and emits to parent.
   * @param concurso The contest data returned after successful inscription.
   */
  onInscriptionComplete(concurso: Concurso): void {
    this.loggingService.debug('[ConcursoDetalleComponent] Evento inscriptionComplete recibido. Re-verificando inscripción...', concurso, 'ConcursoDetalle');
    this.verificarInscripcion(); // Re-check status after inscription
    this.inscriptionComplete.emit(concurso); // Emit to parent component
  }

  /**
   * Provides default dates for a contest if none are available.
   * @returns An array of default ContestDate objects.
   */
  private getDefaultDates(): ContestDate[] {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 15); // Example: 15 days from now

    const resultsStartDate = new Date(endDate);
    resultsStartDate.setDate(endDate.getDate() + 10);

    const resultsEndDate = new Date(resultsStartDate);
    resultsEndDate.setDate(resultsStartDate.getDate() + 5);

    return [
      {
        label: 'Fecha de Inscripción',
        startDate: today, // Use Date objects directly
        endDate: endDate, // Use Date objects directly
        type: 'inscription'
      },
      {
        label: 'Publicación de Resultados',
        startDate: resultsStartDate,
        endDate: resultsEndDate,
        type: 'results'
      }
    ];
  }
}
