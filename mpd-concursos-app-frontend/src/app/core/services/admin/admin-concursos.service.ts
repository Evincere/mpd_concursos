import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs'; // Import throwError
import { catchError, map, tap } from 'rxjs/operators'; // Import tap
import { environment } from '../../../../environments/environment';
import { Concurso, ContestStatus } from '@shared/interfaces/concurso/concurso.interface';
import { ContestDate } from '@shared/interfaces/concurso/contest-date.interface';
import { LoggingService } from '../logging/logging.service'; // Import LoggingService

export interface ConcursoFilter {
  status?: ContestStatus | 'ALL';
  department?: string;
  position?: string;
  category?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc' | '';
}

export interface ConcursoPage {
  content: Concurso[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ConcursoCreateRequest {
  title: string;
  description?: string;
  position: string;
  category: string;
  class: string;
  functions: string;
  department: string;
  dependencia: string; // Assuming this is the backend field for dependency
  status: ContestStatus;
  startDate: Date | string;
  endDate: Date | string;
  termsUrl?: string;
  profileUrl?: string;
  dates?: ContestDate[];
}

export interface ConcursoUpdateRequest extends ConcursoCreateRequest {
  id: number | string;
}

export interface ConcursoStats {
  total: number;
  active: number;
  draft: number;
  closed: number;
  inProgress: number;
  cancelled: number;
  byDepartment: Record<string, number>;
  byCategory: Record<string, number>;
}

@Injectable({
  providedIn: 'root'
})
export class AdminConcursosService {
  private apiUrl = `${environment.apiUrl}/admin/contests`; // Admin endpoint
  private publicApiUrl = `${environment.apiUrl}/concursos`; // Public endpoint for fallback (corrected from /contests)

  constructor(
    private http: HttpClient,
    private loggingService: LoggingService // Inject LoggingService
  ) {
    this.loggingService.debug('[AdminConcursosService] Initializing AdminConcursosService.', undefined, 'ConcursosService');
  }

  /**
   * Retrieves all contests with filters and pagination.
   * @param filter Filters to apply.
   */
  getConcursos(filter?: ConcursoFilter): Observable<ConcursoPage> {
    this.loggingService.info('[AdminConcursosService] Fetching contests with filters:', filter, 'ConcursosService');
    let params = new HttpParams();

    if (filter) {
      if (filter.status && filter.status !== 'ALL') {
        params = params.set('status', filter.status);
        this.loggingService.debug(`[AdminConcursosService] Adding status filter: ${filter.status}`, undefined, 'ConcursosService');
      }
      if (filter.department) {
        params = params.set('department', filter.department);
        this.loggingService.debug(`[AdminConcursosService] Adding department filter: ${filter.department}`, undefined, 'ConcursosService');
      }
      if (filter.position) {
        params = params.set('position', filter.position);
        this.loggingService.debug(`[AdminConcursosService] Adding position filter: ${filter.position}`, undefined, 'ConcursosService');
      }
      if (filter.category) {
        params = params.set('category', filter.category);
        this.loggingService.debug(`[AdminConcursosService] Adding category filter: ${filter.category}`, undefined, 'ConcursosService');
      }
      if (filter.search) {
        params = params.set('search', filter.search);
        this.loggingService.debug(`[AdminConcursosService] Adding search filter: ${filter.search}`, undefined, 'ConcursosService');
      }
      if (filter.page !== undefined) {
        params = params.set('page', filter.page.toString());
        this.loggingService.debug(`[AdminConcursosService] Setting page: ${filter.page}`, undefined, 'ConcursosService');
      }
      if (filter.size) {
        params = params.set('size', filter.size.toString());
        this.loggingService.debug(`[AdminConcursosService] Setting size: ${filter.size}`, undefined, 'ConcursosService');
      }
      if (filter.sortBy) {
        params = params.set('sort', filter.sortBy);
        this.loggingService.debug(`[AdminConcursosService] Setting sort by: ${filter.sortBy}`, undefined, 'ConcursosService');
      }
      if (filter.sortDirection && (filter.sortDirection === 'asc' || filter.sortDirection === 'desc')) {
        params = params.set('direction', filter.sortDirection);
        this.loggingService.debug(`[AdminConcursosService] Setting sort direction: ${filter.sortDirection}`, undefined, 'ConcursosService');
      }

      if (filter.startDate) {
        const startDate = filter.startDate instanceof Date
          ? filter.startDate.toISOString().split('T')[0]
          : filter.startDate;
        params = params.set('startDate', startDate);
        this.loggingService.debug(`[AdminConcursosService] Setting startDate: ${startDate}`, undefined, 'ConcursosService');
      }

      if (filter.endDate) {
        const endDate = filter.endDate instanceof Date
          ? filter.endDate.toISOString().split('T')[0]
          : filter.endDate;
        params = params.set('endDate', endDate);
        this.loggingService.debug(`[AdminConcursosService] Setting endDate: ${endDate}`, undefined, 'ConcursosService');
      }
    }
    this.loggingService.debug('[AdminConcursosService] Sending GET request for contests with params:', params.toString(), 'ConcursosService');
    return this.http.get<ConcursoPage>(`${this.apiUrl}`, { params }).pipe(
      tap(response => {
        this.loggingService.debug('[AdminConcursosService] Contests fetched successfully:', response, 'ConcursosService');
      }),
      catchError(error => {
        this.loggingService.error('[AdminConcursosService] Error fetching contests:', error, 'ConcursosService');
        return of({
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: filter?.size || 10,
          number: filter?.page || 0
        });
      })
    );
  }

  /**
   * Retrieves a contest by its ID.
   * Tries admin endpoint first, then public endpoint as fallback, then mocks data for development.
   * @param id Contest ID.
   */
  getConcursoById(id: number | string): Observable<Concurso> {
    this.loggingService.info(`[AdminConcursosService] Fetching contest by ID: ${id} (admin endpoint).`, undefined, 'ConcursosService');
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => this.mapBackendResponseToFrontend(response)),
      tap(concurso => {
        this.loggingService.debug(`[AdminConcursosService] Contest ${id} fetched successfully from admin endpoint.`, concurso, 'ConcursosService');
      }),
      catchError(adminError => {
        this.loggingService.warn(`[AdminConcursosService] Error fetching contest ID ${id} from admin endpoint (${adminError.status}). Trying public endpoint...`, adminError, 'ConcursosService');
        return this.http.get<any>(`${this.publicApiUrl}/${id}`).pipe(
          map(response => this.mapBackendResponseToFrontend(response)),
          tap(concurso => {
            this.loggingService.debug(`[AdminConcursosService] Contest ${id} fetched successfully from public endpoint.`, concurso, 'ConcursosService');
          }),
          catchError(publicError => {
            this.loggingService.error(`[AdminConcursosService] Error fetching contest ID ${id} from public endpoint:`, publicError, 'ConcursosService');
            // If both endpoints fail, return mock data for development
            if (adminError.status === 404 || publicError.status === 404) {
              this.loggingService.warn(`[AdminConcursosService] Contest with ID ${id} not found, returning mock data for development.`, undefined, 'ConcursosService');
              return of(this.createMockConcurso(id));
            }
            // If it's another error, re-throw the last error
            return throwError(() => publicError);
          })
        );
      })
    );
  }

  /**
   * Creates mock contest data for development when the requested ID is not found.
   * @param id The requested contest ID.
   */
  private createMockConcurso(id: number | string): Concurso {
    this.loggingService.warn(`[AdminConcursosService] Creating mock contest for ID: ${id}.`, undefined, 'ConcursosService');
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30);

    return {
      id: Number(id),
      title: `Concurso de Prueba ${id}`,
      position: 'Defensor/a Penal - Primera C.J.',
      department: 'DEFENSORIAS PENALES',
      category: 'JURIDICO',
      status: 'ACTIVE' as ContestStatus, // Changed to ACTIVE for more realistic mock
      startDate: today.toISOString(),
      endDate: futureDate.toISOString(),
      description: `Concurso de prueba generado automáticamente para el ID ${id}. Este es un concurso de respaldo para desarrollo.`,
      functions: 'Asistencia técnica y representación legal en causas penales',
      class: 'A',
      termsUrl: 'https://mpd.gov.ar/bases/defensor-penal.pdf',
      profileUrl: 'https://mpd.gov.ar/descripcion/defensor-penal.pdf',
      createdAt: today.toISOString(),
      updatedAt: today.toISOString(),
      dates: [
        {
          id: '1',
          contestId: Number(id),
          label: 'Fin de Inscripción',
          type: 'REGISTRATION_END', // Specific type
          date: futureDate.toISOString(),
          startDate: today,
          endDate: futureDate,
          important: true,
          title: 'Fin de Inscripción',
          description: 'Fecha límite para inscribirse al concurso'
        },
        {
          id: '2',
          contestId: Number(id),
          label: 'Examen Escrito',
          type: 'WRITTEN_EXAM',
          date: new Date(futureDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), // +5 days
          startDate: new Date(futureDate.getTime() + 5 * 24 * 60 * 60 * 1000),
          endDate: new Date(futureDate.getTime() + 5 * 24 * 60 * 60 * 1000),
          important: true,
          title: 'Examen Escrito',
          description: 'Fecha del examen escrito'
        }
      ]
    };
  }

  /**
   * Maps the backend response to the frontend expected format.
   * This can include converting date strings to Date objects if necessary,
   * or normalizing field names.
   * @param response The raw response from the backend.
   */
  private mapBackendResponseToFrontend(response: any): Concurso {
    this.loggingService.debug('[AdminConcursosService] Mapping backend response to frontend format.', response, 'ConcursosService');
    // Example: Convert date strings to Date objects if they come as strings
    if (response.startDate && typeof response.startDate === 'string') {
      response.startDate = new Date(response.startDate);
    }
    if (response.endDate && typeof response.endDate === 'string') {
      response.endDate = new Date(response.endDate);
    }
    if (response.createdAt && typeof response.createdAt === 'string') {
      response.createdAt = new Date(response.createdAt);
    }
    if (response.updatedAt && typeof response.updatedAt === 'string') {
      response.updatedAt = new Date(response.updatedAt);
    }
    if (response.dates && Array.isArray(response.dates)) {
      response.dates = response.dates.map((dateItem: any) => {
        if (dateItem.date && typeof dateItem.date === 'string') {
          dateItem.date = new Date(dateItem.date);
        }
        if (dateItem.startDate && typeof dateItem.startDate === 'string') {
          dateItem.startDate = new Date(dateItem.startDate);
        }
        if (dateItem.endDate && typeof dateItem.endDate === 'string') {
          dateItem.endDate = new Date(dateItem.endDate);
        }
        return dateItem;
      });
    }
    return response as Concurso;
  }

  /**
   * Creates a new contest.
   * @param concurso Contest data to create.
   */
  createConcurso(concurso: ConcursoCreateRequest): Observable<Concurso> {
    this.loggingService.info('[AdminConcursosService] Creating new contest.', concurso, 'ConcursosService');
    return this.http.post<Concurso>(`${this.apiUrl}`, concurso).pipe(
      tap(response => {
        this.loggingService.debug('[AdminConcursosService] Contest created successfully:', response, 'ConcursosService');
      }),
      catchError(error => {
        this.loggingService.error('[AdminConcursosService] Error creating contest:', error, 'ConcursosService');
        return throwError(() => error); // Re-throw the error for specific handling in components
      })
    );
  }

  /**
   * Updates an existing contest.
   * @param concurso Contest data to update.
   */
  updateConcurso(concurso: ConcursoUpdateRequest): Observable<Concurso> {
    this.loggingService.info(`[AdminConcursosService] Updating contest with ID ${concurso.id}.`, concurso, 'ConcursosService');
    return this.http.put<Concurso>(`${this.apiUrl}/${concurso.id}`, concurso).pipe(
      tap(response => {
        this.loggingService.debug(`[AdminConcursosService] Contest ${concurso.id} updated successfully:`, response, 'ConcursosService');
      }),
      catchError(error => {
        this.loggingService.error(`[AdminConcursosService] Error updating contest with ID ${concurso.id}:`, error, 'ConcursosService');
        return throwError(() => error);
      })
    );
  }

  /**
   * Changes the status of a contest.
   * @param id Contest ID.
   * @param status New status.
   */
  changeStatus(id: number | string, status: ContestStatus): Observable<Concurso> {
    this.loggingService.info(`[AdminConcursosService] Changing status for contest ID ${id} to ${status}.`, undefined, 'ConcursosService');
    return this.http.patch<Concurso>(`${this.apiUrl}/${id}/status`, { status }).pipe(
      tap(response => {
        this.loggingService.debug(`[AdminConcursosService] Status for contest ${id} changed successfully to ${status}:`, response, 'ConcursosService');
      }),
      catchError(error => {
        this.loggingService.error(`[AdminConcursosService] Error changing status for contest with ID ${id}:`, error, 'ConcursosService');
        return throwError(() => error);
      })
    );
  }

  /**
   * Deletes a contest (only available for contests in DRAFT status).
   * @param id Contest ID.
   */
  deleteConcurso(id: number | string): Observable<void> {
    this.loggingService.info(`[AdminConcursosService] Deleting contest with ID: ${id}.`, undefined, 'ConcursosService');
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.loggingService.debug(`[AdminConcursosService] Contest ${id} deleted successfully.`, undefined, 'ConcursosService');
      }),
      catchError(error => {
        this.loggingService.error(`[AdminConcursosService] Error deleting contest with ID ${id}:`, error, 'ConcursosService');
        return throwError(() => error);
      })
    );
  }

  /**
   * Retrieves contest statistics.
   */
  getStats(): Observable<ConcursoStats> {
    this.loggingService.info('[AdminConcursosService] Fetching contest statistics.', undefined, 'ConcursosService');
    return this.http.get<ConcursoStats>(`${this.apiUrl}/stats`).pipe(
      tap(response => {
        this.loggingService.debug('[AdminConcursosService] Contest statistics fetched successfully:', response, 'ConcursosService');
      }),
      catchError(error => {
        this.loggingService.error('[AdminConcursosService] Error fetching contest stats:', error, 'ConcursosService');
        return of({
          total: 0,
          active: 0,
          draft: 0,
          closed: 0,
          inProgress: 0,
          cancelled: 0,
          byDepartment: {},
          byCategory: {}
        });
      })
    );
  }

  /**
   * Retrieves available departments for filtering.
   * Includes mock data fallback for development.
   */
  getDepartments(): Observable<string[]> {
    this.loggingService.info('[AdminConcursosService] Fetching departments.', undefined, 'ConcursosService');
    return this.http.get<string[]>(`${this.apiUrl}/departments`).pipe(
      tap(response => {
        this.loggingService.debug('[AdminConcursosService] Departments fetched successfully:', response, 'ConcursosService');
      }),
      catchError(error => {
        this.loggingService.error('[AdminConcursosService] Error fetching departments, returning mock data:', error, 'ConcursosService');
        return of([
          'INFORMATICA',
          'RECURSOS_HUMANOS',
          'CONTADURIA',
          'LEGAL',
          'ADMINISTRACION'
        ]);
      })
    );
  }

  /**
   * Retrieves available categories for filtering.
   * Includes mock data fallback for development.
   */
  getCategories(): Observable<string[]> {
    this.loggingService.info('[AdminConcursosService] Fetching categories.', undefined, 'ConcursosService');
    return this.http.get<string[]>(`${this.apiUrl}/categories`).pipe(
      tap(response => {
        this.loggingService.debug('[AdminConcursosService] Categories fetched successfully:', response, 'ConcursosService');
      }),
      catchError(error => {
        this.loggingService.error('[AdminConcursosService] Error fetching categories, returning mock data:', error, 'ConcursosService');
        return of([
          'PROFESIONAL',
          'TECNICO',
          'ADMINISTRATIVO',
          'OPERATIVO'
        ]);
      })
    );
  }

  /**
   * Retrieves available positions for filtering.
   * Includes mock data fallback for development.
   */
  getPositions(): Observable<string[]> {
    this.loggingService.info('[AdminConcursosService] Fetching positions.', undefined, 'ConcursosService');
    return this.http.get<string[]>(`${this.apiUrl}/positions`).pipe(
      tap(response => {
        this.loggingService.debug('[AdminConcursosService] Positions fetched successfully:', response, 'ConcursosService');
      }),
      catchError(error => {
        this.loggingService.error('[AdminConcursosService] Error fetching positions, returning mock data:', error, 'ConcursosService');
        return of([
          'Desarrollador Senior',
          'Analista de Sistemas',
          'Contador',
          'Abogado',
          'Administrativo'
        ]);
      })
    );
  }
}
