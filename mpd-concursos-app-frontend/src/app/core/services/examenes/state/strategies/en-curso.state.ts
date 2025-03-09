import { Injectable, Inject } from '@angular/core';
import { IExamenState } from '@core/interfaces/examenes/state/examen-state.interface';
import { ExamenEnCurso, RespuestaUsuario } from '@shared/interfaces/examen/pregunta.interface';
import { Observable, of } from 'rxjs';
import { ExamenTimeService } from '@core/services/examenes/examen-time.service';
import { EXAMEN_TOKEN } from '@core/tokens/examen.token';

@Injectable()
export class ExamenEnCursoState implements IExamenState {
  private examen: ExamenEnCurso;
  private timeService: ExamenTimeService;

  constructor(
    @Inject(EXAMEN_TOKEN) examen: ExamenEnCurso,
    @Inject(ExamenTimeService) timeService: ExamenTimeService
  ) {
    this.examen = examen;
    this.timeService = timeService;
  }

  iniciar(): void {
    throw new Error('El examen ya está en curso');
  }

  pausar(): void {
    this.examen.estado = 'PAUSADO';
  }

  reanudar(): void {
    throw new Error('El examen ya está en curso');
  }

  finalizar(): void {
    this.examen.estado = 'FINALIZADO';
  }

  guardarRespuesta(respuesta: RespuestaUsuario): void {
    const respuestas = [...this.examen.respuestas];
    const index = respuestas.findIndex(r => r.preguntaId === respuesta.preguntaId);

    if (index >= 0) {
      respuestas[index] = {
        ...respuesta,
        timestamp: new Date().toISOString(),
        intentos: (respuestas[index].intentos || 0) + 1
      };
    } else {
      respuestas.push({
        ...respuesta,
        timestamp: new Date().toISOString(),
        intentos: 1
      });
    }

    this.examen.respuestas = respuestas;
  }

  getEstadoActual(): string {
    return 'EN_CURSO';
  }

  puedeResponder(): boolean {
    return true;
  }

  puedeNavegar(): boolean {
    return true;
  }

  tiempoDisponible(): Observable<number> {
    return of(this.timeService.getTimeRemaining());
  }
}
