import { Injectable } from '@angular/core';
import { HttpParams } from  '@angular/common/http';
import { Observable, of } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { InscriptionStep } from '@shared/enums/inscription-step.enum';


/**
 * Interfaz para los datos del embudo de conversión
 */
export interface FunnelData {
  totalStarted: number;
  steps: {
    step: InscriptionStep;
    count: number;
    percentage: number;
    averageTimeInMinutes: number;
    dropOffCount: number;
    dropOffPercentage: number;
  }[];
}

/**
 * Interfaz para los puntos de abandono
 */
export interface DropOffPoint {
  step: InscriptionStep;
  count: number;
  percentage: number;
  reasons?: {
    reason: string;
    count: number;
    percentage: number;
  }[];
}

/**
 * Interfaz para las métricas de tiempo por etapa
 */
export interface StepTimeMetrics {
  step: InscriptionStep;
  averageTimeInMinutes: number;
  medianTimeInMinutes: number;
  minTimeInMinutes: number;
  maxTimeInMinutes: number;
  percentile90InMinutes: number;
}

/**
 * Interfaz para los datos de uso de funcionalidades
 */
export interface FeatureUsageData {
  feature: string;
  totalUsage: number;
  uniqueUsers: number;
  averageUsagePerUser: number;
  usageByPeriod: {
    period: string;
    count: number;
  }[];
}

/**
 * Interfaz para los segmentos de usuarios
 */
export interface UserSegment {
  id: string;
  name: string;
  description: string;
  count: number;
  percentage: number;
  characteristics: {
    characteristic: string;
    value: string;
  }[];
  behaviors: {
    behavior: string;
    value: number;
  }[];
}

/**
 * Interfaz para los filtros de análisis
 */
export interface AnalyticsFilter {
  startDate?: Date;
  endDate?: Date;
  contestId?: number;
  userSegment?: string;
  userRole?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InscriptionAnalyticsService {
  private apiUrl = `${environment.apiUrl}/admin/analytics`;



  /**
   * Obtiene los datos del embudo de conversión
   * @param filter Filtros para los datos
   */
  getFunnelData(_filter?: AnalyticsFilter): Observable<FunnelData> {
    // En una implementación real, esto sería una llamada a la API
    // return this.http.get<FunnelData>(`${this.apiUrl}/funnel`, { params: this.buildParams(filter) });

    // Implementación mock para desarrollo
    return of(this.getMockFunnelData());
  }

  /**
   * Obtiene los puntos de abandono
   * @param filter Filtros para los datos
   */
  getDropOffPoints(_filter?: AnalyticsFilter): Observable<DropOffPoint[]> {
    // En una implementación real, esto sería una llamada a la API
    // return this.http.get<DropOffPoint[]>(`${this.apiUrl}/drop-off-points`, { params: this.buildParams(filter) });

    // Implementación mock para desarrollo
    return of(this.getMockDropOffPoints());
  }

  /**
   * Obtiene las métricas de tiempo por etapa
   * @param filter Filtros para los datos
   */
  getStepTimeMetrics(_filter?: AnalyticsFilter): Observable<StepTimeMetrics[]> {
    // En una implementación real, esto sería una llamada a la API
    // return this.http.get<StepTimeMetrics[]>(`${this.apiUrl}/step-time-metrics`, { params: this.buildParams(filter) });

    // Implementación mock para desarrollo
    return of(this.getMockStepTimeMetrics());
  }

  /**
   * Obtiene los datos de uso de funcionalidades
   * @param filter Filtros para los datos
   */
  getFeatureUsageData(_filter?: AnalyticsFilter): Observable<FeatureUsageData[]> {
    // En una implementación real, esto sería una llamada a la API
    // return this.http.get<FeatureUsageData[]>(`${this.apiUrl}/feature-usage`, { params: this.buildParams(filter) });

    // Implementación mock para desarrollo
    return of(this.getMockFeatureUsageData());
  }

  /**
   * Obtiene los segmentos de usuarios
   * @param filter Filtros para los datos
   */
  getUserSegments(_filter?: AnalyticsFilter): Observable<UserSegment[]> {
    // En una implementación real, esto sería una llamada a la API
    // return this.http.get<UserSegment[]>(`${this.apiUrl}/user-segments`, { params: this.buildParams(filter) });

    // Implementación mock para desarrollo
    return of(this.getMockUserSegments());
  }

  /**
   * Construye los parámetros para las peticiones HTTP
   * @param filter Filtros para los datos
   */
  private buildParams(filter?: AnalyticsFilter): HttpParams {
    let params = new HttpParams();

    if (filter) {
      if (filter.startDate) {
        params = params.set('startDate', filter.startDate.toISOString());
      }

      if (filter.endDate) {
        params = params.set('endDate', filter.endDate.toISOString());
      }

      if (filter.contestId) {
        params = params.set('contestId', filter.contestId.toString());
      }

      if (filter.userSegment) {
        params = params.set('userSegment', filter.userSegment);
      }

      if (filter.userRole) {
        params = params.set('userRole', filter.userRole);
      }
    }

    return params;
  }

  /**
   * Genera datos mock para el embudo de conversión
   */
  private getMockFunnelData(): FunnelData {
    return {
      totalStarted: 1000,
      steps: [
        {
          step: InscriptionStep.INITIAL,
          count: 1000,
          percentage: 100,
          averageTimeInMinutes: 0,
          dropOffCount: 150,
          dropOffPercentage: 15
        },
        {
          step: InscriptionStep.TERMS_ACCEPTANCE,
          count: 850,
          percentage: 85,
          averageTimeInMinutes: 2,
          dropOffCount: 100,
          dropOffPercentage: 11.8
        },
        {
          step: InscriptionStep.LOCATION_SELECTION,
          count: 750,
          percentage: 75,
          averageTimeInMinutes: 5,
          dropOffCount: 150,
          dropOffPercentage: 20
        },
        {
          step: InscriptionStep.DOCUMENTATION,
          count: 600,
          percentage: 60,
          averageTimeInMinutes: 15,
          dropOffCount: 200,
          dropOffPercentage: 33.3
        },
        {
          step: InscriptionStep.DATA_CONFIRMATION,
          count: 400,
          percentage: 40,
          averageTimeInMinutes: 3,
          dropOffCount: 50,
          dropOffPercentage: 12.5
        },
        {
          step: InscriptionStep.COMPLETED,
          count: 350,
          percentage: 35,
          averageTimeInMinutes: 0,
          dropOffCount: 0,
          dropOffPercentage: 0
        }
      ]
    };
  }

  /**
   * Genera datos mock para los puntos de abandono
   */
  private getMockDropOffPoints(): DropOffPoint[] {
    return [
      {
        step: InscriptionStep.INITIAL,
        count: 150,
        percentage: 15,
        reasons: [
          { reason: 'Navegación accidental', count: 75, percentage: 50 },
          { reason: 'Falta de interés', count: 45, percentage: 30 },
          { reason: 'Otros', count: 30, percentage: 20 }
        ]
      },
      {
        step: InscriptionStep.TERMS_ACCEPTANCE,
        count: 100,
        percentage: 11.8,
        reasons: [
          { reason: 'No acepta términos', count: 60, percentage: 60 },
          { reason: 'Confusión en el proceso', count: 25, percentage: 25 },
          { reason: 'Otros', count: 15, percentage: 15 }
        ]
      },
      {
        step: InscriptionStep.LOCATION_SELECTION,
        count: 150,
        percentage: 20,
        reasons: [
          { reason: 'No encuentra su ubicación', count: 70, percentage: 46.7 },
          { reason: 'Problemas técnicos', count: 45, percentage: 30 },
          { reason: 'Cambio de opinión', count: 35, percentage: 23.3 }
        ]
      },
      {
        step: InscriptionStep.DOCUMENTATION,
        count: 200,
        percentage: 33.3,
        reasons: [
          { reason: 'Documentos no disponibles', count: 90, percentage: 45 },
          { reason: 'Problemas de carga', count: 60, percentage: 30 },
          { reason: 'Proceso muy largo', count: 50, percentage: 25 }
        ]
      },
      {
        step: InscriptionStep.DATA_CONFIRMATION,
        count: 50,
        percentage: 12.5,
        reasons: [
          { reason: 'Datos incorrectos', count: 25, percentage: 50 },
          { reason: 'Cambio de opinión', count: 15, percentage: 30 },
          { reason: 'Otros', count: 10, percentage: 20 }
        ]
      }
    ];
  }

  /**
   * Genera datos mock para las métricas de tiempo por etapa
   */
  private getMockStepTimeMetrics(): StepTimeMetrics[] {
    return [
      {
        step: InscriptionStep.TERMS_ACCEPTANCE,
        averageTimeInMinutes: 2,
        medianTimeInMinutes: 1.5,
        minTimeInMinutes: 0.5,
        maxTimeInMinutes: 10,
        percentile90InMinutes: 5
      },
      {
        step: InscriptionStep.LOCATION_SELECTION,
        averageTimeInMinutes: 5,
        medianTimeInMinutes: 4,
        minTimeInMinutes: 1,
        maxTimeInMinutes: 20,
        percentile90InMinutes: 12
      },
      {
        step: InscriptionStep.DOCUMENTATION,
        averageTimeInMinutes: 15,
        medianTimeInMinutes: 12,
        minTimeInMinutes: 3,
        maxTimeInMinutes: 60,
        percentile90InMinutes: 35
      },
      {
        step: InscriptionStep.DATA_CONFIRMATION,
        averageTimeInMinutes: 3,
        medianTimeInMinutes: 2,
        minTimeInMinutes: 1,
        maxTimeInMinutes: 15,
        percentile90InMinutes: 8
      }
    ];
  }

  /**
   * Genera datos mock para el uso de funcionalidades
   */
  private getMockFeatureUsageData(): FeatureUsageData[] {
    return [
      {
        feature: 'Búsqueda de concursos',
        totalUsage: 5000,
        uniqueUsers: 800,
        averageUsagePerUser: 6.25,
        usageByPeriod: [
          { period: 'Enero', count: 1200 },
          { period: 'Febrero', count: 1000 },
          { period: 'Marzo', count: 1500 },
          { period: 'Abril', count: 1300 }
        ]
      },
      {
        feature: 'Visualización de detalles de concurso',
        totalUsage: 3500,
        uniqueUsers: 750,
        averageUsagePerUser: 4.67,
        usageByPeriod: [
          { period: 'Enero', count: 800 },
          { period: 'Febrero', count: 750 },
          { period: 'Marzo', count: 1100 },
          { period: 'Abril', count: 850 }
        ]
      },
      {
        feature: 'Inscripción a concurso',
        totalUsage: 1200,
        uniqueUsers: 600,
        averageUsagePerUser: 2,
        usageByPeriod: [
          { period: 'Enero', count: 250 },
          { period: 'Febrero', count: 280 },
          { period: 'Marzo', count: 420 },
          { period: 'Abril', count: 250 }
        ]
      },
      {
        feature: 'Carga de documentos',
        totalUsage: 2500,
        uniqueUsers: 550,
        averageUsagePerUser: 4.55,
        usageByPeriod: [
          { period: 'Enero', count: 500 },
          { period: 'Febrero', count: 550 },
          { period: 'Marzo', count: 850 },
          { period: 'Abril', count: 600 }
        ]
      },
      {
        feature: 'Visualización de postulaciones',
        totalUsage: 4200,
        uniqueUsers: 700,
        averageUsagePerUser: 6,
        usageByPeriod: [
          { period: 'Enero', count: 900 },
          { period: 'Febrero', count: 950 },
          { period: 'Marzo', count: 1300 },
          { period: 'Abril', count: 1050 }
        ]
      }
    ];
  }

  /**
   * Genera datos mock para los segmentos de usuarios
   */
  private getMockUserSegments(): UserSegment[] {
    return [
      {
        id: 'active-applicants',
        name: 'Postulantes Activos',
        description: 'Usuarios que se inscriben frecuentemente en concursos',
        count: 350,
        percentage: 35,
        characteristics: [
          { characteristic: 'Edad promedio', value: '32 años' },
          { characteristic: 'Género predominante', value: 'Femenino (65%)' },
          { characteristic: 'Ubicación', value: 'Capital (40%)' }
        ],
        behaviors: [
          { behavior: 'Inscripciones promedio', value: 4.5 },
          { behavior: 'Tasa de finalización', value: 85 },
          { behavior: 'Visitas semanales', value: 3.2 }
        ]
      },
      {
        id: 'occasional-users',
        name: 'Usuarios Ocasionales',
        description: 'Usuarios que se inscriben esporádicamente',
        count: 450,
        percentage: 45,
        characteristics: [
          { characteristic: 'Edad promedio', value: '28 años' },
          { characteristic: 'Género predominante', value: 'Masculino (55%)' },
          { characteristic: 'Ubicación', value: 'Godoy Cruz (30%)' }
        ],
        behaviors: [
          { behavior: 'Inscripciones promedio', value: 1.8 },
          { behavior: 'Tasa de finalización', value: 60 },
          { behavior: 'Visitas semanales', value: 1.5 }
        ]
      },
      {
        id: 'abandoners',
        name: 'Abandonadores',
        description: 'Usuarios que frecuentemente abandonan el proceso',
        count: 200,
        percentage: 20,
        characteristics: [
          { characteristic: 'Edad promedio', value: '25 años' },
          { characteristic: 'Género predominante', value: 'Equilibrado' },
          { characteristic: 'Ubicación', value: 'Diversa' }
        ],
        behaviors: [
          { behavior: 'Inscripciones promedio', value: 2.3 },
          { behavior: 'Tasa de finalización', value: 20 },
          { behavior: 'Visitas semanales', value: 1.1 }
        ]
      }
    ];
  }
}
