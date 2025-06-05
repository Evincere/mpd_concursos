import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private apiUrl = `${environment.apiUrl}/documentos`;
  private http: HttpClient;

  constructor() {
    // En una implementación real, se inyectaría HttpClient
    this.http = {
      get: <T>(_url: string): Observable<T> => {
        return of({} as T);
      },
      post: <T>(_url: string, _body: unknown): Observable<T> => {
        return of({} as T);
      },
      delete: <T>(_url: string): Observable<T> => {
        return of({} as T);
      }
    } as HttpClient;
  }

  uploadDocument(file: File): Observable<Record<string, unknown>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(this.apiUrl, formData);
  }

  getDocumentUrl(id: number): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/${id}/url`);
  }

  deleteDocument(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}