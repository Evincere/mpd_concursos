import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  SLAConfiguration,
  EscalationRule,
  TicketCategory,
  TicketPriority
} from '../../models/support-ticket.model';

/**
 * Servicio para configuración de SLA y escalamiento automático
 */
@Injectable({
  providedIn: 'root'
})
export class SLAConfigurationService {
  private readonly apiUrl = `${environment.apiUrl}/support/sla`;
  
  // Estados reactivos
  private slaConfigurationsSubject = new BehaviorSubject<SLAConfiguration[]>([]);
  private escalationRulesSubject = new BehaviorSubject<EscalationRule[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  // Observables públicos
  public slaConfigurations$ = this.slaConfigurationsSubject.asObservable();
  public escalationRules$ = this.escalationRulesSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  // Configuraciones SLA por defecto
  private defaultSLAConfigurations: SLAConfiguration[] = [
    // Crítico
    { category: TicketCategory.TECHNICAL, priority: TicketPriority.CRITICAL, responseTimeMinutes: 15, resolutionTimeMinutes: 240, escalationTimeMinutes: 30 },
    { category: TicketCategory.ACCOUNT, priority: TicketPriority.CRITICAL, responseTimeMinutes: 30, resolutionTimeMinutes: 480, escalationTimeMinutes: 60 },
    { category: TicketCategory.PAYMENT, priority: TicketPriority.CRITICAL, responseTimeMinutes: 15, resolutionTimeMinutes: 240, escalationTimeMinutes: 30 },
    
    // Urgente
    { category: TicketCategory.TECHNICAL, priority: TicketPriority.URGENT, responseTimeMinutes: 60, resolutionTimeMinutes: 480, escalationTimeMinutes: 120 },
    { category: TicketCategory.INSCRIPTION, priority: TicketPriority.URGENT, responseTimeMinutes: 120, resolutionTimeMinutes: 720, escalationTimeMinutes: 240 },
    { category: TicketCategory.DOCUMENTS, priority: TicketPriority.URGENT, responseTimeMinutes: 120, resolutionTimeMinutes: 720, escalationTimeMinutes: 240 },
    
    // Alto
    { category: TicketCategory.TECHNICAL, priority: TicketPriority.HIGH, responseTimeMinutes: 240, resolutionTimeMinutes: 1440, escalationTimeMinutes: 480 },
    { category: TicketCategory.ACCOUNT, priority: TicketPriority.HIGH, responseTimeMinutes: 240, resolutionTimeMinutes: 1440, escalationTimeMinutes: 480 },
    { category: TicketCategory.INSCRIPTION, priority: TicketPriority.HIGH, responseTimeMinutes: 480, resolutionTimeMinutes: 2880, escalationTimeMinutes: 720 },
    
    // Normal
    { category: TicketCategory.GENERAL, priority: TicketPriority.NORMAL, responseTimeMinutes: 480, resolutionTimeMinutes: 2880, escalationTimeMinutes: 1440 },
    { category: TicketCategory.TECHNICAL, priority: TicketPriority.NORMAL, responseTimeMinutes: 480, resolutionTimeMinutes: 2880, escalationTimeMinutes: 1440 },
    { category: TicketCategory.FEATURE_REQUEST, priority: TicketPriority.NORMAL, responseTimeMinutes: 1440, resolutionTimeMinutes: 10080, escalationTimeMinutes: 2880 },
    
    // Bajo
    { category: TicketCategory.GENERAL, priority: TicketPriority.LOW, responseTimeMinutes: 1440, resolutionTimeMinutes: 7200, escalationTimeMinutes: 2880 },
    { category: TicketCategory.FEATURE_REQUEST, priority: TicketPriority.LOW, responseTimeMinutes: 2880, resolutionTimeMinutes: 20160, escalationTimeMinutes: 7200 },
    { category: TicketCategory.BUG_REPORT, priority: TicketPriority.LOW, responseTimeMinutes: 1440, resolutionTimeMinutes: 10080, escalationTimeMinutes: 2880 }
  ];

  constructor(
    private http: HttpClient,
    private loggingService: LoggingService
  ) {
    this.loadConfigurations();
  }

  /**
   * Obtiene todas las configuraciones SLA
   */
  getSLAConfigurations(): Observable<SLAConfiguration[]> {
    this.loadingSubject.next(true);
    
    return this.http.get<any>(`${this.apiUrl}/configurations`).pipe(
      map(response => response.data || this.defaultSLAConfigurations),
      tap(configurations => {
        this.slaConfigurationsSubject.next(configurations);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        // Si hay error, usar configuraciones por defecto
        this.slaConfigurationsSubject.next(this.defaultSLAConfigurations);
        this.loadingSubject.next(false);
        console.warn('Error cargando configuraciones SLA, usando valores por defecto:', error);
        return this.slaConfigurationsSubject.asObservable();
      })
    );
  }

  /**
   * Actualiza una configuración SLA
   */
  updateSLAConfiguration(configuration: SLAConfiguration): Observable<SLAConfiguration> {
    return this.http.put<any>(`${this.apiUrl}/configurations`, configuration).pipe(
      map(response => response.data),
      tap(() => this.loadConfigurations()),
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene configuración SLA para una categoría y prioridad específica
   */
  getSLAForTicket(category: TicketCategory, priority: TicketPriority): Observable<SLAConfiguration | null> {
    return this.slaConfigurations$.pipe(
      map(configurations => 
        configurations.find(config => 
          config.category === category && config.priority === priority
        ) || null
      )
    );
  }

  /**
   * Obtiene todas las reglas de escalamiento
   */
  getEscalationRules(): Observable<EscalationRule[]> {
    this.loadingSubject.next(true);
    
    return this.http.get<any>(`${this.apiUrl}/escalation-rules`).pipe(
      map(response => response.data || this.getDefaultEscalationRules()),
      tap(rules => {
        this.escalationRulesSubject.next(rules);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        // Si hay error, usar reglas por defecto
        const defaultRules = this.getDefaultEscalationRules();
        this.escalationRulesSubject.next(defaultRules);
        this.loadingSubject.next(false);
        console.warn('Error cargando reglas de escalamiento, usando valores por defecto:', error);
        return this.escalationRulesSubject.asObservable();
      })
    );
  }

  /**
   * Crea una nueva regla de escalamiento
   */
  createEscalationRule(rule: Omit<EscalationRule, 'id'>): Observable<EscalationRule> {
    return this.http.post<any>(`${this.apiUrl}/escalation-rules`, rule).pipe(
      map(response => response.data),
      tap(() => this.loadEscalationRules()),
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza una regla de escalamiento
   */
  updateEscalationRule(id: string, rule: Partial<EscalationRule>): Observable<EscalationRule> {
    return this.http.put<any>(`${this.apiUrl}/escalation-rules/${id}`, rule).pipe(
      map(response => response.data),
      tap(() => this.loadEscalationRules()),
      catchError(this.handleError)
    );
  }

  /**
   * Elimina una regla de escalamiento
   */
  deleteEscalationRule(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/escalation-rules/${id}`).pipe(
      tap(() => this.loadEscalationRules()),
      catchError(this.handleError)
    );
  }

  /**
   * Activa o desactiva una regla de escalamiento
   */
  toggleEscalationRule(id: string, isActive: boolean): Observable<EscalationRule> {
    return this.http.patch<any>(`${this.apiUrl}/escalation-rules/${id}/toggle`, { isActive }).pipe(
      map(response => response.data),
      tap(() => this.loadEscalationRules()),
      catchError(this.handleError)
    );
  }

  /**
   * Ejecuta manualmente las reglas de escalamiento
   */
  executeEscalationRules(): Observable<{ processed: number; escalated: number }> {
    return this.http.post<any>(`${this.apiUrl}/escalation-rules/execute`, {}).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene métricas de SLA
   */
  getSLAMetrics(from?: Date, to?: Date): Observable<{
    totalTickets: number;
    responseTimeCompliance: number;
    resolutionTimeCompliance: number;
    averageResponseTime: number;
    averageResolutionTime: number;
    overdueTickets: number;
  }> {
    let params: any = {};
    if (from) params.from = from.toISOString();
    if (to) params.to = to.toISOString();

    return this.http.get<any>(`${this.apiUrl}/metrics`, { params }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Métodos privados
   */
  private loadConfigurations(): void {
    this.getSLAConfigurations().subscribe();
  }

  private loadEscalationRules(): void {
    this.getEscalationRules().subscribe();
  }

  private getDefaultEscalationRules(): EscalationRule[] {
    return [
      {
        id: 'default-critical-escalation',
        name: 'Escalamiento Crítico',
        description: 'Escala tickets críticos sin respuesta en 30 minutos',
        isActive: true,
        conditions: {
          priority: [TicketPriority.CRITICAL],
          timeThresholdMinutes: 30,
          noResponseTime: 30
        },
        actions: {
          sendNotification: true,
          notificationTemplate: 'critical-escalation',
          addTags: ['escalated', 'critical-overdue']
        }
      },
      {
        id: 'default-urgent-escalation',
        name: 'Escalamiento Urgente',
        description: 'Escala tickets urgentes sin respuesta en 2 horas',
        isActive: true,
        conditions: {
          priority: [TicketPriority.URGENT],
          timeThresholdMinutes: 120,
          noResponseTime: 120
        },
        actions: {
          sendNotification: true,
          notificationTemplate: 'urgent-escalation',
          addTags: ['escalated']
        }
      },
      {
        id: 'default-high-escalation',
        name: 'Escalamiento Alto',
        description: 'Escala tickets de alta prioridad sin respuesta en 8 horas',
        isActive: true,
        conditions: {
          priority: [TicketPriority.HIGH],
          timeThresholdMinutes: 480,
          noResponseTime: 480
        },
        actions: {
          sendNotification: true,
          addTags: ['escalated']
        }
      }
    ];
  }

  private handleError(error: any): Observable<never> {
    console.error('Error en SLAConfigurationService:', error);
    return throwError(() => error);
  }
}
