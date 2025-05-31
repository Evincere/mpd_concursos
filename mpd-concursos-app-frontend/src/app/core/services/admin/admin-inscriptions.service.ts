import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from  '@angular/common/http';
import { Observable, of, map } from 'rxjs';
import { catchError } from  'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';
import { IInscription } from '@shared/interfaces/inscripcion/inscription.interface';
import { UserProfile } from '@shared/interfaces/user/user-profile.interface';

export interface InscriptionFilter {
  status?: InscripcionState | 'ALL';
  contestId?: number | string;
  userId?: string;
  documentStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';
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

export interface AdminInscription extends IInscription {
  contestTitle: string;
  contestCategory: string;
  contestDepartment: string;
  userFullName: string;
  userEmail: string;
  userDni: string;
  documentsCount: number;
  pendingDocuments: number;
  approvedDocuments: number;
  rejectedDocuments: number;
  lastUpdate: Date;
  reviewedBy?: string;
  reviewDate?: Date;
  observations?: string;
}

export interface InscriptionDocument {
  id: string;
  inscriptionId: string;
  documentType: string;
  documentTypeId: string;
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  observations?: string;
  reviewedBy?: string;
  reviewDate?: Date;
  downloadUrl: string;
}

export interface InscriptionDetail {
  inscription: AdminInscription;
  user: UserProfile;
  documents: InscriptionDocument[];
  history: InscriptionHistoryItem[];
}

export interface InscriptionHistoryItem {
  id: string;
  inscriptionId: string;
  date: Date;
  action: string;
  previousState?: InscripcionState;
  newState?: InscripcionState;
  userId: string;
  userName: string;
  userRole: string;
  details?: string;
}

export interface InscriptionStatusUpdateRequest {
  status: InscripcionState;
  observations?: string;
}

export interface DocumentStatusUpdateRequest {
  status: 'APPROVED' | 'REJECTED';
  observations?: string;
}

export interface InscriptionStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  inProcess: number;
  byContest: Record<string, number>;
  byDepartment: Record<string, number>;
  pendingDocuments: number;
  documentsToReview: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminInscriptionsService {
  private apiUrl = `${environment.apiUrl}/admin/inscriptions`;

  constructor(private http: HttpClient) {}


  /**
   * Obtiene todas las inscripciones con filtros y paginación
   * @param filter Filtros a aplicar
   */
  getInscriptions(filter?: InscriptionFilter): Observable<InscriptionPage> {
    let params = new HttpParams();

    if (filter) {
      if (filter.status && filter.status !== 'ALL') params = params.set('status', filter.status);
      if (filter.contestId) params = params.set('contestId', filter.contestId.toString());
      if (filter.userId) params = params.set('userId', filter.userId);
      if (filter.documentStatus && filter.documentStatus !== 'ALL') params = params.set('documentStatus', filter.documentStatus);
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
   * Obtiene una inscripción por su ID
   * @param id ID de la inscripción
   */
  getInscriptionById(id: string): Observable<InscriptionDetail> {
    return this.http.get<InscriptionDetail>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`Error obteniendo inscripción con ID ${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Actualiza el estado de una inscripción
   * @param id ID de la inscripción
   * @param request Datos de actualización
   */
  updateInscriptionStatus(id: string, request: InscriptionStatusUpdateRequest): Observable<AdminInscription> {
    return this.http.patch<AdminInscription>(`${this.apiUrl}/${id}/status`, request).pipe(
      catchError(error => {
        console.error(`Error actualizando estado de inscripción con ID ${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Actualiza el estado de un documento
   * @param inscriptionId ID de la inscripción
   * @param documentId ID del documento
   * @param request Datos de actualización
   */
  updateDocumentStatus(inscriptionId: string, documentId: string, request: DocumentStatusUpdateRequest): Observable<InscriptionDocument> {
    return this.http.patch<InscriptionDocument>(
      `${this.apiUrl}/${inscriptionId}/documents/${documentId}/status`,
      request
    ).pipe(
      catchError(error => {
        console.error(`Error actualizando estado de documento con ID ${documentId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Obtiene estadísticas de inscripciones
   */
  getStats(): Observable<InscriptionStats> {
    console.log('[AdminInscriptionsService] Obteniendo estadísticas de inscripciones...');

    // Usar datos mock directamente para evitar errores 500 del backend
    // TODO: Cambiar a llamada HTTP real cuando el backend esté implementado
    console.warn('[AdminInscriptionsService] Usando datos de respaldo para estadísticas (backend no implementado)');
    return of(this.createMockStats());

    // Código comentado para cuando el backend esté listo:
    // return this.http.get<InscriptionStats>(`${this.apiUrl}/stats`).pipe(
    //   catchError(error => {
    //     console.error('Error obteniendo estadísticas de inscripciones:', error);
    //     console.warn('[AdminInscriptionsService] Usando datos de respaldo para estadísticas');
    //     return of(this.createMockStats());
    //   })
    // );
  }

  /**
   * Crea estadísticas de respaldo para desarrollo
   */
  private createMockStats(): InscriptionStats {
    return {
      total: 3567,
      pending: 124,
      approved: 2890,
      rejected: 553,
      cancelled: 0,
      inProcess: 124,
      byContest: {
        'Concurso Defensor/a Penal': 1250,
        'Concurso Fiscal Adjunto': 890,
        'Concurso Asesor Tutelar': 567,
        'Concurso Curador Público': 445,
        'Concurso Defensor Civil': 415
      },
      byDepartment: {
        'DEFENSORIAS PENALES': 1250,
        'FISCALIAS': 890,
        'ASESORIA TUTELAR': 567,
        'CURADURIA PUBLICA': 445,
        'DEFENSORIAS CIVILES': 415
      },
      pendingDocuments: 342,
      documentsToReview: 342
    };
  }

  /**
   * Obtiene el historial de una inscripción
   * @param id ID de la inscripción
   */
  getInscriptionHistory(id: string): Observable<InscriptionHistoryItem[]> {
    return this.http.get<InscriptionHistoryItem[]>(`${this.apiUrl}/${id}/history`).pipe(
      catchError(error => {
        console.error(`Error obteniendo historial de inscripción con ID ${id}:`, error);
        return of([]);
      })
    );
  }

  /**
   * Obtiene los documentos de una inscripción
   * @param id ID de la inscripción
   */
  getInscriptionDocuments(id: string): Observable<InscriptionDocument[]> {
    return this.http.get<InscriptionDocument[]>(`${this.apiUrl}/${id}/documents`).pipe(
      catchError(error => {
        console.error(`Error obteniendo documentos de inscripción con ID ${id}:`, error);
        return of([]);
      })
    );
  }

  /**
   * Descarga un documento
   * @param inscriptionId ID de la inscripción
   * @param documentId ID del documento
   */
  downloadDocument(inscriptionId: string, documentId: string): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/${inscriptionId}/documents/${documentId}/download`,
      { responseType: 'blob' }
    ).pipe(
      catchError(error => {
        console.error(`Error descargando documento con ID ${documentId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Obtiene un reporte personalizado de inscripciones
   */
  getInscriptionReport(params: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/admin/inscriptions/report`, params)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo reporte de inscripciones:', {
            type: 'SERVER',
            message: 'Error interno del servidor. Por favor, intente nuevamente más tarde.',
            originalError: error,
            timestamp: Date.now()
          });
          
          // Devolver datos simulados mientras se implementa el backend
          return of({
            success: true,
            data: this.getMockReportData(params.fields)
          });
        })
      );
  }

  private getMockReportData(fields: string[]): any[] {
    const result = [];
    const count = 20;

    for (let i = 1; i <= count; i++) {
      const row: Record<string, unknown> = {};
      fields.forEach(field => {
        switch (field) {
          case 'userFullName':
            row[field] = `Usuario Ejemplo ${i}`;
            break;
          case 'userDni':
            row[field] = `${30000000 + i}`;
            break;
          case 'contestTitle':
            row[field] = `Concurso Ejemplo ${i}`;
            break;
          case 'inscriptionState':
            row[field] = Object.values(InscripcionState)[i % 5];
            break;
          case 'inscriptionCreatedAt':
            row[field] = new Date(Date.now() - i * 86400000).toISOString();
            break;
          default:
            row[field] = `Valor ${i} para ${field}`;
        }
      });
      result.push(row);
    }
    return result;
  }
}
