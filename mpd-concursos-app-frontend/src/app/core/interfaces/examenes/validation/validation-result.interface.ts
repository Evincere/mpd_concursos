import { SecurityViolationType } from '../../../interfaces/security/security-violation.interface';

export interface ValidationDetails {
  code?: string;
  source?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ValidationResult {
  isValid: boolean;
  violationType?: SecurityViolationType;
  details?: ValidationDetails;
  message?: string;
}

export interface ValidationContext {
  examenId: string;
  timestamp: number;
  tiempoRespuesta?: number;
}
