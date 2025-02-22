import { Injectable, HostListener } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ExamenNotificationService {
  private readonly MAX_WARNINGS = 3;
  private readonly MIN_WARNING_INTERVAL = 2000;
  private readonly PENALTY_DURATION = 300000; // 5 minutos de penalización

  private warningCount = 0;
  private lastWarningTime = 0;
  private penaltyEndTime = 0;

  // Observable para el estado de las infracciones
  private securityStateSubject = new BehaviorSubject<{
    warningCount: number;
    isPenalized: boolean;
    remainingPenaltyTime: number;
  }>({ warningCount: 0, isPenalized: false, remainingPenaltyTime: 0 });

  public securityState$ = this.securityStateSubject.asObservable();

  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {
    this.loadSecurityState();
    this.startPenaltyTimer();
    this.logSecurityState(); // Para debugging
  }

  private loadSecurityState(): void {
    const savedState = localStorage.getItem('securityState');
    if (savedState) {
      const state = JSON.parse(savedState);
      this.warningCount = state.warningCount;
      this.penaltyEndTime = state.penaltyEndTime;
      this.updateSecurityState();
    }
  }

  private saveSecurityState(): void {
    localStorage.setItem('securityState', JSON.stringify({
      warningCount: this.warningCount,
      penaltyEndTime: this.penaltyEndTime
    }));
  }

  private startPenaltyTimer(): void {
    setInterval(() => {
      if (this.penaltyEndTime > 0) {
        const remaining = this.penaltyEndTime - Date.now();
        if (remaining <= 0) {
          this.penaltyEndTime = 0;
          this.warningCount = 0; // Reset después de cumplir la penalización
        }
        this.updateSecurityState();
        this.saveSecurityState();
      }
    }, 1000);
  }

  private updateSecurityState(): void {
    const now = Date.now();
    const isPenalized = this.penaltyEndTime > now;
    const remainingPenaltyTime = Math.max(0, this.penaltyEndTime - now);

    this.securityStateSubject.next({
      warningCount: this.warningCount,
      isPenalized,
      remainingPenaltyTime
    });
  }

  private logSecurityState(): void {
    this.securityState$.subscribe(state => {
      console.log('Estado de seguridad:', state);
    });
  }

  showSecurityWarning(type: SecurityViolationType, details?: string): void {
    const now = Date.now();

    // Verificar si está en penalización
    if (this.penaltyEndTime > now) {
      this.showPenaltyMessage(Math.ceil((this.penaltyEndTime - now) / 1000));
      return;
    }

    // Anti-spam check con mensaje
    if (now - this.lastWarningTime < this.MIN_WARNING_INTERVAL) {
      console.log('Advertencia ignorada por anti-spam');
      return;
    }

    this.lastWarningTime = now;
    this.warningCount++;

    // Logging para debug
    console.log(`Advertencia ${this.warningCount} de ${this.MAX_WARNINGS}`);

    const severity = this.warningCount >= this.MAX_WARNINGS ? 'error-snackbar' : 'warning-snackbar';
    const message = `${this.getSecurityMessage(type)} (Advertencia ${this.warningCount}/${this.MAX_WARNINGS})`;
    const action = this.warningCount >= this.MAX_WARNINGS ? 'Entiendo' : 'OK';

    this.snackBar.open(message, action, {
      duration: 6000,
      panelClass: [severity],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });

    if (this.warningCount >= this.MAX_WARNINGS) {
      this.applyPenalty();
    }

    this.updateSecurityState();
    this.saveSecurityState();
  }

  private applyPenalty(): void {
    this.penaltyEndTime = Date.now() + this.PENALTY_DURATION;

    // Mostrar diálogo de penalización
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: '🚫 Penalización por Infracciones',
        message: `Has alcanzado el límite de advertencias permitidas.
                 Tu examen será bloqueado durante 5 minutos como medida de seguridad.
                 Si las infracciones continúan, el examen podría ser finalizado automáticamente.`,
        confirmText: 'Entiendo',
        cancelText: null,
        type: 'error'
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      // Actualizar estado y UI
      this.updateSecurityState();
      this.saveSecurityState();

      // Opcional: redirigir a una página de penalización
      // this.router.navigate(['/examen/penalizacion']);
    });
  }

  private showPenaltyMessage(remainingSeconds: number): void {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const timeFormat = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    this.snackBar.open(
      `🚫 Acceso bloqueado por infracciones múltiples. Tiempo restante: ${timeFormat}`,
      'Entiendo',
      {
        duration: undefined, // El mensaje permanece hasta que termine la penalización
        panelClass: ['error-snackbar', 'persistent-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      }
    );
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
      ANSWER_TOO_FAST: 'Respuesta demasiado rápida, posible comportamiento sospechoso',
      ANSWER_TOO_SLOW: 'Tiempo de respuesta excedido',
      SUSPICIOUS_PATTERN: 'Se ha detectado un patrón de respuestas sospechoso',
      POST_INCIDENT_VALIDATION_FAILED: 'La validación post-incidente ha fallado',
      FULLSCREEN_REQUIRED: 'El examen debe realizarse en modo pantalla completa',
      FULLSCREEN_WARNING: 'Está intentando salir del modo pantalla completa'
    };

    return messages[type] || 'Se ha detectado una violación de seguridad';
  }

  showConnectionWarning(isOnline: boolean): void {
    // Evitar mostrar el mensaje si ya hay uno visible
    this.snackBar.dismiss();

    const message = isOnline
      ? 'Conexión restaurada. Sincronizando...'
      : 'Sin conexión. Tus respuestas se guardarán localmente.';

    this.snackBar.open(message, 'OK', {
      duration: isOnline ? 3000 : undefined,
      panelClass: isOnline ? 'success-snackbar' : 'warning-snackbar',
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  async confirmAction(action: 'finalizar' | 'salir' | 'pantalla-completa'): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      panelClass: 'security-dialog',
      disableClose: true,
      data: {
        title: this.getConfirmTitle(action),
        message: this.getConfirmMessage(action),
        confirmText: 'Continuar',
        cancelText: 'Cancelar'
      }
    });

    return dialogRef.afterClosed().toPromise();
  }

  private showFinalWarningDialog(type?: SecurityViolationType): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Advertencia Final',
        message: 'Has recibido múltiples advertencias de seguridad. ' +
                'La próxima violación podría resultar en la finalización del examen.',
        confirmText: 'Entiendo',
        cancelText: null
      }
    });
  }

  resetWarningCount(): void {
    this.warningCount = 0;
  }

  private getConfirmTitle(action: string): string {
    switch (action) {
      case 'pantalla-completa':
        return 'Advertencia de Seguridad';
      case 'finalizar':
        return 'Finalizar Examen';
      default:
        return 'Salir del Examen';
    }
  }

  private getConfirmMessage(action: string): string {
    switch (action) {
      case 'pantalla-completa':
        return 'Salir del modo pantalla completa se considerará una infracción de seguridad. ¿Está seguro que desea continuar?';
      case 'finalizar':
        return '¿Estás seguro de que deseas finalizar el examen? Esta acción no se puede deshacer.';
      default:
        return '¿Estás seguro de que deseas salir? Se perderá el progreso no guardado.';
    }
  }

  async showFullscreenWarning(): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      panelClass: 'security-dialog',
      disableClose: true,
      backdropClass: 'dark-backdrop',
      data: {
        title: 'Advertencia de Seguridad',
        message: 'Salir del modo pantalla completa se registrará como una infracción de seguridad. ¿Está seguro que desea continuar?',
        confirmText: 'Sí, salir',
        cancelText: 'Cancelar',
        type: 'warning'
      }
    });

    return dialogRef.afterClosed().toPromise();
  }

  @HostListener('window:keydown', ['$event'])
  async handleKeyPress(event: KeyboardEvent): Promise<void> {
    if (event.key === 'Escape' && document.fullscreenElement) {
      event.preventDefault();
      event.stopPropagation();

      const shouldExit = await this.showFullscreenWarning();
      if (!shouldExit) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }

  showClipboardWarning(operation: 'copy' | 'cut' | 'paste'): void {
    const operationMap = {
      copy: 'copiar',
      cut: 'cortar',
      paste: 'pegar'
    };

    this.snackBar.open(
      `⚠️ No está permitido ${operationMap[operation]} contenido durante el examen. Esta acción será registrada como posible intento de fraude.`,
      'Entiendo',
      {
        duration: 6000,
        panelClass: ['warning-snackbar'], // Simplificamos para usar solo la clase principal
        horizontalPosition: 'center',
        verticalPosition: 'top'
      }
    );
  }
}
