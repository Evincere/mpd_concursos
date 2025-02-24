import { Injectable } from '@angular/core';
import { ISecurityStrategy } from '@core/interfaces/examenes/security/security-strategy.interface';
import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';

@Injectable()
export abstract class BaseSecurityStrategy implements ISecurityStrategy {
  abstract getType(): SecurityViolationType;
  abstract handleViolation(details?: any): void;

  async activate(): Promise<void> {
    // Implementación base que puede ser sobrescrita
    console.log(`Activando estrategia de seguridad: ${this.getType()}`);
  }

  deactivate(): void {
    // Implementación base que puede ser sobrescrita
    console.log(`Desactivando estrategia de seguridad: ${this.getType()}`);
  }
}
