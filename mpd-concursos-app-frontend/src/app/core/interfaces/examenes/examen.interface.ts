import { TipoExamen } from '@shared/interfaces/examen/examen.interface';
import { RespuestaUsuario } from '@shared/interfaces/examen/pregunta.interface';

export interface IExamen {
  id: string;
  tipo: TipoExamen;
  estado: ExamenEstado;
  iniciar(): void;
  pausar(): void;
  reanudar(): void;
  finalizar(): void;
  guardarRespuesta(respuesta: RespuestaUsuario): void;
}

export enum ExamenEstado {
  NO_INICIADO = 'NO_INICIADO',
  EN_CURSO = 'EN_CURSO',
  PAUSADO = 'PAUSADO',
  FINALIZADO = 'FINALIZADO'
}
