import { Observable } from 'rxjs';
import { RespuestaUsuario } from '@shared/interfaces/examen/pregunta.interface';

export interface IExamenState {
  iniciar(): void;
  pausar(): void;
  reanudar(): void;
  finalizar(): void;
  guardarRespuesta(respuesta: RespuestaUsuario): void;
  getEstadoActual(): string;
  puedeResponder(): boolean;
  puedeNavegar(): boolean;
  tiempoDisponible(): Observable<number>;
}
