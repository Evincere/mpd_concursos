import { Injectable, NgZone } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { BehaviorSubject, Observable, Subject, interval, fromEvent } from 'rxjs';
import { takeUntil, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';
import { PushNotificationService } from '@core/services/pwa/push-notification.service';

/**
 * Tipos de notificación en tiempo real
 */
export type RealTimeNotificationType = 
  | 'message' 
  | 'inscription_update' 
  | 'contest_update' 
  | 'document_status' 
  | 'exam_schedule' 
  | 'system_alert'
  | 'user_action';

/**
 * Prioridades de notificación
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Canales de notificación
 */
export type NotificationChannel = 'in_app' | 'push' | 'email' | 'sms';

/**
 * Notificación en tiempo real
 */
export interface RealTimeNotification {
  id: string;
  type: RealTimeNotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  data?: any;
  userId?: string;
  userRole?: string;
  timestamp: Date;
  expiresAt?: Date;
  isRead: boolean;
  isActionable: boolean;
  actions?: NotificationAction[];
  metadata?: NotificationMetadata;
}

/**
 * Acción de notificación
 */
export interface NotificationAction {
  id: string;
  label: string;
  icon?: string;
  color?: string;
  url?: string;
  action?: string;
  data?: any;
}

/**
 * Metadatos de notificación
 */
export interface NotificationMetadata {
  source: string;
  category: string;
  tags: string[];
  relatedEntityId?: string;
  relatedEntityType?: string;
  requiresResponse?: boolean;
  autoExpire?: boolean;
}

/**
 * Configuración de notificaciones
 */
export interface NotificationConfig {
  enableRealTime: boolean;
  enableSound: boolean;
  enableVibration: boolean;
  enableDesktop: boolean;
  maxNotifications: number;
  autoMarkAsRead: boolean;
  autoMarkAsReadDelay: number; // ms
  groupSimilar: boolean;
  showPreview: boolean;
  channels: {
    [key in NotificationChannel]: boolean;
  };
  priorities: {
    [key in NotificationPriority]: {
      enabled: boolean;
      sound: boolean;
      vibration: boolean;
      desktop: boolean;
    };
  };
}

/**
 * Estado de conexión en tiempo real
 */
export interface ConnectionState {
  isConnected: boolean;
  lastHeartbeat: Date | null;
  reconnectAttempts: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
}

/**
 * Estadísticas de notificaciones
 */
export interface NotificationStats {
  totalReceived: number;
  totalRead: number;
  totalUnread: number;
  byType: Record<RealTimeNotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  averageResponseTime: number; // ms
  lastActivity: Date | null;
}

/**
 * Servicio de notificaciones en tiempo real
 */
@Injectable({
  providedIn: 'root'
})
export class RealTimeNotificationsService {

  // Estados reactivos
  private notificationsSubject = new BehaviorSubject<RealTimeNotification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private connectionStateSubject = new BehaviorSubject<ConnectionState>({
    isConnected: false,
    lastHeartbeat: null,
    reconnectAttempts: 0,
    connectionQuality: 'disconnected'
  });
  private configSubject = new BehaviorSubject<NotificationConfig>({
    enableRealTime: true,
    enableSound: true,
    enableVibration: true,
    enableDesktop: true,
    maxNotifications: 50,
    autoMarkAsRead: false,
    autoMarkAsReadDelay: 5000,
    groupSimilar: true,
    showPreview: true,
    channels: {
      in_app: true,
      push: true,
      email: false,
      sms: false
    },
    priorities: {
      low: { enabled: true, sound: false, vibration: false, desktop: false },
      normal: { enabled: true, sound: true, vibration: false, desktop: true },
      high: { enabled: true, sound: true, vibration: true, desktop: true },
      critical: { enabled: true, sound: true, vibration: true, desktop: true }
    }
  });

  // Observables públicos
  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();
  public connectionState$ = this.connectionStateSubject.asObservable();
  public config$ = this.configSubject.asObservable();

  // Control de conexión
  private eventSource?: EventSource;
  private heartbeatInterval?: any;
  private reconnectTimeout?: any;
  private destroy$ = new Subject<void>();

  // Cache de notificaciones
  private notificationsCache: RealTimeNotification[] = [];
  private maxCacheSize = 100;

  constructor(
    
    private ngZone: NgZone,
    private customNotificationService: CustomNotificationService,
    private pushNotificationService: PushNotificationService
  ,
    private loggingService: LoggingService
  ) {
    this.initializeService();
  }

  /**
   * Inicializa el servicio
   */
  private initializeService(): void {
    this.loadCachedNotifications();
    this.setupVisibilityHandling();
    this.startRealTimeConnection();
    this.setupHeartbeat();
  }

  /**
   * Inicia la conexión en tiempo real
   */
  private startRealTimeConnection(): void {
    const config = this.configSubject.value;
    if (!config.enableRealTime) return;

    try {
      // En producción, usar Server-Sent Events (SSE)
      this.eventSource = new EventSource('/api/notifications/stream');

      this.eventSource.onopen = () => {
        this.ngZone.run(() => {
          this.updateConnectionState({
            isConnected: true,
            lastHeartbeat: new Date(),
            reconnectAttempts: 0,
            connectionQuality: 'excellent'
          });
        });
      };

      this.eventSource.onmessage = (event) => {
        this.ngZone.run(() => {
          try {
            const notification: RealTimeNotification = JSON.parse(event.data);
            this.handleIncomingNotification(notification);
          } catch (error) {
            console.error('Error parsing notification:', error);
          }
        });
      };

      this.eventSource.onerror = () => {
        this.ngZone.run(() => {
          this.handleConnectionError();
        });
      };

    } catch (error) {
      console.error('Error starting real-time connection:', error);
      this.handleConnectionError();
    }
  }

  /**
   * Maneja notificación entrante
   */
  private handleIncomingNotification(notification: RealTimeNotification): void {
    // Agregar timestamp si no existe
    if (!notification.timestamp) {
      notification.timestamp = new Date();
    }

    // Agregar a cache
    this.addToCache(notification);

    // Procesar según canales configurados
    this.processNotificationChannels(notification);

    // Actualizar estado
    this.updateNotificationsList();
    this.updateUnreadCount();
  }

  /**
   * Procesa notificación según canales
   */
  private processNotificationChannels(notification: RealTimeNotification): void {
    const config = this.configSubject.value;
    const priorityConfig = config.priorities[notification.priority];

    // Canal in-app
    if (config.channels.in_app && priorityConfig.enabled) {
      this.showInAppNotification(notification);
    }

    // Canal push
    if (config.channels.push && priorityConfig.desktop) {
      this.showPushNotification(notification);
    }

    // Efectos de sonido y vibración
    if (priorityConfig.sound && config.enableSound) {
      this.playNotificationSound(notification.priority);
    }

    if (priorityConfig.vibration && config.enableVibration) {
      this.triggerVibration(notification.priority);
    }
  }

  /**
   * Muestra notificación in-app
   */
  private showInAppNotification(notification: RealTimeNotification): void {
    const config = this.configSubject.value;
    
    let notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';
    
    switch (notification.priority) {
      case 'critical':
        notificationType = 'error';
        break;
      case 'high':
        notificationType = 'warning';
        break;
      case 'normal':
        notificationType = 'info';
        break;
      case 'low':
        notificationType = 'success';
        break;
    }

    const options: any = {
      duration: notification.priority === 'critical' ? 0 : 5000, // Critical no se auto-cierra
      showCloseButton: true,
      actions: notification.actions?.map(action => ({
        text: action.label,
        action: () => this.executeNotificationAction(notification, action)
      }))
    };

    this.customNotificationService.show(
      notification.title,
      notification.message,
      notificationType,
      options
    );
  }

  /**
   * Muestra notificación push
   */
  private async showPushNotification(notification: RealTimeNotification): Promise<void> {
    try {
      const pushTemplate = {
        title: notification.title,
        body: notification.message,
        icon: this.getNotificationIcon(notification.type),
        tag: notification.id,
        data: {
          notificationId: notification.id,
          type: notification.type,
          ...notification.data
        },
        actions: notification.actions?.map(action => ({
          action: action.id,
          title: action.label,
          icon: action.icon
        })),
        requireInteraction: notification.priority === 'critical',
        silent: notification.priority === 'low'
      };

      await this.pushNotificationService.showLocalNotification(pushTemplate);
    } catch (error) {
      console.error('Error showing push notification:', error);
    }
  }

  /**
   * Reproduce sonido de notificación
   */
  private playNotificationSound(priority: NotificationPriority): void {
    try {
      const soundFile = this.getSoundFile(priority);
      const audio = new Audio(soundFile);
      audio.volume = this.getSoundVolume(priority);
      audio.play().catch(() => {
        // Ignorar errores de reproducción
      });
    } catch (error) {
      // Ignorar errores de audio
    }
  }

  /**
   * Activa vibración
   */
  private triggerVibration(priority: NotificationPriority): void {
    if ('vibrate' in navigator) {
      const pattern = this.getVibrationPattern(priority);
      navigator.vibrate(pattern);
    }
  }

  /**
   * Ejecuta acción de notificación
   */
  private executeNotificationAction(notification: RealTimeNotification, action: NotificationAction): void {
    // Marcar como leída
    this.markAsRead(notification.id);

    // Ejecutar acción específica
    if (action.url) {
      window.open(action.url, '_blank');
    } else if (action.action) {
      // Emitir evento personalizado para que otros servicios lo manejen
      window.dispatchEvent(new CustomEvent('notification-action', {
        detail: { notification, action }
      }));
    }
  }

  /**
   * Marca notificación como leída
   */
  public markAsRead(notificationId: string): void {
    const notification = this.notificationsCache.find(n => n.id === notificationId);
    if (notification && !notification.isRead) {
      notification.isRead = true;
      this.updateNotificationInCache(notification);
      this.updateNotificationsList();
      this.updateUnreadCount();
    }
  }

  /**
   * Marca todas las notificaciones como leídas
   */
  public markAllAsRead(): void {
    this.notificationsCache.forEach(notification => {
      if (!notification.isRead) {
        notification.isRead = true;
      }
    });
    this.updateNotificationsList();
    this.updateUnreadCount();
  }

  /**
   * Elimina notificación
   */
  public removeNotification(notificationId: string): void {
    this.notificationsCache = this.notificationsCache.filter(n => n.id !== notificationId);
    this.updateNotificationsList();
    this.updateUnreadCount();
  }

  /**
   * Limpia todas las notificaciones
   */
  public clearAllNotifications(): void {
    this.notificationsCache = [];
    this.updateNotificationsList();
    this.updateUnreadCount();
  }

  /**
   * Obtiene notificaciones por tipo
   */
  public getNotificationsByType(type: RealTimeNotificationType): Observable<RealTimeNotification[]> {
    return this.notifications$.pipe(
      map(notifications => notifications.filter(n => n.type === type))
    );
  }

  /**
   * Obtiene notificaciones no leídas
   */
  public getUnreadNotifications(): Observable<RealTimeNotification[]> {
    return this.notifications$.pipe(
      map(notifications => notifications.filter(n => !n.isRead))
    );
  }

  /**
   * Actualiza configuración
   */
  public updateConfig(config: Partial<NotificationConfig>): void {
    const currentConfig = this.configSubject.value;
    const newConfig = { ...currentConfig, ...config };
    this.configSubject.next(newConfig);
    
    // Reiniciar conexión si cambió enableRealTime
    if (config.enableRealTime !== undefined) {
      this.restartConnection();
    }
  }

  /**
   * Obtiene estadísticas
   */
  public getStats(): NotificationStats {
    const notifications = this.notificationsCache;
    const unread = notifications.filter(n => !n.isRead);
    
    const byType = notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<RealTimeNotificationType, number>);

    const byPriority = notifications.reduce((acc, n) => {
      acc[n.priority] = (acc[n.priority] || 0) + 1;
      return acc;
    }, {} as Record<NotificationPriority, number>);

    return {
      totalReceived: notifications.length,
      totalRead: notifications.length - unread.length,
      totalUnread: unread.length,
      byType,
      byPriority,
      averageResponseTime: 0, // Calcular en producción
      lastActivity: notifications.length > 0 ? notifications[0].timestamp : null
    };
  }

  /**
   * Maneja error de conexión
   */
  private handleConnectionError(): void {
    const currentState = this.connectionStateSubject.value;
    
    this.updateConnectionState({
      isConnected: false,
      lastHeartbeat: currentState.lastHeartbeat,
      reconnectAttempts: currentState.reconnectAttempts + 1,
      connectionQuality: 'disconnected'
    });

    // Intentar reconectar
    this.scheduleReconnect();
  }

  /**
   * Programa reconexión
   */
  private scheduleReconnect(): void {
    const state = this.connectionStateSubject.value;
    const delay = Math.min(1000 * Math.pow(2, state.reconnectAttempts), 30000); // Backoff exponencial

    this.reconnectTimeout = setTimeout(() => {
      this.startRealTimeConnection();
    }, delay);
  }

  /**
   * Configura heartbeat
   */
  private setupHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.eventSource?.readyState === EventSource.OPEN) {
        this.updateConnectionState({
          ...this.connectionStateSubject.value,
          lastHeartbeat: new Date(),
          connectionQuality: 'excellent'
        });
      }
    }, 30000); // Cada 30 segundos
  }

  /**
   * Configura manejo de visibilidad
   */
  private setupVisibilityHandling(): void {
    fromEvent(document, 'visibilitychange').pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (document.hidden) {
        // Página oculta - reducir frecuencia
        this.reducePollingFrequency();
      } else {
        // Página visible - restaurar frecuencia normal
        this.restorePollingFrequency();
      }
    });
  }

  /**
   * Métodos auxiliares
   */
  private addToCache(notification: RealTimeNotification): void {
    this.notificationsCache.unshift(notification);
    
    // Mantener tamaño de cache
    if (this.notificationsCache.length > this.maxCacheSize) {
      this.notificationsCache = this.notificationsCache.slice(0, this.maxCacheSize);
    }
  }

  private updateNotificationInCache(notification: RealTimeNotification): void {
    const index = this.notificationsCache.findIndex(n => n.id === notification.id);
    if (index !== -1) {
      this.notificationsCache[index] = notification;
    }
  }

  private updateNotificationsList(): void {
    this.notificationsSubject.next([...this.notificationsCache]);
  }

  private updateUnreadCount(): void {
    const unreadCount = this.notificationsCache.filter(n => !n.isRead).length;
    this.unreadCountSubject.next(unreadCount);
  }

  private updateConnectionState(state: Partial<ConnectionState>): void {
    const currentState = this.connectionStateSubject.value;
    this.connectionStateSubject.next({ ...currentState, ...state });
  }

  private loadCachedNotifications(): void {
    // En producción, cargar desde localStorage o API
    const cached = localStorage.getItem('realtime_notifications');
    if (cached) {
      try {
        this.notificationsCache = JSON.parse(cached).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
          expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined
        }));
        this.updateNotificationsList();
        this.updateUnreadCount();
      } catch (error) {
        console.error('Error loading cached notifications:', error);
      }
    }
  }

  private getNotificationIcon(type: RealTimeNotificationType): string {
    const icons = {
      message: '/icons/message.png',
      inscription_update: '/icons/inscription.png',
      contest_update: '/icons/contest.png',
      document_status: '/icons/document.png',
      exam_schedule: '/icons/exam.png',
      system_alert: '/icons/alert.png',
      user_action: '/icons/user.png'
    };
    return icons[type] || '/icons/notification.png';
  }

  private getSoundFile(priority: NotificationPriority): string {
    const sounds = {
      low: '/assets/sounds/notification-low.mp3',
      normal: '/assets/sounds/notification.mp3',
      high: '/assets/sounds/notification-high.mp3',
      critical: '/assets/sounds/notification-critical.mp3'
    };
    return sounds[priority];
  }

  private getSoundVolume(priority: NotificationPriority): number {
    const volumes = { low: 0.3, normal: 0.5, high: 0.7, critical: 1.0 };
    return volumes[priority];
  }

  private getVibrationPattern(priority: NotificationPriority): number[] {
    const patterns = {
      low: [100],
      normal: [200, 100, 200],
      high: [300, 100, 300, 100, 300],
      critical: [500, 200, 500, 200, 500]
    };
    return patterns[priority];
  }

  private restartConnection(): void {
    this.stopConnection();
    this.startRealTimeConnection();
  }

  private stopConnection(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
  }

  private reducePollingFrequency(): void {
    // Implementar lógica para reducir frecuencia cuando la página está oculta
  }

  private restorePollingFrequency(): void {
    // Implementar lógica para restaurar frecuencia normal
  }

  /**
   * Destructor del servicio
   */
  public destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopConnection();
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }
}

// Función auxiliar para importar map
import { map } from 'rxjs/operators';
