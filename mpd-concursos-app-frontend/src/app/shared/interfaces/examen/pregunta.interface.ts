export enum TipoPregunta {
  OPCION_MULTIPLE = 'MULTIPLE_CHOICE',
  SELECCION_MULTIPLE = 'MULTIPLE_SELECT',
  VERDADERO_FALSO = 'TRUE_FALSE',
  DESARROLLO = 'ESSAY',
  ORDENAMIENTO = 'ORDERING'
}

export interface Opcion {
  id: string;
  texto: string;
  orden: number;
}

export interface Pregunta {
  id: string;
  texto: string;
  tipo: TipoPregunta;
  opciones?: Opcion[];
  puntaje: number;
  orden: number;
  respuestaCorrecta?: string; // Para preguntas V/F
  respuestasCorrectas?: string[]; // Para preguntas de selección múltiple
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
  duracion?: number; // Duración en minutos
}

// Tipos de respuesta del backend
export interface PreguntaDTO {
  id: string;
  text: string;
  type: string;
  options: {
    id: string;
    text: string;
    order: number;
  }[];
  score: number;
  order: number;
  correctAnswer?: string;
  correctAnswers?: string[];
}
