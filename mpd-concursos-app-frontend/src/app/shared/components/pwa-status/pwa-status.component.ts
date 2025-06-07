import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PWAManagerService, PWAState, PWAConfig } from '@core/services/pwa/pwa-manager.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';

/**
 * Componente para mostrar el estado de la PWA
 */
@Component({
  selector: 'app-pwa-status',
  templateUrl: './pwa-status.component.html',
  styleUrls: ['./pwa-status.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class PWAStatusComponent implements OnInit, OnDestroy {

  // Estados del componente
  pwaState: PWAState | null = null;
  pwaConfig: PWAConfig | null = null;
  installationInfo: any = null;
  offlineStats: any = null;
  capabilities: any = null;
  
  // Estados de UI
  showDetails = false;
  isInstalling = false;
  isCheckingUpdate = false;

  private destroy$ = new Subject<void>();

  constructor(
    private pwaManager: PWAManagerService,
    private notificationService: CustomNotificationService
  ) {}

  ngOnInit(): void {
    this.setupSubscriptions();
    this.loadPWAInfo();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Configura las suscripciones
   */
  private setupSubscriptions(): void {
    // Suscribirse al estado de la PWA
    this.pwaManager.state$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(state => {
      this.pwaState = state;
    });

    // Suscribirse a la configuración
    this.pwaManager.config$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(config => {
      this.pwaConfig = config;
    });
  }

  /**
   * Carga información de la PWA
   */
  private loadPWAInfo(): void {
    this.installationInfo = this.pwaManager.getInstallationInfo();
    this.capabilities = this.pwaManager.getPWACapabilities();
    
    // Cargar estadísticas offline
    this.pwaManager.getOfflineStats().pipe(
      takeUntil(this.destroy$)
    ).subscribe(stats => {
      this.offlineStats = stats;
    });
  }

  /**
   * Instala la PWA
   */
  async installPWA(): Promise<void> {
    if (this.isInstalling) return;

    this.isInstalling = true;
    
    try {
      const success = await this.pwaManager.installPWA();
      if (success) {
        this.notificationService.showSuccess('Iniciando instalación...');
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
      this.notificationService.showError('Error al instalar la aplicación');
    } finally {
      this.isInstalling = false;
    }
  }

  /**
   * Verifica actualizaciones
   */
  async checkForUpdates(): Promise<void> {
    if (this.isCheckingUpdate) return;

    this.isCheckingUpdate = true;
    
    try {
      const hasUpdate = await this.pwaManager.checkForUpdate();
      if (hasUpdate) {
        this.notificationService.showInfo('Nueva actualización encontrada');
      } else {
        this.notificationService.showInfo('La aplicación está actualizada');
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      this.notificationService.showError('Error al verificar actualizaciones');
    } finally {
      this.isCheckingUpdate = false;
    }
  }

  /**
   * Aplica la actualización
   */
  async applyUpdate(): Promise<void> {
    try {
      await this.pwaManager.applyUpdate();
    } catch (error) {
      console.error('Error applying update:', error);
      this.notificationService.showError('Error al aplicar la actualización');
    }
  }

  /**
   * Limpia el cache
   */
  async clearCache(): Promise<void> {
    try {
      await this.pwaManager.clearCache();
      this.loadPWAInfo(); // Recargar estadísticas
    } catch (error) {
      console.error('Error clearing cache:', error);
      this.notificationService.showError('Error al limpiar el cache');
    }
  }

  /**
   * Alterna la visibilidad de detalles
   */
  toggleDetails(): void {
    this.showDetails = !this.showDetails;
  }

  /**
   * Obtiene el ícono del estado de conexión
   */
  getConnectionIcon(): string {
    return this.pwaState?.isOnline ? 'fas fa-wifi' : 'fas fa-wifi-slash';
  }

  /**
   * Obtiene el color del estado de conexión
   */
  getConnectionColor(): string {
    return this.pwaState?.isOnline ? 'success' : 'danger';
  }

  /**
   * Obtiene el texto del estado de conexión
   */
  getConnectionText(): string {
    return this.pwaState?.isOnline ? 'En línea' : 'Sin conexión';
  }

  /**
   * Obtiene el ícono del estado de instalación
   */
  getInstallationIcon(): string {
    if (this.pwaState?.isInstalled) {
      return 'fas fa-mobile-alt';
    } else if (this.pwaState?.isInstallable) {
      return 'fas fa-download';
    } else {
      return 'fas fa-globe';
    }
  }

  /**
   * Obtiene el color del estado de instalación
   */
  getInstallationColor(): string {
    if (this.pwaState?.isInstalled) {
      return 'success';
    } else if (this.pwaState?.isInstallable) {
      return 'primary';
    } else {
      return 'secondary';
    }
  }

  /**
   * Obtiene el texto del estado de instalación
   */
  getInstallationText(): string {
    if (this.pwaState?.isInstalled) {
      return 'Instalada';
    } else if (this.pwaState?.isInstallable) {
      return 'Disponible para instalar';
    } else {
      return 'Navegador web';
    }
  }

  /**
   * Verifica si puede mostrar el botón de instalación
   */
  canShowInstallButton(): boolean {
    return this.pwaState?.isInstallable && !this.pwaState?.isInstalled;
  }

  /**
   * Verifica si puede mostrar el botón de actualización
   */
  canShowUpdateButton(): boolean {
    return this.pwaState?.hasUpdate && !this.pwaState?.isUpdating;
  }

  /**
   * Formatea el tamaño del cache
   */
  formatCacheSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Obtiene el estado de una capacidad
   */
  getCapabilityStatus(capability: boolean): { icon: string; color: string; text: string } {
    if (capability) {
      return {
        icon: 'fas fa-check-circle',
        color: 'success',
        text: 'Soportado'
      };
    } else {
      return {
        icon: 'fas fa-times-circle',
        color: 'danger',
        text: 'No soportado'
      };
    }
  }

  /**
   * Obtiene las instrucciones de instalación
   */
  getInstallInstructions(): string {
    return this.installationInfo?.instructions || 'Instrucciones no disponibles';
  }

  /**
   * Verifica si está trabajando offline
   */
  isWorkingOffline(): boolean {
    return this.pwaManager.isWorkingOffline();
  }

  /**
   * Obtiene el estado general de la PWA
   */
  getPWAHealthStatus(): { status: string; color: string; message: string } {
    if (!this.pwaState) {
      return {
        status: 'unknown',
        color: 'secondary',
        message: 'Estado desconocido'
      };
    }

    if (this.pwaState.isInstalled && this.pwaState.isOnline && !this.pwaState.hasUpdate) {
      return {
        status: 'excellent',
        color: 'success',
        message: 'Funcionando perfectamente'
      };
    }

    if (this.pwaState.isInstalled && this.pwaState.hasUpdate) {
      return {
        status: 'update-available',
        color: 'warning',
        message: 'Actualización disponible'
      };
    }

    if (this.pwaState.isInstalled && !this.pwaState.isOnline) {
      return {
        status: 'offline',
        color: 'info',
        message: 'Trabajando sin conexión'
      };
    }

    if (this.pwaState.isInstallable) {
      return {
        status: 'installable',
        color: 'primary',
        message: 'Lista para instalar'
      };
    }

    return {
      status: 'browser',
      color: 'secondary',
      message: 'Ejecutándose en navegador'
    };
  }
}
