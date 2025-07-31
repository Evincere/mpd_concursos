import { Injectable, signal } from '@angular/core';
import { LoggingService } from './logging/logging.service';
import { AuthService } from './auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class WelcomeModalService {
  private readonly STORAGE_KEY = 'welcomeModalShown';
  private readonly STORAGE_VERSION = '1.0.0';

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
      const userInfo = this.authService.userInfo();

      if (!userInfo.username) {
        this.loggingService.debug('[WelcomeModalService] Usuario no autenticado, no mostrar modal', undefined, 'WelcomeModal');
        return;
      }

      // Crear clave específica por usuario
      const userSpecificKey = `${this.STORAGE_KEY}_${userInfo.username}`;
      const welcomeData = this.getWelcomeData(userSpecificKey);

      if (!welcomeData.hasShown) {
        this.loggingService.info('[WelcomeModalService] Primer ingreso detectado, mostrando modal de bienvenida', { username: userInfo.username }, 'WelcomeModal');
        this.showModalSignal.set(true);
      } else {
        this.loggingService.debug('[WelcomeModalService] Modal de bienvenida ya mostrado anteriormente', { username: userInfo.username }, 'WelcomeModal');
      }
    } catch (error) {
      this.loggingService.error('[WelcomeModalService] Error al verificar modal de bienvenida:', error, 'WelcomeModal');
    }
  }

  /**
   * Marca el modal como mostrado y lo oculta
   */
  markAsShown(): void {
    try {
      const userInfo = this.authService.userInfo();

      if (!userInfo.username) {
        this.loggingService.warn('[WelcomeModalService] No se puede marcar modal como mostrado sin usuario autenticado', undefined, 'WelcomeModal');
        return;
      }

      const userSpecificKey = `${this.STORAGE_KEY}_${userInfo.username}`;
      const welcomeData = {
        hasShown: true,
        shownAt: new Date().toISOString(),
        version: this.STORAGE_VERSION,
        username: userInfo.username
      };

      localStorage.setItem(userSpecificKey, JSON.stringify(welcomeData));
      this.showModalSignal.set(false);

      this.loggingService.info('[WelcomeModalService] Modal de bienvenida marcado como mostrado', { username: userInfo.username }, 'WelcomeModal');
    } catch (error) {
      this.loggingService.error('[WelcomeModalService] Error al marcar modal como mostrado:', error, 'WelcomeModal');
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
      this.forceShowModal();
    };
    (window as any).resetWelcomeModal = (username?: string) => {
      this.resetWelcomeState(username);
    };
    this.loggingService.info('[WelcomeModalService] Métodos de testing expuestos: showWelcomeModal(), resetWelcomeModal()', undefined, 'WelcomeModal');
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
  private getWelcomeData(key: string): { hasShown: boolean; shownAt?: string; version?: string } {
    try {
      const stored = localStorage.getItem(key);

      if (!stored) {
        return { hasShown: false };
      }

      const data = JSON.parse(stored);

      // Verificar versión para posibles migraciones futuras
      if (data.version !== this.STORAGE_VERSION) {
        this.loggingService.debug('[WelcomeModalService] Versión de datos obsoleta, tratando como no mostrado', { storedVersion: data.version, currentVersion: this.STORAGE_VERSION }, 'WelcomeModal');
        return { hasShown: false };
      }

      return {
        hasShown: data.hasShown || false,
        shownAt: data.shownAt,
        version: data.version
      };
    } catch (error) {
      this.loggingService.error('[WelcomeModalService] Error al leer datos de bienvenida:', error, 'WelcomeModal');
      return { hasShown: false };
    }
  }

  /**
   * Obtiene información sobre el estado del modal para el usuario actual
   */
  getWelcomeStatus(): { hasShown: boolean; shownAt?: string; canShow: boolean } {
    const userInfo = this.authService.userInfo();

    if (!userInfo.username) {
      return { hasShown: false, canShow: false };
    }

    const userSpecificKey = `${this.STORAGE_KEY}_${userInfo.username}`;
    const welcomeData = this.getWelcomeData(userSpecificKey);

    return {
      hasShown: welcomeData.hasShown,
      shownAt: welcomeData.shownAt,
      canShow: !welcomeData.hasShown
    };
  }
}
