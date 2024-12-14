import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Inscripcion } from '@shared/interfaces/inscripcion/inscripcion.interface';

@Injectable({
  providedIn: 'root'
})
export class InscripcionService {
  private apiUrl = `${environment.apiUrl}/inscripciones`;

  constructor(private http: HttpClient) { }

  inscribirseAConcurso(concursoId: string): Observable<Inscripcion> {
    return this.http.post<Inscripcion>(`${this.apiUrl}`, { concursoId });
  }

  getInscripcionesUsuario(): Observable<Inscripcion[]> {
    return this.http.get<Inscripcion[]>(`${this.apiUrl}/usuario`);
  }

  getInscripcionesConcurso(concursoId: string): Observable<Inscripcion[]> {
    return this.http.get<Inscripcion[]>(`${this.apiUrl}/concurso/${concursoId}`);
  }

  cancelarInscripcion(inscripcionId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${inscripcionId}`);
  }

  actualizarEstadoInscripcion(inscripcionId: string, estado: string, observaciones?: string): Observable<Inscripcion> {
    return this.http.patch<Inscripcion>(`${this.apiUrl}/${inscripcionId}/estado`, {
      estado,
      observaciones
    });
  }
}
