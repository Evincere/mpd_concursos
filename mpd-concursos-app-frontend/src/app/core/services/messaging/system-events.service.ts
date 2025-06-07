import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map, catchError, tap, filter } from 'rxjs/operators';
import { environment } from '@environments/environment';

/**
 * Evento del sistema
 */
export interface SystemEvent {
  id: string;
  type: string;
  source: string;
  timestamp: Date;
  data: any;
  context: {
    userId?: string;
    contestId?: string;
    inscriptionId?: string;
    documentId?: string;
    examId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  metadata: {
    version: string;
    environment: string;
    correlationId?: string;
    causationId?: string;
    sequence?: number;
  };
  processed: boolean;
  processedAt?: Date;
  triggersExecuted: string[];
  errors?: string[];
}

/**
 * Configuración de evento
 */
export interface EventConfiguration {
  type: string;
  name: string;
  description: string;
  category: 'user' | 'contest' | 'inscription' | 'document' | 'exam' | 'system' | 'notification';
  isActive: boolean;
  schema: {
    properties: Record<string, {
      type: 'string' | 'number' | 'boolean' | 'object' | 'array';
      required: boolean;
      description: string;
      example?: any;
    }>;
    required: string[];
  };
  triggers: string[];
  retentionDays: number;
  settings: {
    enableLogging: boolean;
    enableMetrics: boolean;
    enableTriggers: boolean;
    maxRetries: number;
    retryDelay: number;
    batchSize: number;
  };
}

/**
 * Estadísticas de eventos
 */
export interface EventStats {
  totalEvents: number;
  eventsToday: number;
  eventsThisWeek: number;
  eventsThisMonth: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  byHour: number[];
  recentEvents: SystemEvent[];
  topEventTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  processingStats: {
    processed: number;
    pending: number;
    failed: number;
    averageProcessingTime: number;
  };
}

/**
 * Filtros de eventos
 */
export interface EventFilters {
  type?: string;
  category?: string;
  source?: string;
  userId?: string;
  contestId?: string;
  processed?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Listener de eventos
 */
export interface EventListener {
  id: string;
  eventTypes: string[];
  callback: (event: SystemEvent) => void;
  filter?: (event: SystemEvent) => boolean;
  isActive: boolean;
}

/**
 * Servicio de eventos del sistema
 */
@Injectable({
  providedIn: 'root'
})
export class SystemEventsService {

  private readonly apiUrl = `${environment.apiUrl}/system/events`;

  // Estados reactivos
  private eventsSubject = new BehaviorSubject<SystemEvent[]>([]);
  private configurationsSubject = new BehaviorSubject<EventConfiguration[]>([]);
  private statsSubject = new BehaviorSubject<EventStats | null>(null);
  private realTimeEventsSubject = new Subject<SystemEvent>();

  // Observables públicos
  public events$ = this.eventsSubject.asObservable();
  public configurations$ = this.configurationsSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();
  public realTimeEvents$ = this.realTimeEventsSubject.asObservable();

  // Listeners registrados
  private listeners: Map<string, EventListener> = new Map();

  // WebSocket para eventos en tiempo real
  private websocket?: WebSocket;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(private http: HttpClient) {
    this.initializeWebSocket();
    this.loadEventConfigurations();
  }

  /**
   * Obtiene eventos del sistema
   */
  public getEvents(filters?: EventFilters): Observable<SystemEvent[]> {
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

    return this.http.get<SystemEvent[]>(this.apiUrl, { params }).pipe(
      map(events => events.map(this.mapEvent)),
      tap(events => this.eventsSubject.next(events)),
      catchError(this.handleError<SystemEvent[]>('getEvents', []))
    );
  }

  /**
   * Obtiene un evento específico
   */
  public getEvent(id: string): Observable<SystemEvent> {
    return this.http.get<SystemEvent>(`${this.apiUrl}/${id}`).pipe(
      map(this.mapEvent),
      catchError(this.handleError<SystemEvent>('getEvent'))
    );
  }

  /**
   * Publica un nuevo evento
   */
  public publishEvent(eventType: string, data: any, context?: any): Observable<SystemEvent> {
    const eventData = {
      type: eventType,
      source: 'frontend',
      data,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        sessionId: this.getSessionId(),
        userAgent: navigator.userAgent
      }
    };

    return this.http.post<SystemEvent>(`${this.apiUrl}/publish`, eventData).pipe(
      map(this.mapEvent),
      tap(event => {
        // Agregar a la lista local
        const current = this.eventsSubject.value;
        this.eventsSubject.next([event, ...current.slice(0, 99)]);
        
        // Notificar listeners
        this.notifyListeners(event);
      }),
      catchError(this.handleError<SystemEvent>('publishEvent'))
    );
  }

  /**
   * Obtiene configuraciones de eventos
   */
  public getEventConfigurations(): Observable<EventConfiguration[]> {
    return this.http.get<EventConfiguration[]>(`${this.apiUrl}/configurations`).pipe(
      tap(configs => this.configurationsSubject.next(configs)),
      catchError(this.handleError<EventConfiguration[]>('getEventConfigurations', []))
    );
  }

  /**
   * Actualiza configuración de evento
   */
  public updateEventConfiguration(type: string, config: Partial<EventConfiguration>): Observable<EventConfiguration> {
    return this.http.put<EventConfiguration>(`${this.apiUrl}/configurations/${type}`, config).pipe(
      tap(updatedConfig => {
        const current = this.configurationsSubject.value;
        const index = current.findIndex(c => c.type === type);
        if (index !== -1) {
          current[index] = updatedConfig;
          this.configurationsSubject.next([...current]);
        }
      }),
      catchError(this.handleError<EventConfiguration>('updateEventConfiguration'))
    );
  }

  /**
   * Obtiene estadísticas de eventos
   */
  public getEventStats(): Observable<EventStats> {
    return this.http.get<EventStats>(`${this.apiUrl}/stats`).pipe(
      tap(stats => this.statsSubject.next(stats)),
      catchError(this.handleError<EventStats>('getEventStats'))
    );
  }

  /**
   * Reprocesa eventos fallidos
   */
  public reprocessFailedEvents(eventIds?: string[]): Observable<{ processed: number; failed: number }> {
    const body = eventIds ? { eventIds } : {};
    return this.http.post<{ processed: number; failed: number }>(`${this.apiUrl}/reprocess`, body).pipe(
      catchError(this.handleError<{ processed: number; failed: number }>('reprocessFailedEvents', { processed: 0, failed: 0 }))
    );
  }

  /**
   * Limpia eventos antiguos
   */
  public cleanupOldEvents(olderThanDays: number): Observable<{ deleted: number }> {
    return this.http.delete<{ deleted: number }>(`${this.apiUrl}/cleanup`, {
      params: { olderThanDays: olderThanDays.toString() }
    }).pipe(
      catchError(this.handleError<{ deleted: number }>('cleanupOldEvents', { deleted: 0 }))
    );
  }

  /**
   * Registra un listener para eventos
   */
  public addEventListener(
    id: string, 
    eventTypes: string[], 
    callback: (event: SystemEvent) => void,
    filter?: (event: SystemEvent) => boolean
  ): void {
    const listener: EventListener = {
      id,
      eventTypes,
      callback,
      filter,
      isActive: true
    };
    
    this.listeners.set(id, listener);
  }

  /**
   * Remueve un listener de eventos
   */
  public removeEventListener(id: string): void {
    this.listeners.delete(id);
  }

  /**
   * Activa/desactiva un listener
   */
  public toggleEventListener(id: string, isActive: boolean): void {
    const listener = this.listeners.get(id);
    if (listener) {
      listener.isActive = isActive;
    }
  }

  /**
   * Obtiene listeners registrados
   */
  public getEventListeners(): EventListener[] {
    return Array.from(this.listeners.values());
  }

  /**
   * Eventos predefinidos del sistema
   */
  public getSystemEventTypes(): EventConfiguration[] {
    return [
      {
        type: 'user_registered',
        name: 'Usuario Registrado',
        description: 'Se dispara cuando un nuevo usuario se registra en el sistema',
        category: 'user',
        isActive: true,
        schema: {
          properties: {
            userId: { type: 'string', required: true, description: 'ID del usuario', example: 'user_123' },
            email: { type: 'string', required: true, description: 'Email del usuario', example: 'user@example.com' },
            name: { type: 'string', required: true, description: 'Nombre del usuario', example: 'Juan Pérez' },
            role: { type: 'string', required: false, description: 'Rol del usuario', example: 'user' },
            registrationMethod: { type: 'string', required: false, description: 'Método de registro', example: 'email' }
          },
          required: ['userId', 'email', 'name']
        },
        triggers: [],
        retentionDays: 365,
        settings: {
          enableLogging: true,
          enableMetrics: true,
          enableTriggers: true,
          maxRetries: 3,
          retryDelay: 5000,
          batchSize: 10
        }
      },
      {
        type: 'inscription_submitted',
        name: 'Inscripción Enviada',
        description: 'Se dispara cuando un usuario envía una inscripción a un concurso',
        category: 'inscription',
        isActive: true,
        schema: {
          properties: {
            inscriptionId: { type: 'string', required: true, description: 'ID de la inscripción', example: 'insc_123' },
            contestId: { type: 'string', required: true, description: 'ID del concurso', example: 'contest_123' },
            userId: { type: 'string', required: true, description: 'ID del usuario', example: 'user_123' },
            status: { type: 'string', required: true, description: 'Estado de la inscripción', example: 'submitted' },
            completionPercentage: { type: 'number', required: false, description: 'Porcentaje de completitud', example: 85 }
          },
          required: ['inscriptionId', 'contestId', 'userId', 'status']
        },
        triggers: [],
        retentionDays: 730,
        settings: {
          enableLogging: true,
          enableMetrics: true,
          enableTriggers: true,
          maxRetries: 3,
          retryDelay: 5000,
          batchSize: 10
        }
      },
      {
        type: 'document_uploaded',
        name: 'Documento Subido',
        description: 'Se dispara cuando un usuario sube un documento',
        category: 'document',
        isActive: true,
        schema: {
          properties: {
            documentId: { type: 'string', required: true, description: 'ID del documento', example: 'doc_123' },
            inscriptionId: { type: 'string', required: true, description: 'ID de la inscripción', example: 'insc_123' },
            userId: { type: 'string', required: true, description: 'ID del usuario', example: 'user_123' },
            documentType: { type: 'string', required: true, description: 'Tipo de documento', example: 'dni_frente' },
            fileName: { type: 'string', required: true, description: 'Nombre del archivo', example: 'dni_frente.pdf' },
            fileSize: { type: 'number', required: false, description: 'Tamaño del archivo en bytes', example: 1024000 }
          },
          required: ['documentId', 'inscriptionId', 'userId', 'documentType', 'fileName']
        },
        triggers: [],
        retentionDays: 365,
        settings: {
          enableLogging: true,
          enableMetrics: true,
          enableTriggers: true,
          maxRetries: 3,
          retryDelay: 5000,
          batchSize: 10
        }
      },
      {
        type: 'exam_scheduled',
        name: 'Examen Programado',
        description: 'Se dispara cuando se programa un examen para un concurso',
        category: 'exam',
        isActive: true,
        schema: {
          properties: {
            examId: { type: 'string', required: true, description: 'ID del examen', example: 'exam_123' },
            contestId: { type: 'string', required: true, description: 'ID del concurso', example: 'contest_123' },
            examDate: { type: 'string', required: true, description: 'Fecha del examen', example: '2024-06-15T10:00:00Z' },
            location: { type: 'string', required: false, description: 'Ubicación del examen', example: 'Aula 101' },
            duration: { type: 'number', required: false, description: 'Duración en minutos', example: 120 },
            participantCount: { type: 'number', required: false, description: 'Número de participantes', example: 50 }
          },
          required: ['examId', 'contestId', 'examDate']
        },
        triggers: [],
        retentionDays: 365,
        settings: {
          enableLogging: true,
          enableMetrics: true,
          enableTriggers: true,
          maxRetries: 3,
          retryDelay: 5000,
          batchSize: 10
        }
      },
      {
        type: 'deadline_approaching',
        name: 'Fecha Límite Próxima',
        description: 'Se dispara cuando se acerca una fecha límite importante',
        category: 'system',
        isActive: true,
        schema: {
          properties: {
            deadlineType: { type: 'string', required: true, description: 'Tipo de fecha límite', example: 'inscription_end' },
            contestId: { type: 'string', required: false, description: 'ID del concurso', example: 'contest_123' },
            deadlineDate: { type: 'string', required: true, description: 'Fecha límite', example: '2024-06-15T23:59:59Z' },
            daysRemaining: { type: 'number', required: true, description: 'Días restantes', example: 3 },
            affectedUsers: { type: 'array', required: false, description: 'Usuarios afectados', example: ['user_123', 'user_456'] }
          },
          required: ['deadlineType', 'deadlineDate', 'daysRemaining']
        },
        triggers: [],
        retentionDays: 90,
        settings: {
          enableLogging: true,
          enableMetrics: true,
          enableTriggers: true,
          maxRetries: 3,
          retryDelay: 5000,
          batchSize: 10
        }
      },
      {
        type: 'contest_created',
        name: 'Concurso Creado',
        description: 'Se dispara cuando se crea un nuevo concurso',
        category: 'contest',
        isActive: true,
        schema: {
          properties: {
            contestId: { type: 'string', required: true, description: 'ID del concurso', example: 'contest_123' },
            title: { type: 'string', required: true, description: 'Título del concurso', example: 'Concurso de Programación' },
            category: { type: 'string', required: true, description: 'Categoría del concurso', example: 'tecnologia' },
            createdBy: { type: 'string', required: true, description: 'ID del creador', example: 'admin_123' },
            startDate: { type: 'string', required: false, description: 'Fecha de inicio', example: '2024-07-01T00:00:00Z' },
            endDate: { type: 'string', required: false, description: 'Fecha de fin', example: '2024-07-31T23:59:59Z' }
          },
          required: ['contestId', 'title', 'category', 'createdBy']
        },
        triggers: [],
        retentionDays: 365,
        settings: {
          enableLogging: true,
          enableMetrics: true,
          enableTriggers: true,
          maxRetries: 3,
          retryDelay: 5000,
          batchSize: 10
        }
      },
      {
        type: 'results_published',
        name: 'Resultados Publicados',
        description: 'Se dispara cuando se publican los resultados de un concurso',
        category: 'contest',
        isActive: true,
        schema: {
          properties: {
            contestId: { type: 'string', required: true, description: 'ID del concurso', example: 'contest_123' },
            examId: { type: 'string', required: false, description: 'ID del examen', example: 'exam_123' },
            publishedBy: { type: 'string', required: true, description: 'ID del publicador', example: 'admin_123' },
            participantCount: { type: 'number', required: false, description: 'Número de participantes', example: 50 },
            passedCount: { type: 'number', required: false, description: 'Número de aprobados', example: 25 },
            averageScore: { type: 'number', required: false, description: 'Puntuación promedio', example: 75.5 }
          },
          required: ['contestId', 'publishedBy']
        },
        triggers: [],
        retentionDays: 730,
        settings: {
          enableLogging: true,
          enableMetrics: true,
          enableTriggers: true,
          maxRetries: 3,
          retryDelay: 5000,
          batchSize: 10
        }
      }
    ];
  }

  /**
   * Inicializa WebSocket para eventos en tiempo real
   */
  private initializeWebSocket(): void {
    if (!environment.production) return; // Solo en producción

    const wsUrl = environment.wsUrl || environment.apiUrl.replace('http', 'ws');
    
    try {
      this.websocket = new WebSocket(`${wsUrl}/events/stream`);
      
      this.websocket.onopen = () => {
        console.log('WebSocket conectado para eventos del sistema');
        this.reconnectAttempts = 0;
      };
      
      this.websocket.onmessage = (event) => {
        try {
          const systemEvent = JSON.parse(event.data);
          const mappedEvent = this.mapEvent(systemEvent);
          this.realTimeEventsSubject.next(mappedEvent);
          this.notifyListeners(mappedEvent);
        } catch (error) {
          console.error('Error procesando evento WebSocket:', error);
        }
      };
      
      this.websocket.onclose = () => {
        console.log('WebSocket desconectado');
        this.handleWebSocketReconnect();
      };
      
      this.websocket.onerror = (error) => {
        console.error('Error en WebSocket:', error);
      };
    } catch (error) {
      console.error('Error inicializando WebSocket:', error);
    }
  }

  /**
   * Maneja reconexión de WebSocket
   */
  private handleWebSocketReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      setTimeout(() => {
        console.log(`Reintentando conexión WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.initializeWebSocket();
      }, delay);
    }
  }

  /**
   * Notifica a los listeners registrados
   */
  private notifyListeners(event: SystemEvent): void {
    this.listeners.forEach(listener => {
      if (!listener.isActive) return;
      
      const matchesType = listener.eventTypes.includes('*') || listener.eventTypes.includes(event.type);
      if (!matchesType) return;
      
      const passesFilter = !listener.filter || listener.filter(event);
      if (!passesFilter) return;
      
      try {
        listener.callback(event);
      } catch (error) {
        console.error(`Error en listener ${listener.id}:`, error);
      }
    });
  }

  /**
   * Carga configuraciones de eventos
   */
  private loadEventConfigurations(): void {
    this.getEventConfigurations().subscribe();
  }

  /**
   * Obtiene ID de sesión
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  /**
   * Mapea evento desde API
   */
  private mapEvent = (event: any): SystemEvent => ({
    ...event,
    timestamp: new Date(event.timestamp),
    processedAt: event.processedAt ? new Date(event.processedAt) : undefined
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
    if (this.websocket) {
      this.websocket.close();
    }
    this.listeners.clear();
  }
}
