import { Injectable, NgZone } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { BehaviorSubject, Observable, fromEvent, merge, of } from 'rxjs';
import { filter, map, switchMap, take, catchError } from 'rxjs/operators';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';

/**
 * Estado de la PWA
 */
export interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  isUpdating: boolean;
  installPrompt?: BeforeInstallPromptEvent;
}

/**
 * Configuración de PWA
 */
export interface PWAConfig {
  enableAutoUpdate: boolean;
  enableInstallPrompt: boolean;
  enableOfflineNotification: boolean;
  updateCheckInterval: number;
  installPromptDelay: number;
}

/**
 * Evento de instalación de PWA
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

/**
 * Servicio de gestión de PWA
 */
@Injectable({
  providedIn: 'root'
})
export class PWAManagerService {

  private stateSubject = new BehaviorSubject<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: navigator.onLine,
    hasUpdate: false,
    isUpdating: false
  });

  private configSubject = new BehaviorSubject<PWAConfig>({
    enableAutoUpdate: true,
    enableInstallPrompt: true,
    enableOfflineNotification: true,
    updateCheckInterval: 60000, // 1 minuto
    installPromptDelay: 30000 // 30 segundos
  });

  // Observables públicos
  public state$ = this.stateSubject.asObservable();
  public config$ = this.configSubject.asObservable();

  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private updateCheckTimer?: number;

  constructor(
    private swUpdate: SwUpdate,
    private ngZone: NgZone,
    private notificationService: CustomNotificationService
  ) {
    this.initializePWA();
  }

  /**
   * Inicializa la PWA
   */
  private initializePWA(): void {
    this.checkInstallationStatus();
    this.setupNetworkMonitoring();
    this.setupInstallPrompt();
    this.setupServiceWorkerUpdates();
    this.startUpdateChecking();
  }

  /**
   * Verifica el estado de instalación
   */
  private checkInstallationStatus(): void {
    // Verificar si la app está instalada
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone ||
                       document.referrer.includes('android-app://');

    this.updateState({ isInstalled });
  }

  /**
   * Configura el monitoreo de red
   */
  private setupNetworkMonitoring(): void {
    this.ngZone.runOutsideAngular(() => {
      merge(
        fromEvent(window, 'online'),
        fromEvent(window, 'offline')
      ).subscribe(() => {
        this.ngZone.run(() => {
          const isOnline = navigator.onLine;
          this.updateState({ isOnline });

          if (this.configSubject.value.enableOfflineNotification) {
            if (isOnline) {
              this.notificationService.showSuccess('Conexión restaurada');
            } else {
              this.notificationService.showWarning('Sin conexión a internet. Trabajando en modo offline.');
            }
          }
        });
      });
    });
  }

  /**
   * Configura el prompt de instalación
   */
  private setupInstallPrompt(): void {
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('beforeinstallprompt', (e: Event) => {
        e.preventDefault();
        this.deferredPrompt = e as BeforeInstallPromptEvent;
        
        this.ngZone.run(() => {
          this.updateState({ 
            isInstallable: true,
            installPrompt: this.deferredPrompt!
          });

          // Mostrar prompt después del delay configurado
          if (this.configSubject.value.enableInstallPrompt) {
            setTimeout(() => {
              this.showInstallPrompt();
            }, this.configSubject.value.installPromptDelay);
          }
        });
      });

      window.addEventListener('appinstalled', () => {
        this.ngZone.run(() => {
          this.updateState({ 
            isInstalled: true,
            isInstallable: false,
            installPrompt: undefined
          });
          this.notificationService.showSuccess('¡Aplicación instalada exitosamente!');
        });
      });
    });
  }

  /**
   * Configura las actualizaciones del Service Worker
   */
  private setupServiceWorkerUpdates(): void {
    if (!this.swUpdate.isEnabled) {
      console.warn('Service Worker updates not enabled');
      return;
    }

    // Detectar actualizaciones disponibles
    this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
      .subscribe(() => {
        this.updateState({ hasUpdate: true });
        this.showUpdatePrompt();
      });

    // Detectar cuando se activa una nueva versión
    this.swUpdate.versionUpdates
      .pipe(filter(evt => evt.type === 'VERSION_INSTALLED'))
      .subscribe(() => {
        this.notificationService.showSuccess('Nueva versión instalada. Reinicia la aplicación para aplicar los cambios.');
      });
  }

  /**
   * Inicia la verificación periódica de actualizaciones
   */
  private startUpdateChecking(): void {
    if (!this.swUpdate.isEnabled || !this.configSubject.value.enableAutoUpdate) {
      return;
    }

    this.updateCheckTimer = window.setInterval(() => {
      this.checkForUpdate();
    }, this.configSubject.value.updateCheckInterval);
  }

  /**
   * Verifica si hay actualizaciones disponibles
   */
  public checkForUpdate(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) {
      return Promise.resolve(false);
    }

    return this.swUpdate.checkForUpdate().catch(error => {
      console.error('Error checking for updates:', error);
      return false;
    });
  }

  /**
   * Aplica la actualización disponible
   */
  public applyUpdate(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) {
      return Promise.resolve(false);
    }

    this.updateState({ isUpdating: true });

    return this.swUpdate.activateUpdate()
      .then(() => {
        this.updateState({ 
          hasUpdate: false,
          isUpdating: false
        });
        
        // Recargar la página para aplicar la actualización
        window.location.reload();
        return true;
      })
      .catch(error => {
        console.error('Error applying update:', error);
        this.updateState({ isUpdating: false });
        this.notificationService.showError('Error al aplicar la actualización');
        return false;
      });
  }

  /**
   * Muestra el prompt de instalación
   */
  public showInstallPrompt(): void {
    if (!this.deferredPrompt) {
      this.notificationService.showInfo('La instalación no está disponible en este momento');
      return;
    }

    this.deferredPrompt.prompt();

    this.deferredPrompt.userChoice.then(choiceResult => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      this.deferredPrompt = null;
      this.updateState({ 
        isInstallable: false,
        installPrompt: undefined
      });
    });
  }

  /**
   * Muestra el prompt de actualización
   */
  private showUpdatePrompt(): void {
    this.notificationService.showInfo(
      'Nueva versión disponible. ¿Deseas actualizar ahora?',
      {
        duration: 0, // No auto-dismiss
        actions: [
          {
            text: 'Actualizar',
            action: () => this.applyUpdate()
          },
          {
            text: 'Más tarde',
            action: () => {}
          }
        ]
      }
    );
  }

  /**
   * Instala la PWA manualmente
   */
  public installPWA(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.deferredPrompt) {
        this.showInstallPrompt();
        resolve(true);
      } else {
        this.notificationService.showInfo(
          'Para instalar la aplicación, usa el menú de tu navegador y selecciona "Instalar aplicación" o "Agregar a pantalla de inicio"'
        );
        resolve(false);
      }
    });
  }

  /**
   * Obtiene información de la instalación
   */
  public getInstallationInfo(): {
    canInstall: boolean;
    isInstalled: boolean;
    platform: string;
    instructions: string;
  } {
    const state = this.stateSubject.value;
    const userAgent = navigator.userAgent.toLowerCase();
    
    let platform = 'desktop';
    let instructions = 'Usa el menú del navegador para instalar la aplicación';

    if (userAgent.includes('android')) {
      platform = 'android';
      instructions = 'Toca el menú (⋮) y selecciona "Instalar aplicación"';
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      platform = 'ios';
      instructions = 'Toca el botón de compartir (□↗) y selecciona "Agregar a pantalla de inicio"';
    } else if (userAgent.includes('chrome')) {
      instructions = 'Busca el ícono de instalación en la barra de direcciones';
    }

    return {
      canInstall: state.isInstallable || !state.isInstalled,
      isInstalled: state.isInstalled,
      platform,
      instructions
    };
  }

  /**
   * Obtiene estadísticas de uso offline
   */
  public getOfflineStats(): Observable<{
    cacheSize: number;
    cachedResources: number;
    lastSync: Date | null;
  }> {
    if (!('caches' in window)) {
      return of({
        cacheSize: 0,
        cachedResources: 0,
        lastSync: null
      });
    }

    return fromEvent(window, 'load').pipe(
      take(1),
      switchMap(() => caches.keys()),
      switchMap(cacheNames => {
        const promises = cacheNames.map(async cacheName => {
          const cache = await caches.open(cacheName);
          const keys = await cache.keys();
          return keys.length;
        });
        
        return Promise.all(promises);
      }),
      map(cacheSizes => ({
        cacheSize: cacheSizes.reduce((total, size) => total + size, 0) * 1024, // Estimación
        cachedResources: cacheSizes.reduce((total, size) => total + size, 0),
        lastSync: new Date() // Simplificado
      })),
      catchError(() => of({
        cacheSize: 0,
        cachedResources: 0,
        lastSync: null
      }))
    );
  }

  /**
   * Limpia el cache de la PWA
   */
  public clearCache(): Promise<boolean> {
    if (!('caches' in window)) {
      return Promise.resolve(false);
    }

    return caches.keys()
      .then(cacheNames => {
        const deletePromises = cacheNames.map(cacheName => caches.delete(cacheName));
        return Promise.all(deletePromises);
      })
      .then(() => {
        this.notificationService.showSuccess('Cache limpiado exitosamente');
        return true;
      })
      .catch(error => {
        console.error('Error clearing cache:', error);
        this.notificationService.showError('Error al limpiar el cache');
        return false;
      });
  }

  /**
   * Actualiza la configuración
   */
  public updateConfig(config: Partial<PWAConfig>): void {
    const currentConfig = this.configSubject.value;
    const newConfig = { ...currentConfig, ...config };
    this.configSubject.next(newConfig);

    // Reiniciar timer de actualizaciones si cambió el intervalo
    if (config.updateCheckInterval && this.updateCheckTimer) {
      clearInterval(this.updateCheckTimer);
      this.startUpdateChecking();
    }
  }

  /**
   * Obtiene la configuración actual
   */
  public getCurrentConfig(): PWAConfig {
    return this.configSubject.value;
  }

  /**
   * Obtiene el estado actual
   */
  public getCurrentState(): PWAState {
    return this.stateSubject.value;
  }

  /**
   * Actualiza el estado interno
   */
  private updateState(updates: Partial<PWAState>): void {
    const currentState = this.stateSubject.value;
    const newState = { ...currentState, ...updates };
    this.stateSubject.next(newState);
  }

  /**
   * Verifica si la PWA está funcionando offline
   */
  public isWorkingOffline(): boolean {
    return !navigator.onLine && this.stateSubject.value.isInstalled;
  }

  /**
   * Obtiene capacidades de la PWA
   */
  public getPWACapabilities(): {
    serviceWorker: boolean;
    notifications: boolean;
    backgroundSync: boolean;
    pushMessaging: boolean;
    installPrompt: boolean;
    fullscreen: boolean;
  } {
    return {
      serviceWorker: 'serviceWorker' in navigator,
      notifications: 'Notification' in window,
      backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      pushMessaging: 'serviceWorker' in navigator && 'PushManager' in window,
      installPrompt: 'BeforeInstallPromptEvent' in window,
      fullscreen: 'requestFullscreen' in document.documentElement
    };
  }

  /**
   * Destructor
   */
  public destroy(): void {
    if (this.updateCheckTimer) {
      clearInterval(this.updateCheckTimer);
    }
  }
}
