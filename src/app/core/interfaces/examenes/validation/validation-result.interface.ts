import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';

export interface ValidationResult {
  isValid: boolean;
  violationType?: SecurityViolationType;
  details?: any;
  message?: string;
}

export interface ValidationContext {
  examenId: string;
  timestamp: number;
  tiempoRespuesta?: number;
} 