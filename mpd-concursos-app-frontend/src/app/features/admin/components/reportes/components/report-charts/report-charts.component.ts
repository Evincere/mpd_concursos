import { Component, OnInit, OnDestroy, Input, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartService } from '../../services/chart.service';
import { ApexChartData } from '../../../admin-dashboard/components/stats-chart/stats-chart.component';

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
    inscriptionsByState: ApexChartData;
    inscriptionsByMonth: ApexChartData;
    contestParticipation: ApexChartData;
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
    // ApexCharts cleanup is handled automatically
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
  private processInscriptionsByState(): ApexChartData {
    const stateCounts: { [key: string]: number } = {};
    
    this.reportData.forEach(row => {
      const state = row.inscriptionState || 'Sin Estado';
      stateCounts[state] = (stateCounts[state] || 0) + 1;
    });

    const labels = Object.keys(stateCounts);
    const data = Object.values(stateCounts);

    return {
      labels,
      series: data,
      colors: [
        '#10b981', // Verde
        '#f59e0b', // Amarillo
        '#ef4444', // Rojo
        '#3b82f6', // Azul
        '#6b7280'  // Gris
      ]
    };
  }

  /**
   * Procesa los datos de inscripciones por mes
   */
  private processInscriptionsByMonth(): ApexChartData {
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
      series: data,
      colors: ['#3b82f6']
    };
  }

  /**
   * Procesa los datos de participación por concurso
   */
  private processContestParticipation(): ApexChartData {
    const contestCounts: { [key: string]: number } = {};
    
    this.reportData.forEach(row => {
      const contest = row.contestName || 'Sin Concurso';
      contestCounts[contest] = (contestCounts[contest] || 0) + 1;
    });

    const labels = Object.keys(contestCounts);
    const data = Object.values(contestCounts);

    return {
      labels,
      series: data,
      colors: [
        '#3b82f6', // Azul
        '#10b981', // Verde
        '#f59e0b', // Amarillo
        '#8b5cf6', // Púrpura
        '#ec4899'  // Rosa
      ]
    };
  }

  /**
   * Crea todos los gráficos - ApexCharts se maneja automáticamente
   */
  private createCharts(): void {
    if (!this.chartData || !this.showCharts) return;

    try {
      // Los gráficos ApexCharts se crean automáticamente en el template
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
      // ApexCharts se actualiza automáticamente cuando cambian los datos
      this.chartsLoaded = true;
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
