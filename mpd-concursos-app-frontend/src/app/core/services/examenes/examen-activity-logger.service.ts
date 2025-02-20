import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, fromEvent } from 'rxjs';
import { debounceTime, buffer, map, filter } from 'rxjs/operators';
import { environment } from '@env/environment';

export interface ActivityLog {
  type: ActivityLogType;
  timestamp: number;
  details: any;
  resourceUsage?: SystemResourceInfo;
  networkInfo?: NetworkActivityInfo;
  userContext?: UserContextInfo;
}

export enum ActivityLogType {
  USER_INTERACTION = 'USER_INTERACTION',
  SYSTEM_EVENT = 'SYSTEM_EVENT',
  NETWORK_ACTIVITY = 'NETWORK_ACTIVITY',
  RESOURCE_USAGE = 'RESOURCE_USAGE',
  SECURITY_EVENT = 'SECURITY_EVENT'
}

interface SystemResourceInfo {
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  cpu?: {
    usage: number;
    cores: number;
  };
  battery?: {
    level: number;
    charging: boolean;
  };
}

interface NetworkActivityInfo {
  url?: string;
  method?: string;
  size?: number;
  duration?: number;
  type?: string;
  status?: number;
  bandwidth?: number;
}

interface UserContextInfo {
  viewport: {
    width: number;
    height: number;
  };
  userAgent: string;
  location: {
    path: string;
    hash: string;
  };
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExamenActivityLoggerService {
  private readonly BATCH_SIZE = 50;
  private readonly SYNC_INTERVAL = 10000; // 10 segundos
  private readonly MAX_LOGS_IN_MEMORY = 1000;

  private activityLogs: ActivityLog[] = [];
  private pendingLogs$ = new BehaviorSubject<ActivityLog[]>([]);
  private resourceMonitoringInterval: any;
  private performanceObserver!: PerformanceObserver;
  private mouseEvents$ = new Subject<MouseEvent>();
  private keyboardEvents$ = new Subject<KeyboardEvent>();

  constructor(private http: HttpClient) {
    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    // Monitoreo de interacciones del usuario
    this.setupUserInteractionMonitoring();

    // Monitoreo de recursos del sistema
    this.setupSystemResourceMonitoring();

    // Monitoreo de red
    this.setupNetworkMonitoring();

    // Sincronización periódica
    this.setupLogSynchronization();
  }

  private setupUserInteractionMonitoring(): void {
    // Monitorear movimientos del mouse
    fromEvent<MouseEvent>(document, 'mousemove')
      .pipe(
        debounceTime(100) // Reducir frecuencia de eventos
      )
      .subscribe(event => this.mouseEvents$.next(event));

    // Buffer de eventos del mouse para detectar patrones
    this.mouseEvents$.pipe(
      buffer(this.mouseEvents$.pipe(debounceTime(1000))),
      filter(events => events.length > 0)
    ).subscribe(events => {
      this.logActivity({
        type: ActivityLogType.USER_INTERACTION,
        timestamp: Date.now(),
        details: {
          type: 'mouse_movement',
          points: events.map(e => ({ x: e.clientX, y: e.clientY }))
        }
      });
    });

    // Monitorear teclado
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(debounceTime(100))
      .subscribe(event => {
        this.keyboardEvents$.next(event);
        this.logActivity({
          type: ActivityLogType.USER_INTERACTION,
          timestamp: Date.now(),
          details: {
            type: 'keyboard',
            key: event.key,
            modifiers: {
              ctrl: event.ctrlKey,
              alt: event.altKey,
              shift: event.shiftKey
            }
          }
        });
      });
  }

  private setupSystemResourceMonitoring(): void {
    this.resourceMonitoringInterval = setInterval(async () => {
      const resourceInfo = await this.getSystemResourceInfo();
      this.logActivity({
        type: ActivityLogType.RESOURCE_USAGE,
        timestamp: Date.now(),
        details: resourceInfo
      });
    }, 5000);
  }

  private async getSystemResourceInfo(): Promise<SystemResourceInfo> {
    const memory = (performance as any).memory || {};
    const resourceInfo: SystemResourceInfo = {
      memory: {
        usedJSHeapSize: memory.usedJSHeapSize || 0,
        totalJSHeapSize: memory.totalJSHeapSize || 0,
        jsHeapSizeLimit: memory.jsHeapSizeLimit || 0
      }
    };

    // Obtener información de la batería si está disponible
    if ('getBattery' in navigator) {
      const battery: any = await (navigator as any).getBattery();
      resourceInfo.battery = {
        level: battery.level,
        charging: battery.charging
      };
    }

    return resourceInfo;
  }

  private setupNetworkMonitoring(): void {
    this.performanceObserver = new PerformanceObserver(list => {
      list.getEntries().forEach(entry => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          this.logNetworkActivity(resourceEntry);
        }
      });
    });

    this.performanceObserver.observe({
      entryTypes: ['resource', 'navigation', 'network-information']
    });

    // Monitorear cambios en la conexión
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', () => {
        this.logActivity({
          type: ActivityLogType.NETWORK_ACTIVITY,
          timestamp: Date.now(),
          details: {
            type: 'connection_change',
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt
          }
        });
      });
    }
  }

  private logNetworkActivity(entry: PerformanceResourceTiming): void {
    const networkInfo: NetworkActivityInfo = {
      url: entry.name,
      duration: entry.duration,
      size: entry.transferSize,
      type: entry.initiatorType,
      bandwidth: entry.transferSize / (entry.duration || 1)
    };

    this.logActivity({
      type: ActivityLogType.NETWORK_ACTIVITY,
      timestamp: Date.now(),
      details: networkInfo
    });
  }

  private setupLogSynchronization(): void {
    // Sincronizar logs periódicamente
    setInterval(() => {
      this.syncLogs();
    }, this.SYNC_INTERVAL);

    // Sincronizar antes de cerrar la página
    window.addEventListener('beforeunload', () => {
      this.syncLogs(true);
    });
  }

  logActivity(log: ActivityLog): void {
    // Agregar contexto del usuario
    log.userContext = this.getUserContext();

    this.activityLogs.push(log);

    // Mantener el tamaño del buffer controlado
    if (this.activityLogs.length > this.MAX_LOGS_IN_MEMORY) {
      this.syncLogs(true);
    }
  }

  private getUserContext(): UserContextInfo {
    return {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      userAgent: navigator.userAgent,
      location: {
        path: window.location.pathname,
        hash: window.location.hash
      },
      timestamp: Date.now()
    };
  }

  private syncLogs(force: boolean = false): void {
    if (this.activityLogs.length === 0) return;

    if (force || this.activityLogs.length >= this.BATCH_SIZE) {
      const logsToSync = this.activityLogs.splice(0, this.BATCH_SIZE);

      this.http.post(`${environment.apiUrl}/activity-logs`, logsToSync)
        .subscribe({
          next: () => {
            console.log(`Synchronized ${logsToSync.length} logs`);
          },
          error: (error) => {
            console.error('Error syncing logs:', error);
            // Reintentar más tarde
            this.activityLogs.unshift(...logsToSync);
          }
        });
    }
  }

  getActivityLogs(): Observable<ActivityLog[]> {
    return this.pendingLogs$.asObservable();
  }

  cleanup(): void {
    if (this.resourceMonitoringInterval) {
      clearInterval(this.resourceMonitoringInterval);
    }
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    this.syncLogs(true);
  }
}
