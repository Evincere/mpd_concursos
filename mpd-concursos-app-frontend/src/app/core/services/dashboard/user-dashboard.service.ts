import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { LoggingService } from '@core/services/logging/logging.service';

/**
 * Interfaces para los datos del dashboard de usuario
 */
export interface UserDeadline {
  id: string;
  type: 'INSCRIPTION' | 'DOCUMENTS' | 'EXAM' | 'RESULT';
  title: string;
  description: string;
  deadline: string; // ISO date string
  daysRemaining: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  contestId: string;
  actionRequired: string;
  route: string;
  isUrgent: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'COMPLETED';
  contestTitle: string;
  contestDepartment: string;
  documentType?: string;
  examType?: string;
  hoursRemaining: number;
}

export interface ProfileStats {
  completionPercentage: number;
  totalFields: number;
  completedFields: number;
  pendingFields: number;
  hasProfileImage: boolean;
  hasBasicInfo: boolean;
  hasContactInfo: boolean;
  hasEducation: boolean;
  hasExperience: boolean;
  lastUpdated: string;
}

export interface InscriptionStats {
  totalInscriptions: number;
  activeInscriptions: number;
  completedInscriptions: number;
  pendingInscriptions: number;
  cancelledInscriptions: number;
  frozenInscriptions: number;
  byStatus: Record<string, number>;
  byContest: Record<string, number>;
}

export interface DocumentStats {
  totalDocuments: number;
  pendingDocuments: number;
  approvedDocuments: number;
  rejectedDocuments: number;
  expiredDocuments: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface ExamStats {
  availableExams: number;
  completedExams: number;
  pendingExams: number;
  passedExams: number;
  failedExams: number;
  averageScore: number;
  byStatus: Record<string, number>;
}

export interface ActivityStats {
  totalLogins: number;
  lastLogin: string;
  documentsUploaded: number;
  profileUpdates: number;
  contestsViewed: number;
  accountCreated: string;
  daysActive: number;
}

export interface UserStats {
  profileStats: ProfileStats;
  inscriptionStats: InscriptionStats;
  documentStats: DocumentStats;
  examStats: ExamStats;
  activityStats: ActivityStats;
}

/**
 * Servicio para gestionar los datos del dashboard específicos del usuario
 * Conecta con los nuevos endpoints del backend para obtener vencimientos y estadísticas reales
 */
@Injectable({
  providedIn: 'root'
})
export class UserDashboardService {
  private readonly apiUrl = `${environment.apiUrl}/dashboard/user`;
  private readonly LOG_TAG = 'UserDashboardService';

  // BehaviorSubjects para cache de datos
  private deadlinesSubject = new BehaviorSubject<UserDeadline[]>([]);
  private statsSubject = new BehaviorSubject<UserStats | null>(null);

  constructor(
    private http: HttpClient,
    private loggingService: LoggingService
  ) {
    this.loggingService.debug(`[${this.LOG_TAG}] Initializing UserDashboardService.`, undefined, this.LOG_TAG);
  }

  /**
   * Obtiene los vencimientos próximos del usuario
   * @param daysAhead Número de días hacia adelante para buscar vencimientos (por defecto 30)
   * @returns Observable con la lista de vencimientos
   */
  getUserDeadlines(daysAhead: number = 30): Observable<UserDeadline[]> {
    this.loggingService.info(`[${this.LOG_TAG}] Fetching user deadlines for ${daysAhead} days ahead.`, undefined, this.LOG_TAG);

    const params = new HttpParams().set('daysAhead', daysAhead.toString());

    return this.http.get<UserDeadline[]>(`${this.apiUrl}/deadlines`, { params }).pipe(
      tap(deadlines => {
        this.loggingService.info(`[${this.LOG_TAG}] Successfully fetched ${deadlines.length} deadlines.`, deadlines, this.LOG_TAG);
        this.deadlinesSubject.next(deadlines);
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error fetching user deadlines:`, error, this.LOG_TAG);
        // En caso de error, devolver datos mock para que la UI no se rompa
        const mockDeadlines = this.getMockDeadlines();
        this.deadlinesSubject.next(mockDeadlines);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene solo los vencimientos urgentes del usuario (próximos 7 días)
   * @returns Observable con la lista de vencimientos urgentes
   */
  getUrgentDeadlines(): Observable<UserDeadline[]> {
    this.loggingService.info(`[${this.LOG_TAG}] Fetching urgent deadlines.`, undefined, this.LOG_TAG);

    return this.http.get<UserDeadline[]>(`${this.apiUrl}/deadlines/urgent`).pipe(
      tap(deadlines => {
        this.loggingService.info(`[${this.LOG_TAG}] Successfully fetched ${deadlines.length} urgent deadlines.`, deadlines, this.LOG_TAG);
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error fetching urgent deadlines:`, error, this.LOG_TAG);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene vencimientos por tipo específico
   * @param type Tipo de vencimiento (INSCRIPTION, DOCUMENTS, EXAM, RESULT)
   * @returns Observable con la lista de vencimientos del tipo especificado
   */
  getDeadlinesByType(type: string): Observable<UserDeadline[]> {
    this.loggingService.info(`[${this.LOG_TAG}] Fetching deadlines by type: ${type}.`, undefined, this.LOG_TAG);

    return this.http.get<UserDeadline[]>(`${this.apiUrl}/deadlines/type/${type}`).pipe(
      tap(deadlines => {
        this.loggingService.info(`[${this.LOG_TAG}] Successfully fetched ${deadlines.length} deadlines of type ${type}.`, deadlines, this.LOG_TAG);
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error fetching deadlines by type ${type}:`, error, this.LOG_TAG);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene las estadísticas completas del usuario
   * @returns Observable con las estadísticas del usuario
   */
  getUserStats(): Observable<UserStats> {
    this.loggingService.info(`[${this.LOG_TAG}] Fetching complete user stats.`, undefined, this.LOG_TAG);

    return this.http.get<UserStats>(`${this.apiUrl}/stats`).pipe(
      tap(stats => {
        this.loggingService.info(`[${this.LOG_TAG}] Successfully fetched user stats.`, stats, this.LOG_TAG);
        this.statsSubject.next(stats);
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error fetching user stats:`, error, this.LOG_TAG);
        // En caso de error, devolver datos mock
        const mockStats = this.getMockStats();
        this.statsSubject.next(mockStats);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene solo las estadísticas del perfil del usuario
   * @returns Observable con las estadísticas del perfil
   */
  getProfileStats(): Observable<ProfileStats> {
    this.loggingService.info(`[${this.LOG_TAG}] Fetching profile stats.`, undefined, this.LOG_TAG);

    return this.http.get<ProfileStats>(`${this.apiUrl}/stats/profile`).pipe(
      tap(stats => {
        this.loggingService.info(`[${this.LOG_TAG}] Successfully fetched profile stats.`, stats, this.LOG_TAG);
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error fetching profile stats:`, error, this.LOG_TAG);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene solo las estadísticas de inscripciones del usuario
   * @returns Observable con las estadísticas de inscripciones
   */
  getInscriptionStats(): Observable<InscriptionStats> {
    this.loggingService.info(`[${this.LOG_TAG}] Fetching inscription stats.`, undefined, this.LOG_TAG);

    return this.http.get<InscriptionStats>(`${this.apiUrl}/stats/inscriptions`).pipe(
      tap(stats => {
        this.loggingService.info(`[${this.LOG_TAG}] Successfully fetched inscription stats.`, stats, this.LOG_TAG);
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error fetching inscription stats:`, error, this.LOG_TAG);
        return throwError(() => error);
      })
    );
  }

  /**
   * Observables para acceso a datos cacheados
   */
  get deadlines$(): Observable<UserDeadline[]> {
    return this.deadlinesSubject.asObservable();
  }

  get stats$(): Observable<UserStats | null> {
    return this.statsSubject.asObservable();
  }

  /**
   * Refresca todos los datos del dashboard
   */
  refreshDashboardData(): Observable<{ deadlines: UserDeadline[], stats: UserStats }> {
    this.loggingService.info(`[${this.LOG_TAG}] Refreshing all dashboard data.`, undefined, this.LOG_TAG);

    return new Observable(observer => {
      Promise.all([
        this.getUserDeadlines().toPromise(),
        this.getUserStats().toPromise()
      ]).then(([deadlines, stats]) => {
        observer.next({ deadlines: deadlines!, stats: stats! });
        observer.complete();
      }).catch(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error refreshing dashboard data:`, error, this.LOG_TAG);
        observer.error(error);
      });
    });
  }

  /**
   * Datos mock para fallback en caso de error
   */
  private getMockDeadlines(): UserDeadline[] {
    return [
      {
        id: 'mock-1',
        type: 'INSCRIPTION',
        title: 'Inscripción: Concurso de Ejemplo',
        description: 'Cierre de inscripciones',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        daysRemaining: 5,
        priority: 'MEDIUM',
        contestId: 'mock-contest',
        actionRequired: 'Completar inscripción',
        route: '/dashboard/concursos/mock-contest',
        isUrgent: false,
        status: 'ACTIVE',
        contestTitle: 'Concurso de Ejemplo',
        contestDepartment: 'Departamento de Ejemplo',
        hoursRemaining: 120
      }
    ];
  }

  private getMockStats(): UserStats {
    return {
      profileStats: {
        completionPercentage: 65,
        totalFields: 7,
        completedFields: 4,
        pendingFields: 3,
        hasProfileImage: false,
        hasBasicInfo: true,
        hasContactInfo: true,
        hasEducation: false,
        hasExperience: false,
        lastUpdated: new Date().toISOString()
      },
      inscriptionStats: {
        totalInscriptions: 2,
        activeInscriptions: 1,
        completedInscriptions: 0,
        pendingInscriptions: 1,
        cancelledInscriptions: 0,
        frozenInscriptions: 0,
        byStatus: { active: 1, pending: 1 },
        byContest: { 'Concurso Ejemplo': 1, 'Otro Concurso': 1 }
      },
      documentStats: {
        totalDocuments: 3,
        pendingDocuments: 2,
        approvedDocuments: 1,
        rejectedDocuments: 0,
        expiredDocuments: 0,
        byType: { 'DNI': 1, 'CV': 1, 'Título': 1 },
        byStatus: { pending: 2, approved: 1 }
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
        totalLogins: 15,
        lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        documentsUploaded: 3,
        profileUpdates: 2,
        contestsViewed: 5,
        accountCreated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        daysActive: 25
      }
    };
  }
}
