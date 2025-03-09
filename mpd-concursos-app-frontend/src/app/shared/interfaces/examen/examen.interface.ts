import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import { ExamenDTO } from '@core/interfaces/examenes/examen-dto.interface';

export enum TipoExamen {
  TECNICO_JURIDICO = 'TECHNICAL_LEGAL',
  TECNICO_ADMINISTRATIVO = 'TECHNICAL_ADMINISTRATIVE',
  PSICOLOGICO = 'PSYCHOLOGICAL'
}

export enum ESTADO_EXAMEN {
  BORRADOR = 'BORRADOR',
  ACTIVO = 'ACTIVO',
  ANULADO = 'ANULADO',
  FINALIZADO = 'FINALIZADO',
  DISPONIBLE = 'DISPONIBLE',
  EN_CURSO = 'EN_CURSO'
}

export interface MotivoAnulacion {
  fecha: string;
  infracciones: SecurityViolationType[];
  motivo?: string;
}

export interface Examen {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  estado: ESTADO_EXAMEN;
  duracion: number;
  puntajeMaximo: number;
  fechaInicio: string;
  intentosPermitidos: number;
  intentosRealizados?: number;
  requisitos: string[];
  reglasExamen: string[];
  materialesPermitidos: string[];
  motivoAnulacion?: {
    fecha: string;
    infracciones: string[];
    motivo?: string;
  };
}

export type { ExamenDTO };
