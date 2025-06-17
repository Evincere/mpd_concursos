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
import { APEX_GLOBAL_OPTIONS, APEX_CHART_TYPE_DEFAULTS } from '@core/config/chart-global-config';

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
      type: 'pie',
      height: 300,
      background: 'transparent',
      foreColor: '#f9fafb',
      fontFamily: 'Roboto, "Helvetica Neue", sans-serif'
    },
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
    legend: {
      labels: {
        colors: '#f9fafb'
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        colors: ['#fff']
      }
    }
  };
  public apexSeries: any = [];
  public isChartReady = false; // Flag to control chart rendering
  public shouldRenderChart = false; // Additional flag for delayed rendering

  private readonly LOG_TAG = 'StatsChartComponent'; // Tag for logging

  constructor(
    private loggingService: LoggingService,
    private cdr: ChangeDetectorRef
  ) {
    this.loggingService.debug(`[${this.LOG_TAG}] StatsChartComponent constructor called.`, undefined, this.LOG_TAG);
  }

  /**
   * Lifecycle hook that is called when any data-bound property changes
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartData'] && !changes['chartData'].firstChange && this.chartData) {
      this.loggingService.debug(`[${this.LOG_TAG}] Chart data changed, updating configuration.`, undefined, this.LOG_TAG);
      this.initializeChart();
    }
  }

  /**
   * Lifecycle hook that is called after Angular has initialized all of the component's views and child views.
   * This is where the ApexCharts configuration is set up.
   */
  ngAfterViewInit(): void {
    this.loggingService.info(`[${this.LOG_TAG}] ngAfterViewInit called.`, undefined, this.LOG_TAG);

    // Use multiple strategies to ensure DOM is ready
    this.waitForDOMReady();
  }

  /**
   * Wait for DOM to be ready using multiple strategies
   */
  private waitForDOMReady(): void {
    // Strategy 1: Check if container exists immediately
    if (this.chartContainer && this.chartContainer.nativeElement) {
      this.loggingService.debug(`[${this.LOG_TAG}] Chart container found immediately.`, undefined, this.LOG_TAG);
      this.scheduleChartInitialization();
      return;
    }

    // Strategy 2: Use requestAnimationFrame to wait for next render cycle
    requestAnimationFrame(() => {
      if (this.chartContainer && this.chartContainer.nativeElement) {
        this.loggingService.debug(`[${this.LOG_TAG}] Chart container found after requestAnimationFrame.`, undefined, this.LOG_TAG);
        this.scheduleChartInitialization();
        return;
      }

      // Strategy 3: Use setTimeout with increasing delays
      this.retryWithDelay(0);
    });
  }

  /**
   * Retry initialization with increasing delays
   */
  private retryWithDelay(attempt: number): void {
    const maxAttempts = 5;
    const delay = Math.min(100 * Math.pow(2, attempt), 1000); // Exponential backoff, max 1s

    if (attempt >= maxAttempts) {
      this.loggingService.error(`[${this.LOG_TAG}] Failed to find chart container after ${maxAttempts} attempts.`, undefined, this.LOG_TAG);
      return;
    }

    setTimeout(() => {
      if (this.chartContainer && this.chartContainer.nativeElement) {
        this.loggingService.debug(`[${this.LOG_TAG}] Chart container found after ${attempt + 1} attempts.`, undefined, this.LOG_TAG);
        this.scheduleChartInitialization();
      } else {
        this.loggingService.warn(`[${this.LOG_TAG}] Chart container not found, attempt ${attempt + 1}/${maxAttempts}. Retrying...`, undefined, this.LOG_TAG);
        this.retryWithDelay(attempt + 1);
      }
    }, delay);
  }

  /**
   * Schedule chart initialization with additional safety checks
   */
  private scheduleChartInitialization(): void {
    // Additional safety: wait one more frame to ensure everything is settled
    requestAnimationFrame(() => {
      setTimeout(() => {
        this.initializeChart();
      }, 50); // Small additional delay
    });
  }

  /**
   * Lifecycle hook for cleanup
   */
  ngOnDestroy(): void {
    this.isChartReady = false;
    this.shouldRenderChart = false;
    this.loggingService.debug(`[${this.LOG_TAG}] Component destroyed.`, undefined, this.LOG_TAG);
  }

  /**
   * Initialize chart with proper validation
   */
  private initializeChart(): void {
    // Validate container exists
    if (!this.chartContainer || !this.chartContainer.nativeElement) {
      this.loggingService.error(`[${this.LOG_TAG}] Cannot initialize chart: container not found.`, undefined, this.LOG_TAG);
      return;
    }

    // Validate data exists
    if (!this.chartData || !this.chartData.series || !this.chartData.labels) {
      this.loggingService.warn(`[${this.LOG_TAG}] Cannot initialize chart: invalid data.`, this.chartData, this.LOG_TAG);
      return;
    }

    // Validate container is visible and has dimensions
    const containerElement = this.chartContainer.nativeElement;
    const rect = containerElement.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) {
      this.loggingService.warn(`[${this.LOG_TAG}] Container has no dimensions, retrying...`, { width: rect.width, height: rect.height }, this.LOG_TAG);
      // Retry after a short delay
      setTimeout(() => {
        this.initializeChart();
      }, 100);
      return;
    }

    this.loggingService.debug(`[${this.LOG_TAG}] Initializing chart with data:`, this.chartData, this.LOG_TAG);
    this.loggingService.debug(`[${this.LOG_TAG}] Container dimensions:`, { width: rect.width, height: rect.height }, this.LOG_TAG);

    this.setupApexChart();
  }

  /**
   * Sets up the ApexCharts configuration based on chart type and data
   */
  private setupApexChart(): void {
    this.loggingService.info(`[${this.LOG_TAG}] setupApexChart method called. Chart type: ${this.chartType}.`, undefined, this.LOG_TAG);

    try {
      // Reset chart ready state
      this.isChartReady = false;

      // Validate input data
      if (!this.chartData || !this.chartData.series || !this.chartData.labels) {
        this.loggingService.warn(`[${this.LOG_TAG}] Invalid chart data provided.`, this.chartData, this.LOG_TAG);
        return;
      }

      // Ensure series is properly formatted for ApexCharts
      if (this.chartType === 'pie' || this.chartType === 'donut') {
        // For pie/donut charts, series must be a simple array of numbers
        this.apexSeries = Array.isArray(this.chartData.series) ?
          this.chartData.series.map(value => {
            const num = Number(value);
            return isNaN(num) ? 0 : num;
          }) : [];
      } else {
        // For bar/line charts, series must be an array of objects with name and data
        if (Array.isArray(this.chartData.series) && typeof this.chartData.series[0] === 'object') {
          this.apexSeries = this.chartData.series;
        } else {
          this.apexSeries = [{
            name: this.title || 'Data',
            data: Array.isArray(this.chartData.series) ?
              this.chartData.series.map(value => {
                const num = Number(value);
                return isNaN(num) ? 0 : num;
              }) : []
          }];
        }
      }

      // Validate series data
      if (!this.apexSeries || this.apexSeries.length === 0) {
        this.loggingService.warn(`[${this.LOG_TAG}] No valid series data available.`, this.apexSeries, this.LOG_TAG);
        return;
      }

      // Build chart configuration step by step
      this.apexChartOptions = {
        chart: {
          type: this.chartType === 'donut' ? 'donut' : this.chartType,
          height: parseInt(this.height.replace('px', '')),
          background: 'transparent',
          foreColor: '#f9fafb',
          fontFamily: 'Roboto, "Helvetica Neue", sans-serif',
          animations: {
            enabled: false
          },
          // Ensure chart has a unique ID to avoid conflicts
          id: `chart-${Math.random().toString(36).substr(2, 9)}`
        },

        // Colors
        colors: this.chartData.colors || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],

        // Labels (only for pie/donut charts)
        labels: (this.chartType === 'pie' || this.chartType === 'donut') ? this.chartData.labels : undefined,

        // Legend
        legend: {
          show: true,
          position: 'bottom',
          labels: {
            colors: '#f9fafb'
          }
        },

        // Data labels
        dataLabels: {
          enabled: true,
          style: {
            colors: ['#fff']
          }
        },

        // Tooltip
        tooltip: {
          theme: 'dark'
        }
      };

      // Add xaxis for bar/line charts
      if (this.chartType !== 'pie' && this.chartType !== 'donut') {
        this.apexChartOptions.xaxis = {
          categories: this.chartData.labels,
          labels: {
            style: {
              colors: '#f9fafb'
            }
          }
        };
      }

      // Add plotOptions for donut charts
      if (this.chartType === 'donut') {
        this.apexChartOptions.plotOptions = {
          pie: {
            donut: {
              size: '70%'
            }
          }
        };
      }

      // Mark chart as ready
      this.isChartReady = true;

      // Enable rendering after a short delay to ensure DOM is stable
      setTimeout(() => {
        this.shouldRenderChart = true;
        this.cdr.detectChanges();
      }, 100);

      this.loggingService.info(`[${this.LOG_TAG}] ApexChart configuration setup completed for type "${this.chartType}".`, undefined, this.LOG_TAG);
      this.loggingService.debug(`[${this.LOG_TAG}] Series data:`, this.apexSeries, this.LOG_TAG);
      this.loggingService.debug(`[${this.LOG_TAG}] Chart options:`, this.apexChartOptions, this.LOG_TAG);

    } catch (error) {
      this.loggingService.error(`[${this.LOG_TAG}] Error setting up ApexChart:`, error, this.LOG_TAG);
      this.isChartReady = false;
    }
  }

  /**
   * Triggers the download of the chart as an image (PNG, JPG, or SVG).
   * ApexCharts provides built-in export functionality.
   * @param format The desired image format ('png' | 'jpg' | 'svg').
   */
  downloadChart(format: 'png' | 'jpg' | 'svg'): void {
    this.loggingService.info(`[${this.LOG_TAG}] Download chart requested. Format: ${format}.`, undefined, this.LOG_TAG);

    // ApexCharts provides built-in export functionality
    // This would be implemented using ApexCharts.exec() method
    // For now, we'll log the action
    this.loggingService.info(`[${this.LOG_TAG}] Chart download functionality available with ApexCharts built-in export.`, undefined, this.LOG_TAG);

    // TODO: Implement ApexCharts export functionality
    // Example: ApexCharts.exec('chart-id', 'exportChart', { type: format });
  }
}
