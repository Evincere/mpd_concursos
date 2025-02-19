export interface Examen {
  id: string;
  titulo: string;
  tipo: TipoExamen;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoExamen;
  descripcion?: string;
  duracion: number; // en minutos
  puntajeMaximo: number;
  intentosPermitidos: number;
  intentosRealizados?: number;
  requisitos?: string[];
  reglasExamen?: string[];
  materialesPermitidos?: string[];
}

export enum TipoExamen {
  TECNICO_JURIDICO = 'TECNICO_JURIDICO',
  TECNICO_ADMINISTRATIVO = 'TECNICO_ADMINISTRATIVO',
  SERVICIOS_AUXILIARES = 'SERVICIOS_AUXILIARES'
}

export enum EstadoExamen {
  PENDIENTE = 'PENDIENTE',
  EN_CURSO = 'EN_CURSO',
  COMPLETADO = 'COMPLETADO',
  VENCIDO = 'VENCIDO'
} 