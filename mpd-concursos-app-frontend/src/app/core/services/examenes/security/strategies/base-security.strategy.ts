import { Injectable } from '@angular/core';
import { ISecurityStrategy } from '@core/interfaces/examenes/security/security-strategy.interface';
import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import { Observable, Subject } from 'rxjs';

@Injectable()
export abstract class BaseSecurityStrategy implements ISecurityStrategy {
  protected violations$ = new Subject<SecurityViolationType>();

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

  initialize(): void {
    // Implementación base que puede ser sobrescrita
    console.log(`Inicializando estrategia de seguridad: ${this.getType()}`);
  }

  cleanup(): void {
    // Implementación base que puede ser sobrescrita
    console.log(`Limpiando estrategia de seguridad: ${this.getType()}`);
    this.violations$.complete();
  }

  getViolations(): Observable<SecurityViolationType> {
    return this.violations$.asObservable();
  }
}
