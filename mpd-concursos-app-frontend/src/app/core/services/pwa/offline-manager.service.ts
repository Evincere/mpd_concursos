import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge, of } from 'rxjs';
import { map, catchError, switchMap, debounceTime } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

/**
 * Estado de conectividad
 */
export interface ConnectivityState {
  isOnline: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
  lastOnline: Date | null;
  lastOffline: Date | null;
}

/**
 * Configuración de modo offline
 */
export interface OfflineConfig {
  enableOfflineMode: boolean;
  enableBackgroundSync: boolean;
  enableOfflineNotifications: boolean;
  maxOfflineStorage: number; // MB
  syncRetryAttempts: number;
  syncRetryDelay: number; // ms
  offlineTimeout: number; // ms
}

/**
 * Datos pendientes de sincronización
 */
export interface PendingSyncData {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  priority: 'low' | 'normal' | 'high';
}

/**
 * Estadísticas de modo offline
 */
export interface OfflineStats {
  totalOfflineTime: number; // ms
  syncQueueSize: number;
  successfulSyncs: number;
  failedSyncs: number;
  lastSyncAttempt: Date | null;
  storageUsed: number; // bytes
  storageAvailable: number; // bytes
}

/**
 * Servicio de gestión de modo offline
 */
@Injectable({
  providedIn: 'root'
})
export class OfflineManagerService {

  private connectivitySubject = new BehaviorSubject<ConnectivityState>({
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false,
    lastOnline: navigator.onLine ? new Date() : null,
    lastOffline: !navigator.onLine ? new Date() : null
  });

  private configSubject = new BehaviorSubject<OfflineConfig>({
    enableOfflineMode: true,
    enableBackgroundSync: true,
    enableOfflineNotifications: true,
    maxOfflineStorage: 50, // 50MB
    syncRetryAttempts: 3,
    syncRetryDelay: 5000, // 5 segundos
    offlineTimeout: 10000 // 10 segundos
  });

  private syncQueueSubject = new BehaviorSubject<PendingSyncData[]>([]);

  // Observables públicos
  public connectivity$ = this.connectivitySubject.asObservable();
  public config$ = this.configSubject.asObservable();
  public syncQueue$ = this.syncQueueSubject.asObservable();

  private syncQueue: PendingSyncData[] = [];
  private isSyncing = false;
  private offlineStartTime: Date | null = null;

  constructor(
    private http: HttpClient,
    private ngZone: NgZone
  ) {
    this.initializeOfflineManager();
  }

  /**
   * Inicializa el gestor de modo offline
   */
  private initializeOfflineManager(): void {
    this.setupConnectivityMonitoring();
    this.loadSyncQueue();
    this.setupBackgroundSync();
    this.updateNetworkInformation();
  }

  /**
   * Configura el monitoreo de conectividad
   */
  private setupConnectivityMonitoring(): void {
    this.ngZone.runOutsideAngular(() => {
      merge(
        fromEvent(window, 'online'),
        fromEvent(window, 'offline')
      ).pipe(
        debounceTime(1000)
      ).subscribe(() => {
        this.ngZone.run(() => {
          this.updateConnectivityState();
        });
      });

      // Monitorear cambios en la conexión
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        fromEvent(connection, 'change').pipe(
          debounceTime(1000)
        ).subscribe(() => {
          this.ngZone.run(() => {
            this.updateNetworkInformation();
          });
        });
      }
    });
  }

  /**
   * Actualiza el estado de conectividad
   */
  private updateConnectivityState(): void {
    const isOnline = navigator.onLine;
    const currentState = this.connectivitySubject.value;
    
    const newState: ConnectivityState = {
      ...currentState,
      isOnline,
      lastOnline: isOnline ? new Date() : currentState.lastOnline,
      lastOffline: !isOnline ? new Date() : currentState.lastOffline
    };

    // Manejar transición offline -> online
    if (!currentState.isOnline && isOnline) {
      this.handleOnlineTransition();
      this.offlineStartTime = null;
    }

    // Manejar transición online -> offline
    if (currentState.isOnline && !isOnline) {
      this.handleOfflineTransition();
      this.offlineStartTime = new Date();
    }

    this.connectivitySubject.next(newState);
    this.updateNetworkInformation();
  }

  /**
   * Actualiza información de red
   */
  private updateNetworkInformation(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const currentState = this.connectivitySubject.value;
      
      const newState: ConnectivityState = {
        ...currentState,
        connectionType: connection.type || 'unknown',
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false
      };

      this.connectivitySubject.next(newState);
    }
  }

  /**
   * Maneja la transición a online
   */
  private handleOnlineTransition(): void {
    console.log('Connection restored - starting sync');
    
    if (this.configSubject.value.enableBackgroundSync) {
      this.processSyncQueue();
    }
  }

  /**
   * Maneja la transición a offline
   */
  private handleOfflineTransition(): void {
    console.log('Connection lost - entering offline mode');
  }

  /**
   * Configura la sincronización en segundo plano
   */
  private setupBackgroundSync(): void {
    // Procesar cola cada 30 segundos si está online
    setInterval(() => {
      if (this.connectivitySubject.value.isOnline && 
          this.configSubject.value.enableBackgroundSync &&
          this.syncQueue.length > 0) {
        this.processSyncQueue();
      }
    }, 30000);
  }

  /**
   * Carga la cola de sincronización desde localStorage
   */
  private loadSyncQueue(): void {
    try {
      const stored = localStorage.getItem('offline_sync_queue');
      if (stored) {
        this.syncQueue = JSON.parse(stored).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        this.syncQueueSubject.next([...this.syncQueue]);
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
      this.syncQueue = [];
    }
  }

  /**
   * Guarda la cola de sincronización en localStorage
   */
  private saveSyncQueue(): void {
    try {
      localStorage.setItem('offline_sync_queue', JSON.stringify(this.syncQueue));
      this.syncQueueSubject.next([...this.syncQueue]);
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  /**
   * Agrega datos a la cola de sincronización
   */
  public addToSyncQueue(data: Omit<PendingSyncData, 'id' | 'timestamp' | 'retryCount'>): void {
    const syncData: PendingSyncData = {
      ...data,
      id: this.generateId(),
      timestamp: new Date(),
      retryCount: 0
    };

    this.syncQueue.push(syncData);
    this.saveSyncQueue();

    // Intentar sincronizar inmediatamente si está online
    if (this.connectivitySubject.value.isOnline) {
      this.processSyncQueue();
    }
  }

  /**
   * Procesa la cola de sincronización
   */
  private async processSyncQueue(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    const config = this.configSubject.value;

    // Ordenar por prioridad y timestamp
    this.syncQueue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp.getTime() - b.timestamp.getTime();
    });

    const itemsToSync = [...this.syncQueue];
    
    for (const item of itemsToSync) {
      try {
        await this.syncItem(item);
        this.removeSyncItem(item.id);
      } catch (error) {
        console.error('Sync failed for item:', item.id, error);
        
        item.retryCount++;
        if (item.retryCount >= config.syncRetryAttempts) {
          console.error('Max retry attempts reached for item:', item.id);
          this.removeSyncItem(item.id);
        } else {
          // Esperar antes del siguiente intento
          await this.delay(config.syncRetryDelay * item.retryCount);
        }
      }
    }

    this.isSyncing = false;
  }

  /**
   * Sincroniza un elemento individual
   */
  private async syncItem(item: PendingSyncData): Promise<any> {
    const { type, endpoint, data } = item;

    switch (type) {
      case 'CREATE':
        return this.http.post(endpoint, data).toPromise();
      case 'UPDATE':
        return this.http.put(endpoint, data).toPromise();
      case 'DELETE':
        return this.http.delete(endpoint).toPromise();
      default:
        throw new Error(`Unknown sync type: ${type}`);
    }
  }

  /**
   * Elimina un elemento de la cola de sincronización
   */
  private removeSyncItem(id: string): void {
    this.syncQueue = this.syncQueue.filter(item => item.id !== id);
    this.saveSyncQueue();
  }

  /**
   * Verifica si hay conectividad realizando una prueba
   */
  public checkConnectivity(): Observable<boolean> {
    const testUrl = '/api/health'; // Endpoint de prueba
    
    return this.http.get(testUrl, { 
      timeout: this.configSubject.value.offlineTimeout 
    }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  /**
   * Obtiene datos desde cache offline
   */
  public getOfflineData<T>(key: string): T | null {
    try {
      const stored = localStorage.getItem(`offline_${key}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting offline data:', error);
      return null;
    }
  }

  /**
   * Guarda datos en cache offline
   */
  public setOfflineData<T>(key: string, data: T): void {
    try {
      localStorage.setItem(`offline_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error setting offline data:', error);
    }
  }

  /**
   * Elimina datos del cache offline
   */
  public removeOfflineData(key: string): void {
    try {
      localStorage.removeItem(`offline_${key}`);
    } catch (error) {
      console.error('Error removing offline data:', error);
    }
  }

  /**
   * Limpia todos los datos offline
   */
  public clearOfflineData(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('offline_'));
      keys.forEach(key => localStorage.removeItem(key));
      
      this.syncQueue = [];
      this.saveSyncQueue();
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  }

  /**
   * Obtiene estadísticas de modo offline
   */
  public getOfflineStats(): OfflineStats {
    const totalOfflineTime = this.calculateTotalOfflineTime();
    const storageInfo = this.getStorageInfo();
    
    return {
      totalOfflineTime,
      syncQueueSize: this.syncQueue.length,
      successfulSyncs: this.getSuccessfulSyncs(),
      failedSyncs: this.getFailedSyncs(),
      lastSyncAttempt: this.getLastSyncAttempt(),
      storageUsed: storageInfo.used,
      storageAvailable: storageInfo.available
    };
  }

  /**
   * Calcula el tiempo total offline
   */
  private calculateTotalOfflineTime(): number {
    const state = this.connectivitySubject.value;
    
    if (!state.isOnline && this.offlineStartTime) {
      return Date.now() - this.offlineStartTime.getTime();
    }
    
    return 0;
  }

  /**
   * Obtiene información de almacenamiento
   */
  private getStorageInfo(): { used: number; available: number } {
    try {
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length;
        }
      }
      
      // Estimar espacio disponible (5MB típico para localStorage)
      const available = 5 * 1024 * 1024 - used;
      
      return { used, available: Math.max(0, available) };
    } catch (error) {
      return { used: 0, available: 0 };
    }
  }

  /**
   * Obtiene el número de sincronizaciones exitosas
   */
  private getSuccessfulSyncs(): number {
    try {
      return parseInt(localStorage.getItem('offline_successful_syncs') || '0');
    } catch {
      return 0;
    }
  }

  /**
   * Obtiene el número de sincronizaciones fallidas
   */
  private getFailedSyncs(): number {
    try {
      return parseInt(localStorage.getItem('offline_failed_syncs') || '0');
    } catch {
      return 0;
    }
  }

  /**
   * Obtiene la fecha del último intento de sincronización
   */
  private getLastSyncAttempt(): Date | null {
    try {
      const stored = localStorage.getItem('offline_last_sync_attempt');
      return stored ? new Date(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Actualiza la configuración
   */
  public updateConfig(config: Partial<OfflineConfig>): void {
    const currentConfig = this.configSubject.value;
    const newConfig = { ...currentConfig, ...config };
    this.configSubject.next(newConfig);
  }

  /**
   * Obtiene la configuración actual
   */
  public getCurrentConfig(): OfflineConfig {
    return this.configSubject.value;
  }

  /**
   * Obtiene el estado de conectividad actual
   */
  public getCurrentConnectivity(): ConnectivityState {
    return this.connectivitySubject.value;
  }

  /**
   * Verifica si está en modo offline
   */
  public isOffline(): boolean {
    return !this.connectivitySubject.value.isOnline;
  }

  /**
   * Verifica si la conexión es lenta
   */
  public isSlowConnection(): boolean {
    const state = this.connectivitySubject.value;
    return state.effectiveType === 'slow-2g' || 
           state.effectiveType === '2g' || 
           state.saveData;
  }

  /**
   * Genera un ID único
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Función de delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
