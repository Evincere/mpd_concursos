import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ContestDate } from '@shared/interfaces/concurso/contest-date.interface';

export interface ContestDateCreateRequest {
  contestId: number | string;
  title: string;
  description?: string;
  date: Date | string;
  type: string;
  important: boolean;
}

export interface ContestDateUpdateRequest extends ContestDateCreateRequest {
  id: number | string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminContestDatesService {
  private apiUrl = `${environment.apiUrl}/admin/contests`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todas las fechas importantes de un concurso
   * @param contestId ID del concurso
   */
  getContestDates(contestId: number | string): Observable<ContestDate[]> {
    console.log(`[AdminContestDatesService] Obteniendo fechas para concurso ID: ${contestId}`);

    return this.http.get<ContestDate[]>(`${this.apiUrl}/${contestId}/dates`).pipe(
      catchError(error => {
        console.error(`Error obteniendo fechas del concurso con ID ${contestId}:`, error);
        throw error;
      })
    );
  }



  /**
   * Obtiene una fecha importante por su ID
   * @param contestId ID del concurso
   * @param dateId ID de la fecha
   */
  getContestDateById(contestId: number | string, dateId: number | string): Observable<ContestDate> {
    return this.http.get<ContestDate>(`${this.apiUrl}/${contestId}/dates/${dateId}`).pipe(
      catchError(error => {
        console.error(`Error obteniendo fecha con ID ${dateId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Crea una nueva fecha importante para un concurso
   * @param date Datos de la fecha a crear
   */
  createContestDate(date: ContestDateCreateRequest): Observable<ContestDate> {
    return this.http.post<ContestDate>(`${this.apiUrl}/${date.contestId}/dates`, date).pipe(
      catchError(error => {
        console.error('Error creando fecha importante:', error);
        throw error;
      })
    );
  }

  /**
   * Actualiza una fecha importante existente
   * @param date Datos de la fecha a actualizar
   */
  updateContestDate(date: ContestDateUpdateRequest): Observable<ContestDate> {
    return this.http.put<ContestDate>(
      `${this.apiUrl}/${date.contestId}/dates/${date.id}`,
      date
    ).pipe(
      catchError(error => {
        console.error(`Error actualizando fecha con ID ${date.id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Elimina una fecha importante
   * @param contestId ID del concurso
   * @param dateId ID de la fecha
   */
  deleteContestDate(contestId: number | string, dateId: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${contestId}/dates/${dateId}`).pipe(
      catchError(error => {
        console.error(`Error eliminando fecha con ID ${dateId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Obtiene los tipos de fechas disponibles
   */
  getDateTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/date-types`).pipe(
      catchError(error => {
        console.error('Error obteniendo tipos de fechas:', error);
        // Devolver tipos predeterminados en caso de error
        return of([
          'INSCRIPCION_INICIO',
          'INSCRIPCION_FIN',
          'EVALUACION_INICIO',
          'EVALUACION_FIN',
          'ENTREVISTA',
          'PUBLICACION_RESULTADOS',
          'OTRO'
        ]);
      })
    );
  }

  /**
   * Obtiene todas las fechas importantes de todos los concursos para un rango de fechas
   * @param startDate Fecha de inicio
   * @param endDate Fecha de fin
   */
  getAllContestDates(startDate?: Date | string, endDate?: Date | string): Observable<ContestDate[]> {
    let url = `${this.apiUrl}/dates`;

    if (startDate || endDate) {
      const params: string[] = [];

      if (startDate) {
        const formattedStartDate = startDate instanceof Date
          ? startDate.toISOString().split('T')[0]
          : startDate;
        params.push(`startDate=${formattedStartDate}`);
      }

      if (endDate) {
        const formattedEndDate = endDate instanceof Date
          ? endDate.toISOString().split('T')[0]
          : endDate;
        params.push(`endDate=${formattedEndDate}`);
      }

      url += `?${params.join('&')}`;
    }

    return this.http.get<ContestDate[]>(url).pipe(
      catchError(error => {
        console.error('Error obteniendo todas las fechas importantes:', error);
        return of([]);
      })
    );
  }
}
