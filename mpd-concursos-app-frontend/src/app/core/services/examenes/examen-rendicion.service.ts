import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { Pregunta, ExamenEnCurso, RespuestaUsuario } from '@shared/interfaces/examen/pregunta.interface';

@Injectable({
  providedIn: 'root'
})
export class ExamenRendicionService {
  private examenEnCurso = new BehaviorSubject<ExamenEnCurso | null>(null);
  private preguntas = new BehaviorSubject<Pregunta[]>([]);
  private tiempoRestante = new BehaviorSubject<number>(0);

  constructor() {}

  iniciarExamen(examenId: string, preguntas: Pregunta[]): void {
    const examen: ExamenEnCurso = {
      examenId,
      usuarioId: 'USER_ID', // Obtener del servicio de autenticación
      fechaInicio: new Date().toISOString(),
      fechaLimite: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 horas ejemplo
      respuestas: [],
      preguntaActual: 0,
      estado: 'EN_CURSO'
    };

    this.examenEnCurso.next(examen);
    this.preguntas.next(preguntas);
    this.iniciarTemporizador();
  }

  private iniciarTemporizador(): void {
    const fechaLimite = new Date(this.examenEnCurso.value?.fechaLimite || '');
    const intervalo = timer(0, 1000).pipe(
      map(() => {
        const ahora = new Date();
        return Math.max(0, Math.floor((fechaLimite.getTime() - ahora.getTime()) / 1000));
      }),
      takeUntil(timer(fechaLimite.getTime() - Date.now()))
    );

    intervalo.subscribe({
      next: (tiempo) => {
        this.tiempoRestante.next(tiempo);
        if (tiempo === 0) {
          this.finalizarExamen();
        }
      }
    });
  }

  guardarRespuesta(respuesta: RespuestaUsuario): void {
    const examen = this.examenEnCurso.value;
    if (!examen) return;

    const respuestas = [...examen.respuestas];
    const index = respuestas.findIndex(r => r.preguntaId === respuesta.preguntaId);

    if (index >= 0) {
      respuestas[index] = respuesta;
    } else {
      respuestas.push(respuesta);
    }

    this.examenEnCurso.next({
      ...examen,
      respuestas
    });
  }

  siguientePregunta(): void {
    const examen = this.examenEnCurso.value;
    if (!examen) return;

    if (examen.preguntaActual < this.preguntas.value.length - 1) {
      this.examenEnCurso.next({
        ...examen,
        preguntaActual: examen.preguntaActual + 1
      });
    }
  }

  preguntaAnterior(): void {
    const examen = this.examenEnCurso.value;
    if (!examen || examen.preguntaActual === 0) return;

    this.examenEnCurso.next({
      ...examen,
      preguntaActual: examen.preguntaActual - 1
    });
  }

  finalizarExamen(): void {
    const examen = this.examenEnCurso.value;
    if (!examen) return;

    this.examenEnCurso.next({
      ...examen,
      estado: 'FINALIZADO'
    });
    // Aquí se enviarían las respuestas al backend
  }

  // Observables públicos
  getExamenEnCurso(): Observable<ExamenEnCurso | null> {
    return this.examenEnCurso.asObservable();
  }

  getPreguntas(): Observable<Pregunta[]> {
    return this.preguntas.asObservable();
  }

  getPreguntaActual(): Observable<Pregunta | null> {
    return this.examenEnCurso.pipe(
      map(examen => {
        if (!examen) return null;
        return this.preguntas.value[examen.preguntaActual] || null;
      })
    );
  }

  getTiempoRestante(): Observable<number> {
    return this.tiempoRestante.asObservable();
  }
}
