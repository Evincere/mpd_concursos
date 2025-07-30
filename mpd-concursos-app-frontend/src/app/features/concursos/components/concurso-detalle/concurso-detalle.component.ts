import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ViewChild, TemplateRef } from '@angular/core';
import { finalize, catchError, tap, switchMap, map } from 'rxjs/operators'; // Import tap and catchError
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
import { ContestDocumentService } from '@core/services/contest-document/contest-document.service';
import { ContestDocumentAvailability, ContestDocumentType } from '@shared/interfaces/concurso/contest-document.interface';

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
  @Input() userPostulation: any = null; // ✅ CRITICAL FIX: Recibir desde componente padre
  @Output() cerrarDetalle = new EventEmitter<void>();
  @Output() inscriptionComplete = new EventEmitter<Concurso>();
  @Output() continuarInscripcion = new EventEmitter<{ concurso: Concurso; userPostulation: any }>();

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

  // Contest document availability
  contestDocumentAvailability: ContestDocumentAvailability | null = null;
  loadingDocumentAvailability = false;

  constructor(
    private notificationService: NotificationService,
    private inscriptionService: InscriptionService,
    private loggingService: LoggingService,
    private contestDocumentService: ContestDocumentService
  ) {}

  ngOnInit(): void {
    this.loggingService.debug('[ConcursoDetalleComponent] Componente inicializado con concurso:', this.concurso, 'ConcursoDetalle');
    this.loggingService.debug('[ConcursoDetalleComponent] UserPostulation recibida:', this.userPostulation, 'ConcursoDetalle');

    if (this.concurso) {
      // ✅ CRITICAL FIX: Actualizar estado basado en userPostulation recibida
      this.actualizarEstadoInscripcion();

      // Load contest document availability
      this.loadContestDocumentAvailability();

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
   * ✅ CRITICAL FIX: Actualiza el estado de inscripción basado en userPostulation recibida
   * Ya no hace llamadas HTTP - usa la información del componente padre
   */
  private actualizarEstadoInscripcion(): void {
    if (this.userPostulation) {
      // Mapear el estado de la inscripción al enum
      const estado = this.mapStatusToState(this.userPostulation.estado);
      this.inscripcionState$.next(estado);
      this.loggingService.debug('[ConcursoDetalleComponent] Estado actualizado desde userPostulation:', estado, 'ConcursoDetalle');
    } else {
      this.inscripcionState$.next(InscripcionState.NO_INSCRIPTION);
      this.loggingService.debug('[ConcursoDetalleComponent] No hay inscripción - estado NO_INSCRIPTION', undefined, 'ConcursoDetalle');
    }
  }

  /**
   * ✅ CRITICAL FIX: Mapea el estado de string al enum InscripcionState
   */
  private mapStatusToState(status: string): InscripcionState {
    switch (status) {
      case 'ACTIVE': return InscripcionState.ACTIVE;
      case 'PENDING': return InscripcionState.PENDING;
      case 'COMPLETED_WITH_DOCS': return InscripcionState.COMPLETED_WITH_DOCS;
      case 'COMPLETED_PENDING_DOCS': return InscripcionState.COMPLETED_PENDING_DOCS;
      case 'FROZEN': return InscripcionState.FROZEN;
      case 'APPROVED': return InscripcionState.APPROVED;
      case 'REJECTED': return InscripcionState.REJECTED;
      case 'CANCELLED': return InscripcionState.CANCELLED;
      default: return InscripcionState.NO_INSCRIPTION;
    }
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
   * ✅ CRITICAL FIX: Ya no hace verificación HTTP - emite al padre para que actualice
   * @param concurso The contest data returned after successful inscription.
   */
  onInscriptionComplete(concurso: Concurso): void {
    this.loggingService.debug('[ConcursoDetalleComponent] Evento inscriptionComplete recibido. Emitiendo al padre...', concurso, 'ConcursoDetalle');
    this.inscriptionComplete.emit(concurso); // Emit to parent component
  }

  /**
   * ✅ CRITICAL FIX: Maneja el evento de continuar inscripción desde el modal de detalle
   * Implementa la misma lógica que ConcursosComponent para navegación correcta
   */
  onContinuarInscripcion(concurso: Concurso): void {
    if (!this.userPostulation || !this.userPostulation.id) {
      this.loggingService.error('[ConcursoDetalleComponent] No se puede continuar inscripción: falta información de postulación', { concurso, userPostulation: this.userPostulation }, 'ConcursoDetalle');
      this.notificationService.showError('Error: No se encontró información de la inscripción.');
      return;
    }

    // Emitir evento al componente padre para manejar la navegación
    this.continuarInscripcion.emit({ concurso, userPostulation: this.userPostulation });
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

  // ==========================================
  // MÉTODOS PARA DOCUMENTOS DE CONCURSO
  // ==========================================

  /**
   * Carga la disponibilidad de documentos del concurso
   */
  private loadContestDocumentAvailability(): void {
    if (!this.concurso?.id) {
      console.log('[ConcursoDetalle] No hay ID de concurso disponible');
      return;
    }

    const contestId = typeof this.concurso.id === 'string' ? parseInt(this.concurso.id) : this.concurso.id;
    console.log('[ConcursoDetalle] Cargando disponibilidad de documentos para concurso ID:', contestId);

    this.loadingDocumentAvailability = true;

    this.contestDocumentService.getDocumentAvailability(contestId).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.loadingDocumentAvailability = false;
      })
    ).subscribe({
      next: (availability: ContestDocumentAvailability) => {
        console.log('[ConcursoDetalle] Disponibilidad de documentos recibida:', availability);
        this.contestDocumentAvailability = availability;
        this.loggingService.debug('[ConcursoDetalle] Disponibilidad de documentos cargada:', availability, 'ConcursoDetalle');
      },
      error: (error) => {
        console.error('[ConcursoDetalle] Error al cargar disponibilidad de documentos:', error);
        console.error('[ConcursoDetalle] Detalles del error:', {
          status: error.status,
          message: error.message,
          url: error.url
        });

        // No mostrar error al usuario, simplemente no mostrar los botones
        this.contestDocumentAvailability = {
          contestId: contestId,
          basesAvailable: false,
          descriptionAvailable: false,
          message: 'Error al verificar disponibilidad'
        };
      }
    });
  }

  /**
   * Descarga las bases del concurso
   */
  downloadContestBases(): void {
    if (!this.concurso?.id || !this.contestDocumentAvailability?.basesAvailable) {
      this.notificationService.showWarning('Las bases del concurso no están disponibles para descarga.');
      return;
    }

    const contestId = typeof this.concurso.id === 'string' ? parseInt(this.concurso.id) : this.concurso.id;
    this.contestDocumentService.downloadDocument(contestId, ContestDocumentType.BASES);
    this.loggingService.debug('[ConcursoDetalle] Descargando bases del concurso', { contestId }, 'ConcursoDetalle');
  }

  /**
   * Descarga la descripción del puesto
   */
  downloadContestDescription(): void {
    if (!this.concurso?.id || !this.contestDocumentAvailability?.descriptionAvailable) {
      this.notificationService.showWarning('La descripción del puesto no está disponible para descarga.');
      return;
    }

    const contestId = typeof this.concurso.id === 'string' ? parseInt(this.concurso.id) : this.concurso.id;
    this.contestDocumentService.downloadDocument(contestId, ContestDocumentType.DESCRIPTION);
    this.loggingService.debug('[ConcursoDetalle] Descargando descripción del puesto', { contestId }, 'ConcursoDetalle');
  }

  /**
   * Verifica si hay documentos disponibles para mostrar
   */
  get hasAvailableDocuments(): boolean {
    return this.contestDocumentAvailability?.basesAvailable ||
           this.contestDocumentAvailability?.descriptionAvailable ||
           false;
  }

  /**
   * Obtiene el mensaje a mostrar cuando no hay documentos disponibles
   */
  get documentsNotAvailableMessage(): string {
    if (this.loadingDocumentAvailability) {
      return 'Verificando disponibilidad de documentos...';
    }

    if (!this.contestDocumentAvailability) {
      return 'No se pudo verificar la disponibilidad de los documentos.';
    }

    return 'Los documentos del concurso aún no se han publicado.';
  }
}
