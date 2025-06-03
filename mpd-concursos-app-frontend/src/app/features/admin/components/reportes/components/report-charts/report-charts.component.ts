import { Component, OnInit, OnDestroy, Input, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartService, ChartData } from '../../services/chart.service';

@Component({
  selector: 'app-report-charts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-charts.component.html',
  styleUrls: ['./report-charts.component.scss']
})
export class ReportChartsComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() reportData: any[] = [];
  @Input() displayedColumns: string[] = [];

  // Estado de los gráficos
  chartsLoaded = false;
  showCharts = true;

  // Datos de los gráficos
  chartData: {
    inscriptionsByState: ChartData;
    inscriptionsByMonth: ChartData;
    contestParticipation: ChartData;
  } | null = null;

  constructor(private chartService: ChartService) {}

  ngOnInit(): void {
    this.generateChartData();
  }

  ngAfterViewInit(): void {
    // Esperar un tick para que los canvas estén renderizados
    setTimeout(() => {
      this.createCharts();
    }, 100);
  }

  ngOnDestroy(): void {
    this.chartService.destroyAllCharts();
  }

  /**
   * Genera los datos para los gráficos basado en los datos del reporte
   */
  private generateChartData(): void {
    if (this.reportData.length === 0) {
      // Usar datos de ejemplo si no hay datos reales
      this.chartData = this.chartService.generateSampleData();
      return;
    }

    // Procesar datos reales del reporte
    this.chartData = {
      inscriptionsByState: this.processInscriptionsByState(),
      inscriptionsByMonth: this.processInscriptionsByMonth(),
      contestParticipation: this.processContestParticipation()
    };
  }

  /**
   * Procesa los datos de inscripciones por estado
   */
  private processInscriptionsByState(): ChartData {
    const stateCounts: { [key: string]: number } = {};
    
    this.reportData.forEach(row => {
      const state = row.inscriptionState || 'Sin Estado';
      stateCounts[state] = (stateCounts[state] || 0) + 1;
    });

    const labels = Object.keys(stateCounts);
    const data = Object.values(stateCounts);

    return {
      labels,
      datasets: [{
        label: 'Inscripciones por Estado',
        data,
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(107, 114, 128, 0.8)'
        ]
      }]
    };
  }

  /**
   * Procesa los datos de inscripciones por mes
   */
  private processInscriptionsByMonth(): ChartData {
    const monthCounts: { [key: string]: number } = {};
    
    this.reportData.forEach(row => {
      if (row.inscriptionCreatedAt) {
        const date = new Date(row.inscriptionCreatedAt);
        const monthKey = date.toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'long' 
        });
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
      }
    });

    const labels = Object.keys(monthCounts).sort();
    const data = labels.map(label => monthCounts[label]);

    return {
      labels,
      datasets: [{
        label: 'Inscripciones por Mes',
        data,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)'
      }]
    };
  }

  /**
   * Procesa los datos de participación por concurso
   */
  private processContestParticipation(): ChartData {
    const contestCounts: { [key: string]: number } = {};
    
    this.reportData.forEach(row => {
      const contest = row.contestName || 'Sin Concurso';
      contestCounts[contest] = (contestCounts[contest] || 0) + 1;
    });

    const labels = Object.keys(contestCounts);
    const data = Object.values(contestCounts);

    return {
      labels,
      datasets: [{
        label: 'Participación por Concurso',
        data,
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)'
        ]
      }]
    };
  }

  /**
   * Crea todos los gráficos
   */
  private createCharts(): void {
    if (!this.chartData || !this.showCharts) return;

    try {
      // Gráfico de dona - Estados de inscripción
      this.chartService.createDoughnutChart(
        'inscriptionsByStateChart',
        this.chartData.inscriptionsByState,
        'Distribución por Estado de Inscripción'
      );

      // Gráfico de líneas - Inscripciones por mes
      this.chartService.createLineChart(
        'inscriptionsByMonthChart',
        this.chartData.inscriptionsByMonth,
        'Tendencia de Inscripciones por Mes'
      );

      // Gráfico de barras - Participación por concurso
      this.chartService.createBarChart(
        'contestParticipationChart',
        this.chartData.contestParticipation,
        'Participación por Concurso'
      );

      this.chartsLoaded = true;
    } catch (error) {
      console.error('Error al crear gráficos:', error);
      this.chartsLoaded = false;
    }
  }

  /**
   * Alterna la visibilidad de los gráficos
   */
  toggleCharts(): void {
    this.showCharts = !this.showCharts;
    
    if (this.showCharts) {
      setTimeout(() => {
        this.createCharts();
      }, 100);
    } else {
      this.chartService.destroyAllCharts();
      this.chartsLoaded = false;
    }
  }

  /**
   * Actualiza los gráficos con nuevos datos
   */
  updateCharts(): void {
    if (!this.chartData) return;

    this.generateChartData();
    
    if (this.chartsLoaded && this.showCharts) {
      this.chartService.updateChart('inscriptionsByStateChart', this.chartData.inscriptionsByState);
      this.chartService.updateChart('inscriptionsByMonthChart', this.chartData.inscriptionsByMonth);
      this.chartService.updateChart('contestParticipationChart', this.chartData.contestParticipation);
    }
  }

  /**
   * Exporta un gráfico como imagen
   */
  exportChart(chartId: string): void {
    const canvas = document.getElementById(chartId) as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `${chartId}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  }

  /**
   * Obtiene estadísticas resumidas
   */
  getChartStats(): {
    totalRecords: number;
    uniqueStates: number;
    uniqueContests: number;
    dateRange: string;
  } {
    const totalRecords = this.reportData.length;
    const uniqueStates = new Set(this.reportData.map(row => row.inscriptionState)).size;
    const uniqueContests = new Set(this.reportData.map(row => row.contestName)).size;
    
    const dates = this.reportData
      .map(row => row.inscriptionCreatedAt)
      .filter(date => date)
      .map(date => new Date(date))
      .sort((a, b) => a.getTime() - b.getTime());
    
    const dateRange = dates.length > 0 
      ? `${dates[0].toLocaleDateString()} - ${dates[dates.length - 1].toLocaleDateString()}`
      : 'Sin fechas';

    return {
      totalRecords,
      uniqueStates,
      uniqueContests,
      dateRange
    };
  }
}
