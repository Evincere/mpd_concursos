import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';

export interface ISecurityStrategy {
  getType(): SecurityViolationType;
  handleViolation(details?: any): void;
}
