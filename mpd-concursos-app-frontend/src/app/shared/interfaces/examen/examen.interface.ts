import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';

export enum TipoExamen {
  TECNICO_JURIDICO = 'TECHNICAL_LEGAL',
  TECNICO_ADMINISTRATIVO = 'TECHNICAL_ADMINISTRATIVE',
  PSICOLOGICO = 'PSYCHOLOGICAL'
}

export enum ESTADO_EXAMEN {
  BORRADOR = 'DRAFT',
  DISPONIBLE = 'SCHEDULED',
  EN_CURSO = 'ACTIVE',
  FINALIZADO = 'FINISHED',
  ANULADO = 'CANCELLED'
}

export interface MotivoAnulacion {
  fecha: string;
  infracciones: SecurityViolationType[];
  motivo?: string;
}

export interface Examen {
  id: string;
  titulo: string;
  descripcion?: string;
  tipo: TipoExamen;
  estado: ESTADO_EXAMEN;
  fechaInicio: string;
  fechaFin: string;
  duracion: number; // en minutos
  puntajeMaximo: number;
  intentosPermitidos: number;
  intentosRealizados?: number;
  requisitos?: string[];
  reglasExamen?: string[];
  materialesPermitidos?: string[];
  motivoAnulacion?: MotivoAnulacion;
}

// Tipos de respuesta del backend
export interface ExamenDTO {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  maxScore: number;
  maxAttempts: number;
  attemptsUsed?: number;
  requirements?: string[];
  examRules?: string[];
  allowedMaterials?: string[];
  cancellationDetails: {
    cancellationDate: string;
    violations: SecurityViolationType[];
    reason: string | null;
  } | null;
}
