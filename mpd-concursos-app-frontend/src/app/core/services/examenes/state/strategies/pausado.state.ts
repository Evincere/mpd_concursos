import { Injectable, Inject } from '@angular/core';
import { IExamenState } from '@core/interfaces/examenes/state/examen-state.interface';
import { ExamenEnCurso, RespuestaUsuario } from '@shared/interfaces/examen/pregunta.interface';
import { Observable, of } from 'rxjs';
import { ExamenTimeService } from '../../examen-time.service';

@Injectable()
export class ExamenPausadoState implements IExamenState {
  constructor(
    @Inject('ExamenEnCurso') private examen: ExamenEnCurso,
    @Inject(ExamenTimeService) private timeService: ExamenTimeService
  ) {}

  iniciar(): void {
    throw new Error('No se puede iniciar un examen pausado');
  }

  pausar(): void {
    throw new Error('El examen ya está pausado');
  }

  reanudar(): void {
    this.examen.estado = 'EN_CURSO';
  }

  finalizar(): void {
    this.examen.estado = 'FINALIZADO';
  }

  guardarRespuesta(): void {
    throw new Error('No se pueden guardar respuestas mientras el examen está pausado');
  }

  getEstadoActual(): string {
    return 'PAUSADO';
  }

  puedeResponder(): boolean {
    return false;
  }

  puedeNavegar(): boolean {
    return false;
  }

  tiempoDisponible(): Observable<number> {
    return of(0); // En estado pausado, el tiempo se detiene
  }
}
