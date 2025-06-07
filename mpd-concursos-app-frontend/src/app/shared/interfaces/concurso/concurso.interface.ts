
import { ContestDate } from './contest-date.interface';

// Estados unificados - sincronizados con backend (REFACTORING: Estados específicos)
export type ContestStatus =
  // Estados administrativos fijos
  | 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'CANCELLED' | 'FINISHED' | 'ARCHIVED'
  // Estados dinámicos basados en fechas
  | 'INSCRIPTION_PENDING' | 'INSCRIPTION_OPEN' | 'INSCRIPTION_CLOSED'
  | 'IN_EVALUATION' | 'RESULTS_PUBLISHED';

export interface ContestStatusConfig {
  value: ContestStatus;
  label: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  icon?: string;
}

export interface Concurso {
    id: number | string;
    title: string;
    description?: string;
    position: string;
    category: string;
    class: string;
    functions: string;
    status: ContestStatus;
    department: string;
    dependencia: string;
    termsUrl?: string;  // URL del PDF de bases y condiciones (antes basesUrl)
    profileUrl?: string;  // URL del PDF del perfil del puesto (antes descriptionUrl)
    basesUrl?: string;  // Mantener para compatibilidad
    descriptionUrl?: string;  // Mantener para compatibilidad
    startDate: Date | string;
    endDate: Date | string;
    createdAt: Date | string;
    updatedAt: Date | string;
    dates?: ContestDate[];  // Fechas importantes del concurso
}

// Alias para mantener compatibilidad
export type Contest = Concurso;
