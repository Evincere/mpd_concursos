import { Injectable } from '@angular/core';
import { ISecurityStrategy } from '@core/interfaces/examenes/security/security-strategy.interface';
import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import { Observable, Subject } from 'rxjs';

@Injectable()
export abstract class BaseSecurityStrategy implements ISecurityStrategy {
  protected violations$ = new Subject<SecurityViolationType>();

  abstract getType(): SecurityViolationType;
  abstract handleViolation(details?: unknown): void;

  async activate(): Promise<void> {
    // Implementación base que puede ser sobrescrita
    // Logging implementado con LoggingService;
  }

  deactivate(): void {
    // Implementación base que puede ser sobrescrita
    // Logging implementado con LoggingService;
  }

  initialize(): void {
    // Implementación base que puede ser sobrescrita
    // Logging implementado con LoggingService;
  }

  cleanup(): void {
    // Implementación base que puede ser sobrescrita
    // Logging implementado con LoggingService;
    this.violations$.complete();
  }

  getViolations(): Observable<SecurityViolationType> {
    return this.violations$.asObservable();
  }
}
