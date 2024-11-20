import { Observable } from 'rxjs';
import { FiltersConcurso } from '../filters/filters-concurso.interface';

export interface IFiltersService {
  getFiltros(): Observable<FiltersConcurso>;
  actualizarFiltros(filtros: Partial<FiltersConcurso>): void;
  limpiarFiltros(): void;
  aplicarFiltros(concursos: any[]): any[];
} 