import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Examen, TipoExamen, ESTADO_EXAMEN } from '@shared/interfaces/examen/examen.interface';
import { ExamenDTO } from '@core/interfaces/examenes/examen-dto.interface';
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
      map(examenes => {
        console.log('Datos recibidos del backend (sin procesar):', JSON.stringify(examenes));
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
    console.log(`Solicitando preguntas para examen ${examenId}`);
    return this.http.get<PreguntaDTO[]>(`${this.apiUrl}/${examenId}/questions`).pipe(
      map(preguntas => {
        console.log('DTO recibido del backend:', preguntas);
        const preguntasMapeadas = preguntas.map(pregunta => {
          console.log('Mapeando pregunta:', pregunta);
          const preguntaMapeada = this.mapPreguntaFromDTO(pregunta);
          console.log('Pregunta mapeada:', preguntaMapeada);
          return preguntaMapeada;
        });
        console.log('Preguntas mapeadas:', preguntasMapeadas);
        return preguntasMapeadas;
      }),
      catchError(error => {
        console.error(`Error al obtener preguntas del examen ${examenId}:`, error);
        return throwError(() => new Error('No se pudieron cargar las preguntas'));
      })
    );
  }

  private mapExamenFromDTO(dto: ExamenDTO): Examen {
    console.log('DTO recibido del backend:', {
      requirements: dto.requirements,
      rules: dto.rules,
      allowedMaterials: dto.allowedMaterials
    });

    const examen: Examen = {
      id: dto.id,
      titulo: dto.title,
      descripcion: dto.description || '',
      tipo: this.mapTipoExamen(dto.type),
      estado: this.mapEstadoExamen(dto.status, dto.startTime),
      fechaInicio: dto.startTime,
      duracion: dto.durationMinutes,
      puntajeMaximo: dto.maxScore,
      intentosPermitidos: dto.maxAttempts,
      intentosRealizados: dto.attemptsUsed,
      requisitos: dto.requirements || [],
      reglasExamen: dto.rules || [],
      materialesPermitidos: dto.allowedMaterials || [],
      motivoAnulacion: dto.cancellationDetails ? {
        fecha: dto.cancellationDetails.cancellationDate,
        infracciones: dto.cancellationDetails.violations,
        motivo: dto.cancellationDetails.reason
      } : undefined
    };

    console.log('Examen mapeado:', {
      requisitos: examen.requisitos,
      reglasExamen: examen.reglasExamen,
      materialesPermitidos: examen.materialesPermitidos
    });

    return examen;
  }

  private mapPreguntaFromDTO(dto: PreguntaDTO): Pregunta {
    console.log('Mapeando DTO:', dto);
    if (!dto.options) {
      console.warn('La pregunta no tiene opciones definidas:', dto.id);
    }
    const pregunta = {
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
    console.log('Resultado del mapeo:', pregunta);
    return pregunta;
  }

  private mapTipoExamen(type: string): TipoExamen {
    const mapping: { [key: string]: TipoExamen } = {
      'TECHNICAL_LEGAL': TipoExamen.TECNICO_JURIDICO,
      'TECHNICAL_ADMINISTRATIVE': TipoExamen.TECNICO_ADMINISTRATIVO,
      'PSYCHOLOGICAL': TipoExamen.PSICOLOGICO
    };
    return mapping[type] || TipoExamen.TECNICO_JURIDICO;
  }

  private parseLocalDateTime(dateStr: string): Date | null {
    try {
      // Si la fecha ya tiene información de zona horaria
      if (dateStr.includes('Z') || dateStr.includes('+') || dateStr.includes('-')) {
        const date = new Date(dateStr);
        // Convertir de UTC a hora local
        return new Date(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          date.getUTCHours(),
          date.getUTCMinutes(),
          date.getUTCSeconds()
        );
      }

      // Para fechas sin zona horaria, mantenerlas en hora local
      const [datePart, timePart = '00:00:00'] = dateStr.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes, seconds] = timePart.split(':').map(Number);

      const localDate = new Date(year, month - 1, day, hours, minutes, seconds);
      console.log('Fecha parseada:', {
        original: dateStr,
        parsed: localDate.toISOString(),
        localString: localDate.toLocaleString(),
        offset: localDate.getTimezoneOffset()
      });

      return localDate;
    } catch (error) {
      console.error('Error parseando fecha:', error, {
        dateStr,
        isUTC: dateStr.includes('Z') || dateStr.includes('+') || dateStr.includes('-')
      });
      return null;
    }
  }

  private mapEstadoExamen(status: string, fechaInicio: string): ESTADO_EXAMEN {
    const ahora = new Date();
    const fechaInicioDate = new Date(fechaInicio);

    // Mapeo de estados según el backend
    const mapping: { [key: string]: ESTADO_EXAMEN } = {
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
    const estadoMapeado = mapping[status] || ESTADO_EXAMEN.BORRADOR;

    // Para exámenes PUBLISHED o SCHEDULED, siempre mostrarlos como DISPONIBLE
    if (status === 'PUBLISHED' || status === 'SCHEDULED') {
      console.log(`Examen con estado ${status} y fecha ${fechaInicio} mapeado a DISPONIBLE`);
      return ESTADO_EXAMEN.DISPONIBLE;
    }

    // Para otros estados, aplicar la lógica normal
    console.log(`Examen con estado ${status} y fecha ${fechaInicio} mapeado a ${estadoMapeado}`);
    return estadoMapeado;
  }

  private mapTipoPregunta(type: string): TipoPregunta {
    const mapping: { [key: string]: TipoPregunta } = {
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
