import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import { Observable } from 'rxjs';

export interface ISecurityStrategy {
  getType(): SecurityViolationType;
  handleViolation(details?: unknown): void;
  activate(): Promise<void>;
  deactivate(): void;
  initialize(): void;
  cleanup(): void;
  getViolations(): Observable<SecurityViolationType>;
}
