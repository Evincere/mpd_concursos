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

  private warningCount = 0;
  private lastWarningTime = 0;
  private infracciones: SecurityViolationType[] = [];
  private allowNotifications = false;

  // Observable para el estado de las infracciones
  private securityStateSubject = new BehaviorSubject<{
    warningCount: number;
    infracciones: SecurityViolationType[];
  }>({ warningCount: 0, infracciones: [] });

  public securityState$ = this.securityStateSubject.asObservable();

  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {
    this.loadSecurityState();
  }

  private getCurrentUserId(): string | null {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      return user.id || null;
    } catch {
      return null;
    }
  }

  private getSecurityStateKey(): string {
    const userId = this.getCurrentUserId();
    return userId ? `securityState_${userId}` : 'securityState';
  }

  private loadSecurityState(): void {
    const savedState = localStorage.getItem(this.getSecurityStateKey());
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        this.warningCount = state.warningCount;
        this.infracciones = state.infracciones || [];
        this.updateSecurityState();
      } catch (e) {
        console.error('Error al cargar el estado de seguridad:', e);
        this.resetSecurityState();
      }
    }
  }

  public resetSecurityState(): void {
    this.warningCount = 0;
    this.lastWarningTime = 0;
    this.infracciones = [];
    localStorage.removeItem(this.getSecurityStateKey());
    this.updateSecurityState();
    this.snackBar.dismiss();
  }

  private saveSecurityState(): void {
    const state = {
      warningCount: this.warningCount,
      infracciones: this.infracciones
    };
    localStorage.setItem(this.getSecurityStateKey(), JSON.stringify(state));
  }

  private updateSecurityState(): void {
    this.securityStateSubject.next({
      warningCount: this.warningCount,
      infracciones: this.infracciones
    });
  }

  public showSecurityWarning(violationType: SecurityViolationType, customMessage?: string): void {
    // Si las notificaciones están deshabilitadas y no es una violación crítica, ignoramos
    if (!this.allowNotifications && !this.isViolacionCritica(violationType)) {
        console.log('Notificación de seguridad ignorada porque las notificaciones están deshabilitadas:', violationType);
        return;
    }

    const now = Date.now();

    // Registrar la infracción
    this.infracciones.push(violationType);

    // Incrementar el contador de advertencias si ha pasado suficiente tiempo
    if (now - this.lastWarningTime >= this.MIN_WARNING_INTERVAL) {
      this.warningCount++;
      this.lastWarningTime = now;

      // Actualizar el estado
      this.updateSecurityState();
      this.saveSecurityState();

      // Mostrar mensaje según la cantidad de advertencias
      if (this.warningCount >= this.MAX_WARNINGS) {
        this.showFinalWarningDialog();
      } else {
        const remaining = this.MAX_WARNINGS - this.warningCount;
        this.snackBar.open(
          `${this.getSecurityMessage(violationType)}. ${remaining} advertencia${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''} antes de anular el examen.`,
          'Entendido',
          { duration: 5000 }
        );
      }
    }
  }

  private showFinalWarningDialog(): Promise<void> {
    // Aseguramos que las notificaciones estén habilitadas
    this.enableNotifications();

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Examen Anulado',
        message: `El examen ha sido anulado debido a múltiples infracciones de seguridad.
                 \nInfracciones detectadas:\n${this.infracciones
                   .map(inf => `- ${this.getSecurityMessage(inf)}`)
                   .join('\n')}`,
        confirmText: 'Aceptar',
        showCancel: false
      }
    });

    return new Promise((resolve) => {
      dialogRef.afterClosed().subscribe(() => {
        // Deshabilitamos las notificaciones solo después de mostrar el diálogo
        this.disableNotifications();
        // Redirigir al listado de exámenes
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
    // Si las notificaciones están deshabilitadas, no mostramos nada
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

  async showConfirmDialog(title: string, message: string): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title,
        message,
        confirmText: 'Aceptar',
        cancelText: 'Cancelar',
        type: 'info'
      }
    });

    return dialogRef.afterClosed().toPromise();
  }

  public isExamenAnulado(): boolean {
    return this.warningCount >= this.MAX_WARNINGS;
  }

  public getInfracciones(): SecurityViolationType[] {
    return [...this.infracciones];
  }

  /**
   * Limpia todas las notificaciones y diálogos, y reinicia el estado de seguridad.
   * Debe llamarse cuando se navega fuera del examen o cuando se quiere limpiar
   * completamente el estado de las notificaciones.
   */
  public cleanupNotifications(): void {
    // Cerrar cualquier snackbar abierto
    this.snackBar.dismiss();

    // Cerrar todos los diálogos abiertos
    this.dialog.closeAll();

    // Reiniciar el estado de seguridad
    this.resetSecurityState();

    // Eliminamos todas las claves relacionadas con seguridad del localStorage
    this.cleanupLocalStorage();

    console.log('Notificaciones y estado de seguridad limpiados correctamente');
  }

  /**
   * Limpia todas las claves relacionadas con seguridad del localStorage
   */
  private cleanupLocalStorage(): void {
    // Eliminar todas las claves que coincidan con el patrón de seguridad
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('securityState_') || key.includes('security') || key.includes('infraccion'))) {
        console.log('Eliminando clave de localStorage:', key);
        localStorage.removeItem(key);
        // Decrementar el índice ya que se ha eliminado un elemento
        i--;
      }
    }

    // Eliminar específicamente las claves relacionadas con seguridad
    localStorage.removeItem(this.getSecurityStateKey());
    localStorage.removeItem('examenSecurityState');
    localStorage.removeItem('lastWarnings');

    // Reiniciar variables internas
    this.warningCount = 0;
    this.lastWarningTime = 0;
    this.infracciones = [];

    // Actualizar el estado
    this.updateSecurityState();
  }

  /**
   * Habilita las notificaciones de seguridad
   */
  public enableNotifications(): void {
    this.allowNotifications = true;
    console.log('Notificaciones de seguridad habilitadas');
  }

  /**
   * Deshabilita las notificaciones de seguridad
   */
  public disableNotifications(): void {
    this.allowNotifications = false;
    console.log('Notificaciones de seguridad deshabilitadas');

    // Cerrar notificaciones existentes
    this.cleanupNotifications();
  }

  private isViolacionCritica(violationType: SecurityViolationType): boolean {
    return [
        SecurityViolationType.FULLSCREEN_EXIT,
        SecurityViolationType.FULLSCREEN_DENIED
    ].includes(violationType);
  }

  mostrarError(mensaje: string, duracion: number = 5000): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: duracion,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  mostrarExito(mensaje: string, duracion: number = 3000): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: duracion,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}
