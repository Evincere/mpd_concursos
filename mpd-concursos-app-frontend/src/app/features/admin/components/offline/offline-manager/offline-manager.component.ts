import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, interval } from 'rxjs';
import { takeUntil, startWith } from 'rxjs/operators';

import { OfflineManagerService, ConnectivityState, OfflineConfig, OfflineStats, PendingSyncData } from '@core/services/pwa/offline-manager.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';
import { CustomDialogService } from '@shared/components/custom-dialog/custom-dialog.service';

/**
 * Información de cache por categoría
 */
interface CacheInfo {
  category: string;
  name: string;
  icon: string;
  size: number;
  items: number;
  lastUpdated: Date | null;
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only';
}

/**
 * Componente para gestión del modo offline
 */
@Component({
  selector: 'app-offline-manager',
  templateUrl: './offline-manager.component.html',
  styleUrls: ['./offline-manager.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class OfflineManagerComponent implements OnInit, OnDestroy {

  // Estados del componente
  connectivity: ConnectivityState | null = null;
  offlineConfig: OfflineConfig | null = null;
  offlineStats: OfflineStats | null = null;
  syncQueue: PendingSyncData[] = [];
  
  // Estados de UI
  activeTab: 'overview' | 'sync' | 'cache' | 'config' = 'overview';
  loading = false;
  syncing = false;

  // Formularios
  configForm: FormGroup;

  // Información de cache simulada (en producción vendría del service worker)
  cacheInfo: CacheInfo[] = [
    {
      category: 'concursos',
      name: 'Concursos',
      icon: 'fas fa-trophy',
      size: 2.5 * 1024 * 1024, // 2.5MB
      items: 45,
      lastUpdated: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
      strategy: 'network-first'
    },
    {
      category: 'inscripciones',
      name: 'Inscripciones',
      icon: 'fas fa-user-plus',
      size: 1.8 * 1024 * 1024, // 1.8MB
      items: 23,
      lastUpdated: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
      strategy: 'cache-first'
    },
    {
      category: 'documentos',
      name: 'Documentos',
      icon: 'fas fa-file-pdf',
      size: 15.2 * 1024 * 1024, // 15.2MB
      items: 67,
      lastUpdated: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      strategy: 'stale-while-revalidate'
    },
    {
      category: 'perfil',
      name: 'Perfil de Usuario',
      icon: 'fas fa-user',
      size: 0.3 * 1024 * 1024, // 300KB
      items: 1,
      lastUpdated: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
      strategy: 'network-first'
    },
    {
      category: 'static',
      name: 'Recursos Estáticos',
      icon: 'fas fa-images',
      size: 8.7 * 1024 * 1024, // 8.7MB
      items: 156,
      lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      strategy: 'cache-first'
    }
  ];

  // Opciones para configuración
  strategyOptions = [
    { value: 'cache-first', label: 'Cache Primero', description: 'Usa cache, fallback a red' },
    { value: 'network-first', label: 'Red Primero', description: 'Usa red, fallback a cache' },
    { value: 'stale-while-revalidate', label: 'Cache + Actualización', description: 'Usa cache y actualiza en segundo plano' },
    { value: 'network-only', label: 'Solo Red', description: 'Siempre usa la red' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private offlineManagerService: OfflineManagerService,
    private notificationService: CustomNotificationService,
    private dialogService: CustomDialogService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.setupSubscriptions();
    this.loadData();
    this.startPeriodicUpdates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa los formularios
   */
  private initializeForms(): void {
    this.configForm = this.fb.group({
      enableOfflineMode: [true],
      enableBackgroundSync: [true],
      enableOfflineNotifications: [true],
      maxOfflineStorage: [50],
      syncRetryAttempts: [3],
      syncRetryDelay: [5000],
      offlineTimeout: [10000]
    });
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
    });

    // Suscribirse a la configuración
    this.offlineManagerService.config$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(config => {
      this.offlineConfig = config;
      this.populateConfigForm(config);
    });

    // Suscribirse a la cola de sincronización
    this.offlineManagerService.syncQueue$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(queue => {
      this.syncQueue = queue;
    });
  }

  /**
   * Carga los datos iniciales
   */
  private loadData(): void {
    this.loading = true;
    
    // Cargar estadísticas
    this.offlineStats = this.offlineManagerService.getOfflineStats();
    
    this.loading = false;
  }

  /**
   * Inicia actualizaciones periódicas
   */
  private startPeriodicUpdates(): void {
    // Actualizar estadísticas cada 30 segundos
    interval(30000).pipe(
      startWith(0),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.offlineStats = this.offlineManagerService.getOfflineStats();
    });
  }

  /**
   * Rellena el formulario de configuración
   */
  private populateConfigForm(config: OfflineConfig): void {
    this.configForm.patchValue({
      enableOfflineMode: config.enableOfflineMode,
      enableBackgroundSync: config.enableBackgroundSync,
      enableOfflineNotifications: config.enableOfflineNotifications,
      maxOfflineStorage: config.maxOfflineStorage,
      syncRetryAttempts: config.syncRetryAttempts,
      syncRetryDelay: config.syncRetryDelay,
      offlineTimeout: config.offlineTimeout
    });
  }

  /**
   * Cambia la pestaña activa
   */
  setActiveTab(tab: 'overview' | 'sync' | 'cache' | 'config'): void {
    this.activeTab = tab;
  }

  /**
   * Verifica conectividad manualmente
   */
  async checkConnectivity(): Promise<void> {
    this.loading = true;
    
    try {
      const isOnline = await this.offlineManagerService.checkConnectivity().toPromise();
      const message = isOnline ? 'Conexión disponible' : 'Sin conexión detectada';
      this.notificationService.showInfo(message);
    } catch (error) {
      this.notificationService.showError('Error al verificar conectividad');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Fuerza sincronización manual
   */
  async forceSyncAll(): Promise<void> {
    if (this.syncQueue.length === 0) {
      this.notificationService.showInfo('No hay elementos pendientes de sincronización');
      return;
    }

    const confirmed = await this.dialogService.showConfirmDialog({
      title: 'Forzar Sincronización',
      message: `¿Deseas sincronizar ${this.syncQueue.length} elementos pendientes?`,
      confirmText: 'Sincronizar',
      cancelText: 'Cancelar',
      type: 'info'
    }).toPromise();

    if (confirmed) {
      this.syncing = true;
      
      try {
        // Simular sincronización (en producción llamaría al servicio)
        await this.delay(2000);
        this.notificationService.showSuccess('Sincronización completada exitosamente');
      } catch (error) {
        this.notificationService.showError('Error durante la sincronización');
      } finally {
        this.syncing = false;
      }
    }
  }

  /**
   * Elimina un elemento de la cola de sincronización
   */
  async removeSyncItem(item: PendingSyncData): Promise<void> {
    const confirmed = await this.dialogService.showConfirmDialog({
      title: 'Eliminar de Cola',
      message: `¿Deseas eliminar esta operación de la cola de sincronización?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'warning'
    }).toPromise();

    if (confirmed) {
      // En producción llamaría al servicio para eliminar
      this.notificationService.showSuccess('Elemento eliminado de la cola');
    }
  }

  /**
   * Limpia cache de una categoría
   */
  async clearCacheCategory(category: string): Promise<void> {
    const cacheItem = this.cacheInfo.find(c => c.category === category);
    if (!cacheItem) return;

    const confirmed = await this.dialogService.showConfirmDialog({
      title: 'Limpiar Cache',
      message: `¿Deseas limpiar el cache de ${cacheItem.name}? Se eliminarán ${cacheItem.items} elementos (${this.formatBytes(cacheItem.size)}).`,
      confirmText: 'Limpiar',
      cancelText: 'Cancelar',
      type: 'warning'
    }).toPromise();

    if (confirmed) {
      this.loading = true;
      
      try {
        // Simular limpieza de cache
        await this.delay(1000);
        
        // Actualizar datos simulados
        cacheItem.size = 0;
        cacheItem.items = 0;
        cacheItem.lastUpdated = null;
        
        this.notificationService.showSuccess(`Cache de ${cacheItem.name} limpiado`);
      } catch (error) {
        this.notificationService.showError('Error al limpiar el cache');
      } finally {
        this.loading = false;
      }
    }
  }

  /**
   * Limpia todo el cache offline
   */
  async clearAllCache(): Promise<void> {
    const confirmed = await this.dialogService.showConfirmDialog({
      title: 'Limpiar Todo el Cache',
      message: '¿Deseas limpiar completamente el cache offline? Esta acción no se puede deshacer.',
      confirmText: 'Limpiar Todo',
      cancelText: 'Cancelar',
      type: 'danger'
    }).toPromise();

    if (confirmed) {
      this.loading = true;
      
      try {
        this.offlineManagerService.clearOfflineData();
        
        // Actualizar datos simulados
        this.cacheInfo.forEach(cache => {
          cache.size = 0;
          cache.items = 0;
          cache.lastUpdated = null;
        });
        
        this.notificationService.showSuccess('Todo el cache ha sido limpiado');
      } catch (error) {
        this.notificationService.showError('Error al limpiar el cache');
      } finally {
        this.loading = false;
      }
    }
  }

  /**
   * Guarda la configuración
   */
  saveConfiguration(): void {
    if (this.configForm.invalid) {
      this.markFormGroupTouched(this.configForm);
      return;
    }

    const formValue = this.configForm.value;
    
    this.offlineManagerService.updateConfig(formValue);
    this.notificationService.showSuccess('Configuración guardada exitosamente');
  }

  /**
   * Obtiene el estado de conectividad
   */
  getConnectivityStatus(): { icon: string; color: string; text: string } {
    if (!this.connectivity) {
      return { icon: 'fas fa-question-circle', color: '#6b7280', text: 'Desconocido' };
    }

    if (this.connectivity.isOnline) {
      if (this.offlineManagerService.isSlowConnection()) {
        return { icon: 'fas fa-wifi', color: '#f59e0b', text: 'Conexión Lenta' };
      }
      return { icon: 'fas fa-wifi', color: '#4CAF50', text: 'En Línea' };
    } else {
      return { icon: 'fas fa-wifi-slash', color: '#ef4444', text: 'Sin Conexión' };
    }
  }

  /**
   * Obtiene el color de la prioridad
   */
  getPriorityColor(priority: string): string {
    const colors = {
      low: '#6b7280',
      normal: '#3b82f6',
      high: '#f59e0b',
      critical: '#ef4444'
    };
    return colors[priority as keyof typeof colors] || '#6b7280';
  }

  /**
   * Obtiene el color de la estrategia de cache
   */
  getStrategyColor(strategy: string): string {
    const colors = {
      'cache-first': '#4CAF50',
      'network-first': '#3b82f6',
      'stale-while-revalidate': '#f59e0b',
      'network-only': '#ef4444'
    };
    return colors[strategy as keyof typeof colors] || '#6b7280';
  }

  /**
   * Formatea bytes a formato legible
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Formatea duración en formato legible
   */
  formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${Math.round(ms / 3600000)}h`;
  }

  /**
   * Calcula el porcentaje de uso de almacenamiento
   */
  getStorageUsagePercentage(): number {
    if (!this.offlineStats) return 0;
    const total = this.offlineStats.storageUsed + this.offlineStats.storageAvailable;
    if (total === 0) return 0;
    return Math.round((this.offlineStats.storageUsed / total) * 100);
  }

  /**
   * Obtiene el total de cache usado
   */
  getTotalCacheSize(): number {
    return this.cacheInfo.reduce((total, cache) => total + cache.size, 0);
  }

  /**
   * Obtiene el total de elementos en cache
   */
  getTotalCacheItems(): number {
    return this.cacheInfo.reduce((total, cache) => total + cache.items, 0);
  }

  /**
   * Marca todos los campos del formulario como tocados
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Función de delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * TrackBy function para la lista de sincronización
   */
  trackBySyncId(index: number, item: PendingSyncData): string {
    return item.id;
  }
}
