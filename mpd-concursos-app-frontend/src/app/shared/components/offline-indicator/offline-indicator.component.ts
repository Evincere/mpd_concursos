import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, timer } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

import { OfflineManagerService, ConnectivityState } from '@core/services/pwa/offline-manager.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';

/**
 * Estado del indicador offline
 */
interface IndicatorState {
  isVisible: boolean;
  isExpanded: boolean;
  connectionStatus: 'online' | 'offline' | 'slow' | 'reconnecting';
  pendingOperations: number;
  lastSync: Date | null;
  offlineTime: number;
}

/**
 * Componente indicador de estado offline
 */
@Component({
  selector: 'app-offline-indicator',
  templateUrl: './offline-indicator.component.html',
  styleUrls: ['./offline-indicator.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class OfflineIndicatorComponent implements OnInit, OnDestroy {

  // Estado del componente
  indicatorState: IndicatorState = {
    isVisible: false,
    isExpanded: false,
    connectionStatus: 'online',
    pendingOperations: 0,
    lastSync: null,
    offlineTime: 0
  };

  // Estados de conectividad
  connectivity: ConnectivityState | null = null;
  
  // Timer para actualizar tiempo offline
  private offlineTimer$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(
    private offlineManagerService: OfflineManagerService,
    private notificationService: CustomNotificationService
  ) {}

  ngOnInit(): void {
    this.setupSubscriptions();
    this.startOfflineTimer();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.offlineTimer$.complete();
  }

  /**
   * Configura las suscripciones
   */
  private setupSubscriptions(): void {
    // Suscribirse al estado de conectividad
    this.offlineManagerService.connectivity$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(connectivity => {
      this.connectivity = connectivity;
      this.updateIndicatorState(connectivity);
    });

    // Suscribirse a la cola de sincronización
    this.offlineManagerService.syncQueue$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(queue => {
      this.indicatorState.pendingOperations = queue.length;
      this.updateVisibility();
    });
  }

  /**
   * Actualiza el estado del indicador basado en la conectividad
   */
  private updateIndicatorState(connectivity: ConnectivityState): void {
    const wasOffline = this.indicatorState.connectionStatus === 'offline';
    
    // Determinar estado de conexión
    if (connectivity.isOnline) {
      if (this.offlineManagerService.isSlowConnection()) {
        this.indicatorState.connectionStatus = 'slow';
      } else {
        this.indicatorState.connectionStatus = 'online';
      }
      
      // Si acabamos de reconectar
      if (wasOffline) {
        this.indicatorState.connectionStatus = 'reconnecting';
        this.handleReconnection();
        
        // Volver a online después de 3 segundos
        setTimeout(() => {
          if (this.connectivity?.isOnline) {
            this.indicatorState.connectionStatus = 'online';
            this.updateVisibility();
          }
        }, 3000);
      }
    } else {
      this.indicatorState.connectionStatus = 'offline';
      this.handleDisconnection();
    }

    this.updateVisibility();
  }

  /**
   * Maneja la desconexión
   */
  private handleDisconnection(): void {
    this.notificationService.showWarning(
      'Sin conexión a internet. Trabajando en modo offline.',
      { duration: 5000 }
    );
    
    // Iniciar timer de tiempo offline
    this.startOfflineTimer();
  }

  /**
   * Maneja la reconexión
   */
  private handleReconnection(): void {
    this.notificationService.showSuccess(
      'Conexión restaurada. Sincronizando datos...',
      { duration: 3000 }
    );
    
    // Actualizar última sincronización
    this.indicatorState.lastSync = new Date();
    
    // Detener timer de tiempo offline
    this.offlineTimer$.next();
  }

  /**
   * Inicia el timer para contar tiempo offline
   */
  private startOfflineTimer(): void {
    if (this.indicatorState.connectionStatus === 'offline') {
      timer(0, 1000).pipe(
        takeUntil(this.offlineTimer$),
        takeUntil(this.destroy$)
      ).subscribe(() => {
        if (this.indicatorState.connectionStatus === 'offline') {
          this.indicatorState.offlineTime += 1000;
        }
      });
    }
  }

  /**
   * Actualiza la visibilidad del indicador
   */
  private updateVisibility(): void {
    // Mostrar si está offline, hay operaciones pendientes, o conexión lenta
    this.indicatorState.isVisible = 
      this.indicatorState.connectionStatus === 'offline' ||
      this.indicatorState.connectionStatus === 'reconnecting' ||
      this.indicatorState.connectionStatus === 'slow' ||
      this.indicatorState.pendingOperations > 0;
  }

  /**
   * Alterna la expansión del indicador
   */
  toggleExpanded(): void {
    this.indicatorState.isExpanded = !this.indicatorState.isExpanded;
  }

  /**
   * Cierra el indicador expandido
   */
  closeExpanded(): void {
    this.indicatorState.isExpanded = false;
  }

  /**
   * Fuerza sincronización
   */
  forceSync(): void {
    if (this.connectivity?.isOnline && this.indicatorState.pendingOperations > 0) {
      this.notificationService.showInfo('Iniciando sincronización manual...');
      // En producción llamaría al servicio de sincronización
    }
  }

  /**
   * Obtiene el ícono del estado de conexión
   */
  getConnectionIcon(): string {
    switch (this.indicatorState.connectionStatus) {
      case 'online':
        return 'fas fa-wifi';
      case 'offline':
        return 'fas fa-wifi-slash';
      case 'slow':
        return 'fas fa-wifi';
      case 'reconnecting':
        return 'fas fa-sync-alt fa-spin';
      default:
        return 'fas fa-question-circle';
    }
  }

  /**
   * Obtiene el color del estado de conexión
   */
  getConnectionColor(): string {
    switch (this.indicatorState.connectionStatus) {
      case 'online':
        return '#4CAF50';
      case 'offline':
        return '#ef4444';
      case 'slow':
        return '#f59e0b';
      case 'reconnecting':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  }

  /**
   * Obtiene el texto del estado de conexión
   */
  getConnectionText(): string {
    switch (this.indicatorState.connectionStatus) {
      case 'online':
        return 'En línea';
      case 'offline':
        return 'Sin conexión';
      case 'slow':
        return 'Conexión lenta';
      case 'reconnecting':
        return 'Reconectando...';
      default:
        return 'Estado desconocido';
    }
  }

  /**
   * Obtiene el mensaje detallado del estado
   */
  getDetailedMessage(): string {
    switch (this.indicatorState.connectionStatus) {
      case 'online':
        return 'Conectado a internet. Todos los datos están sincronizados.';
      case 'offline':
        return `Sin conexión desde hace ${this.formatDuration(this.indicatorState.offlineTime)}. Los cambios se sincronizarán automáticamente al reconectar.`;
      case 'slow':
        return 'Conexión lenta detectada. Algunas funciones pueden tardar más en cargar.';
      case 'reconnecting':
        return 'Reconectando y sincronizando datos. Por favor espera...';
      default:
        return 'Verificando estado de conexión...';
    }
  }

  /**
   * Formatea duración en formato legible
   */
  formatDuration(ms: number): string {
    if (ms < 1000) return 'unos segundos';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Obtiene información de red
   */
  getNetworkInfo(): string {
    if (!this.connectivity) return '';
    
    const parts = [];
    
    if (this.connectivity.effectiveType !== 'unknown') {
      parts.push(this.connectivity.effectiveType.toUpperCase());
    }
    
    if (this.connectivity.downlink > 0) {
      parts.push(`${this.connectivity.downlink} Mbps`);
    }
    
    if (this.connectivity.rtt > 0) {
      parts.push(`${this.connectivity.rtt}ms`);
    }
    
    return parts.join(' • ');
  }

  /**
   * Verifica si debe mostrar información de red
   */
  shouldShowNetworkInfo(): boolean {
    return this.indicatorState.connectionStatus === 'slow' || 
           this.indicatorState.connectionStatus === 'online';
  }

  /**
   * Verifica si debe mostrar botón de sincronización
   */
  shouldShowSyncButton(): boolean {
    return this.connectivity?.isOnline && this.indicatorState.pendingOperations > 0;
  }

  /**
   * Obtiene la clase CSS para el indicador
   */
  getIndicatorClass(): string {
    const baseClass = 'offline-indicator';
    const statusClass = `status-${this.indicatorState.connectionStatus}`;
    const expandedClass = this.indicatorState.isExpanded ? 'expanded' : '';
    
    return [baseClass, statusClass, expandedClass].filter(Boolean).join(' ');
  }

  /**
   * Verifica si el indicador debe pulsar
   */
  shouldPulse(): boolean {
    return this.indicatorState.connectionStatus === 'offline' ||
           this.indicatorState.connectionStatus === 'reconnecting';
  }

  /**
   * Obtiene el progreso de sincronización (simulado)
   */
  getSyncProgress(): number {
    if (this.indicatorState.connectionStatus === 'reconnecting') {
      // Simular progreso de sincronización
      return Math.min(90, Date.now() % 10000 / 100);
    }
    return 0;
  }
}
