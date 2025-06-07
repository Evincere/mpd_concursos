/**
 * Interfaz para actividad de usuario
 */
export interface UserActivity {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  sessionId: string;
  action: UserAction;
  resource: string;
  resourceId?: string;
  details: ActivityDetails;
  metadata: ActivityMetadata;
  timestamp: Date | string;
  ipAddress: string;
  userAgent: string;
  location?: GeoLocation;
  success: boolean;
  errorMessage?: string;
  duration?: number; // en milisegundos
}

/**
 * Tipos de acciones de usuario
 */
export type UserAction = 
  // Autenticación
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'
  
  // Navegación
  | 'PAGE_VIEW'
  | 'ROUTE_CHANGE'
  | 'SEARCH'
  | 'FILTER_APPLY'
  | 'SORT_CHANGE'
  
  // CRUD Operations
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'BULK_UPDATE'
  | 'BULK_DELETE'
  
  // Concursos
  | 'CONCURSO_VIEW'
  | 'CONCURSO_CREATE'
  | 'CONCURSO_UPDATE'
  | 'CONCURSO_DELETE'
  | 'CONCURSO_PUBLISH'
  | 'CONCURSO_ARCHIVE'
  
  // Inscripciones
  | 'INSCRIPTION_START'
  | 'INSCRIPTION_SUBMIT'
  | 'INSCRIPTION_UPDATE'
  | 'INSCRIPTION_CANCEL'
  | 'DOCUMENT_UPLOAD'
  | 'DOCUMENT_DELETE'
  
  // Administración
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_DELETE'
  | 'ROLE_ASSIGN'
  | 'ROLE_REMOVE'
  | 'PERMISSION_GRANT'
  | 'PERMISSION_REVOKE'
  
  // Sistema
  | 'EXPORT_DATA'
  | 'IMPORT_DATA'
  | 'BACKUP_CREATE'
  | 'SYSTEM_CONFIG'
  | 'ERROR_OCCURRED';

/**
 * Detalles específicos de la actividad
 */
export interface ActivityDetails {
  description: string;
  category: ActivityCategory;
  severity: ActivitySeverity;
  previousValue?: any;
  newValue?: any;
  affectedFields?: string[];
  relatedEntities?: RelatedEntity[];
  customData?: Record<string, any>;
}

/**
 * Categorías de actividad
 */
export type ActivityCategory = 
  | 'AUTHENTICATION'
  | 'NAVIGATION'
  | 'DATA_MODIFICATION'
  | 'ADMINISTRATION'
  | 'SECURITY'
  | 'SYSTEM'
  | 'USER_INTERACTION';

/**
 * Niveles de severidad
 */
export type ActivitySeverity = 
  | 'LOW'      // Actividad normal
  | 'MEDIUM'   // Actividad importante
  | 'HIGH'     // Actividad crítica
  | 'CRITICAL'; // Actividad que requiere atención inmediata

/**
 * Entidades relacionadas
 */
export interface RelatedEntity {
  type: string;
  id: string;
  name?: string;
  relationship: string;
}

/**
 * Metadatos de la actividad
 */
export interface ActivityMetadata {
  browser: BrowserInfo;
  device: DeviceInfo;
  screen: ScreenInfo;
  referrer?: string;
  language: string;
  timezone: string;
  connectionType?: string;
  performanceMetrics?: PerformanceMetrics;
}

/**
 * Información del navegador
 */
export interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  platform: string;
  mobile: boolean;
}

/**
 * Información del dispositivo
 */
export interface DeviceInfo {
  type: 'desktop' | 'tablet' | 'mobile' | 'unknown';
  os: string;
  osVersion: string;
  vendor?: string;
  model?: string;
}

/**
 * Información de pantalla
 */
export interface ScreenInfo {
  width: number;
  height: number;
  colorDepth: number;
  pixelRatio: number;
}

/**
 * Métricas de rendimiento
 */
export interface PerformanceMetrics {
  loadTime?: number;
  renderTime?: number;
  memoryUsage?: number;
  networkLatency?: number;
}

/**
 * Ubicación geográfica
 */
export interface GeoLocation {
  country: string;
  region: string;
  city: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
  isp?: string;
}

/**
 * Sesión de usuario
 */
export interface UserSession {
  id: string;
  userId: string;
  startTime: Date | string;
  endTime?: Date | string;
  duration?: number;
  ipAddress: string;
  userAgent: string;
  location?: GeoLocation;
  isActive: boolean;
  activities: UserActivity[];
  lastActivity: Date | string;
  deviceFingerprint: string;
}

/**
 * Estadísticas de actividad
 */
export interface ActivityStatistics {
  totalActivities: number;
  activitiesByAction: Record<UserAction, number>;
  activitiesByCategory: Record<ActivityCategory, number>;
  activitiesBySeverity: Record<ActivitySeverity, number>;
  activitiesByHour: Record<string, number>;
  activitiesByDay: Record<string, number>;
  topUsers: UserActivitySummary[];
  topResources: ResourceActivitySummary[];
  errorRate: number;
  averageSessionDuration: number;
  uniqueUsers: number;
  uniqueSessions: number;
}

/**
 * Resumen de actividad por usuario
 */
export interface UserActivitySummary {
  userId: string;
  userName: string;
  userEmail: string;
  totalActivities: number;
  lastActivity: Date | string;
  sessionsCount: number;
  averageSessionDuration: number;
  mostCommonActions: ActionCount[];
  riskScore: number;
  isOnline: boolean;
}

/**
 * Resumen de actividad por recurso
 */
export interface ResourceActivitySummary {
  resource: string;
  totalAccesses: number;
  uniqueUsers: number;
  lastAccess: Date | string;
  mostCommonActions: ActionCount[];
  errorRate: number;
}

/**
 * Contador de acciones
 */
export interface ActionCount {
  action: UserAction;
  count: number;
  percentage: number;
}

/**
 * Filtros para consulta de actividades
 */
export interface ActivityFilters {
  userId?: string;
  userIds?: string[];
  sessionId?: string;
  actions?: UserAction[];
  categories?: ActivityCategory[];
  severities?: ActivitySeverity[];
  resources?: string[];
  dateFrom?: Date | string;
  dateTo?: Date | string;
  ipAddress?: string;
  success?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: ActivitySortField;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Campos para ordenamiento
 */
export type ActivitySortField = 
  | 'timestamp'
  | 'action'
  | 'resource'
  | 'userName'
  | 'severity'
  | 'duration'
  | 'success';

/**
 * Configuración de retención de datos
 */
export interface ActivityRetentionConfig {
  enabled: boolean;
  retentionPeriodDays: number;
  archiveBeforeDelete: boolean;
  archiveLocation?: string;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  autoCleanupEnabled: boolean;
  cleanupSchedule: string; // cron expression
}

/**
 * Configuración de alertas
 */
export interface ActivityAlertConfig {
  enabled: boolean;
  rules: ActivityAlertRule[];
  notificationChannels: NotificationChannel[];
  escalationRules: EscalationRule[];
}

/**
 * Regla de alerta
 */
export interface ActivityAlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: AlertCondition[];
  actions: AlertAction[];
  cooldownMinutes: number;
  severity: ActivitySeverity;
}

/**
 * Condición de alerta
 */
export interface AlertCondition {
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS' | 'IN' | 'NOT_IN';
  value: any;
  timeWindow?: number; // minutos
  threshold?: number;
}

/**
 * Acción de alerta
 */
export interface AlertAction {
  type: 'EMAIL' | 'SMS' | 'WEBHOOK' | 'SLACK' | 'TEAMS';
  target: string;
  template?: string;
  enabled: boolean;
}

/**
 * Canal de notificación
 */
export interface NotificationChannel {
  id: string;
  name: string;
  type: 'EMAIL' | 'SMS' | 'WEBHOOK' | 'SLACK' | 'TEAMS';
  config: Record<string, any>;
  enabled: boolean;
}

/**
 * Regla de escalación
 */
export interface EscalationRule {
  id: string;
  name: string;
  triggerAfterMinutes: number;
  actions: AlertAction[];
  enabled: boolean;
}

/**
 * Reporte de actividad
 */
export interface ActivityReport {
  id: string;
  name: string;
  description: string;
  type: ActivityReportType;
  filters: ActivityFilters;
  generatedAt: Date | string;
  generatedBy: string;
  format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON';
  data: any;
  downloadUrl?: string;
  expiresAt?: Date | string;
}

/**
 * Tipos de reporte
 */
export type ActivityReportType = 
  | 'USER_ACTIVITY'
  | 'SECURITY_AUDIT'
  | 'PERFORMANCE_ANALYSIS'
  | 'COMPLIANCE_REPORT'
  | 'CUSTOM_QUERY';

/**
 * Utilidades para trabajar con actividades
 */
export class ActivityUtils {
  
  /**
   * Calcula el score de riesgo basado en actividades
   */
  static calculateRiskScore(activities: UserActivity[]): number {
    let score = 0;
    const weights = {
      'LOGIN_FAILED': 10,
      'ACCOUNT_LOCKED': 20,
      'PERMISSION_REVOKE': 15,
      'DELETE': 5,
      'BULK_DELETE': 10,
      'SYSTEM_CONFIG': 8
    };

    activities.forEach(activity => {
      const weight = weights[activity.action as keyof typeof weights] || 1;
      const severityMultiplier = this.getSeverityMultiplier(activity.details.severity);
      score += weight * severityMultiplier;
    });

    return Math.min(score, 100); // Máximo 100
  }

  /**
   * Obtiene el multiplicador de severidad
   */
  private static getSeverityMultiplier(severity: ActivitySeverity): number {
    const multipliers = {
      'LOW': 1,
      'MEDIUM': 2,
      'HIGH': 3,
      'CRITICAL': 5
    };
    return multipliers[severity] || 1;
  }

  /**
   * Formatea la duración en formato legible
   */
  static formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Obtiene el color para el nivel de severidad
   */
  static getSeverityColor(severity: ActivitySeverity): string {
    const colors = {
      'LOW': '#10b981',
      'MEDIUM': '#f59e0b',
      'HIGH': '#ef4444',
      'CRITICAL': '#7c2d12'
    };
    return colors[severity] || '#6b7280';
  }

  /**
   * Obtiene el icono para el tipo de acción
   */
  static getActionIcon(action: UserAction): string {
    const icons = {
      'LOGIN': 'fa-sign-in-alt',
      'LOGOUT': 'fa-sign-out-alt',
      'CREATE': 'fa-plus',
      'UPDATE': 'fa-edit',
      'DELETE': 'fa-trash',
      'READ': 'fa-eye',
      'SEARCH': 'fa-search',
      'EXPORT_DATA': 'fa-download',
      'IMPORT_DATA': 'fa-upload'
    };
    return icons[action as keyof typeof icons] || 'fa-circle';
  }

  /**
   * Agrupa actividades por período
   */
  static groupActivitiesByPeriod(
    activities: UserActivity[], 
    period: 'hour' | 'day' | 'week' | 'month'
  ): Record<string, UserActivity[]> {
    const grouped: Record<string, UserActivity[]> = {};

    activities.forEach(activity => {
      const date = new Date(activity.timestamp);
      let key: string;

      switch (period) {
        case 'hour':
          key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
          break;
        case 'day':
          key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${date.getMonth()}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(activity);
    });

    return grouped;
  }
}
