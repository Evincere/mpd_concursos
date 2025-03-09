import { Injectable, Inject, NgZone } from '@angular/core';
import { Observable, BehaviorSubject, fromEvent, merge, Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { SecurityViolation, SecurityViolationType, SecuritySeverity, SecurityAction } from '@core/interfaces/security/security-violation.interface';
import { ISecurityService } from '@core/interfaces/examenes/security/security.interface';
import { ISecurityStrategy } from '@core/interfaces/examenes/security/security-strategy.interface';
import { ICleanupService } from '@core/interfaces/examenes/cleanup/cleanup.interface';
import { ExamenNotificationService } from '../examen-notification.service';

@Injectable({
  providedIn: 'root'
})
export class ExamenSecurityService implements ISecurityService, ICleanupService {
  private readonly MAX_WARNINGS = 3;
  private readonly MIN_WARNING_INTERVAL = 2000;

  private securityStrategies: Map<SecurityViolationType, ISecurityStrategy>;
  private violations$ = new BehaviorSubject<SecurityViolation[]>([]);
  private isSecureModeActive = new BehaviorSubject<boolean>(false);
  private destroy$ = new Subject<void>();

  // Estado de seguridad centralizado
  private securityState$ = new BehaviorSubject<{
    warningCount: number;
    lastWarningTime: number;
    violations: SecurityViolation[];
  }>({
    warningCount: 0,
    lastWarningTime: 0,
    violations: []
  });

  constructor(
    @Inject(ExamenNotificationService) private notificationService: ExamenNotificationService,
    @Inject('SecurityStrategies') private strategies: ISecurityStrategy[],
    private ngZone: NgZone
  ) {
    this.securityStrategies = new Map();
    this.initializeStrategies(strategies);
    this.loadSecurityState();
  }

  private loadSecurityState(): void {
    const savedState = localStorage.getItem(this.getSecurityStateKey());
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        this.securityState$.next(state);
        this.violations$.next(state.violations);
      } catch (e) {
        console.error('Error al cargar el estado de seguridad:', e);
        this.reset();
      }
    }
  }

  private getSecurityStateKey(): string {
    const userId = this.getCurrentUserId();
    return userId ? `securityState_${userId}` : 'securityState';
  }

  private getCurrentUserId(): string | null {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      return user.id || null;
    } catch {
      return null;
    }
  }

  private saveSecurityState(): void {
    const state = this.securityState$.value;
    localStorage.setItem(this.getSecurityStateKey(), JSON.stringify(state));
  }

  initializeSecurityMeasures(): void {
    this.reset();
    this.activateSecureMode().catch(error => {
      console.error('Error al inicializar medidas de seguridad:', error);
      this.notificationService.showSecurityWarning(
        SecurityViolationType.FULLSCREEN_DENIED,
        'No se pudieron inicializar las medidas de seguridad'
      );
    });
  }

  reset(): void {
    const initialState = {
      warningCount: 0,
      lastWarningTime: 0,
      violations: []
    };

    this.securityState$.next(initialState);
    this.violations$.next([]);
    this.isSecureModeActive.next(false);

    localStorage.removeItem(this.getSecurityStateKey());
    this.deactivateSecureMode();
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
    if (!strategy) return;

    strategy.handleViolation(details);

    const now = Date.now();
    const currentState = this.securityState$.value;
    const severity = this.getViolationSeverity(type);

    // Crear la violación
    const violation: SecurityViolation = {
      type,
      timestamp: new Date().toISOString(),
      details,
      severity,
      actionTaken: this.getActionForViolation(type)
    };

    // Actualizar el estado
    if (now - currentState.lastWarningTime >= this.MIN_WARNING_INTERVAL) {
      const newWarningCount = currentState.warningCount + 1;
      const newViolations = [...currentState.violations, violation];

      const newState = {
        warningCount: newWarningCount,
        lastWarningTime: now,
        violations: newViolations
      };

      this.securityState$.next(newState);
      this.violations$.next(newViolations);
      this.saveSecurityState();

      // Notificar según el contador de advertencias
      if (newWarningCount >= this.MAX_WARNINGS) {
        this.notificationService.showFinalWarningDialog(newViolations);
      } else {
        const baseMessage = this.getSecurityMessage(type);
        const remainingWarnings = this.MAX_WARNINGS - newWarningCount;
        const message = `${baseMessage}. ${remainingWarnings} advertencia${remainingWarnings !== 1 ? 's' : ''} restante${remainingWarnings !== 1 ? 's' : ''} antes de anular el examen.`;
        this.notificationService.showSecurityWarning(type, message);
      }
    }
  }

  private getSecurityMessage(type: SecurityViolationType): string {
    const messages: Record<SecurityViolationType, string> = {
      FULLSCREEN_EXIT: 'No se permite salir del modo pantalla completa',
      FULLSCREEN_DENIED: 'Debe permitir el modo pantalla completa para continuar',
      TAB_SWITCH: 'No se permite cambiar de pestaña durante el examen',
      KEYBOARD_SHORTCUT: 'Atajo de teclado no permitido',
      CLIPBOARD_OPERATION: 'Operaciones de copiar/pegar no permitidas',
      INACTIVITY_TIMEOUT: 'Sesión inactiva por mucho tiempo',
      NETWORK_VIOLATION: 'Violación de seguridad de red detectada',
      SUSPICIOUS_BEHAVIOR: 'Se ha detectado comportamiento sospechoso',
      TIME_MANIPULATION: 'Se ha detectado manipulación del tiempo',
      TIME_DRIFT: 'Se ha detectado desincronización del tiempo',
      SUSPICIOUS_ANSWER: 'Respuesta marcada como sospechosa',
      ANSWER_TOO_FAST: 'Respuesta demasiado rápida',
      ANSWER_TOO_SLOW: 'Tiempo de respuesta excedido',
      SUSPICIOUS_PATTERN: 'Se ha detectado un patrón sospechoso',
      POST_INCIDENT_VALIDATION_FAILED: 'La validación ha fallado',
      FULLSCREEN_REQUIRED: 'Se requiere pantalla completa',
      FULLSCREEN_WARNING: 'Advertencia de pantalla completa'
    };
    return messages[type] || 'Se ha detectado una violación de seguridad';
  }

  getSecurityViolations(): Observable<SecurityViolation[]> {
    return this.violations$.asObservable();
  }

  getSecurityState(): Observable<{
    warningCount: number;
    lastWarningTime: number;
    violations: SecurityViolation[];
  }> {
    return this.securityState$.asObservable();
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
    this.destroy$.next();
    this.destroy$.complete();
    this.deactivateSecureMode();
    this.reset();
    this.notificationService.cleanup();
  }

  iniciarMonitoreo(): Observable<SecurityViolationType | null> {
    this.initializeSecurityMeasures();
    return this.violations$.pipe(
      map(violations => {
        const criticalViolations = violations.filter(v =>
          this.getViolationSeverity(v.type) === 'HIGH'
        );
        return criticalViolations.length > 0 ? criticalViolations[0].type : null;
      })
    );
  }
}
