/**
 * Interfaces para el patrón Repository del Dashboard
 * ✅ REFACTORIZACIÓN: Abstracción de acceso a datos del dashboard
 */

import { Observable } from 'rxjs';
import { Card } from '@shared/interfaces/concurso/card.interface';
import { RecentConcurso } from '@shared/interfaces/concurso/recent-concurso.interface';
import { DashboardData, SimpleDashboardData } from '@shared/interfaces/dashboard/dashboard-widgets.interface';

/**
 * Repositorio principal para datos del dashboard
 * Abstrae el acceso a datos de diferentes fuentes
 */
export interface IDashboardRepository {
  /**
   * Obtiene las cards principales del dashboard
   */
  getDashboardCards(): Observable<Card[]>;

  /**
   * Obtiene los concursos recientes
   */
  getRecentConcursos(): Observable<RecentConcurso[]>;

  /**
   * Obtiene datos completos para widgets del dashboard
   */
  getDashboardData(): Observable<DashboardData>;

  /**
   * Obtiene datos simplificados para widgets básicos
   */
  getSimpleDashboardData(): Observable<SimpleDashboardData>;

  /**
   * Refresca todos los datos del dashboard
   */
  refreshDashboardData(): Observable<void>;
}

/**
 * Repositorio para estadísticas del usuario
 */
export interface IUserStatsRepository {
  /**
   * Obtiene estadísticas del perfil del usuario
   */
  getProfileStats(): Observable<ProfileStats>;

  /**
   * Obtiene vencimientos próximos del usuario
   */
  getUserDeadlines(daysAhead?: number): Observable<UserDeadline[]>;

  /**
   * Obtiene estadísticas completas del usuario
   */
  getUserStats(): Observable<UserStats>;
}

/**
 * Repositorio para métricas del dashboard
 */
export interface IMetricsRepository {
  /**
   * Obtiene métricas de concursos
   */
  getContestMetrics(): Observable<ContestMetrics>;

  /**
   * Obtiene métricas de inscripciones
   */
  getInscriptionMetrics(): Observable<InscriptionMetrics>;

  /**
   * Obtiene métricas de documentos
   */
  getDocumentMetrics(): Observable<DocumentMetrics>;
}

/**
 * Interfaces de datos
 */
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

export interface UserDeadline {
  id: string;
  type: string;
  title: string;
  description: string;
  deadline: string;
  daysRemaining: number;
  priority: string;
  contestId?: string;
  actionRequired: string;
  route: string;
}

export interface UserStats {
  profileStats: ProfileStats;
  inscriptionStats: InscriptionStats;
  documentStats: DocumentStats;
  examStats: ExamStats;
  activityStats: ActivityStats;
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

export interface ContestMetrics {
  totalContests: number;
  activeContests: number;
  expiringSoon: number;
  userApplications: number;
}

export interface InscriptionMetrics {
  totalInscriptions: number;
  activeInscriptions: number;
  pendingInscriptions: number;
  completedInscriptions: number;
}

export interface DocumentMetrics {
  totalDocuments: number;
  pendingValidation: number;
  approvedDocuments: number;
  rejectedDocuments: number;
}

/**
 * Configuración del repositorio
 */
export interface DashboardRepositoryConfig {
  enableCache: boolean;
  cacheTimeout: number;
  enableMockData: boolean;
  apiEndpoints: {
    cards: string;
    recentConcursos: string;
    dashboardData: string;
    userStats: string;
    userDeadlines: string;
  };
}
