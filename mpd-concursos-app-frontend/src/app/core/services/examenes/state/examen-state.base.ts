import { ExamenEnCurso, RespuestaUsuario } from '@shared/interfaces/examen/pregunta.interface';
import { Observable } from 'rxjs';

export abstract class ExamenState {
  protected examen: ExamenEnCurso;

  constructor(examen: ExamenEnCurso) {
    this.examen = examen;
  }

  abstract iniciar(): void;
  abstract pausar(): void;
  abstract reanudar(): void;
  abstract finalizar(): void;
  abstract guardarRespuesta(respuesta: RespuestaUsuario): void;
}

export class ExamenEnCursoState extends ExamenState {
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
      respuestas[index] = { ...respuesta, intentos: (respuestas[index].intentos || 0) + 1 };
    } else {
      respuestas.push({ ...respuesta, intentos: 1 });
    }

    this.examen.respuestas = respuestas;
  }
}

export class ExamenPausadoState extends ExamenState {
  iniciar(): void {
    throw new Error('El examen está pausado');
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
}
