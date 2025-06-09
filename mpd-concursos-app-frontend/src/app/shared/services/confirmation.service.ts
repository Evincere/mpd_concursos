import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';

import { ConfirmationDialogComponent, ConfirmationDialogData } from '../components/confirmation-dialog/confirmation-dialog.component';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  constructor(
    private dialog: MatDialog,
    private loggingService: LoggingService
  ) {}


  /**
   * Muestra un diálogo de confirmación
   * @param data Datos del diálogo de confirmación
   * @returns Observable que emite true si el usuario confirma, false si cancela
   */
  confirm(data: ConfirmationDialogData): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: data.width || '400px',
      disableClose: true,
      data
    });

    return dialogRef.afterClosed();
  }

  /**
   * Muestra un diálogo de confirmación de tipo info
   * @param title Título del diálogo
   * @param message Mensaje del diálogo
   * @param detail Detalle opcional del mensaje
   * @param confirmText Texto del botón de confirmación
   * @param cancelText Texto del botón de cancelación
   * @returns Observable que emite true si el usuario confirma, false si cancela
   */
  info(
    title: string,
    message: string,
    detail?: string,
    confirmText = 'Aceptar',
    cancelText = 'Cancelar'
  ): Observable<boolean> {
    return this.confirm({
      title,
      message,
      detail,
      type: 'info',
      confirmText,
      cancelText
    });
  }

  /**
   * Muestra un diálogo de confirmación de tipo advertencia
   * @param title Título del diálogo
   * @param message Mensaje del diálogo
   * @param detail Detalle opcional del mensaje
   * @param confirmText Texto del botón de confirmación
   * @param cancelText Texto del botón de cancelación
   * @returns Observable que emite true si el usuario confirma, false si cancela
   */
  warning(
    title: string,
    message: string,
    detail?: string,
    confirmText = 'Continuar',
    cancelText = 'Cancelar'
  ): Observable<boolean> {
    return this.confirm({
      title,
      message,
      detail,
      type: 'warning',
      confirmText,
      cancelText
    });
  }

  /**
   * Muestra un diálogo de confirmación de tipo peligro
   * @param title Título del diálogo
   * @param message Mensaje del diálogo
   * @param detail Detalle opcional del mensaje
   * @param confirmText Texto del botón de confirmación
   * @param cancelText Texto del botón de cancelación
   * @returns Observable que emite true si el usuario confirma, false si cancela
   */
  danger(
    title: string,
    message: string,
    detail?: string,
    confirmText = 'Eliminar',
    cancelText = 'Cancelar'
  ): Observable<boolean> {
    return this.confirm({
      title,
      message,
      detail,
      type: 'danger',
      confirmText,
      cancelText
    });
  }

  /**
   * Muestra un diálogo de confirmación de tipo éxito
   * @param title Título del diálogo
   * @param message Mensaje del diálogo
   * @param detail Detalle opcional del mensaje
   * @param confirmText Texto del botón de confirmación
   * @param hideCancel Si se debe ocultar el botón de cancelación
   * @returns Observable que emite true si el usuario confirma, false si cancela
   */
  success(
    title: string,
    message: string,
    detail?: string,
    confirmText = 'Aceptar',
    hideCancel = true
  ): Observable<boolean> {
    return this.confirm({
      title,
      message,
      detail,
      type: 'success',
      confirmText,
      hideCancel
    });
  }

  /**
   * Muestra un diálogo de alerta (solo botón de confirmación)
   * @param title Título del diálogo
   * @param message Mensaje del diálogo
   * @param type Tipo de alerta
   * @param confirmText Texto del botón de confirmación
   * @returns Observable que emite true cuando el usuario cierra la alerta
   */
  alert(
    title: string,
    message: string,
    type: 'info' | 'warning' | 'danger' | 'success' = 'info',
    confirmText = 'Aceptar'
  ): Observable<boolean> {
    return this.confirm({
      title,
      message,
      type,
      confirmText,
      hideCancel: true
    });
  }
}
