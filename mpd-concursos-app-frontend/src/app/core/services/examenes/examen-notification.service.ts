import { Injectable, HostListener } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import { BehaviorSubject } from 'rxjs';
import { firstValueFrom } from 'rxjs';
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
  private examenAnulado = false;

  // Observable para el estado de las infracciones
  private securityStateSubject = new BehaviorSubject<{
    warningCount: number;
    isAnulado: boolean;
    infracciones: SecurityViolationType[];
  }>({ warningCount: 0, isAnulado: false, infracciones: [] });

  public securityState$ = this.securityStateSubject.asObservable();

  private infracciones: SecurityViolationType[] = [];

  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {
    this.loadSecurityState();
    this.startPenaltyTimer();
    this.logSecurityState(); // Para debugging
  }

  private getCurrentUserId(): string | null {
    const user = localStorage.getItem('currentUser');
    if (user) {
      try {
        const userData = JSON.parse(user);
        return userData.id || null;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  private getSecurityStateKey(): string {
    const userId = this.getCurrentUserId();
    const examenId = localStorage.getItem('currentExamenId') || 'unknown';
    return `security_state_${userId}_${examenId}`;
  }

  private loadSecurityState(): void {
    const savedState = localStorage.getItem(this.getSecurityStateKey());
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        this.warningCount = state.warningCount;
        this.examenAnulado = state.isAnulado;
        this.infracciones = state.infracciones || [];
        this.updateSecurityState();
      } catch (e) {
        console.error('Error al cargar el estado de seguridad:', e);
        this.resetSecurityState();
      }
    }
  }

  resetSecurityState(): void {
    this.warningCount = 0;
    this.examenAnulado = false;
    this.infracciones = [];
    this.penaltyEndTime = 0;
    this.lastWarningTime = 0;

    // Limpiar el estado del localStorage para el usuario actual
    localStorage.removeItem(this.getSecurityStateKey());

    // Actualizar el estado observable
    this.updateSecurityState();

    // Cerrar cualquier snackbar abierto
    this.snackBar.dismiss();
  }

  private saveSecurityState(): void {
    const state = {
      warningCount: this.warningCount,
      isAnulado: this.examenAnulado,
      infracciones: this.infracciones
    };
    localStorage.setItem(this.getSecurityStateKey(), JSON.stringify(state));
  }

  private startPenaltyTimer(): void {
    setInterval(() => {
      if (this.penaltyEndTime > 0) {
        const remaining = this.penaltyEndTime - Date.now();
        if (remaining <= 0) {
          this.resetSecurityState();
        } else {
          this.updateSecurityState();
          this.saveSecurityState();
        }
      }
    }, 1000);
  }

  private updateSecurityState(): void {
    this.securityStateSubject.next({
      warningCount: this.warningCount,
      isAnulado: this.examenAnulado,
      infracciones: this.infracciones
    });
  }

  private logSecurityState(): void {
    this.securityState$.subscribe(state => {
      console.log('Estado de seguridad:', state);
    });
  }

  showSecurityWarning(type: SecurityViolationType, details?: string): void {
    const now = Date.now();

    // Verificar si el examen ya está anulado
    if (this.examenAnulado) {
      return;
    }

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
    this.infracciones.push(type);

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
      this.anularExamen();
    }

    this.updateSecurityState();
    this.saveSecurityState();
  }

  private anularExamen(): void {
    this.examenAnulado = true;

    // Mostrar diálogo de anulación
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: '🚫 Examen Anulado por Infracciones',
        message: `Se ha alcanzado el límite de advertencias permitidas.
                 Tu examen ha sido anulado debido a múltiples infracciones de seguridad.
                 Serás redirigido al listado de exámenes.

                 Infracciones cometidas:
                 ${this.infracciones.map(inf => `- ${this.getSecurityMessage(inf)}`).join('\n')}`,
        confirmText: 'Entiendo',
        cancelText: null,
        type: 'error'
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      // Actualizar estado y UI
      this.updateSecurityState();
      this.saveSecurityState();

      // Redirigir al listado de exámenes
      this.router.navigate(['/examenes']);
    });
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

  getSecurityMessage(type: SecurityViolationType): string {
    const messages: { [key in SecurityViolationType]: string } = {
      TAB_SWITCH: 'Has cambiado de pestaña o aplicación',
      FULLSCREEN_EXIT: 'Has intentado salir del modo pantalla completa',
      CLIPBOARD_OPERATION: 'Se ha detectado un intento de copiar o pegar contenido',
      NETWORK_VIOLATION: 'Se ha detectado un cambio en la conexión',
      SUSPICIOUS_BEHAVIOR: 'Se han detectado múltiples pantallas',
      KEYBOARD_SHORTCUT: 'Se ha detectado el uso de herramientas de desarrollo',
      INACTIVITY_TIMEOUT: 'La ventana del examen ha perdido visibilidad',
      POST_INCIDENT_VALIDATION_FAILED: 'Validación de integridad fallida',
      TIME_MANIPULATION: 'Manipulación del tiempo detectada',
      TIME_DRIFT: 'Desincronización del tiempo',
      SUSPICIOUS_ANSWER: 'Respuesta sospechosa',
      ANSWER_TOO_FAST: 'Respuesta demasiado rápida',
      ANSWER_TOO_SLOW: 'Tiempo de respuesta excedido',
      SUSPICIOUS_PATTERN: 'Patrón de respuestas sospechoso',
      FULLSCREEN_DENIED: 'Modo pantalla completa denegado',
      FULLSCREEN_REQUIRED: 'Pantalla completa requerida',
      FULLSCREEN_WARNING: 'Advertencia de pantalla completa'
    };
    return messages[type] || 'Violación de seguridad detectada';
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

    return firstValueFrom(dialogRef.afterClosed());
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
    return this.examenAnulado;
  }

  public getInfracciones(): SecurityViolationType[] {
    return [...this.infracciones];
  }
}
