import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IExamenState } from '@core/interfaces/examenes/state/examen-state.interface';
import { ExamenEnCurso } from '@shared/interfaces/examen/pregunta.interface';
import { ExamenEnCursoState } from './strategies/en-curso.state';
import { ExamenPausadoState } from './strategies/pausado.state';
import { ExamenFinalizadoState } from './strategies/finalizado.state';
import { ExamenTimeService } from '../examen-time.service';
import { EXAMEN_TOKEN } from '@core/tokens/examen.token';

@Injectable({
  providedIn: 'root'
})
export class ExamenStateService {
  private currentState$ = new BehaviorSubject<IExamenState | null>(null);
  private examen: ExamenEnCurso | null = null;

  constructor(
    @Inject(ExamenTimeService) private timeService: ExamenTimeService
  ) {}

  initializeState(examen: ExamenEnCurso): void {
    this.examen = examen;
    const stateFactory = this.createStateFactory(examen);

    switch (examen.estado) {
      case 'EN_CURSO':
        this.setState(stateFactory.createEnCursoState());
        break;
      case 'PAUSADO':
        this.setState(stateFactory.createPausadoState());
        break;
      case 'FINALIZADO':
        this.setState(stateFactory.createFinalizadoState());
        break;
      default:
        throw new Error(`Estado no válido: ${examen.estado}`);
    }
  }

  private createStateFactory(examen: ExamenEnCurso) {
    return {
      createEnCursoState: () => new ExamenEnCursoState(examen, this.timeService),
      createPausadoState: () => new ExamenPausadoState(examen, this.timeService),
      createFinalizadoState: () => new ExamenFinalizadoState(this.timeService)
    };
  }

  private setState(state: IExamenState): void {
    this.currentState$.next(state);
  }

  getCurrentState(): Observable<IExamenState | null> {
    return this.currentState$.asObservable();
  }
}
