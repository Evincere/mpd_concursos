import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';

import { DatabaseMetrics } from '@core/services/admin/system-monitoring.service';


@Component({
  selector: 'app-database-monitoring',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './database-monitoring.component.html',
  styleUrls: ['./database-monitoring.component.scss']
})
export class DatabaseMonitoringComponent implements OnInit, OnDestroy, OnChanges {
  @Input() databaseMetrics: DatabaseMetrics | null = null;

  private destroy$ = new Subject<void>();

  constructor() {
    // Constructor vacío
  }

  ngOnInit(): void {
    // Logging implementado con LoggingService;
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Manejar cambios en los inputs
    if (changes['databaseMetrics'] && !changes['databaseMetrics'].firstChange) {
      // Actualizar visualización cuando cambien las métricas
    }
  }

  ngOnDestroy(): void {
    // Limpieza de recursos
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Formatea el tamaño en MB
   * @param mb Tamaño en MB
   * @returns Tamaño formateado
   */
  formatSize(mb: number): string {
    if (mb < 1024) {
      return `${mb.toFixed(2)} MB`;
    } else {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
  }

  /**
   * Obtiene la clase CSS para el estado de una consulta
   * @param executionTime Tiempo de ejecución en ms
   * @returns Clase CSS
   */
  getQueryStatusClass(executionTime: number): string {
    if (executionTime < 100) {
      return 'query-fast';
    } else if (executionTime < 1000) {
      return 'query-normal';
    } else {
      return 'query-slow';
    }
  }

  /**
   * Obtiene el icono para el estado de una consulta
   * @param executionTime Tiempo de ejecución en ms
   * @returns Icono emoji
   */
  getQueryStatusIcon(executionTime: number): string {
    if (executionTime < 100) {
      return '⚡';
    } else if (executionTime < 1000) {
      return '⏱️';
    } else {
      return '🐌';
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
