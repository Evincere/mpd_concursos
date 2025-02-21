import { Injectable, Inject } from '@angular/core';
import { Observable, BehaviorSubject, fromEvent, merge, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SecurityViolation, SecurityViolationType, SecuritySeverity, SecurityAction } from '@core/interfaces/security/security-violation.interface';
import { ISecurityService } from '@core/interfaces/examenes/security/security.interface';
import { ISecurityStrategy } from '@core/interfaces/examenes/security/security-strategy.interface';
import { ExamenNotificationService } from '../examen-notification.service';

@Injectable()
export class ExamenSecurityService implements ISecurityService {
  private securityStrategies: Map<SecurityViolationType, ISecurityStrategy>;
  private violations$ = new BehaviorSubject<SecurityViolation[]>([]);

  constructor(
    @Inject(ExamenNotificationService) private notificationService: ExamenNotificationService,
    @Inject('SecurityStrategies') private strategies: ISecurityStrategy[]
  ) {
    this.securityStrategies = new Map();
    this.initializeStrategies(strategies);
  }

  initializeSecurityMeasures(): void {
    // Implementación de inicialización
  }

  private initializeStrategies(strategies: ISecurityStrategy[]): void {
    strategies.forEach(strategy => {
      this.securityStrategies.set(strategy.getType(), strategy);
    });
  }

  reportSecurityViolation(type: SecurityViolationType, details?: any): void {
    const strategy = this.securityStrategies.get(type);
    if (strategy) {
      strategy.handleViolation(details);
      this.logViolation(type, details);

      // Notificar directamente
      this.notificationService.showSecurityWarning(type, JSON.stringify(details));
    }
  }

  getSecurityViolations(): Observable<SecurityViolation[]> {
    return this.violations$.asObservable();
  }

  cleanup(): void {
    this.violations$.complete();
  }

  private logViolation(type: SecurityViolationType, details?: any): void {
    const violations = this.violations$.value;
    const violation: SecurityViolation = {
      type,
      timestamp: new Date().toISOString(),
      details,
      severity: this.getViolationSeverity(type),
      actionTaken: this.getActionForViolation(type)
    };
    this.violations$.next([...violations, violation]);
  }

  private getViolationSeverity(type: SecurityViolationType): SecuritySeverity {
    const severityMap: Record<SecurityViolationType, SecuritySeverity> = {
      FULLSCREEN_EXIT: 'HIGH',
      FULLSCREEN_DENIED: 'HIGH',
      TAB_SWITCH: 'MEDIUM',
      KEYBOARD_SHORTCUT: 'LOW',
      CLIPBOARD_OPERATION: 'MEDIUM',
      INACTIVITY_TIMEOUT: 'LOW',
      NETWORK_VIOLATION: 'HIGH',
      SUSPICIOUS_BEHAVIOR: 'MEDIUM',
      TIME_MANIPULATION: 'HIGH',
      TIME_DRIFT: 'MEDIUM',
      SUSPICIOUS_ANSWER: 'MEDIUM',
      ANSWER_TOO_FAST: 'HIGH',
      ANSWER_TOO_SLOW: 'LOW',
      SUSPICIOUS_PATTERN: 'MEDIUM',
      POST_INCIDENT_VALIDATION_FAILED: 'HIGH',
      FULLSCREEN_REQUIRED: 'HIGH',
      FULLSCREEN_WARNING: 'MEDIUM'
    };
    return severityMap[type] || 'LOW' as SecuritySeverity;
  }

  private readonly ACTION_MAP: Record<SecurityViolationType, SecurityAction> = {
    FULLSCREEN_EXIT: 'BLOCK',
    FULLSCREEN_DENIED: 'WARN',
    TAB_SWITCH: 'WARN',
    KEYBOARD_SHORTCUT: 'LOG',
    CLIPBOARD_OPERATION: 'BLOCK',
    INACTIVITY_TIMEOUT: 'WARN',
    NETWORK_VIOLATION: 'BLOCK',
    SUSPICIOUS_BEHAVIOR: 'WARN',
    TIME_MANIPULATION: 'BLOCK',
    TIME_DRIFT: 'WARN',
    SUSPICIOUS_ANSWER: 'WARN',
    ANSWER_TOO_FAST: 'BLOCK',
    ANSWER_TOO_SLOW: 'WARN',
    SUSPICIOUS_PATTERN: 'WARN',
    POST_INCIDENT_VALIDATION_FAILED: 'BLOCK',
    FULLSCREEN_REQUIRED: 'WARN',
    FULLSCREEN_WARNING: 'WARN'
  } as const;

  private getActionForViolation(type: SecurityViolationType): SecurityAction {
    return this.ACTION_MAP[type] ?? 'LOG' as SecurityAction;
  }
}
