import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { LoggingService } from '@core/services/logging/logging.service';
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
  dniUsuario?: string;
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
  // Nuevos filtros
  userSearch?: string; // Búsqueda por usuario (DNI, nombre, email)
  documentCategory?: string; // Categoría del documento (OBLIGATORY, CV_PROOF, OPTIONAL)
  search?: string; // Búsqueda general
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface PagedDocumentResponse {
  content: DocumentoAdminView[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminDocumentosService {
  private apiUrl = `${environment.apiUrl}/admin/documentos`;

  constructor(
    private http: HttpClient,
    private loggingService: LoggingService
  ) {}

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

    return this.http.get<PagedDocumentResponse>(`${this.apiUrl}`, { params }).pipe(
      map(response => ({
        documentos: response.content || [],
        total: response.totalElements || 0
      })),
      catchError(error => {
        this.loggingService.error('Error al obtener documentos', error);
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
        this.loggingService.error('Error al obtener estadísticas de documentos', error);
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
   * @param comentarios Comentarios opcionales
   */
  aprobarDocumento(documentoId: string, comentarios?: string): Observable<DocumentoUsuario> {
    const body = { estado: 'APPROVED', comentarios };
    return this.http.patch<DocumentoUsuario>(`${this.apiUrl}/${documentoId}/estado`, body).pipe(
      catchError(error => {
        this.loggingService.error('Error al aprobar documento', error);
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
    const body = { estado: 'REJECTED', comentarios: motivo };
    return this.http.patch<DocumentoUsuario>(`${this.apiUrl}/${documentoId}/estado`, body).pipe(
      catchError(error => {
        this.loggingService.error('Error al rechazar documento', error);
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
        this.loggingService.error('Error al agregar anotación', error);
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
        this.loggingService.error('Error al obtener anotaciones', error);
        console.error('Error al obtener anotaciones:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtiene toda la documentación de un usuario específico
   */
  getUserDocumentation(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/usuario/${userId}/documentacion`)
      .pipe(
        catchError(error => {
          this.loggingService.error(`Error obteniendo documentación del usuario ${userId}`, error);
          throw error;
        })
      );
  }

  /**
   * Obtiene el historial de cambios de documentos de un usuario
   */
  getUserDocumentHistory(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/usuario/${userId}/historial`)
      .pipe(
        catchError(error => {
          this.loggingService.error(`Error obteniendo historial de documentos del usuario ${userId}`, error);
          throw error;
        })
      );
  }


}
