import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, fromEvent } from 'rxjs';
import { debounceTime, buffer, map, filter } from 'rxjs/operators';
import { environment } from '@env/environment';
import { ActivityLogType } from '@core/interfaces/examenes/monitoring/activity-log.interface';
import { TokenService } from '@core/services/auth/token.service';

export interface ActivityLog {
  type: ActivityLogType;
  timestamp: number;
  details: any;
  resourceUsage?: SystemResourceInfo;
  networkInfo?: NetworkActivityInfo;
  userContext?: UserContextInfo;
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

interface FormattedActivityLog {
  type: ActivityLogType;
  timestamp: string;
  details: string;
  userContext?: string;
  resourceUsage?: string;
  networkInfo?: string;
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

  constructor(private http: HttpClient, private tokenService: TokenService) {
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
    try {
      this.performanceObserver = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.logNetworkActivity(resourceEntry);
          }
        });
      });

      // Usar solo los tipos de entrada que son ampliamente soportados
      try {
        this.performanceObserver.observe({
          entryTypes: ['resource', 'navigation']
        });
      } catch (error) {
        console.warn('Error al observar entradas de rendimiento:', error);
      }

      // Monitorear cambios en la conexión
      if ('connection' in navigator) {
        try {
          const connection = (navigator as any).connection;
          connection.addEventListener('change', () => {
            this.logActivity({
              type: ActivityLogType.NETWORK_ACTIVITY,
              timestamp: Date.now(),
              details: {
                event: 'connection-change',
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
              }
            });
          });
        } catch (error) {
          console.warn('Error al monitorear cambios de conexión:', error);
        }
      }
    } catch (error) {
      console.warn('Error al configurar monitoreo de red:', error);
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

  logActivity(log: ActivityLog | ActivityLogType, description?: string): void {
    if (log instanceof Object && 'type' in log) {
      // Es un ActivityLog completo
      this.handleActivityLog(log as ActivityLog);
    } else {
      // Es un ActivityLogType con descripción
      this.handleSimpleLog(log as ActivityLogType, description!);
    }
  }

  private handleActivityLog(log: ActivityLog): void {
    log.userContext = this.getUserContext();
    this.activityLogs.push(log);

    if (this.activityLogs.length > this.MAX_LOGS_IN_MEMORY) {
      this.syncLogs(true);
    }
  }

  private handleSimpleLog(type: ActivityLogType, description: string): void {
    console.log(`[${type}] ${description}`);
    this.handleActivityLog({
      type,
      timestamp: Date.now(),
      details: { description }
    });
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
    if (!this.tokenService.getToken()) {
      console.debug('No hay token disponible para sincronizar logs');
      return;
    }

    if (this.activityLogs.length === 0) {
      console.debug('No hay logs para sincronizar');
      return;
    }

    // No sincronizar si solo hay eventos de sistema o interacción básica
    if (!force && !this.hasSignificantActivity()) {
      console.debug('No hay actividad significativa para sincronizar');
      return;
    }

    if (force || this.activityLogs.length >= this.BATCH_SIZE) {
      const logsToSync = this.activityLogs.splice(0, this.BATCH_SIZE);

      // Formatear los logs según el formato esperado por el backend
      const formattedLogs = logsToSync.map(log => ({
        type: log.type,
        timestamp: new Date(log.timestamp).toISOString(),
        details: JSON.stringify({
          ...log.details,
          userContext: log.userContext,
          resourceUsage: log.resourceUsage,
          networkInfo: log.networkInfo
        })
      }));

      // Validar que todos los logs tengan el formato correcto antes de enviar
      const isValidFormat = formattedLogs.every(log =>
        log.type &&
        log.timestamp &&
        typeof log.details === 'string'
      );

      if (!isValidFormat) {
        console.warn('Se detectaron logs con formato inválido, se descartarán');
        return;
      }

      console.debug('Enviando logs al servidor:', formattedLogs);

      // Enviar los logs uno por uno para evitar problemas de tamaño
      formattedLogs.forEach(log => {
        this.http.post(`${environment.apiUrl}/activity-logs`, log)
          .subscribe({
            next: () => {
              console.debug('Log sincronizado correctamente:', log);
            },
            error: (error) => {
              if (error.status === 400) {
                console.error('Error de formato en el log:', error);
                console.warn('El log fue descartado debido a un error de formato');
              } else {
                console.error('Error al sincronizar log:', error);
                // Solo reintentar si no es un error de formato
                this.activityLogs.unshift(logsToSync[formattedLogs.indexOf(log)]);
              }
            }
          });
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

    // Solo sincronizar logs si hay actividad significativa
    if (this.activityLogs.length > 0 && this.hasSignificantActivity()) {
      this.syncLogs(true);
    } else {
      // Limpiar los logs sin enviarlos si no hay actividad significativa
      this.activityLogs = [];
    }
  }

  private hasSignificantActivity(): boolean {
    // Verificar si hay logs que valgan la pena enviar
    return this.activityLogs.some(log =>
      log.type !== ActivityLogType.SYSTEM_EVENT &&
      log.type !== ActivityLogType.USER_INTERACTION
    );
  }

  registrarActividad(tipo: string): void {
    this.logActivity({
      type: ActivityLogType.USER_INTERACTION,
      timestamp: Date.now(),
      details: {
        type: 'examen_activity',
        action: tipo
      }
    });
  }
}
