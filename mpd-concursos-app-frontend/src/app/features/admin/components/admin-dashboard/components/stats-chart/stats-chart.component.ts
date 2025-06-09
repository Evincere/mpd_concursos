import { Component, Input, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import Chart from 'chart.js/auto';
import { LoggingService } from '@core/services/logging/logging.service'; // Assuming path to LoggingService

/**
 * Interface for the data structure expected by Chart.js.
 */
export interface ChartData {
  labels: string[]; // Labels for the x-axis or segments (e.g., categories, dates)
  datasets: {
    label: string; // Label for the dataset (e.g., "Sales", "Users")
    data: number[]; // Array of data points
    backgroundColor?: string | string[]; // Color(s) for bars/segments
    borderColor?: string | string[]; // Border color(s) for elements
    borderWidth?: number; // Border width for elements
    fill?: boolean; // Whether to fill the area under the line (for line charts)
    tension?: number; // Line tension (for line charts, 0 for sharp, 0.4 for smooth)
  }[];
}

@Component({
  selector: 'app-stats-chart',
  templateUrl: './stats-chart.component.html',
  styleUrls: ['./stats-chart.component.scss'],
  standalone: true, // Indicates that this is a standalone component
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule
  ]
})
export class StatsChartComponent implements AfterViewInit {
  // Reference to the canvas element in the template
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  // Input properties for chart configuration
  @Input() title = 'Estadísticas'; // Card title
  @Input() subtitle = ''; // Card subtitle
  @Input() chartType: 'bar' | 'line' | 'pie' | 'doughnut' = 'bar'; // Type of chart
  @Input() chartData!: ChartData; // Data for the chart
  @Input() chartOptions: Record<string, unknown> = {}; // Custom options for Chart.js
  @Input() height = '300px'; // Height of the chart container

  private chart: Chart | null = null; // Holds the Chart.js instance
  private readonly LOG_TAG = 'StatsChartComponent'; // Tag for logging

  constructor(private loggingService: LoggingService) {
    this.loggingService.debug(`[${this.LOG_TAG}] StatsChartComponent constructor called.`, undefined, this.LOG_TAG);
  }

  /**
   * Lifecycle hook that is called after Angular has initialized all of the component's views and child views.
   * This is where the Chart.js instance is created, as the canvas element is available at this stage.
   */
  ngAfterViewInit(): void {
    this.loggingService.info(`[${this.LOG_TAG}] ngAfterViewInit called.`, undefined, this.LOG_TAG);
    if (this.chartCanvas && this.chartData) {
      this.loggingService.debug(`[${this.LOG_TAG}] chartCanvas and chartData are available. Creating chart.`, undefined, this.LOG_TAG);
      this.createChart();
    } else {
      this.loggingService.warn(`[${this.LOG_TAG}] Cannot create chart: chartCanvas or chartData not available.`, { chartCanvas: !!this.chartCanvas, chartData: !!this.chartData }, this.LOG_TAG);
    }
  }

  /**
   * Initializes and creates the Chart.js instance using the provided data and options.
   */
  private createChart(): void {
    this.loggingService.info(`[${this.LOG_TAG}] createChart method called. Chart type: ${this.chartType}.`, undefined, this.LOG_TAG);
    const ctx = this.chartCanvas.nativeElement.getContext('2d');

    if (!ctx) {
      this.loggingService.error(`[${this.LOG_TAG}] Failed to get 2D context from canvas element. Chart cannot be created.`, undefined, this.LOG_TAG);
      return;
    }

    // Default options tailored for different chart types
    const defaultOptions: Record<string, unknown> = {
      responsive: true, // Chart will resize with its container
      maintainAspectRatio: false, // Do not maintain aspect ratio, allow flexible sizing
      plugins: {
        legend: {
          display: this.chartType === 'pie' || this.chartType === 'doughnut', // Show legend for pie/doughnut charts
          position: 'bottom', // Position legend at the bottom
          labels: {
            boxWidth: 12, // Small colored box for legend items
            padding: 15 // Padding between legend items
          }
        },
        tooltip: {
          enabled: true, // Enable tooltips on hover
          mode: 'index', // Show tooltip for all datasets at a given index
          intersect: false // Tooltip activates if cursor is near data point, not necessarily directly on it
        }
      },
      scales: {
        x: {
          display: this.chartType !== 'pie' && this.chartType !== 'doughnut', // Hide x-axis for circular charts
          grid: {
            display: false // Hide x-axis grid lines
          }
        },
        y: {
          display: this.chartType !== 'pie' && this.chartType !== 'doughnut', // Hide y-axis for circular charts
          beginAtZero: true, // Start y-axis from zero
          grid: {
            drawBorder: false // Do not draw border for y-axis grid lines
          }
        }
      }
    };

    // Combine default options with any custom options provided by the input
    const options = { ...defaultOptions, ...this.chartOptions };
    this.loggingService.debug(`[${this.LOG_TAG}] Chart options merged. Final options:`, options, this.LOG_TAG);

    // Destroy any existing chart instance to prevent memory leaks and re-render correctly
    if (this.chart) {
      this.chart.destroy();
      this.loggingService.debug(`[${this.LOG_TAG}] Destroyed existing chart instance.`, undefined, this.LOG_TAG);
    }

    // Create the new Chart.js instance
    this.chart = new Chart(ctx, {
      type: this.chartType,
      data: this.chartData,
      options: options
    });
    this.loggingService.info(`[${this.LOG_TAG}] Chart of type "${this.chartType}" created successfully.`, undefined, this.LOG_TAG);
  }

  /**
   * Triggers the download of the chart as an image (PNG or JPG).
   * PDF export is a placeholder and would require an external library.
   * @param format The desired image format ('png' | 'jpg' | 'pdf').
   */
  downloadChart(format: 'png' | 'jpg' | 'pdf'): void {
    this.loggingService.info(`[${this.LOG_TAG}] Download chart requested. Format: ${format}.`, undefined, this.LOG_TAG);

    if (!this.chart) {
      this.loggingService.warn(`[${this.LOG_TAG}] Chart instance not found. Cannot download.`, undefined, this.LOG_TAG);
      return;
    }

    const canvas = this.chartCanvas.nativeElement;

    if (format === 'png' || format === 'jpg') {
      const dataUrl = canvas.toDataURL(`image/${format}`);
      const link = document.createElement('a');
      link.download = `${this.title.toLowerCase().replace(/\s+/g, '-')}.${format}`; // Generate file name
      link.href = dataUrl;
      link.click(); // Programmatically click the link to trigger download
      this.loggingService.info(`[${this.LOG_TAG}] Chart downloaded as ${format}.`, undefined, this.LOG_TAG);
    } else if (format === 'pdf') {
      this.loggingService.warn(`[${this.LOG_TAG}] PDF export is not implemented. Please use an external library like jsPDF.`, undefined, this.LOG_TAG);
      // Implementation for PDF export would go here, typically using a library like jsPDF
      // Example:
      // const pdf = new jsPDF();
      // pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0);
      // pdf.save(`${this.title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } else {
      this.loggingService.warn(`[${this.LOG_TAG}] Unsupported download format requested: ${format}.`, undefined, this.LOG_TAG);
    }
  }
}
