import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Pregunta, PreguntaDTO, TipoPregunta } from '@shared/interfaces/examen/pregunta.interface';

@Injectable({
  providedIn: 'root'
})
export class PreguntasService {
  private apiUrl = `${environment.apiUrl}/preguntas`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todas las preguntas
   */
  getPreguntas(): Observable<Pregunta[]> {
    return this.http.get<PreguntaDTO[]>(this.apiUrl).pipe(
      map(preguntas => preguntas.map(pregunta => this.mapPreguntaFromDTO(pregunta))),
      catchError(error => {
        console.error('Error al obtener preguntas:', error);
        return throwError(() => new Error('No se pudieron cargar las preguntas'));
      })
    );
  }

  /**
   * Obtiene una pregunta por su ID
   */
  getPregunta(id: string): Observable<Pregunta> {
    return this.http.get<PreguntaDTO>(`${this.apiUrl}/${id}`).pipe(
      map(pregunta => this.mapPreguntaFromDTO(pregunta)),
      catchError(error => {
        console.error(`Error al obtener pregunta ${id}:`, error);
        return throwError(() => new Error('No se pudo cargar la pregunta'));
      })
    );
  }

  /**
   * Crea una nueva pregunta
   */
  crearPregunta(pregunta: Pregunta): Observable<Pregunta> {
    const preguntaDTO = this.mapPreguntaToDTO(pregunta);
    return this.http.post<PreguntaDTO>(this.apiUrl, preguntaDTO).pipe(
      map(response => this.mapPreguntaFromDTO(response)),
      catchError(error => {
        console.error('Error al crear pregunta:', error);
        return throwError(() => new Error('No se pudo crear la pregunta'));
      })
    );
  }

  /**
   * Actualiza una pregunta existente
   */
  actualizarPregunta(id: string, pregunta: Pregunta): Observable<Pregunta> {
    const preguntaDTO = this.mapPreguntaToDTO(pregunta);
    return this.http.put<PreguntaDTO>(`${this.apiUrl}/${id}`, preguntaDTO).pipe(
      map(response => this.mapPreguntaFromDTO(response)),
      catchError(error => {
        console.error(`Error al actualizar pregunta ${id}:`, error);
        return throwError(() => new Error('No se pudo actualizar la pregunta'));
      })
    );
  }

  /**
   * Elimina una pregunta
   */
  eliminarPregunta(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`Error al eliminar pregunta ${id}:`, error);
        return throwError(() => new Error('No se pudo eliminar la pregunta'));
      })
    );
  }

  /**
   * Asigna preguntas a un examen
   */
  asignarPreguntasAExamen(examenId: string, preguntaIds: string[]): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/examenes/${examenId}/preguntas`, { preguntaIds }).pipe(
      catchError(error => {
        console.error(`Error al asignar preguntas al examen ${examenId}:`, error);
        return throwError(() => new Error('No se pudieron asignar las preguntas al examen'));
      })
    );
  }

  /**
   * Mapea un DTO de pregunta a la interfaz Pregunta
   */
  private mapPreguntaFromDTO(dto: PreguntaDTO): Pregunta {
    return {
      id: dto.id,
      texto: dto.text,
      tipo: dto.type as TipoPregunta,
      opciones: dto.options?.map((opcion, index) => ({
        id: opcion.id,
        texto: opcion.text,
        orden: opcion.order || index + 1
      })) || [],
      puntaje: dto.score,
      orden: dto.order
    };
  }

  /**
   * Mapea una Pregunta a un DTO
   */
  private mapPreguntaToDTO(pregunta: Pregunta): PreguntaDTO {
    return {
      id: pregunta.id,
      text: pregunta.texto,
      type: pregunta.tipo,
      options: pregunta.opciones?.map(opcion => ({
        id: opcion.id,
        text: opcion.texto,
        order: opcion.orden
      })) || [],
      score: pregunta.puntaje,
      order: pregunta.orden
    };
  }
}
