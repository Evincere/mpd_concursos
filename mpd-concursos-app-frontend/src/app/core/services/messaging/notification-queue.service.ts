import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, timer } from 'rxjs';
import { map, catchError, tap, switchMap, takeWhile } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

/**
 * Prioridad de notificación
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent' | 'critical';

/**
 * Estado de notificación en cola
 */
export type QueuedNotificationStatus = 
  | 'pending' 
  | 'processing' 
  | 'sent' 
  | 'failed' 
  | 'cancelled' 
  | 'scheduled' 
  | 'retry';

/**
 * Tipo de notificación
 */
export type NotificationType = 
  | 'email' 
  | 'sms' 
  | 'push' 
  | 'in_app' 
  | 'webhook' 
  | 'system';

/**
 * Notificación en cola
 */
export interface QueuedNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: QueuedNotificationStatus;
  
  // Contenido
  subject?: string;
  content: string;
  templateId?: string;
  variables?: Record<string, any>;
  
  // Destinatarios
  recipients: {
    userId?: string;
    email?: string;
    phone?: string;
    deviceToken?: string;
    webhookUrl?: string;
  }[];
  
  // Programación
  scheduledAt?: Date;
  sendAt?: Date;
  expiresAt?: Date;
  
  // Configuración
  settings: {
    maxRetries: number;
    retryDelay: number; // milliseconds
    batchSize: number;
    enableTracking: boolean;
    requireDeliveryConfirmation: boolean;
    allowDuplicates: boolean;
  };
  
  // Metadatos
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    source: string;
    correlationId?: string;
    triggerId?: string;
    eventId?: string;
    campaignId?: string;
  };
  
  // Estado de procesamiento
  processing: {
    attempts: number;
    lastAttemptAt?: Date;
    nextRetryAt?: Date;
    processingStartedAt?: Date;
    processingCompletedAt?: Date;
    processingDuration?: number;
    errors: string[];
    warnings: string[];
  };
  
  // Resultados de entrega
  delivery: {
    sentCount: number;
    deliveredCount: number;
    failedCount: number;
    bouncedCount: number;
    openedCount: number;
    clickedCount: number;
    unsubscribedCount: number;
    details: Array<{
      recipientId: string;
      status: 'sent' | 'delivered' | 'failed' | 'bounced' | 'opened' | 'clicked';
      timestamp: Date;
      error?: string;
      metadata?: any;
    }>;
  };
}

/**
 * Configuración de cola
 */
export interface QueueConfiguration {
  id: string;
  name: string;
  type: NotificationType;
  isActive: boolean;
  
  // Configuración de procesamiento
  processing: {
    maxConcurrentJobs: number;
    batchSize: number;
    processingInterval: number; // milliseconds
    maxRetries: number;
    retryDelay: number; // milliseconds
    retryBackoffMultiplier: number;
    maxRetryDelay: number; // milliseconds
    jobTimeout: number; // milliseconds
  };
  
  // Configuración de prioridades
  priorities: {
    [key in NotificationPriority]: {
      weight: number;
      maxQueueSize: number;
      processingOrder: number;
    };
  };
  
  // Configuración de límites
  limits: {
    maxQueueSize: number;
    maxDailyNotifications: number;
    maxHourlyNotifications: number;
    maxNotificationsPerUser: number;
    rateLimitWindow: number; // milliseconds
  };
  
  // Configuración de limpieza
  cleanup: {
    retentionDays: number;
    cleanupInterval: number; // milliseconds
    archiveOldNotifications: boolean;
    deleteFailedAfterDays: number;
  };
}

/**
 * Estadísticas de cola
 */
export interface QueueStats {
  totalNotifications: number;
  pendingNotifications: number;
  processingNotifications: number;
  sentNotifications: number;
  failedNotifications: number;
  scheduledNotifications: number;
  
  // Estadísticas por tipo
  byType: Record<NotificationType, {
    total: number;
    pending: number;
    sent: number;
    failed: number;
  }>;
  
  // Estadísticas por prioridad
  byPriority: Record<NotificationPriority, {
    total: number;
    pending: number;
    sent: number;
    failed: number;
  }>;
  
  // Métricas de rendimiento
  performance: {
    averageProcessingTime: number;
    throughputPerHour: number;
    successRate: number;
    retryRate: number;
    queueWaitTime: number;
  };
  
  // Estadísticas de tiempo
  timeStats: {
    last24Hours: number;
    lastWeek: number;
    lastMonth: number;
    peakHour: { hour: number; count: number };
    peakDay: { day: string; count: number };
  };
  
  // Estado de la cola
  queueHealth: {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
    lastHealthCheck: Date;
  };
}

/**
 * Filtros de cola
 */
export interface QueueFilters {
  type?: NotificationType;
  status?: QueuedNotificationStatus;
  priority?: NotificationPriority;
  createdBy?: string;
  source?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Servicio de cola de notificaciones
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationQueueService {

  private readonly apiUrl = `${environment.apiUrl}/messaging/queue`;

  // Estados reactivos
  private notificationsSubject = new BehaviorSubject<QueuedNotification[]>([]);
  private configurationsSubject = new BehaviorSubject<QueueConfiguration[]>([]);
  private statsSubject = new BehaviorSubject<QueueStats | null>(null);

  // Observables públicos
  public notifications$ = this.notificationsSubject.asObservable();
  public configurations$ = this.configurationsSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();

  // Control de polling
  private pollingInterval = 5000; // 5 segundos
  private isPolling = false;
  private pollingSubscription?: any;

  constructor(
    private http: HttpClient,
    private loggingService: LoggingService
  ) {
    this.loadConfigurations();
    this.startPolling();
  }

  /**
   * Obtiene notificaciones en cola
   */
  public getQueuedNotifications(filters?: QueueFilters): Observable<QueuedNotification[]> {
    let params = new HttpParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            params = params.set(key, value.toISOString());
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<QueuedNotification[]>(this.apiUrl, { params }).pipe(
      map(notifications => notifications.map(this.mapNotification)),
      tap(notifications => this.notificationsSubject.next(notifications)),
      catchError(this.handleError<QueuedNotification[]>('getQueuedNotifications', []))
    );
  }

  /**
   * Obtiene una notificación específica
   */
  public getQueuedNotification(id: string): Observable<QueuedNotification> {
    return this.http.get<QueuedNotification>(`${this.apiUrl}/${id}`).pipe(
      map(this.mapNotification),
      catchError(this.handleError<QueuedNotification>('getQueuedNotification'))
    );
  }

  /**
   * Agrega notificación a la cola
   */
  public enqueueNotification(notification: Partial<QueuedNotification>): Observable<QueuedNotification> {
    return this.http.post<QueuedNotification>(`${this.apiUrl}/enqueue`, notification).pipe(
      map(this.mapNotification),
      tap(newNotification => {
        const current = this.notificationsSubject.value;
        this.notificationsSubject.next([newNotification, ...current]);
      }),
      catchError(this.handleError<QueuedNotification>('enqueueNotification'))
    );
  }

  /**
   * Agrega múltiples notificaciones a la cola
   */
  public enqueueBatch(notifications: Partial<QueuedNotification>[]): Observable<QueuedNotification[]> {
    return this.http.post<QueuedNotification[]>(`${this.apiUrl}/enqueue-batch`, { notifications }).pipe(
      map(notifications => notifications.map(this.mapNotification)),
      tap(newNotifications => {
        const current = this.notificationsSubject.value;
        this.notificationsSubject.next([...newNotifications, ...current]);
      }),
      catchError(this.handleError<QueuedNotification[]>('enqueueBatch', []))
    );
  }

  /**
   * Cancela notificación en cola
   */
  public cancelNotification(id: string, reason?: string): Observable<QueuedNotification> {
    return this.http.post<QueuedNotification>(`${this.apiUrl}/${id}/cancel`, { reason }).pipe(
      map(this.mapNotification),
      tap(updatedNotification => {
        const current = this.notificationsSubject.value;
        const index = current.findIndex(n => n.id === id);
        if (index !== -1) {
          current[index] = updatedNotification;
          this.notificationsSubject.next([...current]);
        }
      }),
      catchError(this.handleError<QueuedNotification>('cancelNotification'))
    );
  }

  /**
   * Reintenta notificación fallida
   */
  public retryNotification(id: string): Observable<QueuedNotification> {
    return this.http.post<QueuedNotification>(`${this.apiUrl}/${id}/retry`, {}).pipe(
      map(this.mapNotification),
      tap(updatedNotification => {
        const current = this.notificationsSubject.value;
        const index = current.findIndex(n => n.id === id);
        if (index !== -1) {
          current[index] = updatedNotification;
          this.notificationsSubject.next([...current]);
        }
      }),
      catchError(this.handleError<QueuedNotification>('retryNotification'))
    );
  }

  /**
   * Reintenta todas las notificaciones fallidas
   */
  public retryAllFailed(): Observable<{ retried: number; failed: number }> {
    return this.http.post<{ retried: number; failed: number }>(`${this.apiUrl}/retry-all-failed`, {}).pipe(
      tap(() => this.refreshNotifications()),
      catchError(this.handleError<{ retried: number; failed: number }>('retryAllFailed', { retried: 0, failed: 0 }))
    );
  }

  /**
   * Pausa el procesamiento de la cola
   */
  public pauseQueue(type?: NotificationType): Observable<void> {
    const body = type ? { type } : {};
    return this.http.post<void>(`${this.apiUrl}/pause`, body).pipe(
      catchError(this.handleError<void>('pauseQueue'))
    );
  }

  /**
   * Reanuda el procesamiento de la cola
   */
  public resumeQueue(type?: NotificationType): Observable<void> {
    const body = type ? { type } : {};
    return this.http.post<void>(`${this.apiUrl}/resume`, body).pipe(
      catchError(this.handleError<void>('resumeQueue'))
    );
  }

  /**
   * Limpia notificaciones antiguas
   */
  public cleanupOldNotifications(olderThanDays: number): Observable<{ deleted: number; archived: number }> {
    return this.http.delete<{ deleted: number; archived: number }>(`${this.apiUrl}/cleanup`, {
      params: { olderThanDays: olderThanDays.toString() }
    }).pipe(
      tap(() => this.refreshNotifications()),
      catchError(this.handleError<{ deleted: number; archived: number }>('cleanupOldNotifications', { deleted: 0, archived: 0 }))
    );
  }

  /**
   * Obtiene configuraciones de cola
   */
  public getQueueConfigurations(): Observable<QueueConfiguration[]> {
    return this.http.get<QueueConfiguration[]>(`${this.apiUrl}/configurations`).pipe(
      tap(configs => this.configurationsSubject.next(configs)),
      catchError(this.handleError<QueueConfiguration[]>('getQueueConfigurations', []))
    );
  }

  /**
   * Actualiza configuración de cola
   */
  public updateQueueConfiguration(id: string, config: Partial<QueueConfiguration>): Observable<QueueConfiguration> {
    return this.http.put<QueueConfiguration>(`${this.apiUrl}/configurations/${id}`, config).pipe(
      tap(updatedConfig => {
        const current = this.configurationsSubject.value;
        const index = current.findIndex(c => c.id === id);
        if (index !== -1) {
          current[index] = updatedConfig;
          this.configurationsSubject.next([...current]);
        }
      }),
      catchError(this.handleError<QueueConfiguration>('updateQueueConfiguration'))
    );
  }

  /**
   * Obtiene estadísticas de cola
   */
  public getQueueStats(): Observable<QueueStats> {
    return this.http.get<QueueStats>(`${this.apiUrl}/stats`).pipe(
      tap(stats => this.statsSubject.next(stats)),
      catchError(this.handleError<QueueStats>('getQueueStats'))
    );
  }

  /**
   * Obtiene métricas en tiempo real
   */
  public getRealTimeMetrics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/metrics/realtime`).pipe(
      catchError(this.handleError<any>('getRealTimeMetrics', {}))
    );
  }

  /**
   * Verifica salud de la cola
   */
  public checkQueueHealth(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/health`).pipe(
      catchError(this.handleError<any>('checkQueueHealth', { status: 'unknown' }))
    );
  }

  /**
   * Obtiene configuraciones predefinidas
   */
  public getDefaultConfigurations(): QueueConfiguration[] {
    return [
      {
        id: 'email-queue',
        name: 'Cola de Emails',
        type: 'email',
        isActive: true,
        processing: {
          maxConcurrentJobs: 5,
          batchSize: 10,
          processingInterval: 5000,
          maxRetries: 3,
          retryDelay: 30000,
          retryBackoffMultiplier: 2,
          maxRetryDelay: 300000,
          jobTimeout: 60000
        },
        priorities: {
          critical: { weight: 100, maxQueueSize: 1000, processingOrder: 1 },
          urgent: { weight: 80, maxQueueSize: 2000, processingOrder: 2 },
          high: { weight: 60, maxQueueSize: 5000, processingOrder: 3 },
          normal: { weight: 40, maxQueueSize: 10000, processingOrder: 4 },
          low: { weight: 20, maxQueueSize: 20000, processingOrder: 5 }
        },
        limits: {
          maxQueueSize: 50000,
          maxDailyNotifications: 100000,
          maxHourlyNotifications: 10000,
          maxNotificationsPerUser: 100,
          rateLimitWindow: 3600000
        },
        cleanup: {
          retentionDays: 30,
          cleanupInterval: 86400000,
          archiveOldNotifications: true,
          deleteFailedAfterDays: 7
        }
      },
      {
        id: 'push-queue',
        name: 'Cola de Push Notifications',
        type: 'push',
        isActive: true,
        processing: {
          maxConcurrentJobs: 10,
          batchSize: 50,
          processingInterval: 2000,
          maxRetries: 2,
          retryDelay: 10000,
          retryBackoffMultiplier: 1.5,
          maxRetryDelay: 60000,
          jobTimeout: 30000
        },
        priorities: {
          critical: { weight: 100, maxQueueSize: 500, processingOrder: 1 },
          urgent: { weight: 80, maxQueueSize: 1000, processingOrder: 2 },
          high: { weight: 60, maxQueueSize: 2000, processingOrder: 3 },
          normal: { weight: 40, maxQueueSize: 5000, processingOrder: 4 },
          low: { weight: 20, maxQueueSize: 10000, processingOrder: 5 }
        },
        limits: {
          maxQueueSize: 20000,
          maxDailyNotifications: 50000,
          maxHourlyNotifications: 5000,
          maxNotificationsPerUser: 50,
          rateLimitWindow: 3600000
        },
        cleanup: {
          retentionDays: 7,
          cleanupInterval: 43200000,
          archiveOldNotifications: false,
          deleteFailedAfterDays: 3
        }
      }
    ];
  }

  /**
   * Inicia polling para actualizaciones
   */
  private startPolling(): void {
    if (this.isPolling) return;
    
    this.isPolling = true;
    this.pollingSubscription = interval(this.pollingInterval).pipe(
      switchMap(() => this.getQueueStats())
    ).subscribe();
  }

  /**
   * Detiene polling
   */
  public stopPolling(): void {
    this.isPolling = false;
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  /**
   * Refresca notificaciones
   */
  private refreshNotifications(): void {
    this.getQueuedNotifications().subscribe();
  }

  /**
   * Carga configuraciones
   */
  private loadConfigurations(): void {
    this.getQueueConfigurations().subscribe();
  }

  /**
   * Mapea notificación desde API
   */
  private mapNotification = (notification: any): QueuedNotification => ({
    ...notification,
    scheduledAt: notification.scheduledAt ? new Date(notification.scheduledAt) : undefined,
    sendAt: notification.sendAt ? new Date(notification.sendAt) : undefined,
    expiresAt: notification.expiresAt ? new Date(notification.expiresAt) : undefined,
    metadata: {
      ...notification.metadata,
      createdAt: new Date(notification.metadata.createdAt),
      updatedAt: new Date(notification.metadata.updatedAt)
    },
    processing: {
      ...notification.processing,
      lastAttemptAt: notification.processing.lastAttemptAt ? new Date(notification.processing.lastAttemptAt) : undefined,
      nextRetryAt: notification.processing.nextRetryAt ? new Date(notification.processing.nextRetryAt) : undefined,
      processingStartedAt: notification.processing.processingStartedAt ? new Date(notification.processing.processingStartedAt) : undefined,
      processingCompletedAt: notification.processing.processingCompletedAt ? new Date(notification.processing.processingCompletedAt) : undefined
    },
    delivery: {
      ...notification.delivery,
      details: notification.delivery.details.map((detail: any) => ({
        ...detail,
        timestamp: new Date(detail.timestamp)
      }))
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
    this.stopPolling();
  }
}
