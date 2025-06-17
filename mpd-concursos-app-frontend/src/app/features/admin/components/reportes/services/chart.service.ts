import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { ApexChartData } from '../../admin-dashboard/components/stats-chart/stats-chart.component';

// ApexCharts service for reports - NO Chart.js dependencies

@Injectable({
  providedIn: 'root'
})
export class ChartService {
  constructor(
    private loggingService: LoggingService
  ) {}

  /**
   * Genera datos de ejemplo para demostración con ApexCharts
   */
  generateSampleData(): {
    inscriptionsByState: ApexChartData;
    inscriptionsByMonth: ApexChartData;
    contestParticipation: ApexChartData;
  } {
    return {
      inscriptionsByState: {
        labels: ['Aprobadas', 'Pendientes', 'Rechazadas', 'En Proceso', 'Canceladas'],
        series: [245, 89, 34, 67, 12],
        colors: [
          '#10b981', // Verde - Aprobadas
          '#f59e0b', // Amarillo - Pendientes
          '#ef4444', // Rojo - Rechazadas
          '#3b82f6', // Azul - En Proceso
          '#6b7280'  // Gris - Canceladas
        ]
      },
      inscriptionsByMonth: {
        labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
        series: [65, 89, 123, 156, 134, 178],
        colors: ['#3b82f6']
      },
      contestParticipation: {
        labels: ['Concurso A', 'Concurso B', 'Concurso C', 'Concurso D'],
        series: [234, 189, 156, 98],
        colors: [
          '#3b82f6', // Azul
          '#10b981', // Verde
          '#f59e0b', // Amarillo
          '#8b5cf6'  // Púrpura
        ]
      }
    };
  }

}
