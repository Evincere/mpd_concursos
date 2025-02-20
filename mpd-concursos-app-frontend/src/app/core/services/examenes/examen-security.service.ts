import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent, merge, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SecurityViolation, SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import { ExamenNotificationService } from './examen-notification.service';

@Injectable({
  providedIn: 'root'
})
export class ExamenSecurityService {
  private destroy$ = new Subject<void>();
  private securityViolations$ = new BehaviorSubject<SecurityViolation[]>([]);
  private isFullscreen = false;
  private inactivityTimer: any;
  private readonly INACTIVITY_TIMEOUT = 300000; // 5 minutos

  constructor(
    private notificationService: ExamenNotificationService
  ) {}

  initializeSecurityMeasures(): void {
    this.setupFullscreenMode();
    this.setupTabFocusDetection();
    this.setupKeyboardShortcuts();
    this.setupClipboardRestrictions();
    this.setupInactivityDetection();
    this.startActivityLogging();
  }

  private setupFullscreenMode(): void {
    document.documentElement.requestFullscreen()
      .then(() => {
        this.isFullscreen = true;
        this.logSecurityEvent('FULLSCREEN_ENABLED');
      })
      .catch(err => {
        this.logSecurityViolation(SecurityViolationType.FULLSCREEN_DENIED, err.message);
      });

    fromEvent(document, 'fullscreenchange')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!document.fullscreenElement && this.isFullscreen) {
          this.logSecurityViolation(SecurityViolationType.FULLSCREEN_EXIT);
          // Aquí podríamos implementar una acción como pausar el examen
        }
      });
  }

  private setupTabFocusDetection(): void {
    merge(
      fromEvent(window, 'blur'),
      fromEvent(document, 'visibilitychange')
    ).pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      if (document.hidden || !document.hasFocus()) {
        this.logSecurityViolation(SecurityViolationType.TAB_SWITCH);
      }
    });
  }

  private setupKeyboardShortcuts(): void {
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        // Prevenir atajos comunes
        if (
          (event.ctrlKey && event.key === 'c') || // Copy
          (event.ctrlKey && event.key === 'v') || // Paste
          (event.ctrlKey && event.key === 'p') || // Print
          (event.altKey && event.key === 'Tab') || // Alt+Tab
          event.key === 'F12' || // Dev tools
          event.key === 'PrintScreen'
        ) {
          event.preventDefault();
          this.logSecurityViolation(SecurityViolationType.KEYBOARD_SHORTCUT, `Tecla: ${event.key}`);
        }
      });
  }

  private setupClipboardRestrictions(): void {
    ['copy', 'paste', 'cut'].forEach(eventName => {
      document.addEventListener(eventName, (e) => {
        e.preventDefault();
        this.logSecurityViolation(SecurityViolationType.CLIPBOARD_OPERATION, eventName);
      });
    });
  }

  private setupInactivityDetection(): void {
    const resetInactivityTimer = () => {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = setTimeout(() => {
        this.logSecurityViolation(SecurityViolationType.INACTIVITY_TIMEOUT);
        // Implementar acción de timeout
      }, this.INACTIVITY_TIMEOUT);
    };

    ['mousemove', 'keydown', 'click', 'scroll'].forEach(eventName => {
      document.addEventListener(eventName, () => resetInactivityTimer());
    });

    resetInactivityTimer();
  }

  private startActivityLogging(): void {
    // Implementar logging de actividad
    const networkObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        this.logSecurityEvent('NETWORK_ACTIVITY', entry);
      });
    });

    networkObserver.observe({ entryTypes: ['resource'] });
  }

  private logSecurityViolation(type: SecurityViolationType, details?: any): void {
    const violation: SecurityViolation = {
      type,
      timestamp: new Date().toISOString(),
      details,
      severity: this.getViolationSeverity(type),
      actionTaken: this.getActionForViolation(type)
    };

    const currentViolations = this.securityViolations$.value;
    this.securityViolations$.next([...currentViolations, violation]);

    this.handleViolation(violation);
  }

  private getViolationSeverity(type: SecurityViolationType): 'LOW' | 'MEDIUM' | 'HIGH' {
    const severityMap: Record<SecurityViolationType, 'LOW' | 'MEDIUM' | 'HIGH'> = {
      [SecurityViolationType.FULLSCREEN_EXIT]: 'HIGH',
      [SecurityViolationType.FULLSCREEN_DENIED]: 'HIGH',
      [SecurityViolationType.TAB_SWITCH]: 'MEDIUM',
      [SecurityViolationType.KEYBOARD_SHORTCUT]: 'LOW',
      [SecurityViolationType.CLIPBOARD_OPERATION]: 'MEDIUM',
      [SecurityViolationType.INACTIVITY_TIMEOUT]: 'HIGH',
      [SecurityViolationType.NETWORK_VIOLATION]: 'HIGH',
      [SecurityViolationType.SUSPICIOUS_BEHAVIOR]: 'HIGH',
      [SecurityViolationType.TIME_MANIPULATION]: 'HIGH',
      [SecurityViolationType.TIME_DRIFT]: 'MEDIUM',
      [SecurityViolationType.SUSPICIOUS_ANSWER]: 'HIGH',
      [SecurityViolationType.ANSWER_TOO_FAST]: 'HIGH',
      [SecurityViolationType.ANSWER_TOO_SLOW]: 'MEDIUM',
      [SecurityViolationType.SUSPICIOUS_PATTERN]: 'HIGH',
      [SecurityViolationType.POST_INCIDENT_VALIDATION_FAILED]: 'HIGH'
    };

    return severityMap[type] || 'MEDIUM';
  }

  private getActionForViolation(type: SecurityViolationType): string {
    const actionMap: Record<SecurityViolationType, string> = {
      [SecurityViolationType.FULLSCREEN_EXIT]: 'Examen pausado',
      [SecurityViolationType.FULLSCREEN_DENIED]: 'Acceso denegado',
      [SecurityViolationType.TAB_SWITCH]: 'Advertencia registrada',
      [SecurityViolationType.KEYBOARD_SHORTCUT]: 'Acción bloqueada',
      [SecurityViolationType.CLIPBOARD_OPERATION]: 'Operación bloqueada',
      [SecurityViolationType.INACTIVITY_TIMEOUT]: 'Sesión finalizada',
      [SecurityViolationType.NETWORK_VIOLATION]: 'Conexión monitoreada',
      [SecurityViolationType.SUSPICIOUS_BEHAVIOR]: 'Revisión manual requerida',
      [SecurityViolationType.TIME_MANIPULATION]: 'Examen pausado',
      [SecurityViolationType.TIME_DRIFT]: 'Sincronización requerida',
      [SecurityViolationType.SUSPICIOUS_ANSWER]: 'Respuesta marcada para revisión',
      [SecurityViolationType.ANSWER_TOO_FAST]: 'Respuesta invalidada',
      [SecurityViolationType.ANSWER_TOO_SLOW]: 'Tiempo excedido',
      [SecurityViolationType.SUSPICIOUS_PATTERN]: 'Patrón detectado',
      [SecurityViolationType.POST_INCIDENT_VALIDATION_FAILED]: 'Validación fallida'
    };

    return actionMap[type] || 'Acción registrada';
  }

  private handleViolation(violation: SecurityViolation): void {
    this.notificationService.showSecurityWarning(violation.type);
    
    // Enviar al servidor
    this.sendViolationToServer(violation);

    if (violation.severity === 'HIGH') {
      this.handleHighSeverityViolation(violation);
    }
  }

  private handleHighSeverityViolation(violation: SecurityViolation): void {
    switch (violation.type) {
      case SecurityViolationType.FULLSCREEN_EXIT:
        // Implementar pausa del examen
        break;
      case SecurityViolationType.INACTIVITY_TIMEOUT:
        // Implementar autoguardado y cierre
        break;
      // ... otros casos
    }
  }

  private sendViolationToServer(violation: SecurityViolation): void {
    // TODO: Implementar envío al servidor
    console.log('Sending violation to server:', violation);
  }

  private logSecurityEvent(type: string, details?: any): void {
    // Implementar logging de eventos normales
    console.log('Security Event:', { type, timestamp: new Date().toISOString(), details });
  }

  getSecurityViolations(): Observable<SecurityViolation[]> {
    return this.securityViolations$.asObservable();
  }

  cleanup(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.inactivityTimer);
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }

  // Método público para reportar violaciones
  reportSecurityViolation(type: SecurityViolationType, details?: any): void {
    this.logSecurityViolation(type, details);
  }
}
