import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, combineLatest } from 'rxjs';
import { map, catchError, tap, switchMap, shareReplay } from 'rxjs/operators';
import { environment } from '@environments/environment';

/**
 * Métricas del sistema
 */
export interface SystemMetrics {
  timestamp: Date;
  
  // Métricas de mensajería
  messaging: {
    totalMessages: number;
    messagesLast24h: number;
    unreadMessages: number;
    averageResponseTime: number;
    activeConversations: number;
    messagesByPriority: Record<string, number>;
    messagesByType: Record<string, number>;
  };
  
  // Métricas de notificaciones
  notifications: {
    totalNotifications: number;
    notificationsLast24h: number;
    pendingNotifications: number;
    failedNotifications: number;
    successRate: number;
    averageDeliveryTime: number;
    notificationsByChannel: Record<string, number>;
    notificationsByPriority: Record<string, number>;
  };
  
  // Métricas de triggers
  triggers: {
    totalTriggers: number;
    activeTriggers: number;
    triggersExecutedLast24h: number;
    averageExecutionTime: number;
    successfulExecutions: number;
    failedExecutions: number;
    triggersByType: Record<string, number>;
    topTriggers: Array<{
      id: string;
      name: string;
      executions: number;
      successRate: number;
    }>;
  };
  
  // Métricas de eventos
  events: {
    totalEvents: number;
    eventsLast24h: number;
    pendingEvents: number;
    processedEvents: number;
    averageProcessingTime: number;
    eventsByType: Record<string, number>;
    eventsByCategory: Record<string, number>;
  };
  
  // Métricas de cola
  queue: {
    totalQueued: number;
    queuedByPriority: Record<string, number>;
    queuedByType: Record<string, number>;
    averageWaitTime: number;
    throughputPerHour: number;
    queueHealth: 'healthy' | 'warning' | 'critical';
    queueSizes: Record<string, number>;
  };
  
  // Métricas de rendimiento
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatency: number;
    responseTime: number;
    errorRate: number;
    uptime: number;
  };
}

/**
 * Alertas del sistema
 */
export interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  category: 'messaging' | 'notifications' | 'triggers' | 'events' | 'queue' | 'performance' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata: {
    source: string;
    severity: number;
    affectedComponents: string[];
    recommendedActions: string[];
    relatedMetrics: Record<string, any>;
  };
}

/**
 * Configuración de alertas
 */
export interface AlertConfiguration {
  id: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  
  // Condiciones
  conditions: Array<{
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between';
    value: number | [number, number];
    timeWindow: number; // minutes
    consecutiveChecks: number;
  }>;
  
  // Configuración de notificación
  notification: {
    channels: Array<'email' | 'sms' | 'webhook' | 'in_app'>;
    recipients: string[];
    template: string;
    cooldownPeriod: number; // minutes
    escalationRules: Array<{
      afterMinutes: number;
      recipients: string[];
      channels: Array<'email' | 'sms' | 'webhook' | 'in_app'>;
    }>;
  };
  
  // Metadatos
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    lastTriggered?: Date;
    triggerCount: number;
  };
}

/**
 * Dashboard de monitoreo
 */
export interface MonitoringDashboard {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  
  // Configuración de layout
  layout: {
    columns: number;
    rows: number;
    widgets: Array<{
      id: string;
      type: 'metric' | 'chart' | 'table' | 'alert' | 'status';
      position: { x: number; y: number; width: number; height: number };
      config: {
        title: string;
        dataSource: string;
        refreshInterval: number;
        chartType?: 'line' | 'bar' | 'pie' | 'gauge' | 'number';
        metrics?: string[];
        timeRange?: string;
        filters?: Record<string, any>;
      };
    }>;
  };
  
  // Configuración de actualización
  settings: {
    autoRefresh: boolean;
    refreshInterval: number; // seconds
    timeRange: string;
    timezone: string;
  };
  
  // Metadatos
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    sharedWith: string[];
    tags: string[];
  };
}

/**
 * Datos históricos
 */
export interface HistoricalData {
  metric: string;
  timeRange: string;
  interval: string;
  data: Array<{
    timestamp: Date;
    value: number;
    metadata?: Record<string, any>;
  }>;
}

/**
 * Servicio de monitoreo
 */
@Injectable({
  providedIn: 'root'
})
export class MonitoringService {

  private readonly apiUrl = `${environment.apiUrl}/monitoring`;

  // Estados reactivos
  private metricsSubject = new BehaviorSubject<SystemMetrics | null>(null);
  private alertsSubject = new BehaviorSubject<SystemAlert[]>([]);
  private dashboardsSubject = new BehaviorSubject<MonitoringDashboard[]>([]);
  private alertConfigsSubject = new BehaviorSubject<AlertConfiguration[]>([]);

  // Observables públicos
  public metrics$ = this.metricsSubject.asObservable();
  public alerts$ = this.alertsSubject.asObservable();
  public dashboards$ = this.dashboardsSubject.asObservable();
  public alertConfigurations$ = this.alertConfigsSubject.asObservable();

  // Control de actualización automática
  private autoRefreshInterval = 30000; // 30 segundos
  private isAutoRefreshEnabled = true;
  private refreshSubscription?: any;

  constructor(private http: HttpClient) {
    this.startAutoRefresh();
    this.loadInitialData();
  }

  /**
   * Obtiene métricas del sistema
   */
  public getSystemMetrics(): Observable<SystemMetrics> {
    return this.http.get<SystemMetrics>(`${this.apiUrl}/metrics`).pipe(
      map(this.mapMetrics),
      tap(metrics => this.metricsSubject.next(metrics)),
      catchError(this.handleError<SystemMetrics>('getSystemMetrics'))
    );
  }

  /**
   * Obtiene métricas en tiempo real
   */
  public getRealTimeMetrics(): Observable<SystemMetrics> {
    return interval(this.autoRefreshInterval).pipe(
      switchMap(() => this.getSystemMetrics()),
      shareReplay(1)
    );
  }

  /**
   * Obtiene datos históricos
   */
  public getHistoricalData(
    metric: string, 
    timeRange: string, 
    interval: string = 'hour'
  ): Observable<HistoricalData> {
    const params = new HttpParams()
      .set('metric', metric)
      .set('timeRange', timeRange)
      .set('interval', interval);

    return this.http.get<HistoricalData>(`${this.apiUrl}/historical`, { params }).pipe(
      map(data => ({
        ...data,
        data: data.data.map(point => ({
          ...point,
          timestamp: new Date(point.timestamp)
        }))
      })),
      catchError(this.handleError<HistoricalData>('getHistoricalData'))
    );
  }

  /**
   * Obtiene alertas activas
   */
  public getActiveAlerts(): Observable<SystemAlert[]> {
    return this.http.get<SystemAlert[]>(`${this.apiUrl}/alerts`).pipe(
      map(alerts => alerts.map(this.mapAlert)),
      tap(alerts => this.alertsSubject.next(alerts)),
      catchError(this.handleError<SystemAlert[]>('getActiveAlerts', []))
    );
  }

  /**
   * Reconoce una alerta
   */
  public acknowledgeAlert(alertId: string, note?: string): Observable<SystemAlert> {
    return this.http.post<SystemAlert>(`${this.apiUrl}/alerts/${alertId}/acknowledge`, { note }).pipe(
      map(this.mapAlert),
      tap(updatedAlert => {
        const current = this.alertsSubject.value;
        const index = current.findIndex(a => a.id === alertId);
        if (index !== -1) {
          current[index] = updatedAlert;
          this.alertsSubject.next([...current]);
        }
      }),
      catchError(this.handleError<SystemAlert>('acknowledgeAlert'))
    );
  }

  /**
   * Resuelve una alerta
   */
  public resolveAlert(alertId: string, resolution?: string): Observable<SystemAlert> {
    return this.http.post<SystemAlert>(`${this.apiUrl}/alerts/${alertId}/resolve`, { resolution }).pipe(
      map(this.mapAlert),
      tap(updatedAlert => {
        const current = this.alertsSubject.value;
        const index = current.findIndex(a => a.id === alertId);
        if (index !== -1) {
          current[index] = updatedAlert;
          this.alertsSubject.next([...current]);
        }
      }),
      catchError(this.handleError<SystemAlert>('resolveAlert'))
    );
  }

  /**
   * Obtiene configuraciones de alertas
   */
  public getAlertConfigurations(): Observable<AlertConfiguration[]> {
    return this.http.get<AlertConfiguration[]>(`${this.apiUrl}/alert-configurations`).pipe(
      map(configs => configs.map(this.mapAlertConfiguration)),
      tap(configs => this.alertConfigsSubject.next(configs)),
      catchError(this.handleError<AlertConfiguration[]>('getAlertConfigurations', []))
    );
  }

  /**
   * Crea configuración de alerta
   */
  public createAlertConfiguration(config: Partial<AlertConfiguration>): Observable<AlertConfiguration> {
    return this.http.post<AlertConfiguration>(`${this.apiUrl}/alert-configurations`, config).pipe(
      map(this.mapAlertConfiguration),
      tap(newConfig => {
        const current = this.alertConfigsSubject.value;
        this.alertConfigsSubject.next([...current, newConfig]);
      }),
      catchError(this.handleError<AlertConfiguration>('createAlertConfiguration'))
    );
  }

  /**
   * Actualiza configuración de alerta
   */
  public updateAlertConfiguration(id: string, config: Partial<AlertConfiguration>): Observable<AlertConfiguration> {
    return this.http.put<AlertConfiguration>(`${this.apiUrl}/alert-configurations/${id}`, config).pipe(
      map(this.mapAlertConfiguration),
      tap(updatedConfig => {
        const current = this.alertConfigsSubject.value;
        const index = current.findIndex(c => c.id === id);
        if (index !== -1) {
          current[index] = updatedConfig;
          this.alertConfigsSubject.next([...current]);
        }
      }),
      catchError(this.handleError<AlertConfiguration>('updateAlertConfiguration'))
    );
  }

  /**
   * Obtiene dashboards
   */
  public getDashboards(): Observable<MonitoringDashboard[]> {
    return this.http.get<MonitoringDashboard[]>(`${this.apiUrl}/dashboards`).pipe(
      map(dashboards => dashboards.map(this.mapDashboard)),
      tap(dashboards => this.dashboardsSubject.next(dashboards)),
      catchError(this.handleError<MonitoringDashboard[]>('getDashboards', []))
    );
  }

  /**
   * Crea dashboard
   */
  public createDashboard(dashboard: Partial<MonitoringDashboard>): Observable<MonitoringDashboard> {
    return this.http.post<MonitoringDashboard>(`${this.apiUrl}/dashboards`, dashboard).pipe(
      map(this.mapDashboard),
      tap(newDashboard => {
        const current = this.dashboardsSubject.value;
        this.dashboardsSubject.next([...current, newDashboard]);
      }),
      catchError(this.handleError<MonitoringDashboard>('createDashboard'))
    );
  }

  /**
   * Actualiza dashboard
   */
  public updateDashboard(id: string, dashboard: Partial<MonitoringDashboard>): Observable<MonitoringDashboard> {
    return this.http.put<MonitoringDashboard>(`${this.apiUrl}/dashboards/${id}`, dashboard).pipe(
      map(this.mapDashboard),
      tap(updatedDashboard => {
        const current = this.dashboardsSubject.value;
        const index = current.findIndex(d => d.id === id);
        if (index !== -1) {
          current[index] = updatedDashboard;
          this.dashboardsSubject.next([...current]);
        }
      }),
      catchError(this.handleError<MonitoringDashboard>('updateDashboard'))
    );
  }

  /**
   * Elimina dashboard
   */
  public deleteDashboard(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/dashboards/${id}`).pipe(
      tap(() => {
        const current = this.dashboardsSubject.value;
        const filtered = current.filter(d => d.id !== id);
        this.dashboardsSubject.next(filtered);
      }),
      catchError(this.handleError<void>('deleteDashboard'))
    );
  }

  /**
   * Obtiene estado de salud del sistema
   */
  public getSystemHealth(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/health`).pipe(
      catchError(this.handleError<any>('getSystemHealth', { status: 'unknown' }))
    );
  }

  /**
   * Ejecuta diagnóstico del sistema
   */
  public runSystemDiagnostics(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/diagnostics`, {}).pipe(
      catchError(this.handleError<any>('runSystemDiagnostics', {}))
    );
  }

  /**
   * Obtiene reporte de rendimiento
   */
  public getPerformanceReport(timeRange: string): Observable<any> {
    const params = new HttpParams().set('timeRange', timeRange);
    return this.http.get<any>(`${this.apiUrl}/performance-report`, { params }).pipe(
      catchError(this.handleError<any>('getPerformanceReport', {}))
    );
  }

  /**
   * Exporta métricas
   */
  public exportMetrics(format: 'json' | 'csv' | 'excel', timeRange: string): Observable<Blob> {
    const params = new HttpParams()
      .set('format', format)
      .set('timeRange', timeRange);

    return this.http.get(`${this.apiUrl}/export`, { 
      params, 
      responseType: 'blob' 
    }).pipe(
      catchError(this.handleError<Blob>('exportMetrics'))
    );
  }

  /**
   * Configura actualización automática
   */
  public setAutoRefresh(enabled: boolean, interval?: number): void {
    this.isAutoRefreshEnabled = enabled;
    if (interval) {
      this.autoRefreshInterval = interval;
    }

    if (enabled) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }

  /**
   * Obtiene dashboards predefinidos
   */
  public getDefaultDashboards(): MonitoringDashboard[] {
    return [
      {
        id: 'overview',
        name: 'Vista General',
        description: 'Dashboard principal con métricas generales del sistema',
        isDefault: true,
        layout: {
          columns: 12,
          rows: 8,
          widgets: [
            {
              id: 'system-health',
              type: 'status',
              position: { x: 0, y: 0, width: 3, height: 2 },
              config: {
                title: 'Estado del Sistema',
                dataSource: 'system.health',
                refreshInterval: 30
              }
            },
            {
              id: 'active-alerts',
              type: 'alert',
              position: { x: 3, y: 0, width: 3, height: 2 },
              config: {
                title: 'Alertas Activas',
                dataSource: 'alerts.active',
                refreshInterval: 30
              }
            },
            {
              id: 'messages-24h',
              type: 'metric',
              position: { x: 6, y: 0, width: 3, height: 2 },
              config: {
                title: 'Mensajes (24h)',
                dataSource: 'messaging.messagesLast24h',
                refreshInterval: 60,
                chartType: 'number'
              }
            },
            {
              id: 'notifications-24h',
              type: 'metric',
              position: { x: 9, y: 0, width: 3, height: 2 },
              config: {
                title: 'Notificaciones (24h)',
                dataSource: 'notifications.notificationsLast24h',
                refreshInterval: 60,
                chartType: 'number'
              }
            },
            {
              id: 'queue-status',
              type: 'chart',
              position: { x: 0, y: 2, width: 6, height: 3 },
              config: {
                title: 'Estado de Colas',
                dataSource: 'queue.status',
                refreshInterval: 30,
                chartType: 'pie',
                metrics: ['pending', 'processing', 'completed', 'failed']
              }
            },
            {
              id: 'performance-metrics',
              type: 'chart',
              position: { x: 6, y: 2, width: 6, height: 3 },
              config: {
                title: 'Métricas de Rendimiento',
                dataSource: 'performance.overview',
                refreshInterval: 30,
                chartType: 'line',
                metrics: ['cpu', 'memory', 'responseTime'],
                timeRange: '1h'
              }
            },
            {
              id: 'recent-events',
              type: 'table',
              position: { x: 0, y: 5, width: 12, height: 3 },
              config: {
                title: 'Eventos Recientes',
                dataSource: 'events.recent',
                refreshInterval: 30,
                timeRange: '1h'
              }
            }
          ]
        },
        settings: {
          autoRefresh: true,
          refreshInterval: 30,
          timeRange: '24h',
          timezone: 'America/Argentina/Buenos_Aires'
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          sharedWith: [],
          tags: ['default', 'overview']
        }
      }
    ];
  }

  /**
   * Inicia actualización automática
   */
  private startAutoRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }

    if (this.isAutoRefreshEnabled) {
      this.refreshSubscription = interval(this.autoRefreshInterval).pipe(
        switchMap(() => combineLatest([
          this.getSystemMetrics(),
          this.getActiveAlerts()
        ]))
      ).subscribe();
    }
  }

  /**
   * Detiene actualización automática
   */
  private stopAutoRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  /**
   * Carga datos iniciales
   */
  private loadInitialData(): void {
    this.getSystemMetrics().subscribe();
    this.getActiveAlerts().subscribe();
    this.getDashboards().subscribe();
    this.getAlertConfigurations().subscribe();
  }

  /**
   * Mapea métricas desde API
   */
  private mapMetrics = (metrics: any): SystemMetrics => ({
    ...metrics,
    timestamp: new Date(metrics.timestamp)
  });

  /**
   * Mapea alerta desde API
   */
  private mapAlert = (alert: any): SystemAlert => ({
    ...alert,
    timestamp: new Date(alert.timestamp),
    acknowledgedAt: alert.acknowledgedAt ? new Date(alert.acknowledgedAt) : undefined,
    resolvedAt: alert.resolvedAt ? new Date(alert.resolvedAt) : undefined
  });

  /**
   * Mapea configuración de alerta desde API
   */
  private mapAlertConfiguration = (config: any): AlertConfiguration => ({
    ...config,
    metadata: {
      ...config.metadata,
      createdAt: new Date(config.metadata.createdAt),
      updatedAt: new Date(config.metadata.updatedAt),
      lastTriggered: config.metadata.lastTriggered ? new Date(config.metadata.lastTriggered) : undefined
    }
  });

  /**
   * Mapea dashboard desde API
   */
  private mapDashboard = (dashboard: any): MonitoringDashboard => ({
    ...dashboard,
    metadata: {
      ...dashboard.metadata,
      createdAt: new Date(dashboard.metadata.createdAt),
      updatedAt: new Date(dashboard.metadata.updatedAt)
    }
  });

  /**
   * Maneja errores de HTTP
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return new Observable(observer => {
        if (result !== undefined) {
          observer.next(result as T);
        }
        observer.complete();
      });
    };
  }

  /**
   * Limpia recursos al destruir el servicio
   */
  public ngOnDestroy(): void {
    this.stopAutoRefresh();
  }
}
