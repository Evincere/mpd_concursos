import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { 
  ActivityRetentionConfig, 
  ActivityAlertConfig,
  ActivityAlertRule,
  NotificationChannel,
  EscalationRule
} from '@shared/interfaces/audit/user-activity.interface';

/**
 * Configuración de auditoría por defecto
 */
const DEFAULT_RETENTION_CONFIG: ActivityRetentionConfig = {
  enabled: true,
  retentionPeriodDays: 90,
  archiveBeforeDelete: true,
  compressionEnabled: true,
  encryptionEnabled: false,
  autoCleanupEnabled: true,
  cleanupSchedule: '0 2 * * *' // 2 AM daily
};

const DEFAULT_ALERT_CONFIG: ActivityAlertConfig = {
  enabled: false,
  rules: [],
  notificationChannels: [],
  escalationRules: []
};

/**
 * Servicio para configuración de auditoría
 */
@Injectable({
  providedIn: 'root'
})
export class AuditConfigurationService {

  private readonly apiUrl = `${environment.apiUrl}/audit/config`;

  // Estados internos
  private retentionConfigSubject = new BehaviorSubject<ActivityRetentionConfig>(DEFAULT_RETENTION_CONFIG);
  private alertConfigSubject = new BehaviorSubject<ActivityAlertConfig>(DEFAULT_ALERT_CONFIG);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  // Observables públicos
  public retentionConfig$ = this.retentionConfigSubject.asObservable();
  public alertConfig$ = this.alertConfigSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(
    private http: HttpClient,
    private loggingService: LoggingService
  ) {
    this.loadConfigurations();
  }

  /**
   * Carga las configuraciones iniciales
   */
  private loadConfigurations(): void {
    this.loadRetentionConfig();
    this.loadAlertConfig();
  }

  // ==================== CONFIGURACIÓN DE RETENCIÓN ====================

  /**
   * Obtiene la configuración de retención
   */
  public getRetentionConfig(): Observable<ActivityRetentionConfig> {
    return this.http.get<ActivityRetentionConfig>(`${this.apiUrl}/retention`).pipe(
      tap(config => {
        this.retentionConfigSubject.next(config);
      }),
      catchError(error => {
        console.error('Error loading retention config:', error);
        return of(DEFAULT_RETENTION_CONFIG);
      })
    );
  }

  /**
   * Carga la configuración de retención
   */
  private loadRetentionConfig(): void {
    this.getRetentionConfig().subscribe();
  }

  /**
   * Actualiza la configuración de retención
   */
  public updateRetentionConfig(config: Partial<ActivityRetentionConfig>): Observable<ActivityRetentionConfig> {
    this.loadingSubject.next(true);

    const updatedConfig = { ...this.retentionConfigSubject.value, ...config };

    return this.http.put<ActivityRetentionConfig>(`${this.apiUrl}/retention`, updatedConfig).pipe(
      tap(savedConfig => {
        this.retentionConfigSubject.next(savedConfig);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        console.error('Error updating retention config:', error);
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Restaura la configuración de retención por defecto
   */
  public resetRetentionConfig(): Observable<ActivityRetentionConfig> {
    return this.updateRetentionConfig(DEFAULT_RETENTION_CONFIG);
  }

  /**
   * Valida la configuración de retención
   */
  public validateRetentionConfig(config: ActivityRetentionConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.retentionPeriodDays < 1) {
      errors.push('El período de retención debe ser al menos 1 día');
    }

    if (config.retentionPeriodDays > 3650) {
      errors.push('El período de retención no puede exceder 10 años');
    }

    if (config.cleanupSchedule && !this.isValidCronExpression(config.cleanupSchedule)) {
      errors.push('La expresión cron para limpieza automática no es válida');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ==================== CONFIGURACIÓN DE ALERTAS ====================

  /**
   * Obtiene la configuración de alertas
   */
  public getAlertConfig(): Observable<ActivityAlertConfig> {
    return this.http.get<ActivityAlertConfig>(`${this.apiUrl}/alerts`).pipe(
      tap(config => {
        this.alertConfigSubject.next(config);
      }),
      catchError(error => {
        console.error('Error loading alert config:', error);
        return of(DEFAULT_ALERT_CONFIG);
      })
    );
  }

  /**
   * Carga la configuración de alertas
   */
  private loadAlertConfig(): void {
    this.getAlertConfig().subscribe();
  }

  /**
   * Actualiza la configuración de alertas
   */
  public updateAlertConfig(config: Partial<ActivityAlertConfig>): Observable<ActivityAlertConfig> {
    this.loadingSubject.next(true);

    const updatedConfig = { ...this.alertConfigSubject.value, ...config };

    return this.http.put<ActivityAlertConfig>(`${this.apiUrl}/alerts`, updatedConfig).pipe(
      tap(savedConfig => {
        this.alertConfigSubject.next(savedConfig);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        console.error('Error updating alert config:', error);
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Agrega una nueva regla de alerta
   */
  public addAlertRule(rule: Omit<ActivityAlertRule, 'id'>): Observable<ActivityAlertConfig> {
    const currentConfig = this.alertConfigSubject.value;
    const newRule: ActivityAlertRule = {
      ...rule,
      id: this.generateRuleId()
    };

    const updatedConfig = {
      ...currentConfig,
      rules: [...currentConfig.rules, newRule]
    };

    return this.updateAlertConfig(updatedConfig);
  }

  /**
   * Actualiza una regla de alerta existente
   */
  public updateAlertRule(ruleId: string, updates: Partial<ActivityAlertRule>): Observable<ActivityAlertConfig> {
    const currentConfig = this.alertConfigSubject.value;
    const ruleIndex = currentConfig.rules.findIndex(r => r.id === ruleId);

    if (ruleIndex === -1) {
      throw new Error(`Alert rule with ID ${ruleId} not found`);
    }

    const updatedRules = [...currentConfig.rules];
    updatedRules[ruleIndex] = { ...updatedRules[ruleIndex], ...updates };

    const updatedConfig = {
      ...currentConfig,
      rules: updatedRules
    };

    return this.updateAlertConfig(updatedConfig);
  }

  /**
   * Elimina una regla de alerta
   */
  public removeAlertRule(ruleId: string): Observable<ActivityAlertConfig> {
    const currentConfig = this.alertConfigSubject.value;
    const updatedRules = currentConfig.rules.filter(r => r.id !== ruleId);

    const updatedConfig = {
      ...currentConfig,
      rules: updatedRules
    };

    return this.updateAlertConfig(updatedConfig);
  }

  /**
   * Agrega un canal de notificación
   */
  public addNotificationChannel(channel: Omit<NotificationChannel, 'id'>): Observable<ActivityAlertConfig> {
    const currentConfig = this.alertConfigSubject.value;
    const newChannel: NotificationChannel = {
      ...channel,
      id: this.generateChannelId()
    };

    const updatedConfig = {
      ...currentConfig,
      notificationChannels: [...currentConfig.notificationChannels, newChannel]
    };

    return this.updateAlertConfig(updatedConfig);
  }

  /**
   * Actualiza un canal de notificación
   */
  public updateNotificationChannel(channelId: string, updates: Partial<NotificationChannel>): Observable<ActivityAlertConfig> {
    const currentConfig = this.alertConfigSubject.value;
    const channelIndex = currentConfig.notificationChannels.findIndex(c => c.id === channelId);

    if (channelIndex === -1) {
      throw new Error(`Notification channel with ID ${channelId} not found`);
    }

    const updatedChannels = [...currentConfig.notificationChannels];
    updatedChannels[channelIndex] = { ...updatedChannels[channelIndex], ...updates };

    const updatedConfig = {
      ...currentConfig,
      notificationChannels: updatedChannels
    };

    return this.updateAlertConfig(updatedConfig);
  }

  /**
   * Elimina un canal de notificación
   */
  public removeNotificationChannel(channelId: string): Observable<ActivityAlertConfig> {
    const currentConfig = this.alertConfigSubject.value;
    const updatedChannels = currentConfig.notificationChannels.filter(c => c.id !== channelId);

    const updatedConfig = {
      ...currentConfig,
      notificationChannels: updatedChannels
    };

    return this.updateAlertConfig(updatedConfig);
  }

  /**
   * Prueba un canal de notificación
   */
  public testNotificationChannel(channelId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/alerts/channels/${channelId}/test`, {}).pipe(
      catchError(error => {
        console.error('Error testing notification channel:', error);
        return of({ success: false, message: 'Error al probar el canal de notificación' });
      })
    );
  }

  // ==================== UTILIDADES ====================

  /**
   * Obtiene la configuración actual de retención
   */
  public getCurrentRetentionConfig(): ActivityRetentionConfig {
    return this.retentionConfigSubject.value;
  }

  /**
   * Obtiene la configuración actual de alertas
   */
  public getCurrentAlertConfig(): ActivityAlertConfig {
    return this.alertConfigSubject.value;
  }

  /**
   * Valida una expresión cron
   */
  private isValidCronExpression(expression: string): boolean {
    // Validación básica de expresión cron (5 campos)
    const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
    return cronRegex.test(expression);
  }

  /**
   * Genera un ID único para reglas de alerta
   */
  private generateRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Genera un ID único para canales de notificación
   */
  private generateChannelId(): string {
    return `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Exporta la configuración completa
   */
  public exportConfiguration(): string {
    const config = {
      retention: this.retentionConfigSubject.value,
      alerts: this.alertConfigSubject.value,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    return JSON.stringify(config, null, 2);
  }

  /**
   * Importa una configuración
   */
  public importConfiguration(configJson: string): Observable<{ success: boolean; message: string }> {
    try {
      const config = JSON.parse(configJson);
      
      if (!config.retention || !config.alerts) {
        return of({ success: false, message: 'Formato de configuración inválido' });
      }

      // Validar configuración de retención
      const retentionValidation = this.validateRetentionConfig(config.retention);
      if (!retentionValidation.valid) {
        return of({ 
          success: false, 
          message: `Configuración de retención inválida: ${retentionValidation.errors.join(', ')}` 
        });
      }

      // Aplicar configuraciones
      return this.updateRetentionConfig(config.retention).pipe(
        map(() => {
          this.updateAlertConfig(config.alerts).subscribe();
          return { success: true, message: 'Configuración importada exitosamente' };
        }),
        catchError(error => {
          console.error('Error importing configuration:', error);
          return of({ success: false, message: 'Error al importar la configuración' });
        })
      );

    } catch (error) {
      return of({ success: false, message: 'Error al parsear el archivo de configuración' });
    }
  }

  /**
   * Obtiene plantillas de reglas de alerta predefinidas
   */
  public getAlertRuleTemplates(): ActivityAlertRule[] {
    return [
      {
        id: 'template_failed_logins',
        name: 'Intentos de login fallidos',
        description: 'Alerta cuando hay múltiples intentos de login fallidos',
        enabled: true,
        conditions: [
          {
            field: 'action',
            operator: 'EQUALS',
            value: 'LOGIN_FAILED',
            timeWindow: 15,
            threshold: 5
          }
        ],
        actions: [
          {
            type: 'EMAIL',
            target: 'admin@example.com',
            enabled: true
          }
        ],
        cooldownMinutes: 30,
        severity: 'HIGH'
      },
      {
        id: 'template_bulk_deletions',
        name: 'Eliminaciones masivas',
        description: 'Alerta cuando se realizan eliminaciones masivas',
        enabled: true,
        conditions: [
          {
            field: 'action',
            operator: 'IN',
            value: ['DELETE', 'BULK_DELETE'],
            timeWindow: 5,
            threshold: 10
          }
        ],
        actions: [
          {
            type: 'EMAIL',
            target: 'admin@example.com',
            enabled: true
          }
        ],
        cooldownMinutes: 60,
        severity: 'CRITICAL'
      },
      {
        id: 'template_system_errors',
        name: 'Errores del sistema',
        description: 'Alerta cuando hay errores frecuentes del sistema',
        enabled: true,
        conditions: [
          {
            field: 'success',
            operator: 'EQUALS',
            value: false,
            timeWindow: 10,
            threshold: 20
          }
        ],
        actions: [
          {
            type: 'EMAIL',
            target: 'admin@example.com',
            enabled: true
          }
        ],
        cooldownMinutes: 15,
        severity: 'HIGH'
      }
    ];
  }
}
