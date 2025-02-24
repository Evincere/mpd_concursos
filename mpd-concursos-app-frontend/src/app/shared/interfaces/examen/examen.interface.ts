import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';

export type EstadoExamen = 'DISPONIBLE' | 'EN_CURSO' | 'FINALIZADO' | 'ANULADO';

export const ESTADO_EXAMEN = {
  DISPONIBLE: 'DISPONIBLE' as EstadoExamen,
  EN_CURSO: 'EN_CURSO' as EstadoExamen,
  FINALIZADO: 'FINALIZADO' as EstadoExamen,
  ANULADO: 'ANULADO' as EstadoExamen
} as const;

export interface MotivoAnulacion {
  fecha: string;
  infracciones: SecurityViolationType[];
}

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
  motivoAnulacion?: MotivoAnulacion;
}

export enum TipoExamen {
  TECNICO_JURIDICO = 'TECNICO_JURIDICO',
  TECNICO_ADMINISTRATIVO = 'TECNICO_ADMINISTRATIVO',
  SERVICIOS_AUXILIARES = 'SERVICIOS_AUXILIARES'
}
