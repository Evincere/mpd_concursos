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
  private readonly PENALTY_DURATION = 300000; // 5 minutos de penalización

  private warningCount = 0;
  private lastWarningTime = 0;
  private penaltyEndTime = 0;

  // Observable para el estado de las infracciones
  private securityStateSubject = new BehaviorSubject<{
    warningCount: number;
    isPenalized: boolean;
    remainingPenaltyTime: number;
  }>({ warningCount: 0, isPenalized: false, remainingPenaltyTime: 0 });

  public securityState$ = this.securityStateSubject.asObservable();
  private infracciones: SecurityViolationType[] = [];

  // Bandera para controlar si se permiten mostrar notificaciones
  private allowNotifications = false;

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
    return userId ? `securityState_${userId}` : 'securityState_anonymous';
  }

  private loadSecurityState(): void {
    const savedState = localStorage.getItem(this.getSecurityStateKey());
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        // Solo cargar el estado si la penalización no ha expirado
        if (state.penaltyEndTime > Date.now()) {
          this.warningCount = state.warningCount;
          this.penaltyEndTime = state.penaltyEndTime;
        } else {
          // Si la penalización ha expirado, reiniciar el estado
          this.resetSecurityState();
        }
        this.updateSecurityState();
      } catch (e) {
        console.error('Error al cargar el estado de seguridad:', e);
        this.resetSecurityState();
      }
    }
  }

  public resetSecurityState(): void {
    this.warningCount = 0;
    this.penaltyEndTime = 0;
    this.lastWarningTime = 0;
    this.infracciones = [];
    localStorage.removeItem(this.getSecurityStateKey());
    this.updateSecurityState();
    // Cerrar cualquier snackbar abierto
    this.snackBar.dismiss();
  }

  private saveSecurityState(): void {
    const state = {
      warningCount: this.warningCount,
      penaltyEndTime: this.penaltyEndTime,
      lastWarningTime: this.lastWarningTime
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
    const now = Date.now();
    const isPenalized = this.penaltyEndTime > now;
    const remainingPenaltyTime = Math.max(0, this.penaltyEndTime - now);

    this.securityStateSubject.next({
      warningCount: this.warningCount,
      isPenalized,
      remainingPenaltyTime
    });
  }

  private logSecurityState(): void {
    this.securityState$.subscribe(state => {
      console.log('Estado de seguridad:', state);
    });
  }

  public showSecurityWarning(type: SecurityViolationType, details?: string): void {
    // Si las notificaciones están deshabilitadas, no mostramos nada
    if (!this.allowNotifications) {
      console.log('Notificación de seguridad ignorada porque las notificaciones están deshabilitadas:', type);
      return;
    }

    const now = Date.now();

    // Registrar la infracción
    this.infracciones.push(type);

    // Incrementar el contador de advertencias si ha pasado suficiente tiempo
    if (now - this.lastWarningTime >= this.MIN_WARNING_INTERVAL) {
      this.warningCount++;
      this.lastWarningTime = now;

      // Actualizar el estado
      this.updateSecurityState();
      this.saveSecurityState();

      // Mostrar mensaje según la gravedad
      if (this.warningCount >= this.MAX_WARNINGS) {
        this.applyPenalty();
      } else if (this.warningCount === this.MAX_WARNINGS - 1) {
        this.showFinalWarningDialog(type);
      } else {
        this.snackBar.open(
          this.getSecurityMessage(type),
          'Entendido',
          { duration: 5000 }
        );
      }
    }
  }

  private applyPenalty(): void {
    this.penaltyEndTime = Date.now() + this.PENALTY_DURATION;

    // Mostrar diálogo de penalización
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Penalización por Infracciones',
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
    this.penaltyEndTime = 0;
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
}
