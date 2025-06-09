import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import {
  Chart,
  ChartConfiguration,
  ChartType,
  registerables
} from 'chart.js';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

export interface CustomChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins: {
    legend: {
      display: boolean;
      position: 'top' | 'bottom' | 'left' | 'right';
      labels: {
        color: string;
        font: {
          size: number;
          weight: 'normal' | 'bold' | 'lighter' | 'bolder';
        };
      };
    };
    title: {
      display: boolean;
      text: string;
      color: string;
      font: {
        size: number;
        weight: 'normal' | 'bold' | 'lighter' | 'bolder';
      };
    };
  };
  scales?: {
    x: {
      ticks: {
        color: string;
      };
      grid: {
        color: string;
      };
    };
    y: {
      ticks: {
        color: string;
      };
      grid: {
        color: string;
      };
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class ChartService {
  private charts: Map<string, Chart> = new Map();

  constructor(
    private loggingService: LoggingService
  ) {}

  /**
   * Crea un gráfico de barras
   */
  createBarChart(
    canvasId: string, 
    data: ChartData, 
    title: string = 'Gráfico de Barras'
  ): Chart {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas con ID ${canvasId} no encontrado`);
    }

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: data.datasets.map(dataset => ({
          ...dataset,
          backgroundColor: dataset.backgroundColor || 'rgba(59, 130, 246, 0.8)',
          borderColor: dataset.borderColor || 'rgba(59, 130, 246, 1)',
          borderWidth: dataset.borderWidth || 1
        }))
      },
      options: this.getDefaultOptions(title) as any
    };

    const chart = new Chart(canvas, config);
    this.charts.set(canvasId, chart);
    return chart;
  }

  /**
   * Crea un gráfico de líneas
   */
  createLineChart(
    canvasId: string, 
    data: ChartData, 
    title: string = 'Gráfico de Líneas'
  ): Chart {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas con ID ${canvasId} no encontrado`);
    }

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: data.datasets.map(dataset => ({
          ...dataset,
          backgroundColor: dataset.backgroundColor || 'rgba(59, 130, 246, 0.2)',
          borderColor: dataset.borderColor || 'rgba(59, 130, 246, 1)',
          borderWidth: dataset.borderWidth || 2,
          fill: true,
          tension: 0.4
        }))
      },
      options: this.getDefaultOptions(title) as any
    };

    const chart = new Chart(canvas, config);
    this.charts.set(canvasId, chart);
    return chart;
  }

  /**
   * Crea un gráfico de dona
   */
  createDoughnutChart(
    canvasId: string, 
    data: ChartData, 
    title: string = 'Gráfico de Dona'
  ): Chart {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas con ID ${canvasId} no encontrado`);
    }

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: data.datasets.map(dataset => ({
          ...dataset,
          backgroundColor: dataset.backgroundColor || [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)'
          ],
          borderColor: dataset.borderColor || 'rgba(255, 255, 255, 0.2)',
          borderWidth: dataset.borderWidth || 2
        }))
      },
      options: {
        ...this.getDefaultOptions(title),
        scales: undefined // Los gráficos de dona no usan escalas
      } as any
    };

    const chart = new Chart(canvas, config);
    this.charts.set(canvasId, chart);
    return chart;
  }

  /**
   * Actualiza los datos de un gráfico existente
   */
  updateChart(canvasId: string, newData: ChartData): void {
    const chart = this.charts.get(canvasId);
    if (chart) {
      chart.data.labels = newData.labels;
      chart.data.datasets = newData.datasets;
      chart.update();
    }
  }

  /**
   * Destruye un gráfico
   */
  destroyChart(canvasId: string): void {
    const chart = this.charts.get(canvasId);
    if (chart) {
      chart.destroy();
      this.charts.delete(canvasId);
    }
  }

  /**
   * Destruye todos los gráficos
   */
  destroyAllCharts(): void {
    this.charts.forEach(chart => chart.destroy());
    this.charts.clear();
  }

  /**
   * Obtiene las opciones por defecto para los gráficos
   */
  private getDefaultOptions(title: string): CustomChartOptions {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#f9fafb',
            font: {
              size: 12,
              weight: 'normal'
            }
          }
        },
        title: {
          display: true,
          text: title,
          color: '#f9fafb',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#d1d5db'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        y: {
          ticks: {
            color: '#d1d5db'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      }
    };
  }

  /**
   * Genera datos de ejemplo para demostración
   */
  generateSampleData(): {
    inscriptionsByState: ChartData;
    inscriptionsByMonth: ChartData;
    contestParticipation: ChartData;
  } {
    return {
      inscriptionsByState: {
        labels: ['Aprobadas', 'Pendientes', 'Rechazadas', 'En Proceso', 'Canceladas'],
        datasets: [{
          label: 'Inscripciones por Estado',
          data: [245, 89, 34, 67, 12],
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(107, 114, 128, 0.8)'
          ]
        }]
      },
      inscriptionsByMonth: {
        labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
        datasets: [{
          label: 'Inscripciones por Mes',
          data: [65, 89, 123, 156, 134, 178],
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgba(59, 130, 246, 1)'
        }]
      },
      contestParticipation: {
        labels: ['Concurso A', 'Concurso B', 'Concurso C', 'Concurso D'],
        datasets: [{
          label: 'Participación por Concurso',
          data: [234, 189, 156, 98],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(139, 92, 246, 0.8)'
          ]
        }]
      }
    };
  }
}
