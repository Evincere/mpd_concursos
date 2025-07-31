import { Injectable, signal } from '@angular/core';
import { LoggingService } from './logging/logging.service';
import { AuthService } from './auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class WelcomeModalService {
  private readonly STORAGE_KEY = 'welcomeModalDontShowAgain';
  private readonly STORAGE_VERSION = '2.0.0';

  // Signal para controlar la visibilidad del modal
  private showModalSignal = signal<boolean>(false);
  public readonly showModal = this.showModalSignal.asReadonly();

  constructor(
    private loggingService: LoggingService,
    private authService: AuthService
  ) {}

  /**
   * Verifica si se debe mostrar el modal de bienvenida
   * Se ejecuta después del login exitoso
   */
  checkShouldShowWelcomeModal(): void {
    try {
      this.loggingService.debug('[WelcomeModalService] Iniciando verificación de modal de bienvenida', undefined, 'WelcomeModal');

      const userInfo = this.authService.userInfo();
      this.loggingService.debug('[WelcomeModalService] Información del usuario obtenida:', { username: userInfo.username, cuit: userInfo.cuit }, 'WelcomeModal');

      if (!userInfo.username) {
        this.loggingService.debug('[WelcomeModalService] Usuario no autenticado, no mostrar modal', undefined, 'WelcomeModal');
        return;
      }

      // Crear clave específica por usuario
      const userSpecificKey = `${this.STORAGE_KEY}_${userInfo.username}`;
      this.loggingService.debug('[WelcomeModalService] Clave de localStorage:', { key: userSpecificKey }, 'WelcomeModal');

      const welcomeData = this.getWelcomeData(userSpecificKey);
      this.loggingService.debug('[WelcomeModalService] Datos de bienvenida obtenidos:', welcomeData, 'WelcomeModal');

      if (!welcomeData.dontShowAgain) {
        this.loggingService.info('[WelcomeModalService] Mostrando modal de bienvenida en login', { username: userInfo.username }, 'WelcomeModal');
        this.showModalSignal.set(true);
        this.loggingService.debug('[WelcomeModalService] Signal del modal establecido a true', undefined, 'WelcomeModal');
      } else {
        this.loggingService.debug('[WelcomeModalService] Usuario marcó "No mostrar nuevamente", omitiendo modal', { username: userInfo.username, markedAt: welcomeData.markedAt }, 'WelcomeModal');
      }
    } catch (error) {
      this.loggingService.error('[WelcomeModalService] Error al verificar modal de bienvenida:', error, 'WelcomeModal');
    }
  }

  /**
   * Marca el modal para no mostrarse nuevamente y lo oculta
   */
  markAsShown(): void {
    try {
      const userInfo = this.authService.userInfo();

      if (!userInfo.username) {
        this.loggingService.warn('[WelcomeModalService] No se puede marcar modal como "no mostrar" sin usuario autenticado', undefined, 'WelcomeModal');
        return;
      }

      const userSpecificKey = `${this.STORAGE_KEY}_${userInfo.username}`;
      const welcomeData = {
        dontShowAgain: true,
        markedAt: new Date().toISOString(),
        version: this.STORAGE_VERSION,
        username: userInfo.username
      };

      localStorage.setItem(userSpecificKey, JSON.stringify(welcomeData));
      this.showModalSignal.set(false);

      this.loggingService.info('[WelcomeModalService] Modal de bienvenida marcado como "no mostrar nuevamente"', { username: userInfo.username }, 'WelcomeModal');
    } catch (error) {
      this.loggingService.error('[WelcomeModalService] Error al marcar modal como "no mostrar":', error, 'WelcomeModal');
      // Ocultar modal aunque haya error para no bloquear al usuario
      this.showModalSignal.set(false);
    }
  }

  /**
   * Oculta el modal sin marcarlo como mostrado (para el botón de cerrar)
   */
  hideModal(): void {
    this.showModalSignal.set(false);
    this.loggingService.debug('[WelcomeModalService] Modal de bienvenida ocultado temporalmente', undefined, 'WelcomeModal');
  }

  /**
   * Fuerza mostrar el modal (para testing o casos especiales)
   */
  forceShowModal(): void {
    this.showModalSignal.set(true);
    this.loggingService.debug('[WelcomeModalService] Modal de bienvenida forzado a mostrar', undefined, 'WelcomeModal');
  }

  /**
   * Método para testing - expone el modal globalmente
   */
  exposeForTesting(): void {
    (window as any).showWelcomeModal = () => {
      this.loggingService.info('[WelcomeModalService] showWelcomeModal() ejecutado desde consola', undefined, 'WelcomeModal');
      this.forceShowModal();
      return 'Modal de bienvenida activado';
    };
    (window as any).resetWelcomeModal = (username?: string) => {
      this.loggingService.info('[WelcomeModalService] resetWelcomeModal() ejecutado desde consola', { username }, 'WelcomeModal');
      this.resetWelcomeState(username);
      return 'Estado del modal reseteado';
    };
    (window as any).checkWelcomeStatus = () => {
      const status = this.getWelcomeStatus();
      this.loggingService.info('[WelcomeModalService] Estado actual del modal:', status, 'WelcomeModal');
      return status;
    };
    this.loggingService.info('[WelcomeModalService] Métodos de testing expuestos: showWelcomeModal(), resetWelcomeModal(), checkWelcomeStatus()', undefined, 'WelcomeModal');
  }

  /**
   * Resetea el estado del modal para un usuario (para testing)
   */
  resetWelcomeState(username?: string): void {
    try {
      const targetUsername = username || this.authService.userInfo().username;

      if (!targetUsername) {
        this.loggingService.warn('[WelcomeModalService] No se puede resetear estado sin username', undefined, 'WelcomeModal');
        return;
      }

      const userSpecificKey = `${this.STORAGE_KEY}_${targetUsername}`;
      localStorage.removeItem(userSpecificKey);

      this.loggingService.info('[WelcomeModalService] Estado de modal de bienvenida reseteado', { username: targetUsername }, 'WelcomeModal');
    } catch (error) {
      this.loggingService.error('[WelcomeModalService] Error al resetear estado del modal:', error, 'WelcomeModal');
    }
  }

  /**
   * Obtiene los datos de bienvenida del localStorage
   */
  private getWelcomeData(key: string): { dontShowAgain: boolean; markedAt?: string; version?: string } {
    try {
      const stored = localStorage.getItem(key);

      if (!stored) {
        return { dontShowAgain: false };
      }

      const data = JSON.parse(stored);

      // Verificar versión para posibles migraciones futuras
      if (data.version !== this.STORAGE_VERSION) {
        this.loggingService.debug('[WelcomeModalService] Versión de datos obsoleta, tratando como mostrar modal', { storedVersion: data.version, currentVersion: this.STORAGE_VERSION }, 'WelcomeModal');
        return { dontShowAgain: false };
      }

      return {
        dontShowAgain: data.dontShowAgain || false,
        markedAt: data.markedAt,
        version: data.version
      };
    } catch (error) {
      this.loggingService.error('[WelcomeModalService] Error al leer datos de bienvenida:', error, 'WelcomeModal');
      return { dontShowAgain: false };
    }
  }

  /**
   * Obtiene información sobre el estado del modal para el usuario actual
   */
  getWelcomeStatus(): { dontShowAgain: boolean; markedAt?: string; canShow: boolean } {
    const userInfo = this.authService.userInfo();

    if (!userInfo.username) {
      return { dontShowAgain: false, canShow: false };
    }

    const userSpecificKey = `${this.STORAGE_KEY}_${userInfo.username}`;
    const welcomeData = this.getWelcomeData(userSpecificKey);

    return {
      dontShowAgain: welcomeData.dontShowAgain,
      markedAt: welcomeData.markedAt,
      canShow: !welcomeData.dontShowAgain
    };
  }
}
