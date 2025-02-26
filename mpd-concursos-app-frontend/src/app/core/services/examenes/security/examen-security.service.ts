import { Injectable, Inject, NgZone } from '@angular/core';
import { Observable, BehaviorSubject, fromEvent, merge, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SecurityViolation, SecurityViolationType, SecuritySeverity, SecurityAction } from '@core/interfaces/security/security-violation.interface';
import { ISecurityService } from '@core/interfaces/examenes/security/security.interface';
import { ISecurityStrategy } from '@core/interfaces/examenes/security/security-strategy.interface';
import { ExamenNotificationService } from '../examen-notification.service';

@Injectable({
  providedIn: 'root'
})
export class ExamenSecurityService implements ISecurityService {
  private securityStrategies: Map<SecurityViolationType, ISecurityStrategy>;
  private violations$ = new BehaviorSubject<SecurityViolation[]>([]);
  private isSecureModeActive = new BehaviorSubject<boolean>(false);

  constructor(
    @Inject(ExamenNotificationService) private notificationService: ExamenNotificationService,
    @Inject('SecurityStrategies') private strategies: ISecurityStrategy[],
    private ngZone: NgZone
  ) {
    this.securityStrategies = new Map();
    this.initializeStrategies(strategies);
  }

  initializeSecurityMeasures(): void {
    // Reiniciar el estado de seguridad
    this.resetSecurityState();

    // Activar el modo seguro excluyendo la estrategia de pantalla completa
    this.activateSecureMode().catch(error => {
      console.error('Error al inicializar medidas de seguridad:', error);
      this.notificationService.showSecurityWarning(
        SecurityViolationType.FULLSCREEN_DENIED,
        'No se pudieron inicializar las medidas de seguridad'
      );
    });
  }

  resetSecurityState(): void {
    // Reiniciar el estado de las violaciones
    this.violations$.next([]);

    // Reiniciar el estado de seguridad en el servicio de notificaciones
    this.notificationService.resetSecurityState();

    // Desactivar y volver a activar todas las estrategias
    this.deactivateSecureMode();

    // Reiniciar el estado del modo seguro
    this.isSecureModeActive.next(false);
  }

  private initializeStrategies(strategies: ISecurityStrategy[]): void {
    for (const strategy of strategies) {
      const type = strategy.getType();
      this.securityStrategies.set(type, strategy);
      console.log(`Estrategia registrada: ${type}`);
    }
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

  async activateSecureMode(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.ngZone.run(async () => {
        try {
          console.log('Activando modo seguro...');
          // Activar todas las estrategias de seguridad
          for (const strategy of this.strategies) {
            // La estrategia de pantalla completa se maneja de forma separada en ExamenRendicionComponent
            if (strategy.getType() !== SecurityViolationType.FULLSCREEN_REQUIRED) {
              console.log(`Activando estrategia: ${strategy.getType()}`);
              await strategy.activate();
            } else {
              console.log('Saltando activación de pantalla completa, se manejará en el componente');
            }
          }

          this.isSecureModeActive.next(true);
          console.log('Modo seguro activado correctamente');
          resolve();
        } catch (error) {
          console.error('Error activando modo seguro:', error);
          reject(error);
        }
      });
    });
  }

  deactivateSecureMode(): void {
    this.ngZone.run(() => {
      // Desactivar todas las estrategias
      for (const strategy of this.strategies) {
        strategy.deactivate();
      }
      this.isSecureModeActive.next(false);
    });
  }

  isSecureMode(): Observable<boolean> {
    return this.isSecureModeActive.asObservable();
  }

  // Método para obtener una estrategia específica
  getStrategy(type: SecurityViolationType): ISecurityStrategy | undefined {
    return this.securityStrategies.get(type);
  }

  cleanup(): void {
    this.deactivateSecureMode();
    this.resetSecurityState();
  }
}
