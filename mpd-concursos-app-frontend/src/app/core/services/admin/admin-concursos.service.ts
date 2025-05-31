import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Concurso, ContestStatus } from '@shared/interfaces/concurso/concurso.interface';
import { ContestDate } from '@shared/interfaces/concurso/contest-date.interface';

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
  dependencia: string;
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
  private apiUrl = `${environment.apiUrl}/admin/contests`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los concursos con filtros y paginación
   * @param filter Filtros a aplicar
   */
  getConcursos(filter?: ConcursoFilter): Observable<ConcursoPage> {
    let params = new HttpParams();

    if (filter) {
      if (filter.status && filter.status !== 'ALL') params = params.set('status', filter.status);
      if (filter.department) params = params.set('department', filter.department);
      if (filter.position) params = params.set('position', filter.position);
      if (filter.category) params = params.set('category', filter.category);
      if (filter.search) params = params.set('search', filter.search);
      if (filter.page !== undefined) params = params.set('page', filter.page.toString());
      if (filter.size) params = params.set('size', filter.size.toString());
      if (filter.sortBy) params = params.set('sort', filter.sortBy);
      if (filter.sortDirection && (filter.sortDirection === 'asc' || filter.sortDirection === 'desc')) {
        params = params.set('direction', filter.sortDirection);
      }

      if (filter.startDate) {
        const startDate = filter.startDate instanceof Date
          ? filter.startDate.toISOString().split('T')[0]
          : filter.startDate;
        params = params.set('startDate', startDate);
      }

      if (filter.endDate) {
        const endDate = filter.endDate instanceof Date
          ? filter.endDate.toISOString().split('T')[0]
          : filter.endDate;
        params = params.set('endDate', endDate);
      }
    }

    return this.http.get<ConcursoPage>(`${this.apiUrl}`, { params }).pipe(
      catchError(error => {
        console.error('Error obteniendo concursos:', error);
        return of({
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: 10,
          number: 0
        });
      })
    );
  }

  /**
   * Obtiene un concurso por su ID
   * @param id ID del concurso
   */
  getConcursoById(id: number | string): Observable<Concurso> {
    console.log(`[AdminConcursosService] Obteniendo concurso con ID: ${id}`);
    console.log(`[AdminConcursosService] URL completa: ${this.apiUrl}/${id}`);
    console.log(`[AdminConcursosService] environment.apiUrl: ${environment.apiUrl}`);

    // Intentar primero el endpoint de admin, si falla usar el endpoint público
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => this.mapBackendResponseToFrontend(response)),
      catchError(error => {
        console.warn(`[AdminConcursosService] Error obteniendo concurso con endpoint admin (${error.status}), intentando endpoint público...`);
        // Si falla el endpoint de admin, intentar con el endpoint público
        const publicApiUrl = `${environment.apiUrl}/concursos`;
        return this.http.get<any>(`${publicApiUrl}/${id}`).pipe(
          map(response => this.mapBackendResponseToFrontend(response)),
          catchError(publicError => {
            console.error(`[AdminConcursosService] Error obteniendo concurso con ID ${id} desde ambos endpoints:`, { adminError: error, publicError });

            // Si ambos endpoints fallan, devolver datos de respaldo para desarrollo
            if (error.status === 404 || publicError.status === 404) {
              console.warn(`[AdminConcursosService] Concurso con ID ${id} no encontrado, devolviendo datos de respaldo`);
              return of(this.createMockConcurso(id));
            }

            throw publicError;
          })
        );
      })
    );
  }

  /**
   * Crea un concurso de respaldo para desarrollo cuando no se encuentra el ID solicitado
   * @param id ID del concurso solicitado
   */
  private createMockConcurso(id: number | string): Concurso {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30);

    return {
      id: Number(id),
      title: `Concurso de Prueba ${id}`,
      position: 'Defensor/a Penal - Primera C.J.',
      department: 'DEFENSORIAS PENALES',
      dependencia: 'DEFENSORIAS PENALES',
      category: 'JURIDICO',
      status: 'ACTIVE' as ContestStatus,
      startDate: today,
      endDate: futureDate,
      description: `Concurso de prueba generado automáticamente para el ID ${id}. Este es un concurso de respaldo para desarrollo.`,
      functions: 'Asistencia técnica y representación legal en causas penales',
      class: 'A',
      basesUrl: 'https://mpd.gov.ar/bases/defensor-penal.pdf',
      descriptionUrl: 'https://mpd.gov.ar/descripcion/defensor-penal.pdf',
      createdAt: today,
      updatedAt: today,
      dates: [
        {
          id: '1',
          contestId: Number(id),
          label: 'Fin de Inscripción',
          type: 'REGISTRATION',
          date: futureDate,
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
          date: new Date(futureDate.getTime() + 5 * 24 * 60 * 60 * 1000), // +5 días
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
   * Mapea la respuesta del backend al formato esperado por el frontend
   */
  private mapBackendResponseToFrontend(response: any): Concurso {
    console.log('[AdminConcursosService] Mapeando respuesta del backend:', response);

    return {
      id: response.id,
      title: response.title,
      description: response.description,
      position: response.position,
      category: response.category,
      class: response.contestClass || response.class_ || response.class,
      functions: response.functions,
      status: response.status,
      department: response.department,
      dependencia: response.dependencia || response.department,
      termsUrl: response.termsUrl,
      profileUrl: response.profileUrl,
      basesUrl: response.basesUrl || response.termsUrl,
      descriptionUrl: response.descriptionUrl || response.profileUrl,
      startDate: response.startDate,
      endDate: response.endDate,
      createdAt: response.createdAt || new Date(),
      updatedAt: response.updatedAt || new Date()
    };
  }



  /**
   * Crea un nuevo concurso
   * @param concurso Datos del concurso a crear
   */
  createConcurso(concurso: ConcursoCreateRequest): Observable<Concurso> {
    return this.http.post<Concurso>(`${this.apiUrl}`, concurso).pipe(
      catchError(error => {
        console.error('Error creando concurso:', error);
        throw error;
      })
    );
  }

  /**
   * Actualiza un concurso existente
   * @param concurso Datos del concurso a actualizar
   */
  updateConcurso(concurso: ConcursoUpdateRequest): Observable<Concurso> {
    return this.http.put<Concurso>(`${this.apiUrl}/${concurso.id}`, concurso).pipe(
      catchError(error => {
        console.error(`Error actualizando concurso con ID ${concurso.id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Cambia el estado de un concurso
   * @param id ID del concurso
   * @param status Nuevo estado
   */
  changeStatus(id: number | string, status: ContestStatus): Observable<Concurso> {
    return this.http.patch<Concurso>(`${this.apiUrl}/${id}/status`, { status }).pipe(
      catchError(error => {
        console.error(`Error cambiando estado del concurso con ID ${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Elimina un concurso (solo disponible para concursos en estado DRAFT)
   * @param id ID del concurso
   */
  deleteConcurso(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`Error eliminando concurso con ID ${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Obtiene estadísticas de concursos
   */
  getStats(): Observable<ConcursoStats> {
    return this.http.get<ConcursoStats>(`${this.apiUrl}/stats`).pipe(
      catchError(error => {
        console.error('Error obteniendo estadísticas de concursos:', error);
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
   * Obtiene los departamentos disponibles para filtrar
   */
  getDepartments(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/departments`).pipe(
      catchError(error => {
        console.error('Error obteniendo departamentos:', error);
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
   * Obtiene las categorías disponibles para filtrar
   */
  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categories`).pipe(
      catchError(error => {
        console.error('Error obteniendo categorías:', error);
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
   * Obtiene los cargos disponibles para filtrar
   */
  getPositions(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/positions`).pipe(
      catchError(error => {
        console.error('Error obteniendo cargos:', error);
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
