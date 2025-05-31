import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private snackBar: MatSnackBar) {}

  success(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: duration,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  error(message: string, duration: number = 5000): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: duration,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  info(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: duration,
      panelClass: ['info-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  warning(message: string, duration: number = 4000): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: duration,
      panelClass: ['warning-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}