import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';

import { AlertThreshold } from '@core/services/admin/system-monitoring.service';


@Component({
  selector: 'app-alert-configuration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './alert-configuration.component.html',
  styleUrls: ['./alert-configuration.component.scss']
})
export class AlertConfigurationComponent implements OnInit, OnDestroy, OnChanges {
  @Input() alertThresholds: AlertThreshold[] = [];
  @Output() updateThreshold = new EventEmitter<AlertThreshold>();

  private destroy$ = new Subject<void>();

  // Formulario de configuración
  configForm: FormGroup;

  // Tipos de métricas disponibles
  metricTypes = [
    { value: 'cpu.usage', label: 'Uso de CPU (%)' },
    { value: 'memory.usage', label: 'Uso de Memoria (%)' },
    { value: 'disk.usage', label: 'Uso de Disco (%)' },
    { value: 'api.responseTime', label: 'Tiempo de Respuesta (ms)' },
    { value: 'api.errorRate', label: 'Tasa de Errores (%)' },
    { value: 'database.connections', label: 'Conexiones Activas' }
  ];

  // Tipos de severidad
  severityTypes = [
    { value: 'info', label: 'Información' },
    { value: 'warning', label: 'Advertencia' },
    { value: 'error', label: 'Error' },
    { value: 'critical', label: 'Crítica' }
  ];

  // Operadores disponibles
  operators = [
    { value: '>', label: 'Mayor que (>)' },
    { value: '<', label: 'Menor que (<)' },
    { value: '>=', label: 'Mayor o igual (>=)' },
    { value: '<=', label: 'Menor o igual (<=)' },
    { value: '==', label: 'Igual a (==)' },
    { value: '!=', label: 'Diferente de (!=)' }
  ];

  constructor(private fb: FormBuilder) {
    this.configForm = this.createForm();
  }

  ngOnInit(): void {
    // Logging implementado con LoggingService;
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Manejar cambios en los inputs
    if (changes['alertThresholds'] && !changes['alertThresholds'].firstChange) {
      // Actualizar configuración cuando cambien los thresholds
    }
  }

  ngOnDestroy(): void {
    // Limpieza de recursos
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Crea el formulario de configuración
   */
  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      description: [''],
      metricName: ['', Validators.required],
      operator: ['>', Validators.required],
      threshold: ['', [Validators.required, Validators.min(0)]],
      severity: ['warning', Validators.required],
      enabled: [true],
      cooldownMinutes: [15, [Validators.required, Validators.min(1)]]
    });
  }

  /**
   * Guarda una nueva configuración de alerta
   */
  onSaveThreshold(): void {
    if (this.configForm.valid) {
      const formValue = this.configForm.value;
      const newThreshold: AlertThreshold = {
        id: this.generateId(),
        name: formValue.name,
        description: formValue.description || '',
        metricName: formValue.metricName,
        operator: formValue.operator,
        threshold: formValue.threshold,
        severity: formValue.severity,
        enabled: formValue.enabled,
        notificationChannels: ['system'],
        cooldownMinutes: formValue.cooldownMinutes
      };

      this.updateThreshold.emit(newThreshold);
      this.configForm.reset();
      this.configForm.patchValue({
        enabled: true,
        operator: '>',
        severity: 'warning',
        cooldownMinutes: 15
      });
    }
  }

  /**
   * Actualiza una configuración existente
   */
  onUpdateThreshold(threshold: AlertThreshold): void {
    this.updateThreshold.emit(threshold);
  }

  /**
   * Alterna el estado habilitado/deshabilitado de una alerta
   */
  onToggleThreshold(threshold: AlertThreshold): void {
    const updatedThreshold: AlertThreshold = {
      ...threshold,
      enabled: !threshold.enabled
    };
    this.updateThreshold.emit(updatedThreshold);
  }

  /**
   * Obtiene la etiqueta para un tipo de métrica
   */
  getMetricTypeLabel(metricName: string): string {
    const metric = this.metricTypes.find(m => m.value === metricName);
    return metric ? metric.label : metricName;
  }

  /**
   * Obtiene la etiqueta para un tipo de severidad
   */
  getSeverityLabel(severity: string): string {
    const sev = this.severityTypes.find(s => s.value === severity);
    return sev ? sev.label : severity;
  }

  /**
   * Obtiene la clase CSS para el tipo de severidad
   */
  getSeverityClass(severity: string): string {
    switch (severity) {
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
   * Obtiene el icono para el tipo de severidad
   */
  getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'info':
        return 'ℹ️';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'critical':
        return '🚨';
      default:
        return '📊';
    }
  }

  /**
   * Obtiene la etiqueta para un operador
   */
  getOperatorLabel(operator: string): string {
    const op = this.operators.find(o => o.value === operator);
    return op ? op.label : operator;
  }

  /**
   * Formatea una fecha
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  /**
   * Genera un ID único
   */
  private generateId(): string {
    return 'threshold_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
  }
}
