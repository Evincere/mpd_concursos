import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Concurso } from '../../../shared/interfaces/concurso/concurso.interface';
import { environment } from '../../../../environments/environment';
import { BusquedaConcurso, FiltrosConcurso } from '@shared/interfaces/filters/filtros.interface';

@Injectable({
  providedIn: 'root'
})
export class ConcursosService {
  private apiUrl = `${environment.apiUrl}/concursos`;

  constructor(private http: HttpClient) {
    console.log('ConcursosService inicializado con URL:', this.apiUrl);
  }

  private convertirFiltrosParaHttp(filtros: FiltrosConcurso): Record<string, string | number | boolean> {
    const filtrosHttp: Record<string, string | number | boolean> = {};

    Object.entries(filtros).forEach(([key, value]) => {
      if (value instanceof Date) {
        filtrosHttp[key] = value.toISOString();
      } else if (value !== undefined && value !== null) {
        filtrosHttp[key] = value;
      }
    });

    return filtrosHttp;
  }

  getConcursos(): Observable<Concurso[]> {
    console.log('Obteniendo concursos desde:', this.apiUrl);
    return this.http.get<Concurso[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Error al obtener concursos:', error);
        return throwError(() => new Error('No se pudieron cargar los concursos'));
      })
    );
  }

  getConcursosFiltrados(filtros: FiltrosConcurso): Observable<Concurso[]> {
    console.log('Obteniendo concursos filtrados con:', filtros);
    const filtrosHttp = this.convertirFiltrosParaHttp(filtros);
    let params = new HttpParams();

    Object.entries(filtrosHttp).forEach(([key, value]) => {
      params = params.set(key, String(value));
    });

    return this.http.get<Concurso[]>(`${this.apiUrl}/filtrar`, { params }).pipe(
      catchError(error => {
        console.error('Error al filtrar concursos:', error);
        return throwError(() => new Error('No se pudieron filtrar los concursos'));
      })
    );
  }

  buscarConcursos(busqueda: BusquedaConcurso): Observable<Concurso[]> {
    console.log('Buscando concursos con término:', busqueda.termino);
    return this.http.get<Concurso[]>(`${this.apiUrl}/buscar`, {
      params: { termino: busqueda.termino }
    }).pipe(
      catchError(error => {
        console.error('Error al buscar concursos:', error);
        return throwError(() => new Error('No se pudieron buscar los concursos'));
      })
    );
  }

  postularAConcurso(concursoId: number): Observable<Record<string, unknown>> {
    console.log('Postulando a concurso con ID:', concursoId);
    return this.http.post<Record<string, unknown>>(`${this.apiUrl}/${concursoId}/postular`, {}).pipe(
      catchError(error => {
        console.error('Error al postular a concurso:', error);
        return throwError(() => new Error('No se pudo completar la postulación'));
      })
    );
  }

  getConcursoById(concursoId: string): Observable<Concurso> {
    console.log('Obteniendo concurso con ID:', concursoId);
    return this.http.get<Concurso>(`${this.apiUrl}/${concursoId}`).pipe(
      catchError(error => {
        console.error(`Error al obtener concurso con ID ${concursoId}:`, error);
        return throwError(() => new Error('No se pudo obtener el concurso'));
      })
    );
  }
}
