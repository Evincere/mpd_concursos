import { Injectable, Inject } from '@angular/core';
import { IExamenState } from '@core/interfaces/examenes/state/examen-state.interface';
import { ExamenEnCurso, RespuestaUsuario } from '@shared/interfaces/examen/pregunta.interface';
import { Observable, of } from 'rxjs';
import { ExamenTimeService } from '../../examen-time.service';

@Injectable()
export class ExamenFinalizadoState implements IExamenState {
  constructor(
    @Inject(ExamenTimeService) private timeService: ExamenTimeService
  ) {}

  iniciar(): void {
    throw new Error('No se puede iniciar un examen finalizado');
  }

  pausar(): void {
    throw new Error('No se puede pausar un examen finalizado');
  }

  reanudar(): void {
    throw new Error('No se puede reanudar un examen finalizado');
  }

  finalizar(): void {
    throw new Error('El examen ya está finalizado');
  }

  guardarRespuesta(): void {
    throw new Error('No se pueden modificar las respuestas de un examen finalizado');
  }

  getEstadoActual(): string {
    return 'FINALIZADO';
  }

  puedeResponder(): boolean {
    return false;
  }

  puedeNavegar(): boolean {
    return true; // Permite navegar para revisar respuestas
  }

  tiempoDisponible(): Observable<number> {
    return of(0);
  }
}
