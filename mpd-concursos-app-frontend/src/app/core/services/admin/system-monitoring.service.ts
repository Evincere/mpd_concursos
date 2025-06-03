import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { environment } from '../../../../environments/environment';

/**
 * Interfaz para las métricas de rendimiento de la aplicación
 */
export interface AppPerformanceMetrics {
  // Métricas generales
  uptime: number; // En segundos
  serverLoad: number; // Porcentaje de carga del servidor
  memoryUsage: {
    total: number; // En MB
    used: number; // En MB
    free: number; // En MB
    percentage: number; // Porcentaje de uso
  };
  cpuUsage: {
    percentage: number; // Porcentaje de uso
    cores: number; // Número de núcleos
  };

  // Métricas de API
  apiMetrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number; // En ms
    requestsPerMinute: number;
    requestsPerSecond: number;
    errorRate: number; // Porcentaje
    endpoints: EndpointMetric[];
  };

  // Métricas de errores
  errorMetrics: {
    totalErrors: number;
    errorRate: number; // Porcentaje
    errorsByType: {
      type: string;
      count: number;
      percentage: number;
    }[];
    recentErrors: ErrorDetail[];
  };

  // Métricas de sesiones
  sessionMetrics: {
    activeSessions: number;
    averageSessionDuration: number; // En segundos
    concurrentUsers: number;
    usersByRole: {
      role: string;
      count: number;
    }[];
  };
}

/**
 * Interfaz para las métricas de un endpoint
 */
export interface EndpointMetric {
  path: string;
  method: string;
  totalRequests: number;
  averageResponseTime: number; // En ms
  errorRate: number; // Porcentaje
  requestsPerMinute: number;
  status: 'healthy' | 'warning' | 'critical';
}

/**
 * Interfaz para los detalles de un error
 */
export interface ErrorDetail {
  timestamp: string;
  type: string;
  message: string;
  endpoint: string;
  stackTrace?: string;
  userId?: string;
  username?: string;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Interfaz para las métricas de base de datos
 */
export interface DatabaseMetrics {
  // Métricas generales
  connectionPoolStatus: {
    active: number;
    idle: number;
    total: number;
    maxActive: number;
    usage: number; // Porcentaje
  };

  // Métricas de consultas
  queryMetrics: {
    totalQueries: number;
    averageExecutionTime: number; // En ms
    queriesPerSecond: number;
    slowQueries: number; // Consultas que tardan más de un umbral
  };

  // Consultas lentas
  slowQueriesDetails: {
    query: string;
    executionTime: number; // En ms
    timestamp: string;
    frequency: number; // Número de veces que se ha ejecutado
  }[];

  // Métricas por tabla
  tableMetrics: {
    tableName: string;
    rowCount: number;
    sizeInMB: number;
    readOperations: number;
    writeOperations: number;
    lastUpdated: string;
  }[];
}

/**
 * Interfaz para las alertas del sistema
 */
export interface SystemAlert {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  category: 'performance' | 'database' | 'security' | 'application';
  message: string;
  details: string;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  metrics?: {
    name: string;
    value: number;
    threshold: number;
    unit: string;
  }[];
}

/**
 * Interfaz para la configuración de umbrales de alerta
 */
export interface AlertThreshold {
  id: string;
  name: string;
  description: string;
  metricName: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  threshold: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  enabled: boolean;
  notificationChannels: ('email' | 'sms' | 'system')[];
  cooldownMinutes: number; // Tiempo mínimo entre alertas consecutivas
  lastTriggered?: string;
}

/**
 * Interfaz para los filtros de monitoreo
 */
export interface MonitoringFilter {
  startDate?: Date;
  endDate?: Date;
  interval?: 'minute' | 'hour' | 'day' | 'week' | 'month';
  category?: string;
  severity?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SystemMonitoringService {
  private apiUrl = `${environment.apiUrl}/admin/monitoring`;
  private http = inject(HttpClient);

  constructor() {
    // Constructor vacío - HttpClient se inyecta usando inject()
  }


  /**
   * Obtiene las métricas de rendimiento de la aplicación
   * @param filter Filtros para los datos
   */
  getAppPerformanceMetrics(filter?: MonitoringFilter): Observable<AppPerformanceMetrics> {
    // Para desarrollo, usar datos mock
    // En producción, descomentar la línea siguiente:
    // return this.http.get<AppPerformanceMetrics>(`${this.apiUrl}/app-performance`, { params: this.buildParams(filter) });

    // Implementación mock para desarrollo
    console.log('Loading app performance metrics with filter:', filter);
    return of(this.getMockAppPerformanceMetrics());
  }

  /**
   * Obtiene las métricas de base de datos
   * @param filter Filtros para los datos
   */
  getDatabaseMetrics(filter?: MonitoringFilter): Observable<DatabaseMetrics> {
    // Para desarrollo, usar datos mock
    // En producción, descomentar la línea siguiente:
    // return this.http.get<DatabaseMetrics>(`${this.apiUrl}/database`, { params: this.buildParams(filter) });

    // Implementación mock para desarrollo
    console.log('Loading database metrics with filter:', filter);
    return of(this.getMockDatabaseMetrics());
  }

  /**
   * Obtiene las alertas del sistema
   * @param filter Filtros para los datos
   */
  getSystemAlerts(filter?: MonitoringFilter): Observable<SystemAlert[]> {
    // Para desarrollo, usar datos mock
    // En producción, descomentar la línea siguiente:
    // return this.http.get<SystemAlert[]>(`${this.apiUrl}/alerts`, { params: this.buildParams(filter) });

    // Implementación mock para desarrollo
    console.log('Loading system alerts with filter:', filter);
    return of(this.getMockSystemAlerts());
  }

  /**
   * Obtiene la configuración de umbrales de alerta
   */
  getAlertThresholds(): Observable<AlertThreshold[]> {
    // Para desarrollo, usar datos mock
    // En producción, descomentar la línea siguiente:
    // return this.http.get<AlertThreshold[]>(`${this.apiUrl}/alert-thresholds`);

    // Implementación mock para desarrollo
    console.log('Loading alert thresholds');
    return of(this.getMockAlertThresholds());
  }

  /**
   * Actualiza la configuración de un umbral de alerta
   * @param threshold Umbral de alerta a actualizar
   */
  updateAlertThreshold(threshold: AlertThreshold): Observable<AlertThreshold> {
    // Para desarrollo, usar datos mock
    // En producción, descomentar la línea siguiente:
    // return this.http.put<AlertThreshold>(`${this.apiUrl}/alert-thresholds/${threshold.id}`, threshold);

    // Implementación mock para desarrollo
    console.log('Actualizando umbral de alerta:', threshold);
    return of(threshold);
  }

  /**
   * Acusa recibo de una alerta
   * @param alertId ID de la alerta
   */
  acknowledgeAlert(alertId: string): Observable<SystemAlert> {
    // Para desarrollo, usar datos mock
    // En producción, descomentar la línea siguiente:
    // return this.http.post<SystemAlert>(`${this.apiUrl}/alerts/${alertId}/acknowledge`, {});

    // Implementación mock para desarrollo
    console.log('Acknowledging alert:', alertId);
    const alerts = this.getMockSystemAlerts();
    const alert = alerts.find(a => a.id === alertId);

    if (alert) {
      alert.status = 'acknowledged';
      alert.acknowledgedBy = 'admin';
      alert.acknowledgedAt = new Date().toISOString();
    }

    return of(alert as SystemAlert);
  }

  /**
   * Marca una alerta como resuelta
   * @param alertId ID de la alerta
   */
  resolveAlert(alertId: string): Observable<SystemAlert> {
    // Para desarrollo, usar datos mock
    // En producción, descomentar la línea siguiente:
    // return this.http.post<SystemAlert>(`${this.apiUrl}/alerts/${alertId}/resolve`, {});

    // Implementación mock para desarrollo
    console.log('Resolving alert:', alertId);
    const alerts = this.getMockSystemAlerts();
    const alert = alerts.find(a => a.id === alertId);

    if (alert) {
      alert.status = 'resolved';
      alert.resolvedBy = 'admin';
      alert.resolvedAt = new Date().toISOString();
    }

    return of(alert as SystemAlert);
  }

  /**
   * Construye los parámetros para las peticiones HTTP
   * @param filter Filtros para los datos
   */
  private buildParams(filter?: MonitoringFilter): HttpParams {
    let params = new HttpParams();

    if (filter) {
      if (filter.startDate) {
        params = params.set('startDate', filter.startDate.toISOString());
      }

      if (filter.endDate) {
        params = params.set('endDate', filter.endDate.toISOString());
      }

      if (filter.interval) {
        params = params.set('interval', filter.interval);
      }

      if (filter.category) {
        params = params.set('category', filter.category);
      }

      if (filter.severity) {
        params = params.set('severity', filter.severity);
      }
    }

    return params;
  }

  /**
   * Genera datos mock para las métricas de rendimiento de la aplicación
   */
  private getMockAppPerformanceMetrics(): AppPerformanceMetrics {
    return {
      uptime: 345600, // 4 días en segundos
      serverLoad: 45.2,
      memoryUsage: {
        total: 8192, // 8 GB
        used: 4096, // 4 GB
        free: 4096, // 4 GB
        percentage: 50
      },
      cpuUsage: {
        percentage: 35.7,
        cores: 8
      },
      apiMetrics: {
        totalRequests: 15243,
        successfulRequests: 14980,
        failedRequests: 263,
        averageResponseTime: 235, // ms
        requestsPerMinute: 42.3,
        requestsPerSecond: 0.7,
        errorRate: 1.7, // Porcentaje
        endpoints: [
          {
            path: '/api/concursos',
            method: 'GET',
            totalRequests: 3245,
            averageResponseTime: 180,
            errorRate: 0.5,
            requestsPerMinute: 9.0,
            status: 'healthy'
          },
          {
            path: '/api/inscripciones',
            method: 'POST',
            totalRequests: 1245,
            averageResponseTime: 350,
            errorRate: 2.1,
            requestsPerMinute: 3.5,
            status: 'warning'
          },
          {
            path: '/api/documentos/upload',
            method: 'POST',
            totalRequests: 2456,
            averageResponseTime: 520,
            errorRate: 4.2,
            requestsPerMinute: 6.8,
            status: 'critical'
          }
        ]
      },
      errorMetrics: {
        totalErrors: 263,
        errorRate: 1.7,
        errorsByType: [
          {
            type: 'NullPointerException',
            count: 87,
            percentage: 33.1
          },
          {
            type: 'DatabaseConnectionException',
            count: 65,
            percentage: 24.7
          },
          {
            type: 'AuthenticationException',
            count: 45,
            percentage: 17.1
          },
          {
            type: 'ValidationException',
            count: 38,
            percentage: 14.4
          },
          {
            type: 'OtherExceptions',
            count: 28,
            percentage: 10.7
          }
        ],
        recentErrors: [
          {
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutos atrás
            type: 'DatabaseConnectionException',
            message: 'Error al conectar con la base de datos',
            endpoint: '/api/inscripciones',
            userId: '123456',
            username: 'usuario1',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            ipAddress: '192.168.1.1'
          },
          {
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutos atrás
            type: 'NullPointerException',
            message: 'Error al procesar la solicitud',
            endpoint: '/api/documentos/upload',
            userId: '789012',
            username: 'usuario2',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15',
            ipAddress: '192.168.1.2'
          }
        ]
      },
      sessionMetrics: {
        activeSessions: 245,
        averageSessionDuration: 1800, // 30 minutos
        concurrentUsers: 42,
        usersByRole: [
          {
            role: 'ROLE_USER',
            count: 230
          },
          {
            role: 'ROLE_ADMIN',
            count: 15
          }
        ]
      }
    };
  }

  /**
   * Genera datos mock para las métricas de base de datos
   */
  private getMockDatabaseMetrics(): DatabaseMetrics {
    return {
      connectionPoolStatus: {
        active: 15,
        idle: 5,
        total: 20,
        maxActive: 50,
        usage: 30
      },
      queryMetrics: {
        totalQueries: 25678,
        averageExecutionTime: 45, // ms
        queriesPerSecond: 2.8,
        slowQueries: 124
      },
      slowQueriesDetails: [
        {
          query: 'SELECT * FROM inscriptions i JOIN users u ON i.user_id = u.id WHERE i.status = ?',
          executionTime: 1250, // ms
          timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 minutos atrás
          frequency: 45
        },
        {
          query: 'SELECT c.*, COUNT(i.id) as inscriptions FROM contests c LEFT JOIN inscriptions i ON c.id = i.contest_id GROUP BY c.id',
          executionTime: 980, // ms
          timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 minutos atrás
          frequency: 32
        },
        {
          query: 'SELECT d.*, u.username FROM documents d JOIN users u ON d.user_id = u.id WHERE d.status = ? ORDER BY d.created_at DESC',
          executionTime: 850, // ms
          timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 minutos atrás
          frequency: 28
        }
      ],
      tableMetrics: [
        {
          tableName: 'users',
          rowCount: 1245,
          sizeInMB: 2.5,
          readOperations: 12456,
          writeOperations: 345,
          lastUpdated: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 minutos atrás
        },
        {
          tableName: 'contests',
          rowCount: 48,
          sizeInMB: 0.8,
          readOperations: 8765,
          writeOperations: 124,
          lastUpdated: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15 minutos atrás
        },
        {
          tableName: 'inscriptions',
          rowCount: 3567,
          sizeInMB: 4.2,
          readOperations: 15678,
          writeOperations: 567,
          lastUpdated: new Date(Date.now() - 1000 * 60 * 2).toISOString() // 2 minutos atrás
        },
        {
          tableName: 'documents',
          rowCount: 8976,
          sizeInMB: 12.4,
          readOperations: 9876,
          writeOperations: 789,
          lastUpdated: new Date(Date.now() - 1000 * 60 * 1).toISOString() // 1 minuto atrás
        }
      ]
    };
  }

  /**
   * Genera datos mock para las alertas del sistema
   */
  private getMockSystemAlerts(): SystemAlert[] {
    return [
      {
        id: '1',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutos atrás
        type: 'critical',
        category: 'database',
        message: 'Alto tiempo de respuesta en consultas de base de datos',
        details: 'El tiempo promedio de respuesta de las consultas a la base de datos ha superado el umbral crítico de 500ms.',
        status: 'active',
        metrics: [
          {
            name: 'Tiempo promedio de respuesta',
            value: 850,
            threshold: 500,
            unit: 'ms'
          }
        ]
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutos atrás
        type: 'warning',
        category: 'performance',
        message: 'Uso elevado de memoria',
        details: 'El uso de memoria del servidor ha superado el 80% durante los últimos 10 minutos.',
        status: 'acknowledged',
        acknowledgedBy: 'admin',
        acknowledgedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(), // 40 minutos atrás
        metrics: [
          {
            name: 'Uso de memoria',
            value: 85,
            threshold: 80,
            unit: '%'
          }
        ]
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 horas atrás
        type: 'error',
        category: 'application',
        message: 'Tasa de errores elevada',
        details: 'La tasa de errores en las solicitudes API ha superado el 5% durante los últimos 15 minutos.',
        status: 'resolved',
        acknowledgedBy: 'admin',
        acknowledgedAt: new Date(Date.now() - 1000 * 60 * 115).toISOString(), // 1 hora y 55 minutos atrás
        resolvedBy: 'admin',
        resolvedAt: new Date(Date.now() - 1000 * 60 * 100).toISOString(), // 1 hora y 40 minutos atrás
        metrics: [
          {
            name: 'Tasa de errores',
            value: 7.5,
            threshold: 5,
            unit: '%'
          }
        ]
      }
    ];
  }

  /**
   * Genera datos mock para los umbrales de alerta
   */
  private getMockAlertThresholds(): AlertThreshold[] {
    return [
      {
        id: '1',
        name: 'Alto tiempo de respuesta de base de datos',
        description: 'Alerta cuando el tiempo promedio de respuesta de las consultas a la base de datos supera el umbral',
        metricName: 'database.averageExecutionTime',
        operator: '>',
        threshold: 500,
        severity: 'critical',
        enabled: true,
        notificationChannels: ['email', 'system'],
        cooldownMinutes: 15,
        lastTriggered: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15 minutos atrás
      },
      {
        id: '2',
        name: 'Uso elevado de memoria',
        description: 'Alerta cuando el uso de memoria del servidor supera el umbral',
        metricName: 'system.memoryUsage.percentage',
        operator: '>',
        threshold: 80,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['system'],
        cooldownMinutes: 10,
        lastTriggered: new Date(Date.now() - 1000 * 60 * 45).toISOString() // 45 minutos atrás
      },
      {
        id: '3',
        name: 'Tasa de errores elevada',
        description: 'Alerta cuando la tasa de errores en las solicitudes API supera el umbral',
        metricName: 'api.errorRate',
        operator: '>',
        threshold: 5,
        severity: 'error',
        enabled: true,
        notificationChannels: ['email', 'sms', 'system'],
        cooldownMinutes: 5,
        lastTriggered: new Date(Date.now() - 1000 * 60 * 120).toISOString() // 2 horas atrás
      },
      {
        id: '4',
        name: 'Bajo número de conexiones disponibles',
        description: 'Alerta cuando el número de conexiones disponibles en el pool es menor al umbral',
        metricName: 'database.connectionPool.idle',
        operator: '<',
        threshold: 3,
        severity: 'warning',
        enabled: false,
        notificationChannels: ['system'],
        cooldownMinutes: 5
      }
    ];
  }
}
