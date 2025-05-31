import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';

export interface AdminInscription {
  id: string;
  contestId: number | string;
  userId: string;
  state: InscripcionState;
  inscriptionDate: string;
  lastUpdated: string;
  userInfo?: {
    fullName: string;
    email: string;
    dni: string;
  };
  contestInfo?: {
    title: string;
    position: string;
  };
  documents?: {
    id: string;
    name: string;
    type: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    uploadDate: string;
  }[];
  notes?: {
    id: string;
    text: string;
    createdBy: string;
    createdAt: string;
  }[];
}

export interface InscriptionFilter {
  contestId?: number | string;
  userId?: string;
  state?: InscripcionState | 'ALL';
  startDate?: Date | string;
  endDate?: Date | string;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface InscriptionPage {
  content: AdminInscription[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface InscriptionNote {
  id?: string;
  inscriptionId: string;
  text: string;
  createdBy?: string;
  createdAt?: string;
}

export interface InscriptionStateChange {
  inscriptionId: string;
  newState: InscripcionState;
  note?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminInscripcionesService {
  private apiUrl = `${environment.apiUrl}/admin/inscriptions`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todas las inscripciones con filtros y paginación
   * @param filter Filtros a aplicar
   */
  getInscripciones(filter?: InscriptionFilter): Observable<InscriptionPage> {
    let params = new HttpParams();

    if (filter) {
      if (filter.contestId) params = params.set('contestId', filter.contestId.toString());
      if (filter.userId) params = params.set('userId', filter.userId);
      if (filter.state && filter.state !== 'ALL') params = params.set('state', filter.state);
      if (filter.search) params = params.set('search', filter.search);
      if (filter.page !== undefined) params = params.set('page', filter.page.toString());
      if (filter.size) params = params.set('size', filter.size.toString());
      if (filter.sort) params = params.set('sort', filter.sort);
      if (filter.direction) params = params.set('direction', filter.direction);

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

    return this.http.get<InscriptionPage>(`${this.apiUrl}`, { params }).pipe(
      catchError(error => {
        console.error('Error obteniendo inscripciones:', error);
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
   * Obtiene todas las inscripciones de un concurso específico
   * @param contestId ID del concurso
   * @param filter Filtros adicionales a aplicar
   */
  getInscripcionesByConcurso(contestId: number | string, filter?: Omit<InscriptionFilter, 'contestId'>): Observable<InscriptionPage> {
    const fullFilter: InscriptionFilter = { contestId, ...filter };
    return this.getInscripciones(fullFilter);
  }

  /**
   * Obtiene una inscripción por su ID
   * @param id ID de la inscripción
   */
  getInscripcionById(id: string): Observable<AdminInscription> {
    return this.http.get<AdminInscription>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`Error obteniendo inscripción con ID ${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Cambia el estado de una inscripción
   * @param stateChange Datos del cambio de estado
   */
  changeState(stateChange: InscriptionStateChange): Observable<AdminInscription> {
    return this.http.patch<AdminInscription>(
      `${this.apiUrl}/${stateChange.inscriptionId}/state`,
      stateChange
    ).pipe(
      catchError(error => {
        console.error(`Error cambiando estado de la inscripción con ID ${stateChange.inscriptionId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Agrega una nota a una inscripción
   * @param note Datos de la nota
   */
  addNote(note: InscriptionNote): Observable<InscriptionNote> {
    return this.http.post<InscriptionNote>(
      `${this.apiUrl}/${note.inscriptionId}/notes`,
      note
    ).pipe(
      catchError(error => {
        console.error(`Error agregando nota a la inscripción con ID ${note.inscriptionId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Elimina una nota de una inscripción
   * @param inscriptionId ID de la inscripción
   * @param noteId ID de la nota
   */
  deleteNote(inscriptionId: string, noteId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${inscriptionId}/notes/${noteId}`).pipe(
      catchError(error => {
        console.error(`Error eliminando nota con ID ${noteId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Obtiene estadísticas de inscripciones para un concurso específico
   * @param contestId ID del concurso
   */
  getInscriptionStats(contestId: number | string): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.apiUrl}/stats/contest/${contestId}`).pipe(
      catchError(error => {
        console.error(`Error obteniendo estadísticas de inscripciones para el concurso con ID ${contestId}:`, error);
        return of({
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          inProcess: 0,
          cancelled: 0
        });
      })
    );
  }
}
