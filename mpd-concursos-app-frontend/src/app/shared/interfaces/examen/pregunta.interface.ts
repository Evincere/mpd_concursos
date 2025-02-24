export enum TipoPregunta {
  OPCION_MULTIPLE = 'OPCION_MULTIPLE',
  VERDADERO_FALSO = 'VERDADERO_FALSO',
  DESARROLLO = 'DESARROLLO',
  SELECCION_MULTIPLE = 'SELECCION_MULTIPLE',
  ORDENAMIENTO = 'ORDENAMIENTO'
}

export interface OpcionRespuesta {
  id: string;
  texto: string;
}

export interface Pregunta {
  id: string;
  texto: string;
  tipo: TipoPregunta;
  opciones?: OpcionRespuesta[];
  puntaje: number;
  orden: number;
}

export interface RespuestaUsuario {
  preguntaId: string;
  respuesta: string | string[];
  timestamp: string;
  tiempoRespuesta?: number;
  hash?: string;
  intentos?: number;
}

export interface ExamenEnCurso {
  examenId: string;
  usuarioId: string;
  fechaInicio: string;
  fechaLimite: string;
  respuestas: RespuestaUsuario[];
  preguntaActual: number;
  estado: 'EN_CURSO' | 'PAUSADO' | 'FINALIZADO' | 'ANULADO';
}
