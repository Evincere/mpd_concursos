import { Injectable, HostListener } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';

@Injectable({
  providedIn: 'root'
})
export class ExamenNotificationService {
  private warningCount = 0;
  private readonly MAX_WARNINGS = 3;
  private lastWarningTime: number = 0;
  private readonly MIN_WARNING_INTERVAL = 2000; // 2 segundos entre advertencias

  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  showSecurityWarning(type: SecurityViolationType, details?: string): void {
    const now = Date.now();
    // Evitar spam de notificaciones
    if (now - this.lastWarningTime < this.MIN_WARNING_INTERVAL) {
      return;
    }

    this.lastWarningTime = now;
    this.warningCount++;

    const severity = this.warningCount >= this.MAX_WARNINGS ? 'severe' : 'warning';
    const message = this.getSecurityMessage(type);
    const action = this.warningCount >= this.MAX_WARNINGS ? 'Entiendo' : 'OK';

    this.snackBar.open(message, action, {
      duration: 6000,
      panelClass: [`${severity}-snackbar`],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });

    if (this.warningCount >= this.MAX_WARNINGS) {
      this.showFinalWarningDialog(type);
      // Resetear el contador después de la advertencia final
      this.resetWarningCount();
    }
  }

  showConnectionWarning(isOnline: boolean): void {
    // Evitar mostrar el mensaje si ya hay uno visible
    this.snackBar.dismiss();

    const message = isOnline
      ? 'Conexión restaurada. Sincronizando...'
      : 'Sin conexión. Tus respuestas se guardarán localmente.';

    this.snackBar.open(message, 'OK', {
      duration: isOnline ? 3000 : undefined,
      panelClass: isOnline ? 'success-snackbar' : 'warning-snackbar'
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
      POST_INCIDENT_VALIDATION_FAILED: 'La validación post-incidente ha fallado',
      FULLSCREEN_REQUIRED: 'El examen debe realizarse en modo pantalla completa',
      FULLSCREEN_WARNING: 'Está intentando salir del modo pantalla completa'
    };

    return messages[type] || 'Se ha detectado una violación de seguridad';
  }

  private showFinalWarningDialog(type: SecurityViolationType): void {
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
        title: '⚠️ Advertencia de Seguridad',
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
        panelClass: ['warning-snackbar', 'clipboard-warning'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      }
    );
  }
}
