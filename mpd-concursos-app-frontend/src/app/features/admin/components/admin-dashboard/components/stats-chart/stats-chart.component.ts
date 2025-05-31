import { Component, Input, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import Chart from 'chart.js/auto';

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
  }[];
}

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
    MatTooltipModule
  ]
})
export class StatsChartComponent implements AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  @Input() title = 'Estadísticas';
  @Input() subtitle = '';
  @Input() chartType: 'bar' | 'line' | 'pie' | 'doughnut' = 'bar';
  @Input() chartData!: ChartData;
  @Input() chartOptions: Record<string, unknown> = {};
  @Input() height = '300px';

  private chart: Chart | null = null;

  // No necesitamos inicialización en ngOnInit ya que todo se hace en ngAfterViewInit

  ngAfterViewInit(): void {
    if (this.chartCanvas && this.chartData) {
      this.createChart();
    }
  }

  private createChart(): void {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');

    if (!ctx) {
      console.error('No se pudo obtener el contexto del canvas');
      return;
    }

    // Opciones por defecto según el tipo de gráfico
    const defaultOptions: Record<string, unknown> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: this.chartType === 'pie' || this.chartType === 'doughnut',
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 15
          }
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          display: this.chartType !== 'pie' && this.chartType !== 'doughnut',
          grid: {
            display: false
          }
        },
        y: {
          display: this.chartType !== 'pie' && this.chartType !== 'doughnut',
          beginAtZero: true,
          grid: {
            drawBorder: false
          }
        }
      }
    };

    // Combinar opciones por defecto con las proporcionadas
    const options = { ...defaultOptions, ...this.chartOptions };

    // Crear el gráfico
    this.chart = new Chart(ctx, {
      type: this.chartType,
      data: this.chartData,
      options: options
    });
  }

  downloadChart(format: 'png' | 'jpg' | 'pdf'): void {
    if (!this.chart) return;

    const canvas = this.chartCanvas.nativeElement;

    if (format === 'png' || format === 'jpg') {
      const dataUrl = canvas.toDataURL(`image/${format}`);
      const link = document.createElement('a');
      link.download = `${this.title.toLowerCase().replace(/\s+/g, '-')}.${format}`;
      link.href = dataUrl;
      link.click();
    } else if (format === 'pdf') {
      // Implementar exportación a PDF si es necesario
      console.log('Exportación a PDF no implementada');
    }
  }
}
