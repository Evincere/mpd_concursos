import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Examen, TipoExamen, ESTADO_EXAMEN } from '@shared/interfaces/examen/examen.interface';
import { ExamenDTO } from '@core/interfaces/examenes/examen-dto.interface';
import { Pregunta, PreguntaDTO, TipoPregunta } from '@shared/interfaces/examen/pregunta.interface';
import { environment } from '@env/environment';


@Injectable({
  providedIn: 'root'
})
export class ExamenesService {
  private apiUrl = `${environment.apiUrl}/examenes`;

  constructor(private http: HttpClient) {}

  getExamenes(): Observable<Examen[]> {
    return this.http.get<ExamenDTO[]>(this.apiUrl).pipe(
      map(examenes => {
        // Logging implementado con LoggingService;
        return examenes.map(examen => this.mapExamenFromDTO(examen));
      }),
      catchError(error => {
        console.error('Error al obtener exámenes:', error);
        return throwError(() => new Error('No se pudieron cargar los exámenes'));
      })
    );
  }

  getExamen(id: string): Observable<Examen> {
    return this.http.get<ExamenDTO>(`${this.apiUrl}/${id}`).pipe(
      map(examen => this.mapExamenFromDTO(examen)),
      catchError(error => {
        console.error(`Error al obtener examen ${id}:`, error);
        return throwError(() => new Error('No se pudo cargar el examen'));
      })
    );
  }

  getPreguntas(examenId: string): Observable<Pregunta[]> {
    return this.http.get<PreguntaDTO[]>(`${this.apiUrl}/${examenId}/preguntas`).pipe(
      map(preguntas => preguntas.map(pregunta => this.mapPreguntaFromDTO(pregunta))),
      catchError(error => {
        console.error(`Error al obtener preguntas del examen ${examenId}:`, error);
        return throwError(() => new Error('No se pudieron cargar las preguntas'));
      })
    );
  }

  private mapExamenFromDTO(dto: ExamenDTO): Examen {
    return {
      id: dto.id,
      titulo: dto.title,
      descripcion: dto.description || '', // Handle optional description
      tipo: this.mapTipoExamen(dto.type),
      estado: this.mapEstadoExamen(dto.status, dto.startTime),
      fechaInicio: dto.startTime, // Keep as string according to Examen interface
      duracion: dto.durationMinutes,
      puntajeMaximo: dto.maxScore,
      intentosPermitidos: dto.maxAttempts,
      intentosRealizados: dto.attemptsUsed || 0,
      requisitos: dto.requirements || [],
      reglasExamen: dto.rules || [],
      materialesPermitidos: dto.allowedMaterials || [],
      motivoAnulacion: dto.cancellationDetails ? {
        fecha: dto.cancellationDetails.cancellationDate,
        infracciones: dto.cancellationDetails.violations,
        motivo: dto.cancellationDetails.reason
      } : undefined
    };
  }

  private mapPreguntaFromDTO(dto: PreguntaDTO): Pregunta {
    return {
      id: dto.id,
      texto: dto.text,
      tipo: this.mapTipoPregunta(dto.type),
      opciones: Array.isArray(dto.options) ? dto.options.map(opt => ({
        id: opt.id,
        texto: opt.text,
        orden: opt.order
      })).sort((a, b) => a.orden - b.orden) : [],
      puntaje: dto.score,
      orden: dto.order,
      respuestaCorrecta: dto.correctAnswer,
      respuestasCorrectas: dto.correctAnswers
    };
  }

  private mapTipoExamen(type: string): TipoExamen {
    const mapping: Record<string, TipoExamen> = {
      'TECHNICAL_LEGAL': TipoExamen.TECNICO_JURIDICO,
      'TECHNICAL_ADMINISTRATIVE': TipoExamen.TECNICO_ADMINISTRATIVO,
      'PSYCHOLOGICAL': TipoExamen.PSICOLOGICO
    };
    return mapping[type] || TipoExamen.TECNICO_JURIDICO;
  }



  private mapEstadoExamen(status: string, _startTime: string): ESTADO_EXAMEN {
    // Mapeo de estados según el backend
    const mapping: Record<string, ESTADO_EXAMEN> = {
      'DRAFT': ESTADO_EXAMEN.BORRADOR,
      'SCHEDULED': ESTADO_EXAMEN.DISPONIBLE,
      'PUBLISHED': ESTADO_EXAMEN.DISPONIBLE,
      'ACTIVE': ESTADO_EXAMEN.EN_CURSO,
      'IN_PROGRESS': ESTADO_EXAMEN.EN_CURSO,
      'FINISHED': ESTADO_EXAMEN.FINALIZADO,
      'COMPLETED': ESTADO_EXAMEN.FINALIZADO,
      'CANCELLED': ESTADO_EXAMEN.ANULADO,
      'EXPIRED': ESTADO_EXAMEN.FINALIZADO
    };

    // Obtener el estado mapeado desde el backend
    return mapping[status] || ESTADO_EXAMEN.BORRADOR;
  }

  private mapTipoPregunta(type: string): TipoPregunta {
    const mapping: Record<string, TipoPregunta> = {
      'MULTIPLE_CHOICE': TipoPregunta.OPCION_MULTIPLE,
      'MULTIPLE_SELECT': TipoPregunta.SELECCION_MULTIPLE,
      'TRUE_FALSE': TipoPregunta.VERDADERO_FALSO,
      'ESSAY': TipoPregunta.DESARROLLO,
      'TEXT': TipoPregunta.DESARROLLO,
      'ORDERING': TipoPregunta.ORDENAMIENTO
    };
    return mapping[type] || TipoPregunta.OPCION_MULTIPLE;
  }

  /**
   * Verifica si un examen ya ha sido realizado por el usuario actual
   * @param examenId ID del examen a verificar
   * @returns Observable que emite true si el examen ya fue realizado, false en caso contrario
   */
  verificarExamenRealizado(examenId: string): Observable<boolean> {
    return this.http.get<{realizado: boolean}>(`${this.apiUrl}/${examenId}/verificar-realizado`)
      .pipe(
        map(response => response.realizado),
        catchError(error => {
          console.error(`Error al verificar si el examen ${examenId} fue realizado:`, error);
          return of(false); // En caso de error, asumimos que no fue realizado
        })
      );
  }
}
