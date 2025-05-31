import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private snackBar: {
    open: (message: string, action: string, config?: Record<string, unknown>) => void;
    dismiss: () => void;
  };

  constructor() {
    // En una implementación real, se inyectaría MatSnackBar
    this.snackBar = {
      open: (message: string, action: string, config?: Record<string, unknown>) => {
        console.log(`Notificación: ${message}`, action, config);
      },
      dismiss: () => {
        console.log('Notificación cerrada');
      }
    };
  }

  /**
   * Muestra un mensaje de éxito
   */
  mostrarExito(mensaje: string, duracion = 5000): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: duracion,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  /**
   * Muestra un mensaje de error
   */
  mostrarError(mensaje: string, duracion = 7000): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: duracion,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  /**
   * Muestra un mensaje de advertencia
   */
  mostrarAdvertencia(mensaje: string, duracion = 6000): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: duracion,
      panelClass: ['warning-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  /**
   * Muestra un mensaje informativo
   */
  mostrarInfo(mensaje: string, duracion = 5000): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: duracion,
      panelClass: ['info-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  /**
   * Limpia cualquier notificación activa
   */
  cleanup(): void {
    this.snackBar.dismiss();
  }

  /**
   * Deshabilita las notificaciones
   */
  disableNotifications(): void {
    // Esta función es un placeholder para mantener compatibilidad con ExamenNotificationService
    console.log('Notificaciones deshabilitadas');
  }
}
