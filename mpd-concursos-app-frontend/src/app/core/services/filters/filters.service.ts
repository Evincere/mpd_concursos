import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IFiltersService } from '../../../shared/interfaces/services/filters-service.interface';
import { FiltersConcurso } from '../../../shared/interfaces/filters/filters-concurso.interface';
import { LoggingService } from '@core/services/logging/logging.service'; // Import LoggingService

@Injectable({
  providedIn: 'root'
})
export class FiltersService implements IFiltersService {
  private filtrosIniciales: FiltersConcurso = {
    estado: 'todos',
    periodo: 'todos',
    dependencia: 'todos',
    cargo: 'todos'
  };

  private filtrosSubject = new BehaviorSubject<FiltersConcurso>(this.filtrosIniciales);

  constructor(
    private loggingService: LoggingService // Inject LoggingService
  ) {
    this.loggingService.debug('[FiltersService] Initializing FiltersService with initial filters.', this.filtrosIniciales, 'FiltersService');
  }

  /**
   * Returns an observable of the current filters.
   * @returns Observable of FiltersConcurso.
   */
  getFiltros(): Observable<FiltersConcurso> {
    this.loggingService.debug('[FiltersService] getFiltros() called. Returning filters observable.', undefined, 'FiltersService');
    return this.filtrosSubject.asObservable();
  }

  /**
   * Updates the current filters with new partial filter values.
   * @param filtros Partial object of FiltersConcurso with values to update.
   */
  actualizarFiltros(filtros: Partial<FiltersConcurso>): void {
    const currentFiltros = this.filtrosSubject.value;
    const newFiltros = { ...currentFiltros, ...filtros };
    this.loggingService.info('[FiltersService] Updating filters.', { oldFilters: currentFiltros, newFilters: newFiltros }, 'FiltersService');
    this.filtrosSubject.next(newFiltros);
  }

  /**
   * Resets all filters to their initial state.
   */
  limpiarFiltros(): void {
    this.loggingService.info('[FiltersService] Clearing all filters. Resetting to initial state.', this.filtrosIniciales, 'FiltersService');
    this.filtrosSubject.next(this.filtrosIniciales);
  }

  /**
   * Applies the current filters to a list of contests.
   * @param concursos List of contests to filter.
   * @returns List of filtered contests.
   */
  aplicarFiltros<T extends { status?: string; dependencia?: string; cargo?: string; fecha?: string | Date }>(concursos: T[]): T[] {
    const filtrosActuales = this.filtrosSubject.value;
    this.loggingService.debug('[FiltersService] Applying filters to contests.', { filters: filtrosActuales, totalConcursos: concursos.length }, 'FiltersService');

    const filteredConcursos = concursos.filter(concurso => {
      let cumpleFiltros = true; // Assume it meets the filters initially

      // Filter by status
      if (filtrosActuales.estado !== 'todos' && concurso.status) {
        cumpleFiltros = cumpleFiltros && concurso.status === filtrosActuales.estado;
        this.loggingService.debug(`[FiltersService] Filtering by status "${filtrosActuales.estado}". Concurso status: "${concurso.status}". Match: ${cumpleFiltros}`, undefined, 'FiltersService');
      }

      // Filter by period
      if (filtrosActuales.periodo !== 'todos') {
        const meetsPeriod = this.cumplePeriodo(concurso, filtrosActuales.periodo);
        cumpleFiltros = cumpleFiltros && meetsPeriod;
        this.loggingService.debug(`[FiltersService] Filtering by period "${filtrosActuales.periodo}". Match: ${meetsPeriod}. Overall match: ${cumpleFiltros}`, undefined, 'FiltersService');
      }

      // Filter by dependencia (dependency)
      if (filtrosActuales.dependencia !== 'todos' && concurso.dependencia) {
        cumpleFiltros = cumpleFiltros && concurso.dependencia === filtrosActuales.dependencia;
        this.loggingService.debug(`[FiltersService] Filtering by dependencia "${filtrosActuales.dependencia}". Concurso dependencia: "${concurso.dependencia}". Match: ${cumpleFiltros}`, undefined, 'FiltersService');
      }

      // Filter by cargo (position/role)
      if (filtrosActuales.cargo !== 'todos' && concurso.cargo) {
        cumpleFiltros = cumpleFiltros && concurso.cargo === filtrosActuales.cargo;
        this.loggingService.debug(`[FiltersService] Filtering by cargo "${filtrosActuales.cargo}". Concurso cargo: "${concurso.cargo}". Match: ${cumpleFiltros}`, undefined, 'FiltersService');
      }

      return cumpleFiltros;
    });

    this.loggingService.info(`[FiltersService] Filtered ${filteredConcursos.length} out of ${concursos.length} contests.`, filteredConcursos, 'FiltersService');
    return filteredConcursos;
  }

  /**
   * Checks if a contest meets the period filter.
   * @param concurso Contest to check.
   * @param periodo Period to check against (e.g., 'hoy', 'semana', 'mes').
   * @returns true if the contest meets the period, false otherwise.
   */
  private cumplePeriodo<T extends { fecha?: string | Date }>(concurso: T, periodo: string): boolean {
    if (!concurso.fecha) {
      this.loggingService.warn('[FiltersService] Contest has no date property. Cannot apply period filter. Returning false.', concurso, 'FiltersService');
      return false;
    }

    const fechaConcurso = new Date(concurso.fecha);
    if (isNaN(fechaConcurso.getTime())) {
      this.loggingService.error('[FiltersService] Invalid date format for contest.fecha. Cannot apply period filter.', concurso, 'FiltersService');
      return false;
    }

    let meetsPeriod = false;
    switch (periodo) {
      case 'hoy':
        meetsPeriod = this.esHoy(fechaConcurso);
        break;
      case 'semana':
        meetsPeriod = this.estaEnUltimaSemana(fechaConcurso);
        break;
      case 'mes':
        meetsPeriod = this.estaEnUltimoMes(fechaConcurso);
        break;
      case 'trimestre':
        meetsPeriod = this.estaEnUltimoTrimestre(fechaConcurso);
        break;
      case 'anio':
        meetsPeriod = this.estaEnUltimoAnio(fechaConcurso);
        break;
      default:
        meetsPeriod = true; // 'todos' or unknown period, always true
    }
    this.loggingService.debug(`[FiltersService] Period filter "${periodo}" check for date "${fechaConcurso.toDateString()}". Result: ${meetsPeriod}`, undefined, 'FiltersService');
    return meetsPeriod;
  }

  /**
   * Checks if a given date is today.
   * @param fecha Date to check.
   * @returns true if the date is today, false otherwise.
   */
  private esHoy(fecha: Date): boolean {
    const hoy = new Date();
    const isToday = fecha.toDateString() === hoy.toDateString();
    this.loggingService.debug(`[FiltersService] Checking if "${fecha.toDateString()}" is today. Result: ${isToday}`, undefined, 'FiltersService');
    return isToday;
  }

  /**
   * Checks if a given date is within the last week (including today).
   * @param fecha Date to check.
   * @returns true if the date is within the last week, false otherwise.
   */
  private estaEnUltimaSemana(fecha: Date): boolean {
    const hoy = new Date();
    const unaSemanaAtras = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
    const isInLastWeek = fecha >= unaSemanaAtras && fecha <= hoy;
    this.loggingService.debug(`[FiltersService] Checking if "${fecha.toDateString()}" is in last week. Result: ${isInLastWeek}`, undefined, 'FiltersService');
    return isInLastWeek;
  }

  /**
   * Checks if a given date is within the last month (including today).
   * @param fecha Date to check.
   * @returns true if the date is within the last month, false otherwise.
   */
  private estaEnUltimoMes(fecha: Date): boolean {
    const hoy = new Date();
    const unMesAtras = new Date(hoy.getFullYear(), hoy.getMonth() - 1, hoy.getDate());
    const isInLastMonth = fecha >= unMesAtras && fecha <= hoy;
    this.loggingService.debug(`[FiltersService] Checking if "${fecha.toDateString()}" is in last month. Result: ${isInLastMonth}`, undefined, 'FiltersService');
    return isInLastMonth;
  }

  /**
   * Checks if a given date is within the last quarter (3 months, including today).
   * @param fecha Date to check.
   * @returns true if the date is within the last quarter, false otherwise.
   */
  private estaEnUltimoTrimestre(fecha: Date): boolean {
    const hoy = new Date();
    const tresMesesAtras = new Date(hoy.getFullYear(), hoy.getMonth() - 3, hoy.getDate());
    const isInLastQuarter = fecha >= tresMesesAtras && fecha <= hoy;
    this.loggingService.debug(`[FiltersService] Checking if "${fecha.toDateString()}" is in last quarter. Result: ${isInLastQuarter}`, undefined, 'FiltersService');
    return isInLastQuarter;
  }

  /**
   * Checks if a given date is within the last year (including today).
   * @param fecha Date to check.
   * @returns true if the date is within the last year, false otherwise.
   */
  private estaEnUltimoAnio(fecha: Date): boolean {
    const hoy = new Date();
    const unAnioAtras = new Date(hoy.getFullYear() - 1, hoy.getMonth(), hoy.getDate());
    const isInLastYear = fecha >= unAnioAtras && fecha <= hoy;
    this.loggingService.debug(`[FiltersService] Checking if "${fecha.toDateString()}" is in last year. Result: ${isInLastYear}`, undefined, 'FiltersService');
    return isInLastYear;
  }
}
