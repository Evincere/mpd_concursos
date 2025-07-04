import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError, tap, map } from 'rxjs'; // Added tap and map for logging and mapping
import { Concurso } from '../../../shared/interfaces/concurso/concurso.interface';
import { environment } from '../../../../environments/environment';
import { BusquedaConcurso, FiltrosConcurso } from '@shared/interfaces/filters/filtros.interface';
import { LoggingService } from '../logging/logging.service'; // Import LoggingService

@Injectable({
  providedIn: 'root'
})
export class ConcursosService {
  private apiUrl = `${environment.apiUrl}/concursos`;
  private readonly LOG_TAG = 'ConcursosService'; // Tag for logging

  constructor(
    private http: HttpClient,
    private loggingService: LoggingService // Inject LoggingService
  ) {
    this.loggingService.debug(`[${this.LOG_TAG}] Initializing ConcursosService. API URL: ${this.apiUrl}.`, undefined, this.LOG_TAG);
  }

  /**
   * Transforms a FiltrosConcurso object into a plain object suitable for HttpParams.
   * Handles Date objects by converting them to ISO strings.
   * @param filtros The filters object.
   * @returns A transformed object.
   */
  private transformFiltersToHttpParams(filtros: FiltrosConcurso): Record<string, string | number | boolean> {
    const filtrosHttp: Record<string, string | number | boolean> = {};
    this.loggingService.debug(`[${this.LOG_TAG}] Transforming filters for HTTP params. Original filters:`, filtros, this.LOG_TAG);

    Object.entries(filtros).forEach(([key, value]) => {
      if (value instanceof Date) {
        filtrosHttp[key] = value.toISOString();
        this.loggingService.debug(`[${this.LOG_TAG}] Converted Date filter "${key}" to ISO string: ${filtrosHttp[key]}.`, undefined, this.LOG_TAG);
      } else if (value !== undefined && value !== null) {
        filtrosHttp[key] = value;
      }
    });
    this.loggingService.debug(`[${this.LOG_TAG}] Transformed filters for HTTP params. Result:`, filtrosHttp, this.LOG_TAG);
    return filtrosHttp;
  }

  /**
   * Retrieves all available contests.
   * @returns An Observable of an array of Concurso.
   */
  getConcursos(): Observable<Concurso[]> {
    this.loggingService.info(`[${this.LOG_TAG}] Fetching all contests from: ${this.apiUrl}.`, undefined, this.LOG_TAG);
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(concursos => concursos.map(concurso => this.mapBackendResponseToFrontend(concurso))),
      tap(concursos => {
        this.loggingService.debug(`[${this.LOG_TAG}] Successfully fetched ${concursos.length} contests.`, undefined, this.LOG_TAG);
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error fetching all contests:`, error, this.LOG_TAG);
        return throwError(() => new Error('No se pudieron cargar los concursos.'));
      })
    );
  }

  /**
   * Retrieves contests filtered by the provided criteria.
   * @param filtros The filter criteria.
   * @returns An Observable of an array of Concurso.
   */
  getConcursosFiltrados(filtros: FiltrosConcurso): Observable<Concurso[]> {
    this.loggingService.info(`[${this.LOG_TAG}] Fetching filtered contests. Filters:`, filtros, this.LOG_TAG);
    let params = new HttpParams();
    const filtrosHttp = this.transformFiltersToHttpParams(filtros); // Use the helper method

    Object.entries(filtrosHttp).forEach(([key, value]) => {
      params = params.set(key, String(value));
    });

    this.loggingService.debug(`[${this.LOG_TAG}] HTTP Params for filtered contests:`, params.toString(), this.LOG_TAG);

    return this.http.get<any[]>(`${this.apiUrl}/filtrar`, { params }).pipe(
      map(concursos => concursos.map(concurso => this.mapBackendResponseToFrontend(concurso))),
      tap(concursos => {
        this.loggingService.debug(`[${this.LOG_TAG}] Successfully fetched ${concursos.length} filtered contests.`, undefined, this.LOG_TAG);
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error filtering contests:`, error, this.LOG_TAG);
        return throwError(() => new Error('No se pudieron filtrar los concursos.'));
      })
    );
  }

  /**
   * Searches for contests based on a search query.
   * @param busqueda The search criteria.
   * @returns An Observable of an array of Concurso.
   */
  buscarConcursos(busqueda: BusquedaConcurso): Observable<Concurso[]> {
    this.loggingService.info(`[${this.LOG_TAG}] Searching contests. Search query: "${busqueda.termino}".`, busqueda, this.LOG_TAG);
    let params = new HttpParams();
    if (busqueda.termino) {
      params = params.set('query', busqueda.termino);
    }

    this.loggingService.debug(`[${this.LOG_TAG}] HTTP Params for contest search:`, params.toString(), this.LOG_TAG);

    return this.http.get<any[]>(`${this.apiUrl}/buscar`, { params }).pipe(
      map(concursos => concursos.map(concurso => this.mapBackendResponseToFrontend(concurso))),
      tap(concursos => {
        this.loggingService.debug(`[${this.LOG_TAG}] Successfully found ${concursos.length} contests for search query "${busqueda.termino}".`, undefined, this.LOG_TAG);
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error searching contests for query "${busqueda.termino}":`, error, this.LOG_TAG);
        return throwError(() => new Error('No se pudieron buscar los concursos.'));
      })
    );
  }

  /**
   * Submits an application to a specific contest.
   * @param concursoId The ID of the contest to apply to.
   * @returns An Observable of a generic response object.
   */
  postularAConcurso(concursoId: number): Observable<Record<string, unknown>> {
    this.loggingService.info(`[${this.LOG_TAG}] Applying to contest with ID: ${concursoId}.`, undefined, this.LOG_TAG);
    // Assuming the backend endpoint expects a POST request to '/concursos/{id}/postular'
    return this.http.post<Record<string, unknown>>(`${this.apiUrl}/${concursoId}/postular`, {}).pipe(
      tap(response => {
        this.loggingService.debug(`[${this.LOG_TAG}] Application to contest ${concursoId} successful. Response:`, response, this.LOG_TAG);
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error applying to contest ${concursoId}:`, error, this.LOG_TAG);
        return throwError(() => new Error('No se pudo completar la postulación. Por favor, intente de nuevo.'));
      })
    );
  }

  /**
   * Retrieves a single contest by its ID.
   * @param concursoId The ID of the contest.
   * @returns An Observable of Concurso.
   */
  getConcursoById(concursoId: string): Observable<Concurso> {
    this.loggingService.info(`[${this.LOG_TAG}] Fetching contest by ID: ${concursoId}.`, undefined, this.LOG_TAG);
    return this.http.get<any>(`${this.apiUrl}/${concursoId}`).pipe(
      map(response => this.mapBackendResponseToFrontend(response)),
      tap(concurso => {
        this.loggingService.debug(`[${this.LOG_TAG}] Successfully fetched contest details for ID: ${concursoId}. Title: "${concurso.title}".`, undefined, this.LOG_TAG);
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error fetching contest with ID ${concursoId}:`, error, this.LOG_TAG);
        return throwError(() => new Error(`No se pudo obtener el concurso con ID ${concursoId}.`));
      })
    );
  }

  /**
   * Maps the backend response to the frontend expected format.
   * @param response The raw response from the backend.
   */
  private mapBackendResponseToFrontend(response: any): Concurso {
    this.loggingService.debug(`[${this.LOG_TAG}] Mapping backend response to frontend format.`, response, this.LOG_TAG);

    // MAPEO DE CAMPOS: Backend -> Frontend
    // El backend devuelve 'class_' pero el frontend espera 'class'
    if (response.class_ !== undefined) {
      response.class = response.class_;
      this.loggingService.debug(`[${this.LOG_TAG}] Mapped class_ to class:`, response.class_, this.LOG_TAG);
    }

    // Asegurar que position esté mapeado correctamente
    if (response.position !== undefined) {
      this.loggingService.debug(`[${this.LOG_TAG}] Position field found:`, response.position, this.LOG_TAG);
    }

    this.loggingService.debug(`[${this.LOG_TAG}] Final mapped response:`, response, this.LOG_TAG);
    return response as Concurso;
  }
}
