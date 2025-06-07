import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { SystemAlert } from './admin-notifications.service';

/**
 * Interfaz para reglas de priorización
 */
export interface PrioritizationRule {
  id: string;
  name: string;
  condition: (alert: SystemAlert) => boolean;
  priority: number; // 1 = más alta, 10 = más baja
  action?: 'escalate' | 'suppress' | 'group';
  enabled: boolean;
}

/**
 * Interfaz para alertas priorizadas
 */
export interface PrioritizedAlert extends SystemAlert {
  priorityScore: number;
  priorityLevel: 'critical' | 'high' | 'medium' | 'low';
  escalated: boolean;
  grouped: boolean;
  groupId?: string;
  appliedRules: string[];
}

/**
 * Interfaz para configuración de priorización
 */
export interface PrioritizationConfig {
  enableAutoEscalation: boolean;
  enableGrouping: boolean;
  maxAlertsPerGroup: number;
  escalationThreshold: number; // minutos
  suppressDuplicates: boolean;
  notificationThresholds: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * Servicio para priorización inteligente de alertas
 */
@Injectable({
  providedIn: 'root'
})
export class AlertPrioritizationService {

  // Estados internos
  private rulesSubject = new BehaviorSubject<PrioritizationRule[]>([]);
  private configSubject = new BehaviorSubject<PrioritizationConfig>(this.getDefaultConfig());
  private prioritizedAlertsSubject = new BehaviorSubject<PrioritizedAlert[]>([]);

  // Observables públicos
  public rules$ = this.rulesSubject.asObservable();
  public config$ = this.configSubject.asObservable();
  public prioritizedAlerts$ = this.prioritizedAlertsSubject.asObservable();

  // Alertas por nivel de prioridad
  public criticalAlerts$ = this.prioritizedAlerts$.pipe(
    map(alerts => alerts.filter(a => a.priorityLevel === 'critical')),
    distinctUntilChanged()
  );

  public highPriorityAlerts$ = this.prioritizedAlerts$.pipe(
    map(alerts => alerts.filter(a => a.priorityLevel === 'high')),
    distinctUntilChanged()
  );

  public mediumPriorityAlerts$ = this.prioritizedAlerts$.pipe(
    map(alerts => alerts.filter(a => a.priorityLevel === 'medium')),
    distinctUntilChanged()
  );

  public lowPriorityAlerts$ = this.prioritizedAlerts$.pipe(
    map(alerts => alerts.filter(a => a.priorityLevel === 'low')),
    distinctUntilChanged()
  );

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Inicializa las reglas de priorización por defecto
   */
  private initializeDefaultRules(): void {
    const defaultRules: PrioritizationRule[] = [
      {
        id: 'urgent-inscriptions',
        name: 'Inscripciones Urgentes',
        condition: (alert) => alert.type === 'urgent' && alert.moduleId === 'inscripciones',
        priority: 1,
        action: 'escalate',
        enabled: true
      },
      {
        id: 'contest-deadline',
        name: 'Vencimiento de Concursos',
        condition: (alert) => alert.message.includes('vencer') || alert.message.includes('deadline'),
        priority: 2,
        action: 'escalate',
        enabled: true
      },
      {
        id: 'document-backlog',
        name: 'Acumulación de Documentos',
        condition: (alert) => alert.message.includes('documentos') && alert.type === 'warning',
        priority: 3,
        action: 'group',
        enabled: true
      },
      {
        id: 'system-errors',
        name: 'Errores del Sistema',
        condition: (alert) => alert.message.includes('error') || alert.message.includes('fallo'),
        priority: 1,
        action: 'escalate',
        enabled: true
      },
      {
        id: 'pending-reviews',
        name: 'Revisiones Pendientes',
        condition: (alert) => alert.message.includes('pendiente') && alert.type === 'warning',
        priority: 4,
        action: 'group',
        enabled: true
      },
      {
        id: 'duplicate-suppression',
        name: 'Suprimir Duplicados',
        condition: (alert) => true, // Se aplica en la lógica de procesamiento
        priority: 10,
        action: 'suppress',
        enabled: true
      }
    ];

    this.rulesSubject.next(defaultRules);
  }

  /**
   * Procesa y prioriza una lista de alertas
   */
  public processAlerts(alerts: SystemAlert[]): PrioritizedAlert[] {
    const config = this.configSubject.value;
    const rules = this.rulesSubject.value.filter(r => r.enabled);
    
    let processedAlerts: PrioritizedAlert[] = alerts.map(alert => ({
      ...alert,
      priorityScore: 5, // Prioridad media por defecto
      priorityLevel: 'medium' as const,
      escalated: false,
      grouped: false,
      appliedRules: []
    }));

    // Aplicar reglas de priorización
    processedAlerts = this.applyPrioritizationRules(processedAlerts, rules);

    // Suprimir duplicados si está habilitado
    if (config.suppressDuplicates) {
      processedAlerts = this.suppressDuplicates(processedAlerts);
    }

    // Agrupar alertas si está habilitado
    if (config.enableGrouping) {
      processedAlerts = this.groupAlerts(processedAlerts, config);
    }

    // Escalar alertas si está habilitado
    if (config.enableAutoEscalation) {
      processedAlerts = this.escalateAlerts(processedAlerts, config);
    }

    // Asignar niveles de prioridad finales
    processedAlerts = this.assignPriorityLevels(processedAlerts, config);

    // Ordenar por prioridad
    processedAlerts.sort((a, b) => a.priorityScore - b.priorityScore);

    this.prioritizedAlertsSubject.next(processedAlerts);
    return processedAlerts;
  }

  /**
   * Aplica las reglas de priorización
   */
  private applyPrioritizationRules(alerts: PrioritizedAlert[], rules: PrioritizationRule[]): PrioritizedAlert[] {
    return alerts.map(alert => {
      const applicableRules = rules.filter(rule => rule.condition(alert));
      
      if (applicableRules.length > 0) {
        // Usar la prioridad más alta (número más bajo)
        const highestPriority = Math.min(...applicableRules.map(r => r.priority));
        
        return {
          ...alert,
          priorityScore: highestPriority,
          appliedRules: applicableRules.map(r => r.id)
        };
      }
      
      return alert;
    });
  }

  /**
   * Suprime alertas duplicadas
   */
  private suppressDuplicates(alerts: PrioritizedAlert[]): PrioritizedAlert[] {
    const seen = new Set<string>();
    return alerts.filter(alert => {
      const key = `${alert.moduleId}-${alert.title}-${alert.message}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Agrupa alertas relacionadas
   */
  private groupAlerts(alerts: PrioritizedAlert[], config: PrioritizationConfig): PrioritizedAlert[] {
    const groups = new Map<string, PrioritizedAlert[]>();
    
    alerts.forEach(alert => {
      const groupKey = `${alert.moduleId}-${alert.type}`;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(alert);
    });

    const result: PrioritizedAlert[] = [];
    
    groups.forEach((groupAlerts, groupKey) => {
      if (groupAlerts.length > 1 && groupAlerts.length <= config.maxAlertsPerGroup) {
        // Marcar como agrupadas
        const groupedAlerts = groupAlerts.map(alert => ({
          ...alert,
          grouped: true,
          groupId: groupKey
        }));
        result.push(...groupedAlerts);
      } else {
        result.push(...groupAlerts);
      }
    });

    return result;
  }

  /**
   * Escala alertas basándose en el tiempo
   */
  private escalateAlerts(alerts: PrioritizedAlert[], config: PrioritizationConfig): PrioritizedAlert[] {
    const now = new Date();
    
    return alerts.map(alert => {
      const alertAge = now.getTime() - alert.timestamp.getTime();
      const ageInMinutes = alertAge / (1000 * 60);
      
      if (ageInMinutes > config.escalationThreshold && !alert.acknowledged) {
        return {
          ...alert,
          escalated: true,
          priorityScore: Math.max(1, alert.priorityScore - 1) // Aumentar prioridad
        };
      }
      
      return alert;
    });
  }

  /**
   * Asigna niveles de prioridad basándose en el score
   */
  private assignPriorityLevels(alerts: PrioritizedAlert[], config: PrioritizationConfig): PrioritizedAlert[] {
    return alerts.map(alert => {
      let priorityLevel: 'critical' | 'high' | 'medium' | 'low' = 'low';
      
      if (alert.priorityScore <= 1) {
        priorityLevel = 'critical';
      } else if (alert.priorityScore <= 2) {
        priorityLevel = 'high';
      } else if (alert.priorityScore <= 4) {
        priorityLevel = 'medium';
      }
      
      return {
        ...alert,
        priorityLevel
      };
    });
  }

  /**
   * Obtiene la configuración por defecto
   */
  private getDefaultConfig(): PrioritizationConfig {
    return {
      enableAutoEscalation: true,
      enableGrouping: true,
      maxAlertsPerGroup: 5,
      escalationThreshold: 30, // 30 minutos
      suppressDuplicates: true,
      notificationThresholds: {
        critical: 0, // Notificar inmediatamente
        high: 1,     // Notificar si hay 1 o más
        medium: 3,   // Notificar si hay 3 o más
        low: 5       // Notificar si hay 5 o más
      }
    };
  }

  /**
   * Actualiza la configuración
   */
  public updateConfig(config: Partial<PrioritizationConfig>): void {
    const currentConfig = this.configSubject.value;
    this.configSubject.next({ ...currentConfig, ...config });
  }

  /**
   * Añade una nueva regla de priorización
   */
  public addRule(rule: PrioritizationRule): void {
    const currentRules = this.rulesSubject.value;
    this.rulesSubject.next([...currentRules, rule]);
  }

  /**
   * Actualiza una regla existente
   */
  public updateRule(ruleId: string, updates: Partial<PrioritizationRule>): void {
    const currentRules = this.rulesSubject.value;
    const updatedRules = currentRules.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    );
    this.rulesSubject.next(updatedRules);
  }

  /**
   * Elimina una regla
   */
  public removeRule(ruleId: string): void {
    const currentRules = this.rulesSubject.value;
    const filteredRules = currentRules.filter(rule => rule.id !== ruleId);
    this.rulesSubject.next(filteredRules);
  }

  /**
   * Obtiene estadísticas de priorización
   */
  public getPrioritizationStats(): Observable<{
    totalAlerts: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    escalatedCount: number;
    groupedCount: number;
  }> {
    return this.prioritizedAlerts$.pipe(
      map(alerts => ({
        totalAlerts: alerts.length,
        criticalCount: alerts.filter(a => a.priorityLevel === 'critical').length,
        highCount: alerts.filter(a => a.priorityLevel === 'high').length,
        mediumCount: alerts.filter(a => a.priorityLevel === 'medium').length,
        lowCount: alerts.filter(a => a.priorityLevel === 'low').length,
        escalatedCount: alerts.filter(a => a.escalated).length,
        groupedCount: alerts.filter(a => a.grouped).length
      }))
    );
  }
}
