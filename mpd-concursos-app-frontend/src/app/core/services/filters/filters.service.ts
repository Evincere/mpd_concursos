import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IFiltersService } from '../../../shared/interfaces/services/filters-service.interface';
import { FiltersConcurso } from '../../../shared/interfaces/filters/filters-concurso.interface';

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

  constructor() { }

  getFiltros(): Observable<FiltersConcurso> {
    return this.filtrosSubject.asObservable();
  }

  actualizarFiltros(filtros: Partial<FiltersConcurso>): void {
    this.filtrosSubject.next({
      ...this.filtrosSubject.value,
      ...filtros
    });
  }

  limpiarFiltros(): void {
    this.filtrosSubject.next(this.filtrosIniciales);
  }

  aplicarFiltros(concursos: any[]): any[] {
    const filtrosActuales = this.filtrosSubject.value;

    return concursos.filter(concurso => {
      let cumpleFiltros = true;

      if (filtrosActuales.estado !== 'todos') {
        cumpleFiltros = cumpleFiltros && concurso.estado === filtrosActuales.estado;
      }

      if (filtrosActuales.periodo !== 'todos') {
        cumpleFiltros = cumpleFiltros && this.cumplePeriodo(concurso, filtrosActuales.periodo);
      }

      if (filtrosActuales.dependencia !== 'todos') {
        cumpleFiltros = cumpleFiltros && concurso.dependencia === filtrosActuales.dependencia;
      }

      if (filtrosActuales.cargo !== 'todos') {
        cumpleFiltros = cumpleFiltros && concurso.cargo === filtrosActuales.cargo;
      }

      return cumpleFiltros;
    });
  }

  private cumplePeriodo(concurso: any, periodo: string): boolean {
    const fechaConcurso = new Date(concurso.fecha);
    const hoy = new Date();

    switch (periodo) {
      case 'hoy':
        return this.esHoy(fechaConcurso);
      case 'semana':
        return this.estaEnUltimaSemana(fechaConcurso);
      case 'mes':
        return this.estaEnUltimoMes(fechaConcurso);
      case 'trimestre':
        return this.estaEnUltimoTrimestre(fechaConcurso);
      case 'anio':
        return this.estaEnUltimoAnio(fechaConcurso);
      default:
        return true;
    }
  }

  private esHoy(fecha: Date): boolean {
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  }

  private estaEnUltimaSemana(fecha: Date): boolean {
    const hoy = new Date();
    const unaSemanaAtras = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
    return fecha >= unaSemanaAtras && fecha <= hoy;
  }

  private estaEnUltimoMes(fecha: Date): boolean {
    const hoy = new Date();
    const unMesAtras = new Date(hoy.getFullYear(), hoy.getMonth() - 1, hoy.getDate());
    return fecha >= unMesAtras && fecha <= hoy;
  }

  private estaEnUltimoTrimestre(fecha: Date): boolean {
    const hoy = new Date();
    const tresMesesAtras = new Date(hoy.getFullYear(), hoy.getMonth() - 3, hoy.getDate());
    return fecha >= tresMesesAtras && fecha <= hoy;
  }

  private estaEnUltimoAnio(fecha: Date): boolean {
    const hoy = new Date();
    const unAnioAtras = new Date(hoy.getFullYear() - 1, hoy.getMonth(), hoy.getDate());
    return fecha >= unAnioAtras && fecha <= hoy;
  }
}
