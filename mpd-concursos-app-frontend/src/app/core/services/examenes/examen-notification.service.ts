import { Injectable } from '@angular/core';
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

  async confirmAction(action: 'finalizar' | 'salir'): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: action === 'finalizar' ? 'Finalizar Examen' : 'Salir del Examen',
        message: action === 'finalizar' 
          ? '¿Estás seguro de que deseas finalizar el examen? Esta acción no se puede deshacer.'
          : '¿Estás seguro de que deseas salir? Se perderá el progreso no guardado.',
        confirmText: action === 'finalizar' ? 'Finalizar' : 'Salir',
        cancelText: 'Cancelar'
      }
    });

    return dialogRef.afterClosed().toPromise();
  }

  private getSecurityMessage(type: SecurityViolationType): string {
    const messages: Record<SecurityViolationType, string> = {
      FULLSCREEN_EXIT: 'Por favor, mantén el modo pantalla completa activo.',
      FULLSCREEN_DENIED: 'No se pudo activar el modo pantalla completa.',
      TAB_SWITCH: 'No está permitido cambiar de pestaña durante el examen.',
      KEYBOARD_SHORTCUT: 'Atajo de teclado bloqueado por seguridad.',
      CLIPBOARD_OPERATION: 'No se permite copiar o pegar durante el examen.',
      INACTIVITY_TIMEOUT: 'Se ha detectado inactividad prolongada.',
      NETWORK_VIOLATION: 'Se ha detectado una violación de red.',
      SUSPICIOUS_BEHAVIOR: 'Se ha detectado un comportamiento sospechoso.',
      TIME_MANIPULATION: 'Se ha detectado manipulación del tiempo.',
      TIME_DRIFT: 'Se ha detectado desincronización del tiempo.',
      SUSPICIOUS_ANSWER: 'Respuesta marcada como sospechosa.',
      ANSWER_TOO_FAST: 'Respuesta demasiado rápida.',
      ANSWER_TOO_SLOW: 'Tiempo de respuesta excedido.',
      SUSPICIOUS_PATTERN: 'Se ha detectado un patrón sospechoso.',
      POST_INCIDENT_VALIDATION_FAILED: 'La validación post-incidente ha fallado.'
    };

    return messages[type] || 'Se ha detectado una violación de seguridad.';
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
} 