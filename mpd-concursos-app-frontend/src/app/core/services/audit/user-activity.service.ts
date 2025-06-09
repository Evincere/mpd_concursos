import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, of } from 'rxjs';
import { map, catchError, tap, switchMap, filter } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { AuthService } from '@core/services/auth.service';
import { 
  UserActivity, 
  UserAction, 
  ActivityDetails, 
  ActivityMetadata, 
  ActivityFilters,
  ActivityStatistics,
  UserActivitySummary,
  UserSession,
  ActivityRetentionConfig,
  ActivityAlertConfig,
  ActivityReport,
  ActivityCategory,
  ActivitySeverity
} from '@shared/interfaces/audit/user-activity.interface';

/**
 * Servicio para gestión de actividades de usuario y auditoría
 */
@Injectable({
  providedIn: 'root'
})
export class UserActivityService {

  private readonly apiUrl = `${environment.apiUrl}/audit`;
  
  // Estados internos
  private activitiesSubject = new BehaviorSubject<UserActivity[]>([]);
  private statisticsSubject = new BehaviorSubject<ActivityStatistics | null>(null);
  private currentSessionSubject = new BehaviorSubject<UserSession | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  // Observables públicos
  public activities$ = this.activitiesSubject.asObservable();
  public statistics$ = this.statisticsSubject.asObservable();
  public currentSession$ = this.currentSessionSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  // Configuración
  private trackingEnabled = true;
  private batchSize = 50;
  private flushInterval = 30000; // 30 segundos
  private activityQueue: UserActivity[] = [];
  private currentSession: UserSession | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.initializeTracking();
    this.startPeriodicFlush();
  }

  /**
   * Inicializa el sistema de tracking
   */
  private initializeTracking(): void {
    // Escuchar cambios de usuario autenticado
    this.authService.currentUser$.pipe(
      filter(user => !!user)
    ).subscribe(user => {
      if (user) {
        this.startUserSession(user.id);
      } else {
        this.endCurrentSession();
      }
    });

    // Tracking automático de navegación
    this.setupNavigationTracking();
    
    // Tracking de errores
    this.setupErrorTracking();
    
    // Tracking de rendimiento
    this.setupPerformanceTracking();
  }

  /**
   * Configura el tracking de navegación
   */
  private setupNavigationTracking(): void {
    // Track page views
    if (typeof window !== 'undefined') {
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      history.pushState = (...args) => {
        originalPushState.apply(history, args);
        this.trackPageView(window.location.pathname);
      };

      history.replaceState = (...args) => {
        originalReplaceState.apply(history, args);
        this.trackPageView(window.location.pathname);
      };

      window.addEventListener('popstate', () => {
        this.trackPageView(window.location.pathname);
      });
    }
  }

  /**
   * Configura el tracking de errores
   */
  private setupErrorTracking(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.trackActivity('ERROR_OCCURRED', 'system', undefined, {
          description: `JavaScript Error: ${event.message}`,
          category: 'SYSTEM',
          severity: 'HIGH',
          customData: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack
          }
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.trackActivity('ERROR_OCCURRED', 'system', undefined, {
          description: `Unhandled Promise Rejection: ${event.reason}`,
          category: 'SYSTEM',
          severity: 'HIGH',
          customData: {
            reason: event.reason
          }
        });
      });
    }
  }

  /**
   * Configura el tracking de rendimiento
   */
  private setupPerformanceTracking(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (perfData) {
            this.trackActivity('PAGE_VIEW', window.location.pathname, undefined, {
              description: `Page loaded: ${window.location.pathname}`,
              category: 'NAVIGATION',
              severity: 'LOW',
              customData: {
                loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
                firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime
              }
            });
          }
        }, 1000);
      });
    }
  }

  /**
   * Inicia una nueva sesión de usuario
   */
  private startUserSession(userId: string): void {
    const sessionId = this.generateSessionId();
    const metadata = this.collectMetadata();
    
    this.currentSession = {
      id: sessionId,
      userId,
      startTime: new Date(),
      ipAddress: metadata.ipAddress || 'unknown',
      userAgent: navigator.userAgent,
      location: metadata.location,
      isActive: true,
      activities: [],
      lastActivity: new Date(),
      deviceFingerprint: this.generateDeviceFingerprint()
    };

    this.currentSessionSubject.next(this.currentSession);

    // Track login activity
    this.trackActivity('LOGIN', 'authentication', undefined, {
      description: 'User logged in',
      category: 'AUTHENTICATION',
      severity: 'MEDIUM'
    });
  }

  /**
   * Finaliza la sesión actual
   */
  private endCurrentSession(): void {
    if (this.currentSession) {
      this.currentSession.endTime = new Date();
      this.currentSession.isActive = false;
      this.currentSession.duration = 
        new Date(this.currentSession.endTime).getTime() - 
        new Date(this.currentSession.startTime).getTime();

      // Track logout activity
      this.trackActivity('LOGOUT', 'authentication', undefined, {
        description: 'User logged out',
        category: 'AUTHENTICATION',
        severity: 'MEDIUM'
      });

      // Flush remaining activities
      this.flushActivities();
      
      this.currentSession = null;
      this.currentSessionSubject.next(null);
    }
  }

  /**
   * Registra una actividad de usuario
   */
  public trackActivity(
    action: UserAction,
    resource: string,
    resourceId?: string,
    details?: Partial<ActivityDetails>,
    success: boolean = true,
    errorMessage?: string
  ): void {
    if (!this.trackingEnabled || !this.currentSession) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return;
    }

    const metadata = this.collectMetadata();
    const activity: UserActivity = {
      id: this.generateActivityId(),
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      sessionId: this.currentSession.id,
      action,
      resource,
      resourceId,
      details: {
        description: details?.description || `${action} on ${resource}`,
        category: details?.category || this.inferCategory(action),
        severity: details?.severity || this.inferSeverity(action),
        previousValue: details?.previousValue,
        newValue: details?.newValue,
        affectedFields: details?.affectedFields,
        relatedEntities: details?.relatedEntities,
        customData: details?.customData
      },
      metadata,
      timestamp: new Date(),
      ipAddress: metadata.ipAddress || 'unknown',
      userAgent: navigator.userAgent,
      location: metadata.location,
      success,
      errorMessage,
      duration: details?.customData?.duration
    };

    // Agregar a la cola
    this.activityQueue.push(activity);
    
    // Agregar a la sesión actual
    this.currentSession.activities.push(activity);
    this.currentSession.lastActivity = new Date();

    // Flush si la cola está llena
    if (this.activityQueue.length >= this.batchSize) {
      this.flushActivities();
    }

    // Logging implementado con LoggingService;
  }

  /**
   * Registra una búsqueda
   */
  public trackSearch(query: string, resource: string, resultsCount?: number): void {
    this.trackActivity('SEARCH', resource, undefined, {
      description: `Searched for: ${query}`,
      category: 'USER_INTERACTION',
      severity: 'LOW',
      customData: {
        query,
        resultsCount,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Registra una operación CRUD
   */
  public trackCrudOperation(
    operation: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE',
    resource: string,
    resourceId: string,
    previousValue?: any,
    newValue?: any
  ): void {
    this.trackActivity(operation, resource, resourceId, {
      description: `${operation} ${resource} ${resourceId}`,
      category: 'DATA_MODIFICATION',
      severity: operation === 'DELETE' ? 'HIGH' : 'MEDIUM',
      previousValue,
      newValue
    });
  }

  /**
   * Registra un error
   */
  public trackError(
    action: UserAction,
    resource: string,
    errorMessage: string,
    errorDetails?: any
  ): void {
    this.trackActivity(action, resource, undefined, {
      description: `Error during ${action}: ${errorMessage}`,
      category: 'SYSTEM',
      severity: 'HIGH',
      customData: errorDetails
    }, false, errorMessage);
  }

  /**
   * Envía las actividades en cola al servidor
   */
  private flushActivities(): void {
    if (this.activityQueue.length === 0) {
      return;
    }

    const activitiesToSend = [...this.activityQueue];
    this.activityQueue = [];

    this.http.post(`${this.apiUrl}/activities/batch`, { activities: activitiesToSend }).pipe(
      catchError(error => {
        console.error('Error sending activities:', error);
        // Reintroducir actividades en la cola en caso de error
        this.activityQueue.unshift(...activitiesToSend);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Inicia el flush periódico
   */
  private startPeriodicFlush(): void {
    interval(this.flushInterval).subscribe(() => {
      this.flushActivities();
    });
  }

  /**
   * Recopila metadatos del entorno
   */
  private collectMetadata(): ActivityMetadata {
    const metadata: ActivityMetadata = {
      browser: this.getBrowserInfo(),
      device: this.getDeviceInfo(),
      screen: this.getScreenInfo(),
      referrer: document.referrer,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      connectionType: this.getConnectionType()
    };

    return metadata;
  }

  /**
   * Obtiene información del navegador
   */
  private getBrowserInfo(): any {
    const ua = navigator.userAgent;
    return {
      name: this.getBrowserName(ua),
      version: this.getBrowserVersion(ua),
      engine: this.getBrowserEngine(ua),
      platform: navigator.platform,
      mobile: /Mobile|Android|iPhone|iPad/.test(ua)
    };
  }

  /**
   * Obtiene información del dispositivo
   */
  private getDeviceInfo(): any {
    const ua = navigator.userAgent;
    return {
      type: this.getDeviceType(ua),
      os: this.getOS(ua),
      osVersion: this.getOSVersion(ua),
      vendor: navigator.vendor,
      model: this.getDeviceModel(ua)
    };
  }

  /**
   * Obtiene información de la pantalla
   */
  private getScreenInfo(): any {
    return {
      width: screen.width,
      height: screen.height,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1
    };
  }

  /**
   * Obtiene el tipo de conexión
   */
  private getConnectionType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.effectiveType || 'unknown';
  }

  /**
   * Genera un ID único para la actividad
   */
  private generateActivityId(): string {
    return `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Genera un ID único para la sesión
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Genera una huella digital del dispositivo
   */
  private generateDeviceFingerprint(): string {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.platform,
      navigator.cookieEnabled
    ];
    
    return btoa(components.join('|'));
  }

  /**
   * Infiere la categoría basada en la acción
   */
  private inferCategory(action: UserAction): ActivityCategory {
    const categoryMap: Record<string, ActivityCategory> = {
      'LOGIN': 'AUTHENTICATION',
      'LOGOUT': 'AUTHENTICATION',
      'PAGE_VIEW': 'NAVIGATION',
      'SEARCH': 'USER_INTERACTION',
      'CREATE': 'DATA_MODIFICATION',
      'UPDATE': 'DATA_MODIFICATION',
      'DELETE': 'DATA_MODIFICATION',
      'USER_CREATE': 'ADMINISTRATION',
      'ROLE_ASSIGN': 'ADMINISTRATION',
      'ERROR_OCCURRED': 'SYSTEM'
    };

    return categoryMap[action] || 'USER_INTERACTION';
  }

  /**
   * Infiere la severidad basada en la acción
   */
  private inferSeverity(action: UserAction): ActivitySeverity {
    const severityMap: Record<string, ActivitySeverity> = {
      'LOGIN_FAILED': 'HIGH',
      'ACCOUNT_LOCKED': 'CRITICAL',
      'DELETE': 'HIGH',
      'BULK_DELETE': 'CRITICAL',
      'SYSTEM_CONFIG': 'HIGH',
      'ERROR_OCCURRED': 'HIGH',
      'LOGIN': 'MEDIUM',
      'LOGOUT': 'MEDIUM',
      'CREATE': 'MEDIUM',
      'UPDATE': 'MEDIUM'
    };

    return severityMap[action] || 'LOW';
  }

  // Métodos auxiliares para detección de navegador/dispositivo
  private getBrowserName(ua: string): string {
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getBrowserVersion(ua: string): string {
    const match = ua.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/);
    return match ? match[2] : 'Unknown';
  }

  private getBrowserEngine(ua: string): string {
    if (ua.includes('WebKit')) return 'WebKit';
    if (ua.includes('Gecko')) return 'Gecko';
    if (ua.includes('Trident')) return 'Trident';
    return 'Unknown';
  }

  private getDeviceType(ua: string): 'desktop' | 'tablet' | 'mobile' | 'unknown' {
    if (/Mobile|Android|iPhone/.test(ua)) return 'mobile';
    if (/iPad|Tablet/.test(ua)) return 'tablet';
    return 'desktop';
  }

  private getOS(ua: string): string {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private getOSVersion(ua: string): string {
    const match = ua.match(/(Windows NT|Mac OS X|Android|iOS) ([\d._]+)/);
    return match ? match[2] : 'Unknown';
  }

  private getDeviceModel(ua: string): string {
    const match = ua.match(/\(([^)]+)\)/);
    return match ? match[1] : 'Unknown';
  }

  // ==================== MÉTODOS PÚBLICOS DE CONSULTA ====================

  /**
   * Obtiene actividades con filtros
   */
  public getActivities(filters?: ActivityFilters): Observable<UserActivity[]> {
    this.loadingSubject.next(true);

    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params = params.append(key, v.toString()));
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<UserActivity[]>(`${this.apiUrl}/activities`, { params }).pipe(
      tap(activities => {
        this.activitiesSubject.next(activities);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        console.error('Error loading activities:', error);
        this.loadingSubject.next(false);
        return of([]);
      })
    );
  }

  /**
   * Obtiene estadísticas de actividad
   */
  public getStatistics(filters?: ActivityFilters): Observable<ActivityStatistics> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ActivityStatistics>(`${this.apiUrl}/statistics`, { params }).pipe(
      tap(statistics => {
        this.statisticsSubject.next(statistics);
      }),
      catchError(error => {
        console.error('Error loading statistics:', error);
        return of({
          totalActivities: 0,
          activitiesByAction: {} as any,
          activitiesByCategory: {} as any,
          activitiesBySeverity: {} as any,
          activitiesByHour: {},
          activitiesByDay: {},
          topUsers: [],
          topResources: [],
          errorRate: 0,
          averageSessionDuration: 0,
          uniqueUsers: 0,
          uniqueSessions: 0
        });
      })
    );
  }

  /**
   * Obtiene resumen de actividad por usuario
   */
  public getUserActivitySummary(userId: string): Observable<UserActivitySummary> {
    return this.http.get<UserActivitySummary>(`${this.apiUrl}/users/${userId}/summary`).pipe(
      catchError(error => {
        console.error('Error loading user activity summary:', error);
        throw error;
      })
    );
  }

  /**
   * Obtiene sesiones de un usuario
   */
  public getUserSessions(userId: string, limit?: number): Observable<UserSession[]> {
    let params = new HttpParams();
    if (limit) {
      params = params.set('limit', limit.toString());
    }

    return this.http.get<UserSession[]>(`${this.apiUrl}/users/${userId}/sessions`, { params }).pipe(
      catchError(error => {
        console.error('Error loading user sessions:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtiene actividades de una sesión específica
   */
  public getSessionActivities(sessionId: string): Observable<UserActivity[]> {
    return this.http.get<UserActivity[]>(`${this.apiUrl}/sessions/${sessionId}/activities`).pipe(
      catchError(error => {
        console.error('Error loading session activities:', error);
        return of([]);
      })
    );
  }

  /**
   * Busca actividades por texto
   */
  public searchActivities(query: string, filters?: ActivityFilters): Observable<UserActivity[]> {
    let params = new HttpParams().set('search', query);

    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<UserActivity[]>(`${this.apiUrl}/activities/search`, { params }).pipe(
      catchError(error => {
        console.error('Error searching activities:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtiene actividades en tiempo real
   */
  public getRealtimeActivities(): Observable<UserActivity[]> {
    return interval(5000).pipe(
      switchMap(() => this.getActivities({
        dateFrom: new Date(Date.now() - 5 * 60 * 1000), // Últimos 5 minutos
        sortBy: 'timestamp',
        sortOrder: 'DESC',
        limit: 50
      }))
    );
  }

  // ==================== GESTIÓN DE CONFIGURACIÓN ====================

  /**
   * Obtiene la configuración de retención
   */
  public getRetentionConfig(): Observable<ActivityRetentionConfig> {
    return this.http.get<ActivityRetentionConfig>(`${this.apiUrl}/config/retention`).pipe(
      catchError(error => {
        console.error('Error loading retention config:', error);
        return of({
          enabled: true,
          retentionPeriodDays: 90,
          archiveBeforeDelete: true,
          compressionEnabled: true,
          encryptionEnabled: false,
          autoCleanupEnabled: true,
          cleanupSchedule: '0 2 * * *' // 2 AM daily
        });
      })
    );
  }

  /**
   * Actualiza la configuración de retención
   */
  public updateRetentionConfig(config: ActivityRetentionConfig): Observable<ActivityRetentionConfig> {
    return this.http.put<ActivityRetentionConfig>(`${this.apiUrl}/config/retention`, config).pipe(
      catchError(error => {
        console.error('Error updating retention config:', error);
        throw error;
      })
    );
  }

  /**
   * Obtiene la configuración de alertas
   */
  public getAlertConfig(): Observable<ActivityAlertConfig> {
    return this.http.get<ActivityAlertConfig>(`${this.apiUrl}/config/alerts`).pipe(
      catchError(error => {
        console.error('Error loading alert config:', error);
        return of({
          enabled: false,
          rules: [],
          notificationChannels: [],
          escalationRules: []
        });
      })
    );
  }

  /**
   * Actualiza la configuración de alertas
   */
  public updateAlertConfig(config: ActivityAlertConfig): Observable<ActivityAlertConfig> {
    return this.http.put<ActivityAlertConfig>(`${this.apiUrl}/config/alerts`, config).pipe(
      catchError(error => {
        console.error('Error updating alert config:', error);
        throw error;
      })
    );
  }

  // ==================== REPORTES ====================

  /**
   * Genera un reporte de actividad
   */
  public generateReport(
    type: string,
    filters: ActivityFilters,
    format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON' = 'PDF'
  ): Observable<ActivityReport> {
    const payload = {
      type,
      filters,
      format
    };

    return this.http.post<ActivityReport>(`${this.apiUrl}/reports/generate`, payload).pipe(
      catchError(error => {
        console.error('Error generating report:', error);
        throw error;
      })
    );
  }

  /**
   * Obtiene la lista de reportes generados
   */
  public getReports(): Observable<ActivityReport[]> {
    return this.http.get<ActivityReport[]>(`${this.apiUrl}/reports`).pipe(
      catchError(error => {
        console.error('Error loading reports:', error);
        return of([]);
      })
    );
  }

  /**
   * Descarga un reporte
   */
  public downloadReport(reportId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/reports/${reportId}/download`, {
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error downloading report:', error);
        throw error;
      })
    );
  }

  /**
   * Elimina un reporte
   */
  public deleteReport(reportId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/reports/${reportId}`).pipe(
      catchError(error => {
        console.error('Error deleting report:', error);
        throw error;
      })
    );
  }

  // ==================== UTILIDADES ====================

  /**
   * Habilita/deshabilita el tracking
   */
  public setTrackingEnabled(enabled: boolean): void {
    this.trackingEnabled = enabled;
    // Logging implementado con LoggingService;
  }

  /**
   * Limpia la cola de actividades
   */
  public clearActivityQueue(): void {
    this.activityQueue = [];
  }

  /**
   * Obtiene el tamaño actual de la cola
   */
  public getQueueSize(): number {
    return this.activityQueue.length;
  }

  /**
   * Fuerza el envío de actividades pendientes
   */
  public forceFlush(): void {
    this.flushActivities();
  }

  /**
   * Obtiene la sesión actual
   */
  public getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  /**
   * Exporta actividades a formato JSON
   */
  public exportActivities(activities: UserActivity[]): string {
    return JSON.stringify(activities, null, 2);
  }

  /**
   * Importa actividades desde formato JSON
   */
  public importActivities(jsonData: string): UserActivity[] {
    try {
      return JSON.parse(jsonData);
    } catch (error) {
      console.error('Error parsing activities JSON:', error);
      return [];
    }
  }

  /**
   * Calcula métricas de rendimiento
   */
  public calculatePerformanceMetrics(activities: UserActivity[]): any {
    const pageViews = activities.filter(a => a.action === 'PAGE_VIEW');
    const errors = activities.filter(a => !a.success);

    return {
      totalActivities: activities.length,
      pageViews: pageViews.length,
      errors: errors.length,
      errorRate: activities.length > 0 ? (errors.length / activities.length) * 100 : 0,
      averageLoadTime: this.calculateAverageLoadTime(pageViews),
      mostVisitedPages: this.getMostVisitedPages(pageViews),
      peakHours: this.getPeakHours(activities)
    };
  }

  /**
   * Calcula el tiempo promedio de carga
   */
  private calculateAverageLoadTime(pageViews: UserActivity[]): number {
    const loadTimes = pageViews
      .map(pv => pv.details.customData?.loadTime)
      .filter(lt => typeof lt === 'number');

    return loadTimes.length > 0
      ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length
      : 0;
  }

  /**
   * Obtiene las páginas más visitadas
   */
  private getMostVisitedPages(pageViews: UserActivity[]): any[] {
    const pageCount = new Map<string, number>();

    pageViews.forEach(pv => {
      const page = pv.resource;
      pageCount.set(page, (pageCount.get(page) || 0) + 1);
    });

    return Array.from(pageCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([page, count]) => ({ page, count }));
  }

  /**
   * Obtiene las horas pico de actividad
   */
  private getPeakHours(activities: UserActivity[]): any[] {
    const hourCount = new Map<number, number>();

    activities.forEach(activity => {
      const hour = new Date(activity.timestamp).getHours();
      hourCount.set(hour, (hourCount.get(hour) || 0) + 1);
    });

    return Array.from(hourCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hour, count]) => ({ hour, count }));
  }
}
