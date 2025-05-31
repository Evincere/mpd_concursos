import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

import { FunnelData, DropOffPoint } from '@core/services/admin/inscription-analytics.service';
import { InscriptionStep } from '@shared/enums/inscription-step.enum';

@Component({
  selector: 'app-inscription-funnel',
  templateUrl: './inscription-funnel.component.html',
  styleUrls: ['./inscription-funnel.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    MatDividerModule
  ]
})
export class InscriptionFunnelComponent implements OnChanges {
  @Input() funnelData: FunnelData | null = null;
  @Input() dropOffPoints: DropOffPoint[] = [];
  
  // Datos procesados para la visualización
  funnelSteps: {
    step: InscriptionStep;
    label: string;
    count: number;
    percentage: number;
    width: number;
    dropOffCount: number;
    dropOffPercentage: number;
    averageTimeInMinutes: number;
    icon: string;
    color: string;
  }[] = [];
  
  
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['funnelData'] && this.funnelData) {
      this.processFunnelData();
    }
  }
  
  /**
   * Procesa los datos del embudo para la visualización
   */
  private processFunnelData(): void {
    if (!this.funnelData) return;
    
    this.funnelSteps = this.funnelData.steps.map(step => {
      return {
        step: step.step,
        label: this.getStepLabel(step.step),
        count: step.count,
        percentage: step.percentage,
        width: step.percentage, // El ancho del embudo es proporcional al porcentaje
        dropOffCount: step.dropOffCount,
        dropOffPercentage: step.dropOffPercentage,
        averageTimeInMinutes: step.averageTimeInMinutes,
        icon: this.getStepIcon(step.step),
        color: this.getStepColor(step.step)
      };
    });
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
   * Formatea un tiempo en minutos
   * @param minutes Tiempo en minutos
   * @returns Tiempo formateado
   */
  formatTime(minutes: number): string {
    if (minutes < 1) {
      return 'Menos de 1 minuto';
    } else if (minutes < 60) {
      return `${minutes.toFixed(0)} minutos`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours} hora${hours !== 1 ? 's' : ''} ${mins > 0 ? `y ${mins.toFixed(0)} minutos` : ''}`;
    }
  }
  
  /**
   * Obtiene los detalles de abandono para un paso
   * @param step Paso de inscripción
   * @returns Detalles de abandono
   */
  getDropOffDetails(step: InscriptionStep): DropOffPoint | undefined {
    return this.dropOffPoints.find(point => point.step === step);
  }
}
