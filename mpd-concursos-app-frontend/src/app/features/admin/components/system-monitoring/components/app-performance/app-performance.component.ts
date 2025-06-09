import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppPerformanceMetrics } from '@core/services/admin/system-monitoring.service';
import { LoggingService } from '@core/services/logging/logging.service'; // Import LoggingService

@Component({
  selector: 'app-app-performance',
  templateUrl: './app-performance.component.html',
  styleUrls: ['./app-performance.component.scss'],
  standalone: true,
  imports: [
    CommonModule
  ]
})
export class AppPerformanceComponent implements OnChanges {
  @Input() appPerformanceMetrics: AppPerformanceMetrics | null = null;

  // Columns for the endpoints table
  endpointColumns: string[] = ['path', 'method', 'totalRequests', 'averageResponseTime', 'errorRate', 'requestsPerMinute', 'status'];

  // Columns for the errors table
  errorColumns: string[] = ['timestamp', 'type', 'message', 'endpoint', 'userId'];

  constructor(private loggingService: LoggingService) {
    this.loggingService.debug('[AppPerformanceComponent] Initializing AppPerformanceComponent.', undefined, 'AppPerformance');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appPerformanceMetrics'] && this.appPerformanceMetrics) {
      this.loggingService.info('[AppPerformanceComponent] appPerformanceMetrics input changed. New metrics:', this.appPerformanceMetrics, 'AppPerformance');
    }
  }

  /**
   * Formats uptime from seconds into a human-readable string (days, hours, minutes).
   * @param seconds Uptime in seconds.
   * @returns Formatted uptime string.
   */
  formatUptime(seconds: number): string {
    this.loggingService.debug(`[AppPerformanceComponent] Formatting uptime for ${seconds} seconds.`, undefined, 'AppPerformance');
    if (seconds < 60) {
      return `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
    }

    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);

    const parts: string[] = [];
    if (d > 0) {
      parts.push(`${d} día${d !== 1 ? 's' : ''}`);
    }
    if (h > 0) {
      parts.push(`${h} hora${h !== 1 ? 's' : ''}`);
    }
    // Only include minutes if there are no days/hours, or if minutes are non-zero.
    // If all are zero, it's handled by the initial 'seconds < 60' check.
    if (m > 0 || (d === 0 && h === 0)) {
      parts.push(`${m} minuto${m !== 1 ? 's' : ''}`);
    }

    return parts.join(' ');
  }

  /**
   * Formats memory size from MB to MB or GB.
   * @param mb Memory size in MB.
   * @returns Formatted memory size string.
   */
  formatMemorySize(mb: number): string {
    this.loggingService.debug(`[AppPerformanceComponent] Formatting memory size: ${mb} MB.`, undefined, 'AppPerformance');
    if (mb < 1024) {
      return `${mb.toFixed(2)} MB`;
    } else {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
  }

  /**
   * Gets the CSS class for an endpoint's status.
   * @param status Endpoint status.
   * @returns CSS class string.
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
   * Gets the label for an endpoint's status.
   * @param status Endpoint status.
   * @returns Label string.
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
   * Gets the emoji icon for an endpoint's status.
   * @param status Endpoint status.
   * @returns Emoji icon.
   */
  getEndpointStatusIcon(status: string): string {
    switch (status) {
      case 'healthy':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'critical':
        return '❌';
      default:
        return '❓';
    }
  }

  /**
   * Formats a date string into a localized string.
   * @param dateString Date in ISO format.
   * @returns Formatted date string.
   */
  formatDate(dateString: string): string {
    this.loggingService.debug(`[AppPerformanceComponent] Formatting date: ${dateString}.`, undefined, 'AppPerformance');
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      this.loggingService.error(`[AppPerformanceComponent] Error formatting date string: ${dateString}`, e, 'AppPerformance');
      return 'Fecha inválida';
    }
  }
}
