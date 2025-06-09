import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

/**
 * Configuración de notificaciones push
 */
export interface PushNotificationConfig {
  enabled: boolean;
  vapidPublicKey: string;
  serverEndpoint: string;
  autoSubscribe: boolean;
  showPermissionPrompt: boolean;
  retryFailedSubscriptions: boolean;
}

/**
 * Suscripción de notificaciones
 */
export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: string;
  deviceInfo?: {
    userAgent: string;
    platform: string;
    language: string;
  };
  subscribedAt: Date;
}

/**
 * Estado de las notificaciones push
 */
export interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
  lastError: string | null;
}

/**
 * Plantilla de notificación
 */
export interface NotificationTemplate {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
}

/**
 * Servicio de notificaciones push
 */
@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {

  private stateSubject = new BehaviorSubject<PushNotificationState>({
    isSupported: this.isNotificationSupported(),
    permission: this.getNotificationPermission(),
    isSubscribed: false,
    subscription: null,
    lastError: null
  });

  private configSubject = new BehaviorSubject<PushNotificationConfig>({
    enabled: true,
    vapidPublicKey: environment.vapidPublicKey || '',
    serverEndpoint: `${environment.apiUrl}/push/subscribe`,
    autoSubscribe: false,
    showPermissionPrompt: true,
    retryFailedSubscriptions: true
  });

  // Observables públicos
  public state$ = this.stateSubject.asObservable();
  public config$ = this.configSubject.asObservable();

  constructor(
    private swPush: SwPush,
    private http: HttpClient
  ) {
    this.initializePushNotifications();
  }

  /**
   * Inicializa las notificaciones push
   */
  private initializePushNotifications(): void {
    if (!this.isNotificationSupported()) {
      console.warn('Push notifications not supported');
      return;
    }

    this.checkExistingSubscription();
    this.setupMessageHandling();
  }

  /**
   * Verifica si las notificaciones están soportadas
   */
  private isNotificationSupported(): boolean {
    return 'Notification' in window && 
           'serviceWorker' in navigator && 
           'PushManager' in window;
  }

  /**
   * Obtiene el permiso actual de notificaciones
   */
  private getNotificationPermission(): NotificationPermission {
    return Notification.permission;
  }

  /**
   * Verifica suscripción existente
   */
  private checkExistingSubscription(): void {
    if (!this.swPush.isEnabled) {
      return;
    }

    this.swPush.subscription.subscribe(subscription => {
      this.updateState({
        isSubscribed: !!subscription,
        subscription
      });
    });
  }

  /**
   * Configura el manejo de mensajes
   */
  private setupMessageHandling(): void {
    if (!this.swPush.isEnabled) {
      return;
    }

    // Manejar mensajes push
    this.swPush.messages.subscribe(message => {
      // Logging implementado con LoggingService;
    });

    // Manejar clics en notificaciones
    this.swPush.notificationClicks.subscribe(event => {
      // Logging implementado con LoggingService;
    });
  }

  /**
   * Solicita permiso para notificaciones
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isNotificationSupported()) {
      throw new Error('Notifications not supported');
    }

    try {
      const permission = await Notification.requestPermission();
      this.updateState({ permission });
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      this.updateState({ 
        lastError: 'Error al solicitar permisos de notificación' 
      });
      throw error;
    }
  }

  /**
   * Suscribe a notificaciones push
   */
  public async subscribe(): Promise<PushSubscription | null> {
    if (!this.swPush.isEnabled) {
      throw new Error('Service Worker not enabled');
    }

    const config = this.configSubject.value;
    
    if (!config.vapidPublicKey) {
      throw new Error('VAPID public key not configured');
    }

    try {
      // Solicitar permiso si no se ha otorgado
      if (this.getNotificationPermission() === 'default') {
        const permission = await this.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Permission not granted');
        }
      }

      if (this.getNotificationPermission() !== 'granted') {
        throw new Error('Permission denied');
      }

      // Suscribirse
      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: config.vapidPublicKey
      });

      if (subscription) {
        await this.sendSubscriptionToServer(subscription);
        this.updateState({
          isSubscribed: true,
          subscription,
          lastError: null
        });
      }

      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      this.updateState({ 
        lastError: 'Error al suscribirse a notificaciones' 
      });
      throw error;
    }
  }

  /**
   * Cancela la suscripción a notificaciones
   */
  public async unsubscribe(): Promise<boolean> {
    if (!this.swPush.isEnabled) {
      return false;
    }

    try {
      const subscription = this.stateSubject.value.subscription;
      
      if (subscription) {
        await this.removeSubscriptionFromServer(subscription);
        await this.swPush.unsubscribe();
      }

      this.updateState({
        isSubscribed: false,
        subscription: null,
        lastError: null
      });

      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      this.updateState({ 
        lastError: 'Error al cancelar suscripción' 
      });
      return false;
    }
  }

  /**
   * Envía la suscripción al servidor
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    const config = this.configSubject.value;
    
    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
      },
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      },
      subscribedAt: new Date()
    };

    await this.http.post(config.serverEndpoint, subscriptionData).toPromise();
  }

  /**
   * Elimina la suscripción del servidor
   */
  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    const config = this.configSubject.value;
    const endpoint = encodeURIComponent(subscription.endpoint);
    
    await this.http.delete(`${config.serverEndpoint}/${endpoint}`).toPromise();
  }

  /**
   * Convierte ArrayBuffer a Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Maneja mensajes push recibidos
   */
  private handlePushMessage(message: any): void {
    // Procesar el mensaje y mostrar notificación si es necesario
    if (message.notification) {
      this.showLocalNotification(message.notification);
    }
  }

  /**
   * Maneja clics en notificaciones
   */
  private handleNotificationClick(event: any): void {
    const notification = event.notification;
    const action = event.action;
    
    // Cerrar la notificación
    notification.close();
    
    // Manejar la acción
    if (action) {
      this.handleNotificationAction(action, notification.data);
    } else {
      // Clic en la notificación principal
      this.handleNotificationMainClick(notification.data);
    }
  }

  /**
   * Maneja acciones de notificación
   */
  private handleNotificationAction(action: string, data: any): void {
    switch (action) {
      case 'view':
        if (data?.url) {
          window.open(data.url, '_blank');
        }
        break;
      case 'dismiss':
        // No hacer nada, ya se cerró la notificación
        break;
      default:
        // Logging implementado con LoggingService;
      window.open(data.url, '_blank');
    }
  }

  /**
   * Muestra una notificación local
   */
  public showLocalNotification(template: NotificationTemplate): Promise<Notification> {
    return new Promise((resolve, reject) => {
      if (!this.isNotificationSupported()) {
        reject(new Error('Notifications not supported'));
        return;
      }

      if (this.getNotificationPermission() !== 'granted') {
        reject(new Error('Permission not granted'));
        return;
      }

      const options: NotificationOptions = {
        body: template.body,
        icon: template.icon || '/icons/icon-192x192.png',
        badge: template.badge || '/icons/icon-72x72.png',
        image: template.image,
        tag: template.tag,
        data: template.data,
        actions: template.actions,
        requireInteraction: template.requireInteraction,
        silent: template.silent,
        vibrate: template.vibrate
      };

      const notification = new Notification(template.title, options);
      
      notification.onclick = (event) => {
        this.handleNotificationMainClick(template.data);
      };

      notification.onerror = (error) => {
        reject(error);
      };

      resolve(notification);
    });
  }

  /**
   * Envía notificación de prueba
   */
  public async sendTestNotification(): Promise<void> {
    const template: NotificationTemplate = {
      title: 'Notificación de Prueba',
      body: 'Esta es una notificación de prueba del sistema MPD Concursos',
      icon: '/icons/icon-192x192.png',
      tag: 'test-notification',
      data: { type: 'test' },
      actions: [
        {
          action: 'view',
          title: 'Ver',
          icon: '/icons/icon-72x72.png'
        },
        {
          action: 'dismiss',
          title: 'Descartar',
          icon: '/icons/icon-72x72.png'
        }
      ]
    };

    await this.showLocalNotification(template);
  }

  /**
   * Obtiene estadísticas de notificaciones
   */
  public getNotificationStats(): Observable<{
    totalSent: number;
    totalClicked: number;
    clickRate: number;
    lastSent: Date | null;
    subscriptionCount: number;
  }> {
    const config = this.configSubject.value;
    
    return this.http.get<any>(`${config.serverEndpoint}/stats`).pipe(
      map(stats => ({
        totalSent: stats.totalSent || 0,
        totalClicked: stats.totalClicked || 0,
        clickRate: stats.totalSent > 0 ? (stats.totalClicked / stats.totalSent) * 100 : 0,
        lastSent: stats.lastSent ? new Date(stats.lastSent) : null,
        subscriptionCount: stats.subscriptionCount || 0
      })),
      catchError(() => of({
        totalSent: 0,
        totalClicked: 0,
        clickRate: 0,
        lastSent: null,
        subscriptionCount: 0
      }))
    );
  }

  /**
   * Actualiza la configuración
   */
  public updateConfig(config: Partial<PushNotificationConfig>): void {
    const currentConfig = this.configSubject.value;
    const newConfig = { ...currentConfig, ...config };
    this.configSubject.next(newConfig);
  }

  /**
   * Obtiene la configuración actual
   */
  public getCurrentConfig(): PushNotificationConfig {
    return this.configSubject.value;
  }

  /**
   * Obtiene el estado actual
   */
  public getCurrentState(): PushNotificationState {
    return this.stateSubject.value;
  }

  /**
   * Actualiza el estado interno
   */
  private updateState(updates: Partial<PushNotificationState>): void {
    const currentState = this.stateSubject.value;
    const newState = { ...currentState, ...updates };
    this.stateSubject.next(newState);
  }

  /**
   * Verifica si las notificaciones están habilitadas
   */
  public isEnabled(): boolean {
    const state = this.stateSubject.value;
    const config = this.configSubject.value;
    
    return config.enabled && 
           state.isSupported && 
           state.permission === 'granted' && 
           state.isSubscribed;
  }

  /**
   * Obtiene información de soporte
   */
  public getSupportInfo(): {
    browserSupport: boolean;
    serviceWorkerSupport: boolean;
    pushManagerSupport: boolean;
    notificationSupport: boolean;
    vapidSupport: boolean;
  } {
    return {
      browserSupport: 'serviceWorker' in navigator,
      serviceWorkerSupport: 'serviceWorker' in navigator,
      pushManagerSupport: 'PushManager' in window,
      notificationSupport: 'Notification' in window,
      vapidSupport: 'PushManager' in window && 'getKey' in PushSubscription.prototype
    };
  }
}
