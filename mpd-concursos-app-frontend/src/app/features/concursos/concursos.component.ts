import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

import { trigger, transition, style, animate } from '@angular/animations';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Concurso } from '@shared/interfaces/concurso/concurso.interface';
import { SearchHeaderComponent } from '@shared/components/search-header/search-header.component';
import { FiltrosPanelComponent } from './components/filtros-panel/filtros-panel.component';
import { ConcursoDetalleComponent } from './components/concurso-detalle/concurso-detalle.component';
import { LoaderComponent } from '@shared/components/loader/loader.component';
import { InscripcionButtonComponent } from './components/inscripcion/inscripcion-button/inscripcion-button.component';
import { ConcursoCardComponent } from './components/concurso-card/concurso-card.component';
import { FiltersConcurso } from '@shared/interfaces/filters/filters-concurso.interface';
import { ConcursosService } from '@core/services/concursos/concursos.service';
import { FiltersService } from '@core/services/filters/filters.service';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { InscriptionStateService } from '@core/services/inscripcion/inscription-state.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { translateContestStatus } from '@shared/utils/state-translations.util';
import { LoggingService } from '@core/services/logging/logging.service'; // Assuming LoggingService exists

@Component({
  selector: 'app-concursos',
  templateUrl: './concursos.component.html',
  styleUrls: ['./concursos.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    InscripcionButtonComponent,
    SearchHeaderComponent,
    FiltrosPanelComponent,
    ConcursoDetalleComponent,
    LoaderComponent,
    ConcursoCardComponent,
    CustomButtonComponent
  ],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)' }),
        animate('300ms ease-out', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(-100%)' }))
      ])
    ])
  ]
})
export class ConcursosComponent implements OnInit, OnDestroy {
  concursos: Concurso[] = []; // Concursos actualmente mostrados (filtrados y buscados)
  loading = false;
  error: HttpErrorResponse | null = null;
  concursoSeleccionado: Concurso | null = null;
  mostrarFiltros = false;
  filtrosActivos = false;
  filtros: FiltersConcurso = {
    estado: 'todos',
    dependencia: 'todos',
    cargo: 'todos',
    periodo: 'todos'
  };
  concursosSinFiltrar: Concurso[] = []; // Copia original de todos los concursos
  searchTerm = '';
  primeraConsulta = true;
  private destroy$ = new Subject<void>();

  constructor(
    private concursosService: ConcursosService,
    private filtersService: FiltersService,
    private inscriptionService: InscriptionService,
    private inscriptionStateService: InscriptionStateService,
    private router: Router,
    private route: ActivatedRoute,
    private notification: CustomNotificationService,
    private loggingService: LoggingService
  ) {}

  ngOnInit(): void {
    this.cargarConcursos();

    // Suscribirse a los cambios en los parámetros de la URL
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params: Record<string, string>) => {
        this.loggingService.debug('[ConcursosComponent] Query params changed:', params, 'Concursos');

        let concursoId = params['id']; // Prefer id from URL path, then query params
        if (!concursoId && params['contestId']) {
          concursoId = params['contestId'];
          this.loggingService.debug(`[ConcursosComponent] Using contestId from queryParams: ${concursoId}`, undefined, 'Concursos');
        }

        // Si hay un ID de concurso en la URL, seleccionarlo para mostrar el detalle
        if (concursoId) {
          this.seleccionarConcursoPorId(parseInt(concursoId, 10));
        }

        // Si hay parámetros para continuar una inscripción, procesarlos
        if (params['continueInscription'] === 'true' && params['inscriptionId'] && concursoId) {
          this.loggingService.debug(`[ConcursosComponent] Attempting to continue inscription for contest ${concursoId} and inscription ${params['inscriptionId']}`, undefined, 'Concursos');
          // Navegar al proceso de inscripción
          this.router.navigate(['/dashboard/inscripcion'], {
            queryParams: {
              contestId: concursoId,
              inscriptionId: params['inscriptionId']
            }
          });
          this.notification.info('Continuando con la inscripción...');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga la lista completa de concursos y aplica los filtros iniciales.
   */
  cargarConcursos(): void {
    this.loading = true;
    this.error = null; // Clear previous errors
    console.log('[ConcursosComponent] Starting to load contests...');
    this.concursosService.getConcursos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (concursos: Concurso[]) => {
          console.log(`[ConcursosComponent] Concursos loaded: ${concursos.length}`, concursos);
          this.loggingService.debug(`[ConcursosComponent] Concursos loaded: ${concursos.length}`, undefined, 'Concursos');
          this.concursosSinFiltrar = concursos; // Store the original list

          // Get current filters from the service and apply them
          this.filtersService.getFiltros()
            .pipe(takeUntil(this.destroy$))
            .subscribe((filtros: FiltersConcurso) => {
              this.loggingService.debug('[ConcursosComponent] Applying initial filters:', filtros, 'Concursos');
              this.filtros = filtros; // Update component's filters
              this._applyAllFilters(); // Apply all filters including search term
            });

          this.loading = false;
          this.primeraConsulta = false;
          console.log(`[ConcursosComponent] Final state - loading: ${this.loading}, error: ${this.error}, concursos.length: ${this.concursos.length}`);
        },
        error: (error: HttpErrorResponse) => {
          console.error('[ConcursosComponent] Error al cargar los concursos:', error);
          this.error = error;
          this.loading = false;
          this.notification.error('Error al cargar los concursos. Por favor, inténtelo nuevamente.');
        }
      });
  }

  /**
   * Maneja el evento de búsqueda, actualizando el término de búsqueda y aplicando los filtros.
   * @param event El evento de búsqueda, puede ser una cadena o un objeto con `target.value`.
   */
  onSearch(event: any): void {
    const term = typeof event === 'string' ? event :
      (event && event.target && event.target.value ? event.target.value : '');

    this.searchTerm = term;
    this._applyAllFilters();
  }

  /**
   * Maneja la aplicación de filtros desde el panel de filtros.
   * @param newFilters Los nuevos filtros a aplicar.
   */
  onApplyFilters(newFilters: FiltersConcurso): void {
    this.loggingService.debug('[ConcursosComponent] Applying filters:', newFilters, 'Concursos');
    this.filtros = newFilters; // Update component's filters
    this._applyAllFilters(); // Re-apply all filters
    this.mostrarFiltros = false; // Close filter panel after applying
  }

  /**
   * Aplica todos los filtros (estado, dependencia, cargo, periodo) y el término de búsqueda
   * a la lista original de concursos (`concursosSinFiltrar`).
   */
  private _applyAllFilters(): void {
    let concursosFiltrados = [...this.concursosSinFiltrar]; // Start with the full list

    this.filtrosActivos = this.hayFiltrosActivos(this.filtros) || Boolean(this.searchTerm?.trim());
    this.primeraConsulta = false; // No longer the first query after filters are applied

    this.loggingService.debug('[ConcursosComponent] Applying filters and search...', { filters: this.filtros, searchTerm: this.searchTerm }, 'Concursos');

    concursosFiltrados = concursosFiltrados.filter(concurso => {
      let cumpleFiltros = true;

      // Filter by status
      if (this.filtros.estado !== 'todos') {
        cumpleFiltros = concurso.status?.toLowerCase() === this.filtros.estado.toLowerCase();
      }

      // Rest of the filters only if the status already matches
      if (cumpleFiltros) {
        if (this.filtros.dependencia !== 'todos') {
          cumpleFiltros = (concurso.dependencia?.toLowerCase() || '') === this.filtros.dependencia.toLowerCase();
        }

        if (cumpleFiltros && this.filtros.cargo !== 'todos') {
          cumpleFiltros = (concurso.position?.toLowerCase() || '').includes(this.filtros.cargo.toLowerCase());
        }

        if (cumpleFiltros && this.filtros.periodo !== 'todos') {
          const fechas = this.obtenerFechasPeriodo(this.filtros.periodo);
          if (fechas) {
            const fechaConcurso = new Date(concurso.startDate);
            cumpleFiltros = fechaConcurso >= fechas.fechaInicio && fechaConcurso <= fechas.fechaFin;
          }
        }
      }

      // Apply search term
      if (cumpleFiltros && this.searchTerm?.trim()) {
        const searchTermLower = this.searchTerm.toLowerCase();
        cumpleFiltros = (concurso.title?.toLowerCase().includes(searchTermLower) || false) ||
                        (concurso.position?.toLowerCase().includes(searchTermLower) || false) ||
                        (concurso.dependencia?.toLowerCase().includes(searchTermLower) || false) ||
                        (concurso.description?.toLowerCase().includes(searchTermLower) || false);
      }

      return cumpleFiltros;
    });

    this.concursos = concursosFiltrados;
    console.log(`[ConcursosComponent] Filtered contests: ${this.concursos.length}`, this.concursos);
    this.loggingService.debug(`[ConcursosComponent] Filtered contests: ${this.concursos.length}`, undefined, 'Concursos');
  }

  /**
   * Muestra u oculta el panel de filtros.
   */
  toggleFiltros(): void {
    this.mostrarFiltros = !this.mostrarFiltros;
  }

  /**
   * Limpia el término de búsqueda y recarga todos los concursos aplicando los filtros actuales.
   */
  clearSearch(): void {
    this.searchTerm = '';
    this._applyAllFilters(); // Re-apply filters without the search term
  }

  /**
   * Traduce el estado de un concurso para mostrar en la UI.
   * @param status El estado del concurso.
   * @returns El estado traducido.
   */
  getEstadoConcursoLabel(status: string): string {
    return translateContestStatus(status);
  }

  /**
   * Intenta recargar los concursos si hubo un error.
   */
  retryLoad(): void {
    this.error = null;
    this.loading = true;
    this.cargarConcursos();
  }

  /**
   * Inicia el proceso de inscripción para un concurso dado.
   * Crea una nueva inscripción y navega a la página de inscripción.
   * @param concurso El concurso para el cual se iniciará la inscripción.
   */
  onInscriptionComplete(concurso: Concurso): void {
    this.loggingService.debug('[ConcursosComponent] Initiating inscription process for contest:', concurso.id, 'Concursos');

    // CRITICAL FIX: Navigate directly to inscription process without creating inscription
    // The inscription will be created only after user accepts terms and conditions
    this.router.navigate(['/dashboard/inscripcion'], {
      queryParams: {
        contestId: concurso.id
        // No inscriptionId - will be created after terms acceptance
      }
    });
  }

  /**
   * Método para cuando realmente se complete una inscripción (llamado desde otros lugares).
   * @param concurso El concurso al que se ha inscrito el usuario.
   */
  onInscriptionReallyComplete(concurso: Concurso): void {
    this.loggingService.debug(`[ConcursosComponent] Inscription completed for contest: ${concurso.title}`, undefined, 'Concursos');

    // Update the list of contests after a successful inscription
    // Add a small delay to allow the backend state to update
    setTimeout(() => {
      this.cargarConcursos();
    }, 1000);

    this.notification.success(`Te has inscrito exitosamente al concurso "${concurso.title}"`);

    // If the contest is selected, update its detail view
    if (this.concursoSeleccionado?.id === concurso.id) {
      this.concursoSeleccionado = { ...concurso };
    }
  }

  /**
   * Muestra el detalle de un concurso.
   * @param concurso El concurso a mostrar.
   * @param event Evento del ratón (opcional, para evitar propagación).
   */
  verDetalle(concurso: Concurso, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.concursoSeleccionado = concurso;
  }

  /**
   * Cierra el panel de detalle del concurso.
   */
  cerrarDetalle(): void {
    this.concursoSeleccionado = null;
  }

  /**
   * Obtiene las fechas de inicio y fin para un período de tiempo dado.
   * @param periodo El período (ej. 'hoy', 'semana', 'mes').
   * @returns Un objeto con `fechaInicio` y `fechaFin`, o `null` si 'todos'.
   */
  private obtenerFechasPeriodo(periodo: string): { fechaInicio: Date, fechaFin: Date } | null {
    if (periodo === 'todos') return null;

    const hoy = new Date();
    let fechaInicio: Date;
    let fechaFin: Date;

    switch (periodo) {
      case 'hoy':
        fechaInicio = new Date(hoy);
        fechaFin = new Date(hoy);
        fechaInicio.setHours(0, 0, 0, 0);
        fechaFin.setHours(23, 59, 59, 999);
        break;
      case 'semana': {
        fechaInicio = new Date(hoy);
        const diaSemana = hoy.getDay(); // 0 for Sunday, 1 for Monday, etc.
        fechaInicio.setDate(hoy.getDate() - diaSemana); // Go to the start of the week (Sunday)
        fechaInicio.setHours(0, 0, 0, 0);
        fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaInicio.getDate() + 6); // End of the week (Saturday)
        fechaFin.setHours(23, 59, 59, 999);
        break;
      }
      case 'mes': {
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0); // Last day of the current month
        fechaFin.setHours(23, 59, 59, 999);
        break;
      }
      case 'trimestre': {
        const trimestre = Math.floor(hoy.getMonth() / 3);
        fechaInicio = new Date(hoy.getFullYear(), trimestre * 3, 1);
        fechaFin = new Date(hoy.getFullYear(), (trimestre + 1) * 3, 0);
        fechaFin.setHours(23, 59, 59, 999);
        break;
      }
      case 'anio': {
        fechaInicio = new Date(hoy.getFullYear(), 0, 1);
        fechaFin = new Date(hoy.getFullYear(), 11, 31);
        fechaFin.setHours(23, 59, 59, 999);
        break;
      }
      default:
        return null;
    }

    return { fechaInicio, fechaFin };
  }

  /**
   * Verifica si hay filtros activos (diferentes de 'todos') en el objeto de filtros.
   * @param filtros El objeto de filtros a verificar.
   * @returns `true` si hay al menos un filtro activo, `false` en caso contrario.
   */
  private hayFiltrosActivos(filtros: FiltersConcurso): boolean {
    return Object.values(filtros).some(value => value !== 'todos');
  }

  /**
   * Verifica si hay filtros aplicados (incluyendo término de búsqueda).
   * Se usa para mostrar el botón "Limpiar Filtros".
   * @returns `true` si hay filtros o término de búsqueda activo, `false` en caso contrario.
   */
  hayFiltrosAplicados(): boolean {
    if (this.primeraConsulta) {
      return false; // No show "clear filters" on first load
    }
    return this.hayFiltrosActivos(this.filtros) || Boolean(this.searchTerm?.trim());
  }

  /**
   * Limpia todos los filtros y el término de búsqueda, luego recarga los concursos.
   */
  limpiarFiltros(): void {
    this.searchTerm = '';
    this.filtrosActivos = false;
    this.filtros = {
      estado: 'todos',
      dependencia: 'todos',
      cargo: 'todos',
      periodo: 'todos'
    };
    this._applyAllFilters(); // Apply empty filters
    this.filtersService.actualizarFiltros(this.filtros); // Also update the filters service
    this.notification.info('Filtros y búsqueda limpiados.');
  }

  /**
   * Selecciona un concurso por su ID y muestra su detalle.
   * @param id ID del concurso a seleccionar.
   */
  seleccionarConcursoPorId(id: number): void {
    this.loggingService.debug(`[ConcursosComponent] Attempting to select contest by ID: ${id}`, undefined, 'Concursos');
    const concurso = this.concursosSinFiltrar.find(c => c.id === id);
    if (concurso) {
      this.loggingService.debug(`[ConcursosComponent] Contest found: ${concurso.title}`, undefined, 'Concursos');
      this.verDetalle(concurso);
      this.loggingService.debug('[ConcursosComponent] Detail panel opened for contest.', undefined, 'Concursos');
    } else {
      this.loggingService.warn(`[ConcursosComponent] Contest with ID ${id} not found in the list.`, undefined, 'Concursos');
      this.notification.warning(`No se encontró el concurso con ID ${id}.`);
    }
  }

  // Métodos wrapper temporales para resolver problemas de TypeScript
  private createInscriptionWrapper(contestId: string | number): Observable<any> {
    // TODO: Usar this.inscriptionService.createInscription cuando TypeScript lo reconozca
    // Por ahora, usar casting para acceder al método
    return (this.inscriptionService as any).createInscription(contestId);
  }

  private refreshInscriptionsWrapper(): void {
    // TODO: Usar this.inscriptionService.refreshInscriptions cuando TypeScript lo reconozca
    // Por ahora, usar casting para acceder al método
    (this.inscriptionService as any).refreshInscriptions();
  }

  // Métodos para el template
  onFilter(): void {
    // Método para manejar el evento de filtro - alternar panel de filtros
    this.toggleFiltros();
  }

  aplicarFiltros(event?: any): void {
    if (event) {
      this.filtros = { ...this.filtros, ...event };
    }
    this._applyAllFilters();
  }
}
