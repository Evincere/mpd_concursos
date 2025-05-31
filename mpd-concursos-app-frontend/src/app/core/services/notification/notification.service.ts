import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  /**
   * Muestra un mensaje de éxito
   */
  showSuccess(message: string, title = 'Éxito'): void {
    this.snackBar.open(`${title}: ${message}`, 'Cerrar', {
      duration: 5000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  /**
   * Muestra un mensaje de error
   */
  showError(message: string, title = 'Error'): void {
    this.snackBar.open(`${title}: ${message}`, 'Cerrar', {
      duration: 7000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  /**
   * Muestra un mensaje de advertencia
   */
  showWarning(message: string, title = 'Advertencia'): void {
    this.snackBar.open(`${title}: ${message}`, 'Cerrar', {
      duration: 6000,
      panelClass: ['warning-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  /**
   * Muestra un mensaje informativo
   */
  showInfo(message: string, title = 'Información'): void {
    this.snackBar.open(`${title}: ${message}`, 'Cerrar', {
      duration: 5000,
      panelClass: ['info-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}
