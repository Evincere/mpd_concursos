import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';

import { SystemAlert } from '@core/services/admin/system-monitoring.service';


@Component({
  selector: 'app-system-alerts',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './system-alerts.component.html',
  styleUrls: ['./system-alerts.component.scss']
})
export class SystemAlertsComponent implements OnInit, OnDestroy, OnChanges {
  @Input() systemAlerts: SystemAlert[] = [];
  @Output() acknowledgeAlert = new EventEmitter<string>();
  @Output() resolveAlert = new EventEmitter<string>();

  private destroy$ = new Subject<void>();

  // Filtros para las alertas
  alertFilters = {
    type: 'all',
    status: 'all',
    category: 'all'
  };

  // Alertas filtradas
  filteredAlerts: SystemAlert[] = [];

  constructor() {
    // Constructor vacío
  }

  ngOnInit(): void {
    console.log('System alerts component initialized');
    this.applyFilters();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['systemAlerts']) {
      console.log('System alerts updated:', this.systemAlerts);
      this.applyFilters();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Aplica los filtros a las alertas
   */
  applyFilters(): void {
    this.filteredAlerts = this.systemAlerts.filter(alert => {
      const typeMatch = this.alertFilters.type === 'all' || alert.type === this.alertFilters.type;
      const statusMatch = this.alertFilters.status === 'all' || alert.status === this.alertFilters.status;
      const categoryMatch = this.alertFilters.category === 'all' || alert.category === this.alertFilters.category;

      return typeMatch && statusMatch && categoryMatch;
    });
  }

  /**
   * Cambia el filtro de tipo
   */
  onTypeFilterChange(type: string): void {
    this.alertFilters.type = type;
    this.applyFilters();
  }

  /**
   * Cambia el filtro de estado
   */
  onStatusFilterChange(status: string): void {
    this.alertFilters.status = status;
    this.applyFilters();
  }

  /**
   * Cambia el filtro de categoría
   */
  onCategoryFilterChange(category: string): void {
    this.alertFilters.category = category;
    this.applyFilters();
  }

  /**
   * Acusa recibo de una alerta
   */
  onAcknowledgeAlert(alertId: string): void {
    this.acknowledgeAlert.emit(alertId);
  }

  /**
   * Resuelve una alerta
   */
  onResolveAlert(alertId: string): void {
    this.resolveAlert.emit(alertId);
  }

  /**
   * Obtiene la clase CSS para el tipo de alerta
   */
  getAlertTypeClass(type: string): string {
    switch (type) {
      case 'info':
        return 'alert-info';
      case 'warning':
        return 'alert-warning';
      case 'error':
        return 'alert-error';
      case 'critical':
        return 'alert-critical';
      default:
        return '';
    }
  }

  /**
   * Obtiene el icono para el tipo de alerta
   */
  getAlertTypeIcon(type: string): string {
    switch (type) {
      case 'info':
        return 'ℹ️';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'critical':
        return '🚨';
      default:
        return '❓';
    }
  }

  /**
   * Obtiene la etiqueta para el estado de la alerta
   */
  getAlertStatusLabel(status: string): string {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'acknowledged':
        return 'Acusada';
      case 'resolved':
        return 'Resuelta';
      default:
        return 'Desconocido';
    }
  }

  /**
   * Obtiene la etiqueta para la categoría de la alerta
   */
  getAlertCategoryLabel(category: string): string {
    switch (category) {
      case 'performance':
        return 'Rendimiento';
      case 'database':
        return 'Base de Datos';
      case 'security':
        return 'Seguridad';
      case 'application':
        return 'Aplicación';
      default:
        return 'General';
    }
  }

  /**
   * Formatea una fecha
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
  }
}
