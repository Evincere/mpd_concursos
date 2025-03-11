import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEventType } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DocumentoUsuario, TipoDocumento, DocumentoResponse } from '../../models/documento.model';
import { map, filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DocumentosService {
  private apiUrl = `${environment.apiUrl}/documentos`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todos los documentos del usuario actual
   */
  getDocumentosUsuario(): Observable<DocumentoUsuario[]> {
    return this.http.get<DocumentoUsuario[]>(`${this.apiUrl}/usuario`);
  }

  /**
   * Obtiene los tipos de documento disponibles
   */
  getTiposDocumento(): Observable<TipoDocumento[]> {
    return this.http.get<TipoDocumento[]>(`${this.apiUrl}/tipos`);
  }

  /**
   * Carga un nuevo documento
   * @param formData Datos del formulario con el archivo y metadatos
   */
  uploadDocumento(formData: FormData): Observable<DocumentoResponse> {
    // No configuramos el Content-Type porque el navegador lo establecerá automáticamente
    // con el boundary correcto para multipart/form-data
    return this.http.post<DocumentoResponse>(`${this.apiUrl}/upload`, formData);
  }

  /**
   * Obtiene el archivo de un documento específico
   * @param documentoId ID del documento
   */
  getDocumentoFile(documentoId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${documentoId}/file`, {
      responseType: 'blob'
    });
  }

  /**
   * Elimina un documento
   * @param documentoId ID del documento a eliminar
   */
  deleteDocumento(documentoId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${documentoId}`);
  }

  /**
   * Actualiza un documento existente
   * @param documentoId ID del documento a actualizar
   * @param formData Nuevos datos del documento
   */
  updateDocumento(documentoId: string, formData: FormData): Observable<DocumentoResponse> {
    const headers = new HttpHeaders({
      'Accept': 'application/json'
    });
    return this.http.put<DocumentoResponse>(`${this.apiUrl}/${documentoId}`, formData, { headers });
  }
} 