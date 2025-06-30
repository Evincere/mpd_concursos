/**
 * Servicio de configuración centralizado
 * ✅ REFACTORIZACIÓN: Centraliza valores hardcodeados
 * ✅ SINGLE RESPONSIBILITY: Una sola fuente de configuración
 * ✅ DEPENDENCY INJECTION: Configuración inyectable
 */

import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

/**
 * Configuración de colores del tema
 */
export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  light: string;
  dark: string;
}

/**
 * Configuración de intervalos de tiempo
 */
export interface TimeIntervals {
  minReloadInterval: number;
  cacheTimeout: number;
  sessionTimeout: number;
  heartbeatInterval: number;
}

/**
 * Configuración de límites de la aplicación
 */
export interface AppLimits {
  maxFileSize: number;
  maxFilesPerUpload: number;
  maxConcurrentUploads: number;
  maxRetryAttempts: number;
  paginationPageSize: number;
}

/**
 * Configuración de rutas de la aplicación
 */
export interface AppRoutes {
  dashboard: string;
  profile: string;
  contests: string;
  applications: string;
  documents: string;
  cv: string;
  admin: string;
}

/**
 * Configuración de acciones rápidas
 */
export interface QuickAction {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  priority: 'ALTA' | 'MEDIA' | 'BAJA';
  requiresAuth: boolean;
  roles?: string[];
}

/**
 * Configuración de widgets del dashboard
 */
export interface WidgetConfig {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
  refreshInterval?: number;
  cacheEnabled?: boolean;
}

/**
 * Servicio de configuración centralizado
 */
@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  private readonly LOG_TAG = 'AppConfigService';

  /**
   * Colores del tema de la aplicación
   */
  readonly themeColors: ThemeColors = {
    primary: '#3b82f6',    // blue-500
    secondary: '#6b7280',  // gray-500
    success: '#10b981',    // green-500
    warning: '#f59e0b',    // amber-500
    danger: '#ef4444',     // red-500
    info: '#06b6d4',       // cyan-500
    light: '#f8fafc',      // slate-50
    dark: '#1e293b'        // slate-800
  };

  /**
   * Intervalos de tiempo en milisegundos
   */
  readonly timeIntervals: TimeIntervals = {
    minReloadInterval: 10000,      // 10 segundos
    cacheTimeout: 300000,          // 5 minutos
    sessionTimeout: 1800000,       // 30 minutos
    heartbeatInterval: 60000       // 1 minuto
  };

  /**
   * Límites de la aplicación
   */
  readonly appLimits: AppLimits = {
    maxFileSize: 10 * 1024 * 1024,    // 10 MB
    maxFilesPerUpload: 5,             // 5 archivos
    maxConcurrentUploads: 3,          // 3 uploads simultáneos
    maxRetryAttempts: 3,              // 3 reintentos
    paginationPageSize: 20            // 20 elementos por página
  };

  /**
   * Rutas principales de la aplicación
   */
  readonly appRoutes: AppRoutes = {
    dashboard: '/dashboard',
    profile: '/dashboard/perfil',
    contests: '/dashboard/concursos',
    applications: '/dashboard/postulaciones',
    documents: '/dashboard/documentos',
    cv: '/dashboard/cv',
    admin: '/admin'
  };

  /**
   * Configuración de acciones rápidas por defecto
   */
  readonly defaultQuickActions: QuickAction[] = [
    {
      id: 'complete-profile',
      type: 'PERFIL',
      title: 'Completar Perfil',
      description: 'Completa tu información personal',
      icon: 'fa-user-edit',
      route: this.appRoutes.profile,
      priority: 'ALTA',
      requiresAuth: true,
      roles: ['ROLE_USER']
    },
    {
      id: 'view-contests',
      type: 'CONCURSO',
      title: 'Ver Concursos',
      description: 'Explorar concursos disponibles',
      icon: 'fa-search',
      route: this.appRoutes.contests,
      priority: 'MEDIA',
      requiresAuth: true,
      roles: ['ROLE_USER']
    },
    {
      id: 'upload-documents',
      type: 'DOCUMENTO',
      title: 'Subir Documentos',
      description: 'Cargar documentación requerida',
      icon: 'fa-upload',
      route: this.appRoutes.documents,
      priority: 'ALTA',
      requiresAuth: true,
      roles: ['ROLE_USER']
    },
    {
      id: 'update-cv',
      type: 'CV',
      title: 'Actualizar CV',
      description: 'Mantener CV actualizado',
      icon: 'fa-file-alt',
      route: this.appRoutes.cv,
      priority: 'MEDIA',
      requiresAuth: true,
      roles: ['ROLE_USER']
    }
  ];

  /**
   * Configuración de widgets del dashboard
   */
  readonly widgetConfigs: WidgetConfig[] = [
    {
      id: 'estado-perfil',
      name: 'Estado del Perfil',
      enabled: true,
      order: 1,
      refreshInterval: this.timeIntervals.cacheTimeout,
      cacheEnabled: true
    },
    {
      id: 'proximos-vencimientos',
      name: 'Próximos Vencimientos',
      enabled: true,
      order: 2,
      refreshInterval: this.timeIntervals.minReloadInterval * 6, // 1 minuto
      cacheEnabled: true
    },
    {
      id: 'acciones-rapidas',
      name: 'Acciones Rápidas',
      enabled: true,
      order: 3,
      refreshInterval: this.timeIntervals.cacheTimeout,
      cacheEnabled: false
    },
    {
      id: 'recent-section',
      name: 'Actividad Reciente',
      enabled: true,
      order: 4,
      refreshInterval: this.timeIntervals.minReloadInterval * 3, // 30 segundos
      cacheEnabled: true
    }
  ];

  /**
   * Configuración de API endpoints
   */
  readonly apiEndpoints = {
    base: environment.apiUrl,
    auth: `${environment.apiUrl}/auth`,
    users: `${environment.apiUrl}/users`,
    contests: `${environment.apiUrl}/contests`,
    inscriptions: `${environment.apiUrl}/inscriptions`,
    documents: `${environment.apiUrl}/documents`,
    dashboard: `${environment.apiUrl}/dashboard`,
    cv: `${environment.apiUrl}/cv`,
    admin: `${environment.apiUrl}/admin`
  };

  /**
   * Configuración de validaciones
   */
  readonly validationRules = {
    password: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false
    },
    file: {
      allowedTypes: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
      maxSizeBytes: this.appLimits.maxFileSize,
      maxFiles: this.appLimits.maxFilesPerUpload
    },
    profile: {
      maxNameLength: 100,
      maxDescriptionLength: 500,
      requiredFields: ['firstName', 'lastName', 'email', 'dni']
    }
  };

  constructor() {
    console.log(`[${this.LOG_TAG}] AppConfigService initialized with environment: ${environment.production ? 'production' : 'development'}`);
  }

  /**
   * Obtiene la configuración de un color específico
   */
  getColor(colorName: keyof ThemeColors): string {
    return this.themeColors[colorName];
  }

  /**
   * Obtiene la configuración de un intervalo específico
   */
  getTimeInterval(intervalName: keyof TimeIntervals): number {
    return this.timeIntervals[intervalName];
  }

  /**
   * Obtiene la configuración de un límite específico
   */
  getAppLimit(limitName: keyof AppLimits): number {
    return this.appLimits[limitName];
  }

  /**
   * Obtiene una ruta específica de la aplicación
   */
  getRoute(routeName: keyof AppRoutes): string {
    return this.appRoutes[routeName];
  }

  /**
   * Obtiene las acciones rápidas filtradas por rol
   */
  getQuickActionsForRole(userRoles: string[]): QuickAction[] {
    return this.defaultQuickActions.filter(action => {
      if (!action.roles || action.roles.length === 0) {
        return true;
      }
      return action.roles.some(role => userRoles.includes(role));
    });
  }

  /**
   * Obtiene la configuración de un widget específico
   */
  getWidgetConfig(widgetId: string): WidgetConfig | undefined {
    return this.widgetConfigs.find(config => config.id === widgetId);
  }

  /**
   * Obtiene todos los widgets habilitados ordenados
   */
  getEnabledWidgets(): WidgetConfig[] {
    return this.widgetConfigs
      .filter(config => config.enabled)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Verifica si una funcionalidad está habilitada
   */
  isFeatureEnabled(featureName: string): boolean {
    const featureFlags: Record<string, boolean> = {
      'dashboard-widgets': true,
      'cv-management': true,
      'document-upload': true,
      'real-time-notifications': !environment.production, // Solo en desarrollo
      'advanced-search': true,
      'bulk-operations': false, // Deshabilitado por ahora
      'export-data': true
    };

    return featureFlags[featureName] ?? false;
  }

  /**
   * Obtiene la configuración completa como objeto
   */
  getFullConfig() {
    return {
      themeColors: this.themeColors,
      timeIntervals: this.timeIntervals,
      appLimits: this.appLimits,
      appRoutes: this.appRoutes,
      apiEndpoints: this.apiEndpoints,
      validationRules: this.validationRules,
      environment: {
        production: environment.production,
        apiUrl: environment.apiUrl,
        version: environment.version
      }
    };
  }
}
