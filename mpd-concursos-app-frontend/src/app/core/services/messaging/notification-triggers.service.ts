import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { environment } from '@environments/environment';

/**
 * Tipo de trigger
 */
export type TriggerType = 
  | 'event' 
  | 'schedule' 
  | 'condition' 
  | 'manual' 
  | 'webhook' 
  | 'api';

/**
 * Evento del sistema
 */
export type SystemEvent = 
  | 'user_registered'
  | 'inscription_submitted'
  | 'inscription_approved'
  | 'inscription_rejected'
  | 'document_uploaded'
  | 'document_approved'
  | 'document_rejected'
  | 'exam_scheduled'
  | 'exam_completed'
  | 'results_published'
  | 'deadline_approaching'
  | 'contest_created'
  | 'contest_published'
  | 'contest_closed';

/**
 * Condición de trigger
 */
export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in' | 'exists' | 'not_exists';
  value: any;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
}

/**
 * Configuración de horario
 */
export interface ScheduleConfig {
  type: 'once' | 'recurring';
  startDate: Date;
  endDate?: Date;
  time: string; // HH:mm format
  timezone: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number; // every N days/weeks/months/years
    daysOfWeek?: number[]; // 0-6, Sunday = 0
    dayOfMonth?: number; // 1-31
    monthOfYear?: number; // 1-12
  };
}

/**
 * Acción del trigger
 */
export interface TriggerAction {
  type: 'send_notification' | 'send_email' | 'create_task' | 'update_status' | 'call_webhook' | 'execute_script';
  config: {
    templateId?: string;
    recipients?: string[];
    subject?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    delay?: number; // minutes
    retryAttempts?: number;
    webhookUrl?: string;
    scriptId?: string;
    statusUpdate?: {
      entity: string;
      field: string;
      value: any;
    };
  };
}

/**
 * Trigger automático
 */
export interface NotificationTrigger {
  id: string;
  name: string;
  description: string;
  type: TriggerType;
  isActive: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Configuración del trigger
  event?: SystemEvent;
  conditions?: TriggerCondition[];
  schedule?: ScheduleConfig;
  
  // Acciones a ejecutar
  actions: TriggerAction[];
  
  // Configuración avanzada
  settings: {
    maxExecutions?: number;
    cooldownPeriod?: number; // minutes
    requireApproval: boolean;
    logExecution: boolean;
    enableRetry: boolean;
    retryDelay: number; // minutes
    maxRetries: number;
  };
  
  // Metadatos
  metadata: {
    createdBy: string;
    createdAt: Date;
    updatedBy: string;
    updatedAt: Date;
    lastExecuted?: Date;
    executionCount: number;
    successCount: number;
    failureCount: number;
    version: number;
  };
  
  // Filtros y contexto
  filters?: {
    contestIds?: string[];
    userRoles?: string[];
    categories?: string[];
    tags?: string[];
  };
}

/**
 * Ejecución de trigger
 */
export interface TriggerExecution {
  id: string;
  triggerId: string;
  triggerName: string;
  executedAt: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  context: any;
  actions: {
    actionType: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startedAt?: Date;
    completedAt?: Date;
    result?: any;
    error?: string;
    retryCount: number;
  }[];
  duration?: number; // milliseconds
  error?: string;
  logs: string[];
}

/**
 * Estadísticas de triggers
 */
export interface TriggerStats {
  totalTriggers: number;
  activeTriggers: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  byType: Record<TriggerType, number>;
  byEvent: Record<SystemEvent, number>;
  recentExecutions: TriggerExecution[];
  topTriggers: Array<{
    triggerId: string;
    name: string;
    executionCount: number;
    successRate: number;
  }>;
}

/**
 * Filtros de triggers
 */
export interface TriggerFilters {
  type?: TriggerType;
  event?: SystemEvent;
  isActive?: boolean;
  priority?: string;
  createdBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

/**
 * Servicio de triggers automáticos
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationTriggersService {

  private readonly apiUrl = `${environment.apiUrl}/messaging/triggers`;

  // Estados reactivos
  private triggersSubject = new BehaviorSubject<NotificationTrigger[]>([]);
  private executionsSubject = new BehaviorSubject<TriggerExecution[]>([]);
  private statsSubject = new BehaviorSubject<TriggerStats | null>(null);
  private filtersSubject = new BehaviorSubject<TriggerFilters>({});

  // Observables públicos
  public triggers$ = this.triggersSubject.asObservable();
  public executions$ = this.executionsSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();
  public filters$ = this.filtersSubject.asObservable();

  // Polling para actualizaciones en tiempo real
  private pollingInterval = 30000; // 30 segundos
  private isPolling = false;

  constructor(private http: HttpClient) {
    this.startPolling();
  }

  /**
   * Obtiene todos los triggers
   */
  public getTriggers(filters?: TriggerFilters): Observable<NotificationTrigger[]> {
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

    return this.http.get<NotificationTrigger[]>(this.apiUrl, { params }).pipe(
      map(triggers => triggers.map(this.mapTrigger)),
      tap(triggers => this.triggersSubject.next(triggers)),
      catchError(this.handleError<NotificationTrigger[]>('getTriggers', []))
    );
  }

  /**
   * Obtiene un trigger por ID
   */
  public getTrigger(id: string): Observable<NotificationTrigger> {
    return this.http.get<NotificationTrigger>(`${this.apiUrl}/${id}`).pipe(
      map(this.mapTrigger),
      catchError(this.handleError<NotificationTrigger>('getTrigger'))
    );
  }

  /**
   * Crea un nuevo trigger
   */
  public createTrigger(trigger: Partial<NotificationTrigger>): Observable<NotificationTrigger> {
    return this.http.post<NotificationTrigger>(this.apiUrl, trigger).pipe(
      map(this.mapTrigger),
      tap(newTrigger => {
        const current = this.triggersSubject.value;
        this.triggersSubject.next([newTrigger, ...current]);
      }),
      catchError(this.handleError<NotificationTrigger>('createTrigger'))
    );
  }

  /**
   * Actualiza un trigger existente
   */
  public updateTrigger(id: string, trigger: Partial<NotificationTrigger>): Observable<NotificationTrigger> {
    return this.http.put<NotificationTrigger>(`${this.apiUrl}/${id}`, trigger).pipe(
      map(this.mapTrigger),
      tap(updatedTrigger => {
        const current = this.triggersSubject.value;
        const index = current.findIndex(t => t.id === id);
        if (index !== -1) {
          current[index] = updatedTrigger;
          this.triggersSubject.next([...current]);
        }
      }),
      catchError(this.handleError<NotificationTrigger>('updateTrigger'))
    );
  }

  /**
   * Elimina un trigger
   */
  public deleteTrigger(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const current = this.triggersSubject.value;
        this.triggersSubject.next(current.filter(t => t.id !== id));
      }),
      catchError(this.handleError<void>('deleteTrigger'))
    );
  }

  /**
   * Activa/desactiva un trigger
   */
  public toggleTrigger(id: string, isActive: boolean): Observable<NotificationTrigger> {
    return this.http.patch<NotificationTrigger>(`${this.apiUrl}/${id}/toggle`, { isActive }).pipe(
      map(this.mapTrigger),
      tap(updatedTrigger => {
        const current = this.triggersSubject.value;
        const index = current.findIndex(t => t.id === id);
        if (index !== -1) {
          current[index] = updatedTrigger;
          this.triggersSubject.next([...current]);
        }
      }),
      catchError(this.handleError<NotificationTrigger>('toggleTrigger'))
    );
  }

  /**
   * Ejecuta un trigger manualmente
   */
  public executeTrigger(id: string, context?: any): Observable<TriggerExecution> {
    return this.http.post<TriggerExecution>(`${this.apiUrl}/${id}/execute`, { context }).pipe(
      map(this.mapExecution),
      catchError(this.handleError<TriggerExecution>('executeTrigger'))
    );
  }

  /**
   * Obtiene ejecuciones de triggers
   */
  public getExecutions(triggerId?: string, limit = 50): Observable<TriggerExecution[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (triggerId) {
      params = params.set('triggerId', triggerId);
    }

    return this.http.get<TriggerExecution[]>(`${this.apiUrl}/executions`, { params }).pipe(
      map(executions => executions.map(this.mapExecution)),
      tap(executions => this.executionsSubject.next(executions)),
      catchError(this.handleError<TriggerExecution[]>('getExecutions', []))
    );
  }

  /**
   * Obtiene una ejecución específica
   */
  public getExecution(id: string): Observable<TriggerExecution> {
    return this.http.get<TriggerExecution>(`${this.apiUrl}/executions/${id}`).pipe(
      map(this.mapExecution),
      catchError(this.handleError<TriggerExecution>('getExecution'))
    );
  }

  /**
   * Cancela una ejecución en progreso
   */
  public cancelExecution(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/executions/${id}/cancel`, {}).pipe(
      catchError(this.handleError<void>('cancelExecution'))
    );
  }

  /**
   * Obtiene estadísticas de triggers
   */
  public getTriggerStats(): Observable<TriggerStats> {
    return this.http.get<TriggerStats>(`${this.apiUrl}/stats`).pipe(
      tap(stats => this.statsSubject.next(stats)),
      catchError(this.handleError<TriggerStats>('getTriggerStats'))
    );
  }

  /**
   * Valida un trigger antes de guardarlo
   */
  public validateTrigger(trigger: Partial<NotificationTrigger>): Observable<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    return this.http.post<{ isValid: boolean; errors: string[]; warnings: string[] }>(`${this.apiUrl}/validate`, trigger).pipe(
      catchError(this.handleError<{ isValid: boolean; errors: string[]; warnings: string[] }>('validateTrigger', {
        isValid: false,
        errors: ['Error de validación'],
        warnings: []
      }))
    );
  }

  /**
   * Obtiene eventos del sistema disponibles
   */
  public getSystemEvents(): SystemEvent[] {
    return [
      'user_registered',
      'inscription_submitted',
      'inscription_approved',
      'inscription_rejected',
      'document_uploaded',
      'document_approved',
      'document_rejected',
      'exam_scheduled',
      'exam_completed',
      'results_published',
      'deadline_approaching',
      'contest_created',
      'contest_published',
      'contest_closed'
    ];
  }

  /**
   * Obtiene operadores de condición disponibles
   */
  public getConditionOperators(): Array<{ value: string; label: string; dataTypes: string[] }> {
    return [
      { value: 'equals', label: 'Igual a', dataTypes: ['string', 'number', 'boolean', 'date'] },
      { value: 'not_equals', label: 'Diferente de', dataTypes: ['string', 'number', 'boolean', 'date'] },
      { value: 'contains', label: 'Contiene', dataTypes: ['string', 'array'] },
      { value: 'not_contains', label: 'No contiene', dataTypes: ['string', 'array'] },
      { value: 'greater_than', label: 'Mayor que', dataTypes: ['number', 'date'] },
      { value: 'less_than', label: 'Menor que', dataTypes: ['number', 'date'] },
      { value: 'between', label: 'Entre', dataTypes: ['number', 'date'] },
      { value: 'in', label: 'En lista', dataTypes: ['string', 'number'] },
      { value: 'not_in', label: 'No en lista', dataTypes: ['string', 'number'] },
      { value: 'exists', label: 'Existe', dataTypes: ['string', 'number', 'boolean', 'date', 'array', 'object'] },
      { value: 'not_exists', label: 'No existe', dataTypes: ['string', 'number', 'boolean', 'date', 'array', 'object'] }
    ];
  }

  /**
   * Actualiza filtros
   */
  public updateFilters(filters: Partial<TriggerFilters>): void {
    const currentFilters = this.filtersSubject.value;
    this.filtersSubject.next({ ...currentFilters, ...filters });
  }

  /**
   * Limpia filtros
   */
  public clearFilters(): void {
    this.filtersSubject.next({});
  }

  /**
   * Inicia polling para actualizaciones
   */
  private startPolling(): void {
    if (this.isPolling) return;
    
    this.isPolling = true;
    interval(this.pollingInterval).pipe(
      switchMap(() => this.getTriggerStats())
    ).subscribe();
  }

  /**
   * Detiene polling
   */
  public stopPolling(): void {
    this.isPolling = false;
  }

  /**
   * Mapea trigger desde API
   */
  private mapTrigger = (trigger: any): NotificationTrigger => ({
    ...trigger,
    metadata: {
      ...trigger.metadata,
      createdAt: new Date(trigger.metadata.createdAt),
      updatedAt: new Date(trigger.metadata.updatedAt),
      lastExecuted: trigger.metadata.lastExecuted ? new Date(trigger.metadata.lastExecuted) : undefined
    },
    schedule: trigger.schedule ? {
      ...trigger.schedule,
      startDate: new Date(trigger.schedule.startDate),
      endDate: trigger.schedule.endDate ? new Date(trigger.schedule.endDate) : undefined
    } : undefined
  });

  /**
   * Mapea ejecución desde API
   */
  private mapExecution = (execution: any): TriggerExecution => ({
    ...execution,
    executedAt: new Date(execution.executedAt),
    actions: execution.actions.map((action: any) => ({
      ...action,
      startedAt: action.startedAt ? new Date(action.startedAt) : undefined,
      completedAt: action.completedAt ? new Date(action.completedAt) : undefined
    }))
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
}
