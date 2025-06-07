import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { AdminNotificationsService } from './admin-notifications.service';

/**
 * Interfaz para mensajes WebSocket
 */
export interface WebSocketMessage {
  type: 'INDICATOR_UPDATE' | 'SYSTEM_ALERT' | 'REAL_TIME_UPDATE';
  payload: any;
  timestamp: string;
}

/**
 * Interfaz para el estado de conexión WebSocket
 */
export interface WebSocketConnectionState {
  connected: boolean;
  reconnecting: boolean;
  lastConnected?: Date;
  reconnectAttempts: number;
}

/**
 * Servicio para manejo de WebSockets y notificaciones en tiempo real
 */
@Injectable({
  providedIn: 'root'
})
export class WebSocketNotificationsService implements OnDestroy {
  
  private socket: WebSocket | null = null;
  private reconnectTimer: any = null;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5 segundos
  private destroy$ = new Subject<void>();

  // Estados
  private connectionStateSubject = new BehaviorSubject<WebSocketConnectionState>({
    connected: false,
    reconnecting: false,
    reconnectAttempts: 0
  });

  private messagesSubject = new Subject<WebSocketMessage>();

  // Observables públicos
  public connectionState$ = this.connectionStateSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();

  // Observables específicos por tipo de mensaje
  public indicatorUpdates$ = this.messages$.pipe(
    filter(msg => msg.type === 'INDICATOR_UPDATE')
  );

  public systemAlerts$ = this.messages$.pipe(
    filter(msg => msg.type === 'SYSTEM_ALERT')
  );

  public realTimeUpdates$ = this.messages$.pipe(
    filter(msg => msg.type === 'REAL_TIME_UPDATE')
  );

  constructor(private adminNotificationsService: AdminNotificationsService) {
    this.initializeWebSocket();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }

  /**
   * Inicializa la conexión WebSocket
   */
  private initializeWebSocket(): void {
    // En un entorno real, esto se conectaría al backend WebSocket
    // Por ahora, simularemos actualizaciones periódicas
    this.simulateRealTimeUpdates();
  }

  /**
   * Conecta al servidor WebSocket
   */
  public connect(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // En producción, usar la URL real del WebSocket
      // this.socket = new WebSocket('ws://localhost:8082/ws/admin-notifications');
      
      // Por ahora, simular conexión exitosa
      this.updateConnectionState({
        connected: true,
        reconnecting: false,
        lastConnected: new Date(),
        reconnectAttempts: 0
      });

      console.log('[WebSocket] Conexión simulada establecida');
      
    } catch (error) {
      console.error('[WebSocket] Error al conectar:', error);
      this.handleConnectionError();
    }
  }

  /**
   * Desconecta del servidor WebSocket
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.updateConnectionState({
      connected: false,
      reconnecting: false,
      reconnectAttempts: 0
    });
  }

  /**
   * Maneja errores de conexión
   */
  private handleConnectionError(): void {
    const currentState = this.connectionStateSubject.value;
    
    if (currentState.reconnectAttempts < this.maxReconnectAttempts) {
      this.updateConnectionState({
        ...currentState,
        connected: false,
        reconnecting: true,
        reconnectAttempts: currentState.reconnectAttempts + 1
      });

      this.reconnectTimer = setTimeout(() => {
        console.log(`[WebSocket] Intento de reconexión ${currentState.reconnectAttempts + 1}/${this.maxReconnectAttempts}`);
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error('[WebSocket] Máximo número de intentos de reconexión alcanzado');
      this.updateConnectionState({
        ...currentState,
        connected: false,
        reconnecting: false
      });
    }
  }

  /**
   * Actualiza el estado de conexión
   */
  private updateConnectionState(state: WebSocketConnectionState): void {
    this.connectionStateSubject.next(state);
  }

  /**
   * Simula actualizaciones en tiempo real (para desarrollo)
   */
  private simulateRealTimeUpdates(): void {
    // Simular conexión inicial
    setTimeout(() => {
      this.connect();
    }, 1000);

    // Simular actualizaciones periódicas de indicadores
    setInterval(() => {
      if (this.connectionStateSubject.value.connected) {
        this.simulateIndicatorUpdate();
      }
    }, 30000); // Cada 30 segundos

    // Simular alertas ocasionales
    setInterval(() => {
      if (this.connectionStateSubject.value.connected && Math.random() > 0.8) {
        this.simulateSystemAlert();
      }
    }, 60000); // Cada minuto, 20% de probabilidad
  }

  /**
   * Simula una actualización de indicador
   */
  private simulateIndicatorUpdate(): void {
    const message: WebSocketMessage = {
      type: 'INDICATOR_UPDATE',
      payload: {
        indicatorId: 'inscripciones-pendientes',
        value: Math.floor(Math.random() * 20),
        color: 'warn',
        priority: 'medium'
      },
      timestamp: new Date().toISOString()
    };

    this.messagesSubject.next(message);
    
    // Forzar actualización en el servicio de notificaciones
    this.adminNotificationsService.forceUpdate();
  }

  /**
   * Simula una alerta del sistema
   */
  private simulateSystemAlert(): void {
    const alerts = [
      {
        id: `alert-${Date.now()}`,
        type: 'warning' as const,
        title: 'Nueva Inscripción',
        message: 'Se ha recibido una nueva inscripción que requiere revisión',
        moduleId: 'inscripciones',
        itemId: 'inscripciones-pendientes'
      },
      {
        id: `alert-${Date.now()}`,
        type: 'info' as const,
        title: 'Concurso Próximo a Vencer',
        message: 'Un concurso cerrará inscripciones en 24 horas',
        moduleId: 'concursos',
        itemId: 'concursos-proximos-vencer'
      }
    ];

    const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];

    const message: WebSocketMessage = {
      type: 'SYSTEM_ALERT',
      payload: {
        ...randomAlert,
        timestamp: new Date(),
        acknowledged: false
      },
      timestamp: new Date().toISOString()
    };

    this.messagesSubject.next(message);
  }

  /**
   * Envía un mensaje al servidor (para futuro uso)
   */
  public sendMessage(message: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] No se puede enviar mensaje: conexión no disponible');
    }
  }

  /**
   * Obtiene el estado actual de la conexión
   */
  public getConnectionState(): WebSocketConnectionState {
    return this.connectionStateSubject.value;
  }

  /**
   * Verifica si está conectado
   */
  public isConnected(): boolean {
    return this.connectionStateSubject.value.connected;
  }

  /**
   * Fuerza una reconexión
   */
  public forceReconnect(): void {
    this.disconnect();
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  /**
   * Suscribe a actualizaciones de un indicador específico
   */
  public subscribeToIndicator(indicatorId: string): Observable<any> {
    return this.indicatorUpdates$.pipe(
      filter(msg => msg.payload.indicatorId === indicatorId),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Suscribe a alertas de un módulo específico
   */
  public subscribeToModuleAlerts(moduleId: string): Observable<any> {
    return this.systemAlerts$.pipe(
      filter(msg => msg.payload.moduleId === moduleId),
      takeUntil(this.destroy$)
    );
  }
}
