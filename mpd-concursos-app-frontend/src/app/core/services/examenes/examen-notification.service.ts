import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { SecurityViolation, SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import { ICleanupService } from '@core/interfaces/examenes/cleanup/cleanup.interface';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ExamenNotificationService implements ICleanupService {
  private allowNotifications = true;

  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {}

  public showSecurityWarning(violationType: SecurityViolationType, message?: string): void {
    if (!this.allowNotifications) {
      console.log('Notificación de seguridad ignorada porque las notificaciones están deshabilitadas:', violationType);
      return;
    }

    const finalMessage = message || this.getSecurityMessage(violationType);
    this.snackBar.open(
      finalMessage,
      'Entendido',
      { duration: 5000 }
    );
  }

  public mostrarError(mensaje: string): void {
    if (!this.allowNotifications) return;

    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  public mostrarExito(mensaje: string): void {
    if (!this.allowNotifications) return;

    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  public mostrarAdvertencia(mensaje: string): void {
    if (!this.allowNotifications) return;

    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['warning-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  public showFinalWarningDialog(violations: SecurityViolation[]): Promise<void> {
    this.allowNotifications = true;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Examen Anulado',
        message: `El examen ha sido anulado debido a múltiples infracciones de seguridad.
                 \nInfracciones detectadas:\n${violations
                   .map(v => `- ${this.getSecurityMessage(v.type)}`)
                   .join('\n')}`,
        confirmText: 'Aceptar',
        showCancel: false
      }
    });

    return new Promise((resolve) => {
      dialogRef.afterClosed().subscribe(() => {
        this.allowNotifications = false;
        this.router.navigate(['/dashboard/examenes']);
        resolve();
      });
    });
  }

  public getSecurityMessage(type: SecurityViolationType): string {
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
    if (!this.allowNotifications) {
      console.log('Advertencia de pantalla completa ignorada porque las notificaciones están deshabilitadas');
      return false;
    }

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

  enableNotifications(): void {
    this.allowNotifications = true;
  }

  disableNotifications(): void {
    this.allowNotifications = false;
  }

  /**
   * Limpia todas las notificaciones y diálogos activos
   */
  cleanup(): void {
    this.snackBar.dismiss();
    this.dialog.closeAll();
    this.allowNotifications = false;
  }

  /**
   * Reinicia el estado de las notificaciones
   */
  reset(): void {
    this.cleanup();
    this.allowNotifications = true;
  }
}
