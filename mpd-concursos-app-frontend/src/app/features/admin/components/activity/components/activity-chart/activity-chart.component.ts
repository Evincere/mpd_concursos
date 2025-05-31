import { Component, OnInit, Input, ElementRef, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

// Nota: En un proyecto real, se utilizaría una biblioteca de gráficos como Chart.js, D3.js o Highcharts.
// Para este ejemplo, implementaremos una versión simplificada de gráficos usando CSS.

// Definición de tipos para las paletas de colores
interface ActionColorPalette {
  LOGIN: string;
  LOGOUT: string;
  CREATE: string;
  UPDATE: string;
  DELETE: string;
  READ: string;
  DOWNLOAD: string;
  UPLOAD: string;
  [key: string]: string;
}

interface ColorPalettes {
  module: string[];
  action: ActionColorPalette;
  user: string[];
  date: string[];
  [key: string]: string[] | ActionColorPalette;
}

@Component({
  selector: 'app-activity-chart',
  templateUrl: './activity-chart.component.html',
  styleUrls: ['./activity-chart.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule
  ]
})
export class ActivityChartComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() data: Record<string, number> = {};
  @Input() chartType: 'bar' | 'pie' | 'line' = 'bar';
  @Input() colorScheme: 'module' | 'action' | 'user' | 'date' = 'module';
  @Input() limit = 0; // 0 = sin límite

  @ViewChild('chartContainer') chartContainer!: ElementRef;

  chartData: { label: string, value: number, percentage: number, color: string }[] = [];
  maxValue = 0;
  totalValue = 0;

  // Las interfaces se han movido fuera de la clase

  // Paletas de colores para diferentes esquemas
  private colorPalettes: ColorPalettes = {
    module: [
      '#4285F4', '#EA4335', '#FBBC05', '#34A853', // Google colors
      '#3498DB', '#E74C3C', '#2ECC71', '#F39C12', // Flat UI colors
      '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', // Material colors
      '#03A9F4', '#00BCD4', '#009688', '#4CAF50'  // More Material colors
    ],
    action: {
      'LOGIN': '#4CAF50',     // Green
      'LOGOUT': '#9E9E9E',    // Grey
      'CREATE': '#2196F3',    // Blue
      'UPDATE': '#FF9800',    // Orange
      'DELETE': '#F44336',    // Red
      'READ': '#03A9F4',      // Light Blue
      'DOWNLOAD': '#00BCD4',  // Cyan
      'UPLOAD': '#009688'     // Teal
    },
    user: [
      '#3498DB', '#E74C3C', '#2ECC71', '#F39C12',
      '#9B59B6', '#1ABC9C', '#D35400', '#34495E'
    ],
    date: ['#4285F4', '#5E97F6', '#7BAAF7', '#99BCF9', '#B6CEFA', '#D4E2FC']
  };



  ngOnInit(): void {
    this.processData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['limit'] || changes['colorScheme']) {
      this.processData();
    }
  }

  ngAfterViewInit(): void {
    // Renderizar el gráfico después de que la vista esté inicializada
    setTimeout(() => this.renderChart(), 0);
  }

  processData(): void {
    if (!this.data || Object.keys(this.data).length === 0) {
      this.chartData = [];
      return;
    }

    // Convertir los datos a un array para poder ordenarlos
    let dataArray = Object.entries(this.data).map(([label, value]) => ({ label, value }));

    // Ordenar por valor (descendente)
    dataArray.sort((a, b) => b.value - a.value);

    // Aplicar límite si está configurado
    if (this.limit > 0 && dataArray.length > this.limit) {
      // Agrupar el resto en "Otros"
      const otherValues = dataArray.slice(this.limit - 1);
      const otherSum = otherValues.reduce((sum, item) => sum + item.value, 0);

      dataArray = dataArray.slice(0, this.limit - 1);
      dataArray.push({ label: 'Otros', value: otherSum });
    }

    // Calcular el valor máximo y total
    this.maxValue = Math.max(...dataArray.map(item => item.value));
    this.totalValue = dataArray.reduce((sum, item) => sum + item.value, 0);

    // Asignar colores y calcular porcentajes
    this.chartData = dataArray.map((item, index) => {
      const percentage = (item.value / this.totalValue) * 100;
      let color;

      if (this.colorScheme === 'action' && item.label in this.colorPalettes.action) {
        color = this.colorPalettes.action[item.label];
      } else {
        const palette = Array.isArray(this.colorPalettes[this.colorScheme])
          ? this.colorPalettes[this.colorScheme] as string[]
          : this.colorPalettes.module; // Fallback a la paleta module
        color = palette[index % palette.length];
      }

      return {
        label: item.label,
        value: item.value,
        percentage,
        color
      };
    });
  }

  renderChart(): void {
    // La renderización real se hace en el template con CSS
    // Este método se deja para posibles mejoras futuras
  }

  getBarHeight(value: number): string {
    if (this.maxValue === 0) return '0%';
    return `${(value / this.maxValue) * 100}%`;
  }

  getBarWidth(value: number): string {
    if (this.totalValue === 0) return '0%';
    return `${(value / this.totalValue) * 100}%`;
  }

  getPieSegmentStyle(index: number): object {
    if (this.chartData.length === 0) return {};

    let startAngle = 0;
    for (let i = 0; i < index; i++) {
      startAngle += this.chartData[i].percentage * 3.6; // 3.6 = 360 / 100
    }

    const angle = this.chartData[index].percentage * 3.6;
    const color = this.chartData[index].color;

    return {
      'transform': `rotate(${startAngle}deg)`,
      'clip-path': angle <= 180
        ? `polygon(50% 50%, 100% 50%, 100% 0, 50% 0)`
        : `polygon(50% 50%, 100% 50%, 100% 0, 0 0, 0 50%)`,
      'background-color': color
    };
  }

  getLinePointPosition(index: number, total: number): { left: string, bottom: string } {
    if (total === 0) return { left: '0%', bottom: '0%' };

    const value = this.chartData[index].value;
    const xPos = (index / (total - 1)) * 100;
    const yPos = (value / this.maxValue) * 100;

    return {
      left: `${xPos}%`,
      bottom: `${yPos}%`
    };
  }

  formatValue(value: number): string {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  }

  formatPercentage(percentage: number): string {
    return `${percentage.toFixed(1)}%`;
  }

  formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString();
    } catch (_e) {
      return dateStr;
    }
  }
}
