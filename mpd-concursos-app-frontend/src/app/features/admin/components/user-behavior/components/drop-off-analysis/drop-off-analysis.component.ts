import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';

import { DropOffPoint } from '@core/services/admin/inscription-analytics.service';
import { InscriptionStep } from '@shared/enums/inscription-step.enum';

@Component({
  selector: 'app-drop-off-analysis',
  templateUrl: './drop-off-analysis.component.html',
  styleUrls: ['./drop-off-analysis.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    MatTableModule,
    MatDividerModule
  ]
})
export class DropOffAnalysisComponent implements OnChanges {
  @Input() dropOffPoints: DropOffPoint[] = [];

  // Columnas para la tabla de puntos de abandono
  displayedColumns: string[] = ['step', 'count', 'percentage', 'topReason'];

  // Datos procesados para la visualización
  processedDropOffPoints: {
    step: InscriptionStep;
    label: string;
    count: number;
    percentage: number;
    topReason: string;
    topReasonPercentage: number;
    icon: string;
    color: string;
    reasons: {
      reason: string;
      count: number;
      percentage: number;
    }[];
  }[] = [];

  // Punto de abandono seleccionado para detalles
  selectedDropOffPoint: {
    step: InscriptionStep;
    label: string;
    count: number;
    percentage: number;
    topReason: string;
    topReasonPercentage: number;
    icon: string;
    color: string;
    reasons: {
      reason: string;
      count: number;
      percentage: number;
    }[];
  } | null = null;



  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dropOffPoints'] && this.dropOffPoints) {
      this.processDropOffPoints();
    }
  }

  /**
   * Procesa los puntos de abandono para la visualización
   */
  private processDropOffPoints(): void {
    this.processedDropOffPoints = this.dropOffPoints.map(point => {
      const topReason = point.reasons && point.reasons.length > 0
        ? point.reasons.sort((a, b) => b.count - a.count)[0]
        : { reason: 'Desconocido', count: 0, percentage: 0 };

      return {
        step: point.step,
        label: this.getStepLabel(point.step),
        count: point.count,
        percentage: point.percentage,
        topReason: topReason.reason,
        topReasonPercentage: topReason.percentage,
        icon: this.getStepIcon(point.step),
        color: this.getStepColor(point.step),
        reasons: point.reasons || []
      };
    });

    // Ordenar por cantidad de abandonos (de mayor a menor)
    this.processedDropOffPoints.sort((a, b) => b.count - a.count);

    // Seleccionar el primer punto por defecto
    if (this.processedDropOffPoints.length > 0) {
      this.selectedDropOffPoint = this.processedDropOffPoints[0];
    }
  }

  /**
   * Selecciona un punto de abandono para ver sus detalles
   * @param point Punto de abandono
   */
  selectDropOffPoint(point: {
    step: InscriptionStep;
    label: string;
    count: number;
    percentage: number;
    topReason: string;
    topReasonPercentage: number;
    icon: string;
    color: string;
    reasons: {
      reason: string;
      count: number;
      percentage: number;
    }[];
  }): void {
    this.selectedDropOffPoint = point;
  }

  /**
   * Obtiene la etiqueta de un paso
   * @param step Paso de inscripción
   * @returns Etiqueta del paso
   */
  getStepLabel(step: InscriptionStep): string {
    switch (step) {
      case InscriptionStep.INITIAL:
        return 'Inicio';
      case InscriptionStep.TERMS_ACCEPTANCE:
        return 'Términos y Condiciones';
      case InscriptionStep.LOCATION_SELECTION:
        return 'Selección de Ubicación';
      case InscriptionStep.DOCUMENTATION:
        return 'Documentación';
      case InscriptionStep.DATA_CONFIRMATION:
        return 'Confirmación de Datos';
      case InscriptionStep.COMPLETED:
        return 'Completado';
      default:
        return 'Desconocido';
    }
  }

  /**
   * Obtiene el icono de un paso
   * @param step Paso de inscripción
   * @returns Icono del paso
   */
  getStepIcon(step: InscriptionStep): string {
    switch (step) {
      case InscriptionStep.INITIAL:
        return 'play_arrow';
      case InscriptionStep.TERMS_ACCEPTANCE:
        return 'gavel';
      case InscriptionStep.LOCATION_SELECTION:
        return 'place';
      case InscriptionStep.DOCUMENTATION:
        return 'description';
      case InscriptionStep.DATA_CONFIRMATION:
        return 'fact_check';
      case InscriptionStep.COMPLETED:
        return 'check_circle';
      default:
        return 'help';
    }
  }

  /**
   * Obtiene el color de un paso
   * @param step Paso de inscripción
   * @returns Color del paso
   */
  getStepColor(step: InscriptionStep): string {
    switch (step) {
      case InscriptionStep.INITIAL:
        return '#3f51b5'; // Indigo
      case InscriptionStep.TERMS_ACCEPTANCE:
        return '#2196f3'; // Blue
      case InscriptionStep.LOCATION_SELECTION:
        return '#00bcd4'; // Cyan
      case InscriptionStep.DOCUMENTATION:
        return '#009688'; // Teal
      case InscriptionStep.DATA_CONFIRMATION:
        return '#4caf50'; // Green
      case InscriptionStep.COMPLETED:
        return '#8bc34a'; // Light Green
      default:
        return '#9e9e9e'; // Grey
    }
  }

  /**
   * Formatea un porcentaje
   * @param value Valor del porcentaje
   * @returns Porcentaje formateado
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  /**
   * Calcula el porcentaje total de abandonos
   * @returns Porcentaje total de abandonos
   */
  getTotalDropOffPercentage(): number {
    const totalCount = this.processedDropOffPoints.reduce((sum, point) => sum + point.count, 0);
    return totalCount;
  }
}
