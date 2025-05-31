import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { DocumentoUsuario } from '../../../core/models/documento.model';

export interface DocumentoAnotacion {
  id: string;
  documentoId: string;
  texto: string;
  posicionX: number;
  posicionY: number;
  creadoPor: string;
  fechaCreacion: string;
}

export interface DocumentoAdminView extends DocumentoUsuario {
  nombreUsuario?: string;
  emailUsuario?: string;
}

export interface EstadisticasDocumentos {
  totalDocumentos: number;
  pendientes: number;
  aprobados: number;
  rechazados: number;
  porTipo: Record<string, number>;
}

export interface DocumentoFiltros {
  estado?: string;
  tipoDocumentoId?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  usuarioId?: string;
  busqueda?: string;
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class AdminDocumentosService {
  private apiUrl = `${environment.apiUrl}/admin/documentos`;
  private http: {
    get: <T>(url: string, options?: { params?: HttpParams }) => Observable<T>;
    post: <T>(url: string, body: Record<string, unknown>) => Observable<T>;
    patch: <T>(url: string, body: Record<string, unknown>) => Observable<T>;
  };

  constructor() {
    // En una implementación real, se inyectaría HttpClient
    this.http = {
      get: <T>(_url: string, _options?: { params?: HttpParams }) => of({} as T),
      post: <T>(_url: string, _body: Record<string, unknown>) => of({} as T),
      patch: <T>(_url: string, _body: Record<string, unknown>) => of({} as T)
    };
  }

  /**
   * Obtiene todos los documentos con filtros y paginación
   * @param filtros Filtros a aplicar
   */
  getDocumentos(filtros?: DocumentoFiltros): Observable<{ documentos: DocumentoAdminView[], total: number }> {
    let params = new HttpParams();

    if (filtros) {
      if (filtros.estado) params = params.set('estado', filtros.estado);
      if (filtros.tipoDocumentoId) params = params.set('tipoDocumentoId', filtros.tipoDocumentoId);
      if (filtros.fechaDesde) params = params.set('fechaDesde', filtros.fechaDesde.toISOString());
      if (filtros.fechaHasta) params = params.set('fechaHasta', filtros.fechaHasta.toISOString());
      if (filtros.usuarioId) params = params.set('usuarioId', filtros.usuarioId);
      if (filtros.busqueda) params = params.set('busqueda', filtros.busqueda);
      if (filtros.page !== undefined) params = params.set('page', filtros.page.toString());
      if (filtros.size !== undefined) params = params.set('size', filtros.size.toString());
      if (filtros.sort) params = params.set('sort', filtros.sort);
      if (filtros.direction) params = params.set('direction', filtros.direction);
    }

    return this.http.get<{ content: DocumentoAdminView[], totalElements: number }>(`${this.apiUrl}`, { params }).pipe(
      map(response => ({
        documentos: response.content,
        total: response.totalElements
      })),
      catchError(error => {
        console.error('Error al obtener documentos:', error);
        return of({ documentos: [], total: 0 });
      })
    );
  }

  /**
   * Obtiene estadísticas de documentos
   */
  getEstadisticas(): Observable<EstadisticasDocumentos> {
    return this.http.get<EstadisticasDocumentos>(`${this.apiUrl}/estadisticas`).pipe(
      catchError(error => {
        console.error('Error al obtener estadísticas de documentos:', error);
        return of({
          totalDocumentos: 0,
          pendientes: 0,
          aprobados: 0,
          rechazados: 0,
          porTipo: {}
        });
      })
    );
  }

  /**
   * Aprueba un documento
   * @param documentoId ID del documento
   */
  aprobarDocumento(documentoId: string): Observable<DocumentoUsuario> {
    return this.http.patch<DocumentoUsuario>(`${this.apiUrl}/${documentoId}/aprobar`, {}).pipe(
      catchError(error => {
        console.error('Error al aprobar documento:', error);
        throw error;
      })
    );
  }

  /**
   * Rechaza un documento
   * @param documentoId ID del documento
   * @param motivo Motivo del rechazo
   */
  rechazarDocumento(documentoId: string, motivo: string): Observable<DocumentoUsuario> {
    return this.http.patch<DocumentoUsuario>(`${this.apiUrl}/${documentoId}/rechazar`, { motivo }).pipe(
      catchError(error => {
        console.error('Error al rechazar documento:', error);
        throw error;
      })
    );
  }

  /**
   * Añade una anotación a un documento
   * @param documentoId ID del documento
   * @param anotacion Texto de la anotación
   * @param posicionX Posición X de la anotación (0-100)
   * @param posicionY Posición Y de la anotación (0-100)
   */
  agregarAnotacion(documentoId: string, anotacion: string, posicionX: number, posicionY: number): Observable<DocumentoAnotacion> {
    return this.http.post<DocumentoAnotacion>(`${this.apiUrl}/${documentoId}/anotaciones`, {
      texto: anotacion,
      posicionX,
      posicionY
    }).pipe(
      catchError(error => {
        console.error('Error al agregar anotación:', error);
        throw error;
      })
    );
  }

  /**
   * Obtiene las anotaciones de un documento
   * @param documentoId ID del documento
   */
  getAnotaciones(documentoId: string): Observable<DocumentoAnotacion[]> {
    return this.http.get<DocumentoAnotacion[]>(`${this.apiUrl}/${documentoId}/anotaciones`).pipe(
      catchError(error => {
        console.error('Error al obtener anotaciones:', error);
        return of([]);
      })
    );
  }
}
