import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent, ErrorDialogData } from './error-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class ErrorDialogService {
  private adminEmail = 'administracion@mdp.gov.ar';

  constructor(
    private dialog: MatDialog,
    private loggingService: LoggingService
  ) {}

  /**
   * Muestra un diálogo de error genérico
   */
  showError(message: string, title = 'Error'): void {
    this.dialog.open(ErrorDialogComponent, {
      maxWidth: '450px',
      width: '90%',
      minWidth: '320px',
      autoFocus: false,
      disableClose: false,
      panelClass: ['glassmorphism-dialog', 'error-dialog'],
      backdropClass: 'cdk-overlay-dark-backdrop',
      data: {
        title,
        message,
        buttonText: 'CERRAR'
      }
    });
  }

  /**
   * Muestra un diálogo de error específico para cuentas bloqueadas
   */
  showBlockedAccountError(): void {
    this.dialog.open(ErrorDialogComponent, {
      maxWidth: '450px',
      width: '90%',
      minWidth: '320px',
      autoFocus: false,
      disableClose: false,
      panelClass: ['glassmorphism-dialog', 'error-dialog', 'blocked-account-dialog'],
      backdropClass: 'cdk-overlay-dark-backdrop',
      data: {
        title: 'Cuenta bloqueada',
        message: 'Su cuenta ha sido bloqueada por motivos de seguridad. Para resolver este problema, por favor contacte al administrador del sistema.',
        buttonText: 'CERRAR',
        showAdminContact: true,
        adminEmail: this.adminEmail
      }
    });
  }

  /**
   * Muestra un diálogo de error de autorización
   */
  showAuthorizationError(message?: string): void {
    this.dialog.open(ErrorDialogComponent, {
      maxWidth: '450px',
      width: '90%',
      minWidth: '320px',
      autoFocus: false,
      disableClose: false,
      panelClass: ['glassmorphism-dialog', 'error-dialog', 'authorization-error-dialog'],
      backdropClass: 'cdk-overlay-dark-backdrop',
      data: {
        title: 'Error de permisos',
        message: message || 'No tiene permisos para realizar esta acción.',
        buttonText: 'CERRAR'
      }
    });
  }
}
