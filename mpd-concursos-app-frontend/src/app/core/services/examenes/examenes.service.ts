import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Examen, ExamenDTO, TipoExamen, ESTADO_EXAMEN } from '@shared/interfaces/examen/examen.interface';
import { Pregunta, PreguntaDTO, TipoPregunta } from '@shared/interfaces/examen/pregunta.interface';
import { environment } from '@env/environment';
import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';

@Injectable({
  providedIn: 'root'
})
export class ExamenesService {
  private apiUrl = `${environment.apiUrl}/examenes`;

  constructor(private http: HttpClient) {}

  getExamenes(): Observable<Examen[]> {
    return this.http.get<ExamenDTO[]>(this.apiUrl).pipe(
      map(examenes => examenes.map(examen => this.mapExamenFromDTO(examen))),
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
    return this.http.get<PreguntaDTO[]>(`${this.apiUrl}/${examenId}/questions`).pipe(
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
      descripcion: dto.description || undefined,
      tipo: this.mapTipoExamen(dto.type),
      estado: this.mapEstadoExamen(dto.status),
      fechaInicio: dto.startTime,
      fechaFin: dto.endTime,
      duracion: dto.durationMinutes,
      puntajeMaximo: dto.maxScore,
      intentosPermitidos: dto.maxAttempts,
      intentosRealizados: dto.attemptsUsed,
      requisitos: dto.requirements,
      reglasExamen: dto.examRules,
      materialesPermitidos: dto.allowedMaterials,
      motivoAnulacion: dto.cancellationDetails ? {
        fecha: dto.cancellationDetails.cancellationDate,
        infracciones: dto.cancellationDetails.violations,
        motivo: dto.cancellationDetails.reason || undefined
      } : undefined
    };
  }

  private mapPreguntaFromDTO(dto: PreguntaDTO): Pregunta {
    return {
      id: dto.id,
      texto: dto.text,
      tipo: this.mapTipoPregunta(dto.type),
      opciones: dto.options?.map(opt => ({
        id: opt.id,
        texto: opt.text,
        orden: opt.order
      })),
      puntaje: dto.score,
      orden: dto.order,
      respuestaCorrecta: dto.correctAnswer,
      respuestasCorrectas: dto.correctAnswers
    };
  }

  private mapTipoExamen(type: string): TipoExamen {
    const mapping: { [key: string]: TipoExamen } = {
      'TECHNICAL_LEGAL': TipoExamen.TECNICO_JURIDICO,
      'TECHNICAL_ADMINISTRATIVE': TipoExamen.TECNICO_ADMINISTRATIVO,
      'PSYCHOLOGICAL': TipoExamen.PSICOLOGICO
    };
    return mapping[type] || TipoExamen.TECNICO_JURIDICO;
  }

  private mapEstadoExamen(status: string): ESTADO_EXAMEN {
    const mapping: { [key: string]: ESTADO_EXAMEN } = {
      'DRAFT': ESTADO_EXAMEN.BORRADOR,
      'SCHEDULED': ESTADO_EXAMEN.DISPONIBLE,
      'ACTIVE': ESTADO_EXAMEN.EN_CURSO,
      'FINISHED': ESTADO_EXAMEN.FINALIZADO,
      'CANCELLED': ESTADO_EXAMEN.ANULADO
    };
    return mapping[status] || ESTADO_EXAMEN.BORRADOR;
  }

  private mapTipoPregunta(type: string): TipoPregunta {
    const mapping: { [key: string]: TipoPregunta } = {
      'MULTIPLE_CHOICE': TipoPregunta.OPCION_MULTIPLE,
      'MULTIPLE_SELECT': TipoPregunta.SELECCION_MULTIPLE,
      'TRUE_FALSE': TipoPregunta.VERDADERO_FALSO,
      'ESSAY': TipoPregunta.DESARROLLO,
      'ORDERING': TipoPregunta.ORDENAMIENTO
    };
    return mapping[type] || TipoPregunta.OPCION_MULTIPLE;
  }
}
