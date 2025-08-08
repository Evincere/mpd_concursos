import { Component, Input, AfterViewInit, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  ApexOptions,
  ApexChart,
  ApexNonAxisChartSeries,
  ApexAxisChartSeries
} from 'ng-apexcharts';
import { LoggingService } from '@core/services/logging/logging.service';
// import { APEX_GLOBAL_OPTIONS, APEX_CHART_TYPE_DEFAULTS } from '@core/config/chart-global-config'; // Comentado temporalmente

/**
 * Interface for the data structure expected by ApexCharts.
 */
export interface ApexChartData {
  labels: string[]; // Labels for the x-axis or segments (e.g., categories, dates)
  series: number[] | ApexAxisChartSeries; // Data series for the chart
  colors?: string[]; // Custom colors for the chart
}

/**
 * StatsChartComponent
 *
 * A reusable chart component that uses ApexCharts to display various types of charts.
 * Supports bar, line, pie, and donut charts with glassmorphism styling.
 *
 * Features:
 * - Responsive design
 * - Glassmorphism styling
 * - NO animation issues (unlike Chart.js)
 * - Customizable chart types and data
 * - Error handling and logging
 * - Accessibility support
 */
@Component({
  selector: 'app-stats-chart',
  templateUrl: './stats-chart.component.html',
  styleUrls: ['./stats-chart.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    NgApexchartsModule
  ]
})
export class StatsChartComponent implements AfterViewInit, OnDestroy, OnChanges {
  // ViewChild to access the chart container
  @ViewChild('chartContainer', { static: false }) chartContainer!: ElementRef;

  // Input properties for chart configuration
  @Input() title = 'Estadísticas'; // Card title
  @Input() subtitle = ''; // Card subtitle
  @Input() chartType: 'bar' | 'line' | 'pie' | 'donut' = 'bar'; // Type of chart
  @Input() chartData!: ApexChartData; // Data for the chart
  @Input() chartOptions: Partial<ApexOptions> = {}; // Custom options for ApexCharts
  @Input() height = '300px'; // Height of the chart container

  // ApexCharts configuration
  public apexChartOptions: any = {
    chart: {
      type: 'bar',
      height: 300,
      background: 'transparent',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false
        }
      }
    },
    theme: {
      mode: 'light'
    },
    colors: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth' as const,
      width: 2
    },
    xaxis: {
      categories: []
    },
    yaxis: {
      title: {
        text: 'Valores'
      }
    },
    legend: {
      show: true,
      position: 'bottom' as const
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: '100%'
        },
        legend: {
          position: 'bottom' as const
        }
      }
    }]
  };

  // Chart instance reference
  private chartInstance: any;

  constructor(
    private cdr: ChangeDetectorRef,
    private loggingService: LoggingService
  ) {}

  ngAfterViewInit(): void {
    try {
      this.initializeChart();
    } catch (error) {
      this.loggingService.error('Error initializing chart:', error);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartData'] || changes['chartType'] || changes['chartOptions']) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }

  /**
   * Initialize the ApexCharts instance
   */
  private initializeChart(): void {
    if (!this.chartData) {
      this.loggingService.warn('No chart data provided');
      return;
    }

    this.updateChartOptions();
  }

  /**
   * Update chart with new data
   */
  private updateChart(): void {
    if (!this.chartData) return;

    this.updateChartOptions();
    this.cdr.detectChanges();
  }

  /**
   * Update chart options based on current inputs
   */
  private updateChartOptions(): void {
    try {
      // Configure chart based on type
      const baseOptions = {
        ...this.apexChartOptions,
        chart: {
          ...this.apexChartOptions.chart,
          type: this.chartType,
          height: parseInt(this.height.replace('px', ''))
        },
        series: this.formatSeriesData(),
        xaxis: {
          ...this.apexChartOptions.xaxis,
          categories: this.chartData.labels
        }
      };

      // Apply custom colors if provided
      if (this.chartData.colors && this.chartData.colors.length > 0) {
        baseOptions.colors = this.chartData.colors;
      }

      // Apply custom chart options
      this.apexChartOptions = {
        ...baseOptions,
        ...this.chartOptions
      };

    } catch (error) {
      this.loggingService.error('Error updating chart options:', error);
    }
  }

  /**
   * Format series data based on chart type
   */
  private formatSeriesData(): any {
    if (!this.chartData) return [];

    try {
      // For pie and donut charts
      if (this.chartType === 'pie' || this.chartType === 'donut') {
        return Array.isArray(this.chartData.series) ? this.chartData.series : [this.chartData.series];
      }

      // For bar and line charts
      if (Array.isArray(this.chartData.series) && typeof this.chartData.series[0] === 'number') {
        return [{
          name: 'Datos',
          data: this.chartData.series as number[]
        }];
      }

      // If already in proper format
      return this.chartData.series;
    } catch (error) {
      this.loggingService.error('Error formatting series data:', error);
      return [];
    }
  }

  /**
   * Export chart as image
   */
  exportChart(format: 'png' | 'svg' = 'png'): void {
    try {
      if (this.chartInstance) {
        this.chartInstance.dataURI().then((uri: any) => {
          const link = document.createElement('a');
          link.href = uri.imgURI;
          link.download = `${this.title.toLowerCase().replace(/\s+/g, '_')}_chart.${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
      }
    } catch (error) {
      this.loggingService.error('Error exporting chart:', error);
    }
  }

  /**
   * Refresh chart data
   */
  refresh(): void {
    this.updateChart();
  }
}
