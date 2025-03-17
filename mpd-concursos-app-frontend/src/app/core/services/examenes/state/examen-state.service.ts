import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { IExamenState } from '@core/interfaces/examenes/state/examen-state.interface';
import { ExamenEnCurso, Pregunta, RespuestaUsuario } from '@shared/interfaces/examen/pregunta.interface';
import { ExamenEnCursoState } from './strategies/en-curso.state';
import { ExamenPausadoState } from './strategies/pausado.state';
import { ExamenFinalizadoState } from './strategies/finalizado.state';
import { ExamenTimeService } from '../examen-time.service';

@Injectable({
  providedIn: 'root'
})
export class ExamenStateService {
  // Fuente única de verdad para el estado del examen
  private examenState$ = new BehaviorSubject<ExamenEnCurso | null>(null);

  // Estado de la estrategia actual (patrón State)
  private currentState$ = new BehaviorSubject<IExamenState | null>(null);

  // Estado de las preguntas
  private preguntas$ = new BehaviorSubject<Pregunta[]>([]);

  // Pregunta actual
  private preguntaActual$ = new BehaviorSubject<Pregunta | null>(null);

  // Tiempo restante (delegado a TimeService pero expuesto aquí)
  private tiempoRestante$ = new BehaviorSubject<number>(0);

  constructor(
    @Inject(ExamenTimeService) private timeService: ExamenTimeService
  ) {}

  // Inicialización del estado
  initializeState(examen: ExamenEnCurso): void {
    this.examenState$.next(examen);

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

  // Métodos para actualizar el estado
  setPreguntas(preguntas: Pregunta[]): void {
    this.preguntas$.next(preguntas);
    this.actualizarPreguntaActual();
  }

  setPreguntaActual(indice: number): void {
    const examen = this.examenState$.value;
    if (!examen) return;

    const examenActualizado = {
      ...examen,
      preguntaActual: indice
    };

    this.examenState$.next(examenActualizado);
    this.actualizarPreguntaActual();
  }

  guardarRespuesta(respuesta: RespuestaUsuario): void {
    try {
      const examen = this.examenState$.value;
      if (!examen) {
        console.warn('No hay examen en curso para guardar respuesta');
        return;
      }

      const respuestas = [...examen.respuestas];
      const index = respuestas.findIndex(r => r.preguntaId === respuesta.preguntaId);

      if (index >= 0) {
        respuestas[index] = { ...respuesta, intentos: (respuestas[index].intentos || 0) + 1 };
      } else {
        respuestas.push({ ...respuesta, intentos: 1 });
      }

      this.examenState$.next({
        ...examen,
        respuestas
      });
    } catch (error) {
      console.error('Error al guardar respuesta en el estado:', error);
    }
  }

  cambiarEstadoExamen(estado: 'EN_CURSO' | 'PAUSADO' | 'FINALIZADO'): void {
    const examen = this.examenState$.value;
    if (!examen) return;

    const examenActualizado = {
      ...examen,
      estado
    };

    this.examenState$.next(examenActualizado);

    // Actualizar la estrategia de estado
    const stateFactory = this.createStateFactory(examenActualizado);

    switch (estado) {
      case 'EN_CURSO':
        this.setState(stateFactory.createEnCursoState());
        break;
      case 'PAUSADO':
        this.setState(stateFactory.createPausadoState());
        break;
      case 'FINALIZADO':
        this.setState(stateFactory.createFinalizadoState());
        break;
    }
  }

  actualizarTiempoRestante(tiempo: number): void {
    this.tiempoRestante$.next(tiempo);
  }

  // Métodos para obtener el estado
  getExamenEnCurso(): Observable<ExamenEnCurso | null> {
    return this.examenState$.asObservable();
  }

  getPreguntas(): Observable<Pregunta[]> {
    return this.preguntas$.asObservable();
  }

  getPreguntaActual(): Observable<Pregunta | null> {
    return this.preguntaActual$.asObservable();
  }

  getTiempoRestante(): Observable<number> {
    return this.tiempoRestante$.asObservable();
  }

  getCurrentState(): Observable<IExamenState | null> {
    return this.currentState$.asObservable();
  }

  // Métodos auxiliares
  private actualizarPreguntaActual(): void {
    const examen = this.examenState$.value;
    const preguntas = this.preguntas$.value;

    if (examen && preguntas.length > 0) {
      const preguntaActual = preguntas[examen.preguntaActual];
      if (preguntaActual) {
        this.preguntaActual$.next(preguntaActual);
      }
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

  inicializarExamen(examen: ExamenEnCurso): void {
    this.examenState$.next(examen);

    // Crear el estado inicial
    const stateFactory = this.createStateFactory(examen);
    const initialState = stateFactory.createEnCursoState();
    this.currentState$.next(initialState);

    // Inicializar otros estados
    const duracionEnSegundos = (examen.duracion || 0) * 60; // Convertir minutos a segundos
    this.tiempoRestante$.next(duracionEnSegundos);
    this.preguntaActual$.next(null);
    this.preguntas$.next([]);
  }
}
