import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import { AppPerformanceMetrics } from   '@core/services/admin/system-monitoring.service';

@Component({
  selector: 'app-app-performance',
  templateUrl: './app-performance.component.html',
  styleUrls: ['./app-performance.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatChipsModule,
    MatDividerModule
  ]
})
export class AppPerformanceComponent implements OnChanges {
  @Input() appPerformanceMetrics: AppPerformanceMetrics | null = null;

  // Columnas para la tabla de endpoints
  endpointColumns: string[] = ['path', 'method', 'totalRequests', 'averageResponseTime', 'errorRate', 'requestsPerMinute', 'status'];

  // Columnas para la tabla de errores
  errorColumns: string[] = ['timestamp', 'type', 'message', 'endpoint', 'userId'];



  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appPerformanceMetrics'] && this.appPerformanceMetrics) {
      console.log('Métricas de rendimiento actualizadas:', this.appPerformanceMetrics);
      // Aquí se podrían procesar los datos para visualizaciones o cálculos adicionales
    }
  }

  /**
   * Formatea el tiempo de actividad
   * @param seconds Tiempo en segundos
   * @returns Tiempo formateado
   */
  formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    let result = '';

    if (days > 0) {
      result += `${days} día${days !== 1 ? 's' : ''} `;
    }

    if (hours > 0 || days > 0) {
      result += `${hours} hora${hours !== 1 ? 's' : ''} `;
    }

    result += `${minutes} minuto${minutes !== 1 ? 's' : ''}`;

    return result;
  }

  /**
   * Formatea el tamaño de memoria
   * @param mb Tamaño en MB
   * @returns Tamaño formateado
   */
  formatMemorySize(mb: number): string {
    if (mb < 1024) {
      return `${mb.toFixed(2)} MB`;
    } else {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
  }

  /**
   * Obtiene la clase CSS para el estado de un endpoint
   * @param status Estado del endpoint
   * @returns Clase CSS
   */
  getEndpointStatusClass(status: string): string {
    switch (status) {
      case 'healthy':
        return 'status-healthy';
      case 'warning':
        return 'status-warning';
      case 'critical':
        return 'status-critical';
      default:
        return '';
    }
  }

  /**
   * Obtiene la etiqueta para el estado de un endpoint
   * @param status Estado del endpoint
   * @returns Etiqueta
   */
  getEndpointStatusLabel(status: string): string {
    switch (status) {
      case 'healthy':
        return 'Saludable';
      case 'warning':
        return 'Advertencia';
      case 'critical':
        return 'Crítico';
      default:
        return 'Desconocido';
    }
  }

  /**
   * Obtiene el icono para el estado de un endpoint
   * @param status Estado del endpoint
   * @returns Icono
   */
  getEndpointStatusIcon(status: string): string {
    switch (status) {
      case 'healthy':
        return 'check_circle';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'help';
    }
  }

  /**
   * Formatea una fecha
   * @param dateString Fecha en formato ISO
   * @returns Fecha formateada
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
  }
}
