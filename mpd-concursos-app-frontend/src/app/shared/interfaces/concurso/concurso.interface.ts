
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

/**
 * Unified Contest interface using English terminology
 * REFACTORING: Consolidated from multiple interfaces for consistency
 */
export interface Contest {
    id: number | string;
    title: string;
    description?: string;
    position: string;
    category: string;
    class: string;
    functions: string;
    status: ContestStatus;
    department: string;
    termsUrl?: string;  // URL del PDF de bases y condiciones
    profileUrl?: string;  // URL del PDF del perfil del puesto
    startDate: Date | string;
    endDate: Date | string;
    createdAt: Date | string;
    updatedAt: Date | string;
    dates?: ContestDate[];  // Fechas importantes del concurso

    // Legacy fields for backward compatibility (deprecated)
    /** @deprecated Use department instead */
    dependencia?: string;
    /** @deprecated Use termsUrl instead */
    basesUrl?: string;
    /** @deprecated Use profileUrl instead */
    descriptionUrl?: string;
}

// Alias para mantener compatibilidad durante migración
export type Concurso = Contest;
