import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import {
  ContestDocumentAvailability,
  ContestDocumentType,
  ContestDocumentAvailabilityResponse,
  ContestDocumentDownloadConfig,
  ContestDocumentUtils
} from '../../../shared/interfaces/concurso/contest-document.interface';

import { environment } from '../../../../environments/environment';

/**
 * Servicio para gestionar documentos de concursos
 *
 * Proporciona funcionalidades para:
 * - Verificar disponibilidad de documentos (bases y descripción)
 * - Descargar/visualizar documentos
 * - Generar URLs de descarga
 *
 * @author MPD Development Team
 * @version 1.0
 * @since 2025-07
 */
@Injectable({
  providedIn: 'root'
})
export class ContestDocumentService {

  private readonly baseUrl = `${environment.apiUrl}/contest-documents`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la disponibilidad de documentos para un concurso específico
   *
   * @param contestId ID del concurso
   * @returns Observable con información de disponibilidad
   */
  getDocumentAvailability(contestId: number): Observable<ContestDocumentAvailability> {
    const url = `${this.baseUrl}/${contestId}/availability`;

    console.log(`[ContestDocumentService] Solicitando disponibilidad para concurso ${contestId}`);

    return this.http.get<ContestDocumentAvailabilityResponse>(url).pipe(
      map(response => this.mapAvailabilityResponse(response)),
      catchError(error => this.handleError('getDocumentAvailability', error))
    );
  }

  /**
   * Descarga o visualiza un documento específico
   *
   * @param contestId ID del concurso
   * @param documentType Tipo de documento a descargar
   * @param openInNewWindow Si debe abrirse en nueva ventana (default: true)
   */
  downloadDocument(contestId: number, documentType: ContestDocumentType, openInNewWindow: boolean = true): void {
    const config: ContestDocumentDownloadConfig = {
      contestId,
      documentType,
      openInNewWindow
    };

    this.performDownload(config);
  }

  /**
   * Descarga las bases de un concurso
   *
   * @param contestId ID del concurso
   * @param openInNewWindow Si debe abrirse en nueva ventana (default: true)
   */
  downloadBases(contestId: number, openInNewWindow: boolean = true): void {
    this.downloadDocument(contestId, ContestDocumentType.BASES, openInNewWindow);
  }

  /**
   * Descarga la descripción del puesto de un concurso
   *
   * @param contestId ID del concurso
   * @param openInNewWindow Si debe abrirse en nueva ventana (default: true)
   */
  downloadDescription(contestId: number, openInNewWindow: boolean = true): void {
    this.downloadDocument(contestId, ContestDocumentType.DESCRIPTION, openInNewWindow);
  }

  /**
   * Abre un documento en una nueva pestaña (alias para downloadDocument)
   *
   * @param contestId ID del concurso
   * @param documentType Tipo de documento
   */
  openDocumentInNewTab(contestId: number, documentType: ContestDocumentType): void {
    this.downloadDocument(contestId, documentType, true);
  }

  /**
   * Genera la URL de descarga para un documento específico
   *
   * @param contestId ID del concurso
   * @param documentType Tipo de documento
   * @returns URL completa de descarga
   */
  generateDownloadUrl(contestId: number, documentType: ContestDocumentType): string {
    const baseUrl = environment.apiUrl.replace('/api', '');
    const relativePath = ContestDocumentUtils.generateDownloadUrl(contestId, documentType);
    return `${baseUrl}${relativePath}`;
  }

  /**
   * Verifica si un documento específico está disponible
   *
   * @param contestId ID del concurso
   * @param documentType Tipo de documento
   * @returns Observable con el estado de disponibilidad
   */
  isDocumentAvailable(contestId: number, documentType: ContestDocumentType): Observable<boolean> {
    return this.getDocumentAvailability(contestId).pipe(
      map(availability => {
        switch (documentType) {
          case ContestDocumentType.BASES:
            return availability.basesAvailable;
          case ContestDocumentType.DESCRIPTION:
            return availability.descriptionAvailable;
          default:
            return false;
        }
      })
    );
  }

  /**
   * Realiza la descarga efectiva del documento
   *
   * @private
   * @param config Configuración de descarga
   */
  private performDownload(config: ContestDocumentDownloadConfig): void {
    const url = this.generateDownloadUrl(config.contestId, config.documentType);
    const documentName = ContestDocumentUtils.getDocumentTypeName(config.documentType);

    console.log(`[ContestDocumentService] Descargando ${documentName} para concurso ${config.contestId}`);
    console.log(`[ContestDocumentService] URL: ${url}`);

    if (config.openInNewWindow !== false) {
      // Abrir en nueva ventana/pestaña (comportamiento por defecto)
      const newWindow = window.open(url, '_blank');

      if (!newWindow) {
        console.warn('[ContestDocumentService] No se pudo abrir nueva ventana. Intentando descarga directa.');
        this.forceDirectDownload(url);
      }
    } else {
      // Descarga directa en la misma ventana
      this.forceDirectDownload(url);
    }
  }

  /**
   * Fuerza una descarga directa del archivo
   *
   * @private
   * @param url URL del archivo
   */
  private forceDirectDownload(url: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Mapea la respuesta del backend a la interfaz del frontend
   *
   * @private
   * @param response Respuesta del backend
   * @returns Objeto mapeado para el frontend
   */
  private mapAvailabilityResponse(response: ContestDocumentAvailabilityResponse): ContestDocumentAvailability {
    return {
      contestId: response.contestId,
      basesAvailable: response.basesAvailable,
      descriptionAvailable: response.descriptionAvailable,
      basesUrl: response.basesUrl,
      descriptionUrl: response.descriptionUrl,
      message: response.message
    };
  }

  /**
   * Maneja errores de las peticiones HTTP
   *
   * @private
   * @param operation Nombre de la operación que falló
   * @param error Error ocurrido
   * @returns Observable con error procesado
   */
  private handleError(operation: string, error: HttpErrorResponse): Observable<never> {
    console.error(`[ContestDocumentService] Error en ${operation}:`, error);

    let errorMessage = 'Error al comunicarse con el servidor';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error de red: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      switch (error.status) {
        case 404:
          errorMessage = 'Documentos no encontrados';
          break;
        case 401:
          errorMessage = 'No autorizado para acceder a los documentos';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        default:
          errorMessage = `Error del servidor: ${error.status}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
