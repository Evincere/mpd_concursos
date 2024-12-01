import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Concurso } from '../../../shared/interfaces/concurso/concurso.interface';
import { environment } from '../../../../environments/environment';
import { BusquedaConcurso, FiltrosConcurso } from '@shared/interfaces/filters/filtros.interface';

@Injectable({
  providedIn: 'root'
})
export class ConcursosService {
  private apiUrl = `${environment.apiUrl}/api/concursos`;

  constructor(private http: HttpClient) { }

  private convertirFiltrosParaHttp(filtros: FiltrosConcurso): { [key: string]: string | number | boolean } {
    const filtrosHttp: { [key: string]: string | number | boolean } = {};
    
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
    return this.http.get<Concurso[]>(this.apiUrl, { responseType: 'json' });
  }

  getConcursosFiltrados(filtros: FiltrosConcurso): Observable<Concurso[]> {
    const filtrosHttp = this.convertirFiltrosParaHttp(filtros);
    return this.http.get<Concurso[]>(`${this.apiUrl}/filtrar`, { 
      params: filtrosHttp,
      responseType: 'json'
    });
  }

  buscarConcursos(busqueda: BusquedaConcurso): Observable<Concurso[]> {
    return this.http.get<Concurso[]>(`${this.apiUrl}/buscar`, { 
      params: { termino: busqueda.termino },
      responseType: 'json'
    });
  }

  postularAConcurso(concursoId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${concursoId}/postular`, {}, { 
      responseType: 'json'
    });
  }
}
