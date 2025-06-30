/**
 * Servicio unificado del Dashboard
 * ✅ REFACTORIZACIÓN: Consolida DashboardService, DashboardWidgetsService y UserDashboardService
 * ✅ PATRÓN REPOSITORY: Abstrae acceso a datos
 * ✅ SINGLE RESPONSIBILITY: Una sola responsabilidad por método
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest, of, throwError } from 'rxjs';
import { map, catchError, tap, shareReplay } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { LoggingService } from '../logging/logging.service';
import { AuthService } from '../auth/auth.service';
import { AppConfigService } from '../config/app-config.service';

// Interfaces
import {
  IDashboardRepository,
  IUserStatsRepository,
  IMetricsRepository,
  DashboardRepositoryConfig,
  ProfileStats,
  UserDeadline,
  UserStats,
  ContestMetrics,
  InscriptionMetrics,
  DocumentMetrics
} from '../../interfaces/dashboard/dashboard-repository.interface';

import { Card } from '@shared/interfaces/concurso/card.interface';
import { RecentConcurso } from '@shared/interfaces/concurso/recent-concurso.interface';
import { DashboardData, SimpleDashboardData } from '@shared/interfaces/dashboard/dashboard-widgets.interface';

// Services
import { ConcursosService } from '../concursos/concursos.service';
import { InscriptionService } from '../inscripcion/inscription.service';
import { ProfileService } from '../profile/profile.service';

/**
 * Servicio unificado que implementa todos los repositorios del dashboard
 */
@Injectable({
  providedIn: 'root'
})
export class UnifiedDashboardService implements IDashboardRepository, IUserStatsRepository, IMetricsRepository {
  private readonly LOG_TAG = 'UnifiedDashboardService';
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  // Cache subjects
  private dashboardCardsSubject = new BehaviorSubject<Card[]>([]);
  private recentConcursosSubject = new BehaviorSubject<RecentConcurso[]>([]);
  private dashboardDataSubject = new BehaviorSubject<DashboardData | null>(null);
  private userStatsSubject = new BehaviorSubject<UserStats | null>(null);

  // Configuration
  private config: DashboardRepositoryConfig = {
    enableCache: true,
    cacheTimeout: 5 * 60 * 1000, // 5 minutos
    enableMockData: !environment.production,
    apiEndpoints: {
      cards: `${this.apiUrl}/cards`,
      recentConcursos: `${this.apiUrl}/recent-contests`,
      dashboardData: `${this.apiUrl}/data`,
      userStats: `${this.apiUrl}/user/stats`,
      userDeadlines: `${this.apiUrl}/user/deadlines`
    }
  };

  constructor(
    private http: HttpClient,
    private loggingService: LoggingService,
    private authService: AuthService,
    private appConfigService: AppConfigService,
    private concursosService: ConcursosService,
    private inscriptionService: InscriptionService,
    private profileService: ProfileService
  ) {
    this.loggingService.info(`[${this.LOG_TAG}] Initializing UnifiedDashboardService`, this.config, this.LOG_TAG);
  }

  // ===== IDashboardRepository Implementation =====

  /**
   * Obtiene las cards principales del dashboard
   */
  getDashboardCards(): Observable<Card[]> {
    this.loggingService.info(`[${this.LOG_TAG}] Getting dashboard cards`, undefined, this.LOG_TAG);

    return this.concursosService.getConcursos().pipe(
      map((concursos: any) => {
        const concursosArray = Array.isArray(concursos) ? concursos : (concursos?.content || []);
        
        // Calcular métricas
        const concursosActivos = concursosArray.filter((c: any) => c['status'] === 'PUBLISHED').length;
        const proximosAVencer = this.calculateExpiringSoon(concursosArray);

        // ✅ LIMPIEZA: Usar colores de configuración centralizada
        const cards: Card[] = [
          {
            title: 'Concursos Activos',
            count: concursosActivos,
            icon: 'fa-gavel',
            color: this.appConfigService.getColor('success'),
            description: 'Concursos disponibles para inscripción'
          },
          {
            title: 'Mis Postulaciones',
            count: 0, // Se actualizará con datos de inscripciones
            icon: 'fa-file-alt',
            color: this.appConfigService.getColor('primary'),
            description: 'Postulaciones activas y pendientes'
          },
          {
            title: 'Próximos a Vencer',
            count: proximosAVencer,
            icon: 'fa-clock',
            color: this.appConfigService.getColor('warning'),
            description: 'Concursos que cierran en 7 días o menos'
          }
        ];

        this.dashboardCardsSubject.next(cards);
        return cards;
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error loading dashboard cards`, error, this.LOG_TAG);
        return this.getDefaultCards();
      }),
      shareReplay(1)
    );
  }

  /**
   * Obtiene los concursos recientes
   */
  getRecentConcursos(): Observable<RecentConcurso[]> {
    this.loggingService.info(`[${this.LOG_TAG}] Getting recent contests`, undefined, this.LOG_TAG);

    return this.concursosService.getConcursos().pipe(
      map((concursos: any) => {
        const concursosArray = Array.isArray(concursos) ? concursos : (concursos?.content || []);
        
        const recentConcursos = concursosArray
          .sort((a: any, b: any) => new Date(b['startDate']).getTime() - new Date(a['startDate']).getTime())
          .slice(0, 5)
          .map((concurso: any) => ({
            id: concurso['id'].toString(),
            titulo: concurso['title'],
            fecha: concurso['startDate'],
            estado: this.mapContestStatus(concurso['status'])
          }));

        this.recentConcursosSubject.next(recentConcursos);
        return recentConcursos;
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error loading recent contests`, error, this.LOG_TAG);
        return of([]);
      }),
      shareReplay(1)
    );
  }

  /**
   * Obtiene datos completos para widgets del dashboard
   */
  getDashboardData(): Observable<DashboardData> {
    this.loggingService.info(`[${this.LOG_TAG}] Getting complete dashboard data`, undefined, this.LOG_TAG);

    return combineLatest([
      this.getProfileStats(),
      this.getUserDeadlines(30),
      this.getContestMetrics(),
      this.getInscriptionMetrics()
    ]).pipe(
      map(([profileStats, deadlines, contestMetrics, inscriptionMetrics]) => {
        const dashboardData: DashboardData = {
          estadoPerfil: {
            completitud: profileStats.completionPercentage,
            seccionesPendientes: this.calculatePendingSections(profileStats),
            documentosVencidos: 0,
            ultimaActualizacion: new Date(profileStats.lastUpdated),
            puntajeCompletitud: profileStats.completionPercentage
          },
          proximosVencimientos: deadlines.map(deadline => ({
            id: deadline.id,
            tipo: deadline.type as any,
            titulo: deadline.title,
            descripcion: deadline.description,
            fechaLimite: new Date(deadline.deadline),
            diasRestantes: deadline.daysRemaining,
            prioridad: deadline.priority as any,
            concursoId: deadline.contestId,
            accionRequerida: deadline.actionRequired,
            ruta: deadline.route
          })),
          accionesRapidas: this.generateQuickActions(profileStats, inscriptionMetrics),
          notificaciones: [],
          metricas: {
            inscripcionesTotales: inscriptionMetrics.totalInscriptions,
            inscripcionesActivas: inscriptionMetrics.activeInscriptions,
            inscripcionesAprobadas: inscriptionMetrics.completedInscriptions,
            documentosSubidos: 0,
            concursosDisponibles: contestMetrics.activeContests,
            proximosVencimientos: deadlines.length,
            notificacionesPendientes: 0
          },
          configuracionWidgets: []
        };

        this.dashboardDataSubject.next(dashboardData);
        return dashboardData;
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error loading dashboard data`, error, this.LOG_TAG);
        return this.getDefaultDashboardData();
      }),
      shareReplay(1)
    );
  }

  /**
   * Obtiene datos simplificados para widgets básicos
   */
  getSimpleDashboardData(): Observable<SimpleDashboardData> {
    this.loggingService.info(`[${this.LOG_TAG}] Getting simple dashboard data`, undefined, this.LOG_TAG);

    return combineLatest([
      this.getProfileStats(),
      this.getUserDeadlines(30),
      this.getInscriptionMetrics()
    ]).pipe(
      map(([profileStats, deadlines, inscriptionMetrics]) => ({
        profileCompletion: profileStats.completionPercentage,
        activeApplications: inscriptionMetrics.activeInscriptions,
        pendingDocuments: 0, // ✅ LIMPIEZA: Pendiente implementación de servicio de documentos
        availableExams: 0, // ✅ LIMPIEZA: Pendiente implementación de servicio de exámenes
        upcomingDeadlines: deadlines.slice(0, 3).map(deadline => ({
          title: deadline.title,
          date: deadline.deadline,
          daysRemaining: deadline.daysRemaining
        }))
      })),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error loading simple dashboard data`, error, this.LOG_TAG);
        return this.getDefaultSimpleDashboardData();
      }),
      shareReplay(1)
    );
  }

  /**
   * Refresca todos los datos del dashboard
   */
  refreshDashboardData(): Observable<void> {
    this.loggingService.info(`[${this.LOG_TAG}] Refreshing all dashboard data`, undefined, this.LOG_TAG);

    return combineLatest([
      this.getDashboardCards(),
      this.getRecentConcursos(),
      this.getDashboardData()
    ]).pipe(
      map(() => void 0),
      tap(() => {
        this.loggingService.info(`[${this.LOG_TAG}] Dashboard data refreshed successfully`, undefined, this.LOG_TAG);
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error refreshing dashboard data`, error, this.LOG_TAG);
        return of(void 0);
      })
    );
  }

  // ===== IUserStatsRepository Implementation =====

  /**
   * Obtiene estadísticas del perfil del usuario
   */
  getProfileStats(): Observable<ProfileStats> {
    this.loggingService.info(`[${this.LOG_TAG}] Getting profile stats`, undefined, this.LOG_TAG);

    return this.http.get<ProfileStats>(`${this.config.apiEndpoints.userStats}/profile`).pipe(
      tap(stats => {
        this.loggingService.debug(`[${this.LOG_TAG}] Profile stats loaded`, stats, this.LOG_TAG);
      }),
      catchError(error => {
        this.loggingService.warn(`[${this.LOG_TAG}] Error loading profile stats, using fallback`, error, this.LOG_TAG);
        return this.getFallbackProfileStats();
      }),
      shareReplay(1)
    );
  }

  /**
   * Obtiene vencimientos próximos del usuario
   */
  getUserDeadlines(daysAhead: number = 30): Observable<UserDeadline[]> {
    this.loggingService.info(`[${this.LOG_TAG}] Getting user deadlines for ${daysAhead} days`, undefined, this.LOG_TAG);

    return this.http.get<UserDeadline[]>(`${this.config.apiEndpoints.userDeadlines}?daysAhead=${daysAhead}`).pipe(
      tap(deadlines => {
        this.loggingService.debug(`[${this.LOG_TAG}] User deadlines loaded: ${deadlines.length}`, deadlines, this.LOG_TAG);
      }),
      catchError(error => {
        this.loggingService.warn(`[${this.LOG_TAG}] Error loading user deadlines, using fallback`, error, this.LOG_TAG);
        return this.getFallbackUserDeadlines();
      }),
      shareReplay(1)
    );
  }

  /**
   * Obtiene estadísticas completas del usuario
   */
  getUserStats(): Observable<UserStats> {
    this.loggingService.info(`[${this.LOG_TAG}] Getting complete user stats`, undefined, this.LOG_TAG);

    return this.http.get<UserStats>(this.config.apiEndpoints.userStats).pipe(
      tap(stats => {
        this.userStatsSubject.next(stats);
        this.loggingService.debug(`[${this.LOG_TAG}] Complete user stats loaded`, stats, this.LOG_TAG);
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error loading user stats`, error, this.LOG_TAG);
        
        // ✅ SEGURIDAD: Validar autenticación antes de retornar datos mock
        if (!this.authService.isAuthenticated()) {
          this.loggingService.warn(`[${this.LOG_TAG}] Usuario no autenticado, no se retornan datos mock`, undefined, this.LOG_TAG);
          return throwError(() => new Error('Usuario no autenticado'));
        }
        
        return this.getFallbackUserStats();
      }),
      shareReplay(1)
    );
  }

  // ===== IMetricsRepository Implementation =====

  /**
   * Obtiene métricas de concursos
   */
  getContestMetrics(): Observable<ContestMetrics> {
    this.loggingService.info(`[${this.LOG_TAG}] Getting contest metrics`, undefined, this.LOG_TAG);

    return this.concursosService.getConcursos().pipe(
      map((concursos: any) => {
        const concursosArray = Array.isArray(concursos) ? concursos : (concursos?.content || []);

        const activeContests = concursosArray.filter((c: any) => c['status'] === 'PUBLISHED').length;
        const expiringSoon = this.calculateExpiringSoon(concursosArray);

        return {
          totalContests: concursosArray.length,
          activeContests,
          expiringSoon,
          userApplications: 0 // ✅ LIMPIEZA: Pendiente implementación de métricas de usuario
        };
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error loading contest metrics`, error, this.LOG_TAG);
        return of({
          totalContests: 0,
          activeContests: 0,
          expiringSoon: 0,
          userApplications: 0
        });
      }),
      shareReplay(1)
    );
  }

  /**
   * Obtiene métricas de inscripciones
   */
  getInscriptionMetrics(): Observable<InscriptionMetrics> {
    this.loggingService.info(`[${this.LOG_TAG}] Getting inscription metrics`, undefined, this.LOG_TAG);

    return this.inscriptionService.getUserInscriptions().pipe(
      map((inscriptions: any) => {
        const inscriptionsArray = Array.isArray(inscriptions) ? inscriptions : [];

        const activeInscriptions = inscriptionsArray.filter((i: any) =>
          i.status === 'ACTIVE' || i.status === 'IN_PROGRESS'
        ).length;

        const pendingInscriptions = inscriptionsArray.filter((i: any) =>
          i.status === 'PENDING'
        ).length;

        const completedInscriptions = inscriptionsArray.filter((i: any) =>
          i.status === 'COMPLETED'
        ).length;

        return {
          totalInscriptions: inscriptionsArray.length,
          activeInscriptions,
          pendingInscriptions,
          completedInscriptions
        };
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error loading inscription metrics`, error, this.LOG_TAG);
        return of({
          totalInscriptions: 0,
          activeInscriptions: 0,
          pendingInscriptions: 0,
          completedInscriptions: 0
        });
      }),
      shareReplay(1)
    );
  }

  /**
   * Obtiene métricas de documentos
   */
  getDocumentMetrics(): Observable<DocumentMetrics> {
    this.loggingService.info(`[${this.LOG_TAG}] Getting document metrics`, undefined, this.LOG_TAG);

    // ✅ LIMPIEZA: Pendiente implementación de servicio de documentos
    return of({
      totalDocuments: 0,
      pendingValidation: 0,
      approvedDocuments: 0,
      rejectedDocuments: 0
    });
  }

  // ===== Private Helper Methods =====

  private calculateExpiringSoon(concursos: any[]): number {
    const hoy = new Date();
    return concursos.filter((c: any) => {
      const fechaFin = new Date(c['endDate']);
      const diasRestantes = Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 3600 * 24));
      return diasRestantes <= 7 && diasRestantes > 0 && c['status'] === 'PUBLISHED';
    }).length;
  }

  private mapContestStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'PUBLISHED': 'Activo',
      'DRAFT': 'Borrador',
      'CLOSED': 'Cerrado',
      'CANCELLED': 'Cancelado'
    };
    return statusMap[status] || status;
  }

  private calculatePendingSections(profileStats: ProfileStats): any[] {
    const sections = [];

    if (!profileStats.hasBasicInfo) {
      sections.push({
        nombre: 'Información Básica',
        descripcion: 'Datos personales básicos',
        prioridad: 'ALTA',
        ruta: this.appConfigService.getRoute('profile'),
        icono: 'fa-user',
        completada: false
      });
    }

    if (!profileStats.hasContactInfo) {
      sections.push({
        nombre: 'Información de Contacto',
        descripcion: 'Datos de contacto',
        prioridad: 'ALTA',
        ruta: this.appConfigService.getRoute('profile'),
        icono: 'fa-envelope',
        completada: false
      });
    }

    if (!profileStats.hasEducation) {
      sections.push({
        nombre: 'Educación',
        descripcion: 'Formación académica',
        prioridad: 'MEDIA',
        ruta: this.appConfigService.getRoute('profile'),
        icono: 'fa-graduation-cap',
        completada: false
      });
    }

    if (!profileStats.hasExperience) {
      sections.push({
        nombre: 'Experiencia',
        descripcion: 'Experiencia laboral',
        prioridad: 'MEDIA',
        ruta: this.appConfigService.getRoute('profile'),
        icono: 'fa-briefcase',
        completada: false
      });
    }

    return sections;
  }

  private generateQuickActions(profileStats: ProfileStats, inscriptionMetrics: InscriptionMetrics): any[] {
    // ✅ LIMPIEZA: Usar acciones rápidas de configuración centralizada
    const baseActions = this.appConfigService.defaultQuickActions;
    const actions = [];

    // Acción para completar perfil (solo si no está completo)
    if (profileStats.completionPercentage < 100) {
      const completeProfileAction = baseActions.find(action => action.id === 'complete-profile');
      if (completeProfileAction) {
        actions.push({
          id: completeProfileAction.id,
          tipo: completeProfileAction.type,
          titulo: completeProfileAction.title,
          descripcion: completeProfileAction.description,
          icono: completeProfileAction.icon,
          ruta: completeProfileAction.route,
          prioridad: completeProfileAction.priority,
          badge: Math.round(100 - profileStats.completionPercentage)
        });
      }
    }

    // Acción para ver concursos
    const viewContestsAction = baseActions.find(action => action.id === 'view-contests');
    if (viewContestsAction) {
      actions.push({
        id: viewContestsAction.id,
        tipo: viewContestsAction.type,
        titulo: viewContestsAction.title,
        descripcion: viewContestsAction.description,
        icono: viewContestsAction.icon,
        ruta: viewContestsAction.route,
        prioridad: viewContestsAction.priority,
        badge: null
      });
    }

    // Acción para ver postulaciones (solo si tiene postulaciones)
    if (inscriptionMetrics.totalInscriptions > 0) {
      actions.push({
        id: 'view-applications',
        tipo: 'INSCRIPCION',
        titulo: 'Mis Postulaciones',
        descripcion: 'Revisar estado de postulaciones',
        icono: 'fa-file-alt',
        ruta: this.appConfigService.getRoute('applications'),
        prioridad: 'MEDIA',
        badge: inscriptionMetrics.activeInscriptions
      });
    }

    return actions;
  }

  // ===== Fallback Methods =====

  private getDefaultCards(): Observable<Card[]> {
    // ✅ LIMPIEZA: Cards por defecto con colores de configuración centralizada
    const defaultCards: Card[] = [
      {
        title: 'Concursos Activos',
        count: 0,
        icon: 'fa-gavel',
        color: this.appConfigService.getColor('success'),
        description: 'Concursos disponibles para inscripción'
      },
      {
        title: 'Mis Postulaciones',
        count: 0,
        icon: 'fa-file-alt',
        color: this.appConfigService.getColor('primary'),
        description: 'Postulaciones activas y pendientes'
      },
      {
        title: 'Próximos a Vencer',
        count: 0,
        icon: 'fa-clock',
        color: this.appConfigService.getColor('warning'),
        description: 'Concursos que cierran en 7 días o menos'
      }
    ];

    this.dashboardCardsSubject.next(defaultCards);
    return of(defaultCards);
  }

  private getDefaultDashboardData(): Observable<DashboardData> {
    const defaultData: DashboardData = {
      estadoPerfil: {
        completitud: 0,
        seccionesPendientes: [],
        documentosVencidos: 0,
        ultimaActualizacion: new Date(),
        puntajeCompletitud: 0
      },
      proximosVencimientos: [],
      accionesRapidas: [],
      notificaciones: [],
      metricas: {
        inscripcionesTotales: 0,
        inscripcionesActivas: 0,
        inscripcionesAprobadas: 0,
        documentosSubidos: 0,
        concursosDisponibles: 0,
        proximosVencimientos: 0,
        notificacionesPendientes: 0
      },
      configuracionWidgets: []
    };

    this.dashboardDataSubject.next(defaultData);
    return of(defaultData);
  }

  private getDefaultSimpleDashboardData(): Observable<SimpleDashboardData> {
    return of({
      profileCompletion: 0,
      activeApplications: 0,
      pendingDocuments: 0,
      availableExams: 0,
      upcomingDeadlines: []
    });
  }

  private getFallbackProfileStats(): Observable<ProfileStats> {
    return of({
      completionPercentage: 0,
      totalFields: 10,
      completedFields: 0,
      pendingFields: 10,
      hasProfileImage: false,
      hasBasicInfo: false,
      hasContactInfo: false,
      hasEducation: false,
      hasExperience: false,
      lastUpdated: new Date().toISOString()
    });
  }

  private getFallbackUserDeadlines(): Observable<UserDeadline[]> {
    return of([]);
  }

  private getFallbackUserStats(): Observable<UserStats> {
    return of({
      profileStats: {
        completionPercentage: 0,
        totalFields: 10,
        completedFields: 0,
        pendingFields: 10,
        hasProfileImage: false,
        hasBasicInfo: false,
        hasContactInfo: false,
        hasEducation: false,
        hasExperience: false,
        lastUpdated: new Date().toISOString()
      },
      inscriptionStats: {
        totalInscriptions: 0,
        activeInscriptions: 0,
        completedInscriptions: 0,
        pendingInscriptions: 0,
        cancelledInscriptions: 0,
        frozenInscriptions: 0,
        byStatus: {},
        byContest: {}
      },
      documentStats: {
        totalDocuments: 0,
        pendingDocuments: 0,
        approvedDocuments: 0,
        rejectedDocuments: 0,
        expiredDocuments: 0,
        byType: {},
        byStatus: {}
      },
      examStats: {
        availableExams: 0,
        completedExams: 0,
        pendingExams: 0,
        passedExams: 0,
        failedExams: 0,
        averageScore: 0,
        byStatus: {}
      },
      activityStats: {
        totalLogins: 0,
        lastLogin: new Date().toISOString(),
        documentsUploaded: 0,
        profileUpdates: 0,
        contestsViewed: 0,
        accountCreated: new Date().toISOString(),
        daysActive: 0
      }
    });
  }

  // ===== Public Getters for Reactive Data =====

  get dashboardCards$(): Observable<Card[]> {
    return this.dashboardCardsSubject.asObservable();
  }

  get recentConcursos$(): Observable<RecentConcurso[]> {
    return this.recentConcursosSubject.asObservable();
  }

  get dashboardData$(): Observable<DashboardData | null> {
    return this.dashboardDataSubject.asObservable();
  }

  get userStats$(): Observable<UserStats | null> {
    return this.userStatsSubject.asObservable();
  }
}
