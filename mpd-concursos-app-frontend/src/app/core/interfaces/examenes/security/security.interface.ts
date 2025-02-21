import { Observable } from 'rxjs';
import { SecurityViolation, SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import { RespuestaUsuario } from '@shared/interfaces/examen/pregunta.interface';

export interface ISecurityService {
  initializeSecurityMeasures(): void;
  reportSecurityViolation(type: SecurityViolationType, details?: any): void;
  getSecurityViolations(): Observable<SecurityViolation[]>;
  cleanup(): void;
}

export interface IValidationService {
  validarRespuesta(respuesta: RespuestaUsuario, examenId: string): boolean;
  generarHash(respuesta: RespuestaUsuario): string;
  limpiarHistorial(examenId: string): void;
}
