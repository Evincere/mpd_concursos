/**
 * Servicio unificado del Dashboard
 * ✅ REFACTORIZACIÓN: Consolida DashboardService, DashboardWidgetsService y UserDashboardService
 * ✅ PATRÓN REPOSITORY: Abstrae acceso a datos
 * ✅ SINGLE RESPONSIBILITY: Una sola responsabilidad por método
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest, of, throwError } from 'rxjs';
import { map, catchError, tap, shareReplay, switchMap } from 'rxjs/operators';

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
  DocumentMetrics,
  DocumentStats,
  InscriptionStats
} from '../../interfaces/dashboard/dashboard-repository.interface';

import { Card } from '@shared/interfaces/concurso/card.interface';
import { RecentConcurso } from '@shared/interfaces/concurso/recent-concurso.interface';
import {
  DashboardData,
  SimpleDashboardData,
  ProfileCompletionDetails,
  DocumentStatus,
  DocumentExpiration
} from '@shared/interfaces/dashboard/dashboard-widgets.interface';

// Services
import { ConcursosService } from '../concursos/concursos.service';
import { InscriptionService } from '../inscripcion/inscription.service';
import { ProfileService } from '../profile/profile.service';
import { UserDashboardService } from './user-dashboard.service';

/**
 * Servicio unificado que implementa todos los repositorios del dashboard
 */
@Injectable({
  providedIn: 'root'
})
export class UnifiedDashboardService implements IDashboardRepository, IUserStatsRepository, IMetricsRepository {
  private readonly LOG_TAG = 'UnifiedDashboardService';
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  // Cache subjects - CRITICAL FIX: Don't initialize with empty array to avoid showing 0 values
  public dashboardCardsSubject = new BehaviorSubject<Card[]>([
    {
      title: 'Concursos Activos',
      count: 0,
      icon: 'fa-gavel',
      color: '#28a745',
      description: 'Concursos disponibles para inscripción'
    },
    {
      title: 'Mis Postulaciones',
      count: 0,
      icon: 'fa-file-alt',
      color: '#007bff',
      description: 'Postulaciones activas y pendientes'
    },
    {
      title: 'Próximos a Vencer',
      count: 0,
      icon: 'fa-clock',
      color: '#ffc107',
      description: 'Concursos que cierran en 7 días o menos'
    }
  ]);
  private recentConcursosSubject = new BehaviorSubject<RecentConcurso[]>([]);
  private dashboardDataSubject = new BehaviorSubject<DashboardData | null>(null);
  private userStatsSubject = new BehaviorSubject<UserStats | null>(null);

  // Configuration
  private config: DashboardRepositoryConfig = {
    enableCache: true,
    cacheTimeout: 5 * 60 * 1000, // 5 minutos
    enableMockData: environment.mockData,
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
    private profileService: ProfileService,
    private userDashboardService: UserDashboardService
  ) {
    this.loggingService.info(`[${this.LOG_TAG}] Initializing UnifiedDashboardService`, this.config, this.LOG_TAG);
  }

  // ===== IDashboardRepository Implementation =====

  /**
   * Obtiene las cards principales del dashboard
   */
  getDashboardCards(): Observable<Card[]> {
    this.loggingService.info(`[${this.LOG_TAG}] Getting dashboard cards`, undefined, this.LOG_TAG);

    // CRITICAL FIX: Always load fresh data and return the updated observable
    this.loadDashboardCards();

    return this.dashboardCardsSubject.asObservable();
  }

  public loadDashboardCards(): void {
    // ✅ MEJORA: Combinar datos de concursos, inscripciones y vencimientos para subtítulos informativos
    combineLatest([
      this.concursosService.getConcursos(),
      this.userDashboardService.getInscriptionStats().pipe(
        catchError(() => of({
          totalInscriptions: 0,
          activeInscriptions: 0,
          completedInscriptions: 0,
          pendingInscriptions: 0,
          cancelledInscriptions: 0,
          frozenInscriptions: 0,
          byStatus: {},
          byContest: {}
        }))
      ),
      this.userDashboardService.getUserDeadlines(7).pipe(
        catchError(() => of([]))
      )
    ]).pipe(
      map(([concursos, inscriptionStats, deadlines]) => {
        const concursosArray = Array.isArray(concursos) ? concursos : ((concursos as any)?.content || []);

        // Calcular métricas usando lógica de estados dinámicos
        const concursosActivos = this.calculateActiveContests(concursosArray);
        const proximosAVencer = this.calculateExpiringSoon(concursosArray);

        // ✅ MEJORA: Calcular métricas detalladas para concursos
        const concursosPublicados = concursosArray.filter((c: any) => c.status === 'PUBLISHED').length;
        const concursosProximosAbrir = concursosArray.filter((c: any) => {
          if (c.status !== 'SCHEDULED') return false;
          const fechaInicio = new Date(c.startDate);
          const hoy = new Date();
          const diasHastaInicio = Math.ceil((fechaInicio.getTime() - hoy.getTime()) / (1000 * 3600 * 24));
          return diasHastaInicio <= 30 && diasHastaInicio > 0;
        }).length;

        // ✅ MEJORA: Usar los vencimientos del backend como fuente única de verdad
        this.loggingService.info(`[${this.LOG_TAG}] Deadlines data for vencimientos calculation:`, deadlines, this.LOG_TAG);

        const vencimientosInscripcion = deadlines.filter(d => d.type === 'INSCRIPTION').length;
        const vencimientosDocumentos = deadlines.filter(d => d.type === 'DOCUMENTS').length;
        const vencimientosExamen = deadlines.filter(d => d.type === 'EXAM').length;
        const vencimientosResultado = deadlines.filter(d => d.type === 'RESULT').length;

        // Total de vencimientos próximos (coherente con el subtítulo)
        const totalVencimientos = vencimientosInscripcion + vencimientosDocumentos + vencimientosExamen + vencimientosResultado;

        this.loggingService.info(`[${this.LOG_TAG}] Vencimientos breakdown: inscripciones=${vencimientosInscripcion}, documentos=${vencimientosDocumentos}, examenes=${vencimientosExamen}, resultados=${vencimientosResultado}, total=${totalVencimientos}`, undefined, this.LOG_TAG);

        // ✅ LIMPIEZA: Usar colores de configuración centralizada con subtítulos informativos
        const cards: Card[] = [
          {
            title: 'Concursos Activos',
            count: concursosActivos,
            icon: 'fa-gavel',
            color: this.appConfigService.getColor('success'),
            description: 'Concursos disponibles para inscripción',
            subtitle: this.generateConcursosSubtitle(concursosPublicados, concursosProximosAbrir)
          },
          {
            title: 'Mis Postulaciones',
            count: inscriptionStats.totalInscriptions,
            icon: 'fa-file-alt',
            color: this.appConfigService.getColor('primary'),
            description: 'Postulaciones activas y pendientes',
            subtitle: this.generatePostulacionesSubtitle(inscriptionStats)
          },
          {
            title: 'Próximos a Vencer',
            count: totalVencimientos,
            icon: 'fa-clock',
            color: this.appConfigService.getColor('warning'),
            description: 'Vencimientos próximos en los próximos 7 días',
            subtitle: this.generateVencimientosSubtitle(vencimientosInscripcion, vencimientosDocumentos, vencimientosExamen, vencimientosResultado)
          }
        ];

        return cards;
      }),
      tap(cards => {
        this.loggingService.info(`[${this.LOG_TAG}] Dashboard cards updated with detailed data and subtitles.`, cards, this.LOG_TAG);
        this.dashboardCardsSubject.next(cards);
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error loading dashboard cards`, error, this.LOG_TAG);
        // Return default cards as observable
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
      })
    ).subscribe();
  }

  /**
   * ✅ MEJORA: Genera subtítulo informativo para la card de Concursos Activos
   */
  private generateConcursosSubtitle(publicados: number, proximosAbrir: number): string {
    const partes: string[] = [];

    if (publicados > 0) {
      partes.push(`${publicados} publicado${publicados !== 1 ? 's' : ''}`);
    }

    if (proximosAbrir > 0) {
      partes.push(`${proximosAbrir} próximo${proximosAbrir !== 1 ? 's' : ''} a abrir`);
    }

    return partes.length > 0 ? partes.join(', ') : 'Sin actividad reciente';
  }

  /**
   * ✅ MEJORA: Genera subtítulo informativo para la card de Mis Postulaciones
   */
  private generatePostulacionesSubtitle(stats: any): string {
    try {
      const partes: string[] = [];

      // Validar que stats existe
      if (!stats) {
        return 'Sin datos disponibles';
      }

      // Convertir a números para asegurar comparación correcta
      const incompletas = Number(stats.pendingInscriptions) || 0;
      const esperandoValidacion = Number(stats.completedInscriptions) || 0;

      if (incompletas > 0) {
        partes.push(`${incompletas} incompleta${incompletas !== 1 ? 's' : ''}`);
      }

      if (esperandoValidacion > 0) {
        partes.push(`${esperandoValidacion} esperando validación`);
      }

      return partes.length > 0 ? partes.join(', ') : 'Sin postulaciones registradas';

    } catch (error) {
      this.loggingService.error(`[${this.LOG_TAG}] Error generating postulaciones subtitle:`, error, this.LOG_TAG);
      return 'Error al cargar datos';
    }
  }

  /**
   * ✅ MEJORA: Genera subtítulo informativo para la card de Próximos a Vencer
   */
  private generateVencimientosSubtitle(inscripciones: number, documentos: number, examenes: number = 0, resultados: number = 0): string {
    const partes: string[] = [];

    if (inscripciones > 0) {
      partes.push(`${inscripciones} inscripción${inscripciones !== 1 ? 'es' : ''}`);
    }

    if (documentos > 0) {
      partes.push(`${documentos} documento${documentos !== 1 ? 's' : ''}`);
    }

    if (examenes > 0) {
      partes.push(`${examenes} examen${examenes !== 1 ? 'es' : ''}`);
    }

    if (resultados > 0) {
      partes.push(`${resultados} resultado${resultados !== 1 ? 's' : ''}`);
    }

    return partes.length > 0 ? partes.join(', ') : 'Sin vencimientos próximos';
  }

  /**
   * ✅ MEJORA: Calcula detalles de completitud del perfil incluyendo documentación
   */
  private calculateProfileCompletionDetails(profileStats: ProfileStats, documentStats: DocumentStats, deadlines: UserDeadline[]): ProfileCompletionDetails {
    // Calcular porcentajes
    const personalDataPercentage = profileStats.completionPercentage;

    // Calcular porcentaje de documentos requeridos y opcionales
    const totalRequired = 5; // DNI, CUIL, Antecedentes, Certificado Profesional, Ley Micaela
    const totalOptional = 3; // Documentos opcionales estimados

    const requiredCompleted = Math.min(documentStats.approvedDocuments, totalRequired);
    const optionalCompleted = Math.max(0, documentStats.approvedDocuments - totalRequired);

    const requiredDocumentsPercentage = Math.round((requiredCompleted / totalRequired) * 100);
    const optionalDocumentsPercentage = Math.round((optionalCompleted / totalOptional) * 100);

    // Calcular porcentaje global ponderado
    const globalPercentage = Math.round((personalDataPercentage * 0.4) + (requiredDocumentsPercentage * 0.6));

    // Generar documentos de ejemplo (en producción esto vendría del backend)
    const requiredDocuments: DocumentStatus[] = [
      { id: 'dni-frente', name: 'DNI (Frente)', status: requiredCompleted > 0 ? 'completed' : 'missing', required: true },
      { id: 'dni-dorso', name: 'DNI (Dorso)', status: requiredCompleted > 1 ? 'completed' : 'missing', required: true },
      { id: 'cuil', name: 'CUIL', status: requiredCompleted > 2 ? 'completed' : 'missing', required: true },
      { id: 'antecedentes', name: 'Antecedentes Penales', status: requiredCompleted > 3 ? 'completed' : 'missing', required: true },
      { id: 'certificado-profesional', name: 'Certificado Profesional', status: requiredCompleted > 4 ? 'completed' : 'missing', required: true, expirationDate: '2024-12-31', daysUntilExpiration: 90 }
    ];

    const optionalDocuments: DocumentStatus[] = [
      { id: 'ley-micaela', name: 'Certificado Ley Micaela', status: optionalCompleted > 0 ? 'completed' : 'missing', required: false },
      { id: 'capacitacion-adicional', name: 'Capacitación Adicional', status: optionalCompleted > 1 ? 'completed' : 'missing', required: false },
      { id: 'experiencia-laboral', name: 'Certificado Experiencia', status: optionalCompleted > 2 ? 'completed' : 'missing', required: false }
    ];

    // Generar vencimientos próximos
    const upcomingExpirations: DocumentExpiration[] = deadlines
      .filter(d => d.type === 'DOCUMENTS' && d.daysRemaining <= 30)
      .map(d => ({
        documentName: d.title,
        expirationDate: d.deadline,
        daysUntilExpiration: d.daysRemaining,
        priority: d.daysRemaining <= 7 ? 'high' : d.daysRemaining <= 15 ? 'medium' : 'low'
      }));

    return {
      personalDataPercentage,
      requiredDocumentsPercentage,
      optionalDocumentsPercentage,
      globalPercentage,
      requiredDocuments,
      optionalDocuments,
      upcomingExpirations
    };
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
      this.getInscriptionMetrics(),
      this.getDocumentStats() // ✅ MEJORA: Agregar datos de documentación
    ]).pipe(
      map(([profileStats, deadlines, inscriptionMetrics, documentStats]) => ({
        profileCompletion: profileStats.completionPercentage,
        activeApplications: inscriptionMetrics.activeInscriptions,
        pendingDocuments: documentStats.pendingDocuments,
        availableExams: 0, // ✅ LIMPIEZA: Pendiente implementación de servicio de exámenes
        upcomingDeadlines: deadlines.slice(0, 3).map(deadline => ({
          title: deadline.title,
          date: deadline.deadline,
          daysRemaining: deadline.daysRemaining
        })),
        // ✅ MEJORA: Agregar detalles de completitud del perfil
        profileDetails: this.calculateProfileCompletionDetails(profileStats, documentStats, deadlines)
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

  /**
   * ✅ MEJORA: Obtiene estadísticas de documentos del usuario
   */
  getDocumentStats(): Observable<DocumentStats> {
    this.loggingService.info(`[${this.LOG_TAG}] Getting document stats`, undefined, this.LOG_TAG);

    return this.http.get<DocumentStats>(`${this.config.apiEndpoints.userStats}/documents`).pipe(
      tap(stats => {
        this.loggingService.debug(`[${this.LOG_TAG}] Document stats loaded`, stats, this.LOG_TAG);
      }),
      catchError(error => {
        this.loggingService.warn(`[${this.LOG_TAG}] Error loading document stats, using fallback`, error, this.LOG_TAG);
        return this.getFallbackDocumentStats();
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

        const activeContests = this.calculateActiveContests(concursosArray);
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
        const inscriptionsArray = inscriptions?.content || [];

        const activeInscriptions = inscriptionsArray.filter((i: any) => {
          const estado = (i?.status as string | undefined)?.toUpperCase();
          if (!estado) return false;

          const estadosActivos = [
            'PENDING', 'PENDIENTE', 'CONFIRMADA', 'APPROVED', 'APROBADA', 'APROBADO',
            'INSCRIPTO', 'IN_PROCESS', 'EN_PROCESO', 'COMPLETED_WITH_DOCS',
            'COMPLETED_PENDING_DOCS', 'ACTIVO', 'ACTIVE',
            // ✅ SOLUCIÓN: Sincronizar estados con loadDashboardCards
            'PENDIENTE VALIDACIÓN', 'PENDIENTE_VALIDACIÓN', 'PENDIENTE_VALIDACION',
            'PENDING_VALIDATION', 'VALIDATION_PENDING'
          ];
          return estadosActivos.includes(estado);
        }).length;

        const pendingInscriptions = inscriptionsArray.filter((i: any) => {
          const estado = (i?.status as string | undefined)?.toUpperCase();
          if (!estado) return false;
          return ['PENDING', 'PENDIENTE'].includes(estado);
        }).length;

        const completedInscriptions = inscriptionsArray.filter((i: any) => {
            const estado = (i?.status as string | undefined)?.toUpperCase();
            if (!estado) return false;
            return ['COMPLETED_WITH_DOCS', 'COMPLETED_PENDING_DOCS'].includes(estado);
        }).length;

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

  /**
   * Calcula concursos realmente activos usando lógica de estados dinámicos
   * Un concurso es activo si está PUBLISHED y tiene inscripciones abiertas
   */
  private calculateActiveContests(concursos: any[]): number {
    const ahora = new Date();

    return concursos.filter((concurso: any) => {
      // Usar estado dinámico calculado por el backend
      const currentStatus = concurso['currentStatus'] || concurso['status'];
      return currentStatus === 'ACTIVE';
    }).length;
  }

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

  /**
   * ✅ MEJORA: Fallback para estadísticas de documentos
   */
  private getFallbackDocumentStats(): Observable<DocumentStats> {
    return of({
      totalDocuments: 0,
      pendingDocuments: 0,
      approvedDocuments: 0,
      rejectedDocuments: 0,
      expiredDocuments: 0,
      byType: {},
      byStatus: {}
    });
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
