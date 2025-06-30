/**
 * Servicio de Visualización de Educación
 * 
 * @description Servicio especializado para formateo y visualización de datos de educación
 * @author Augment Agent
 * @date 2025-06-29
 * @version 1.0.0
 */

import { Injectable } from '@angular/core';
import {
  EducationType,
  EducationStatus,
  EducationEntry
} from '@core/models/cv';
import {
  getEducationConfig,
  EDUCATION_STATUS_LABELS,
  EDUCATION_TYPE_LABELS
} from '@core/models/cv/education-rules.model';

/**
 * Información adicional para mostrar en cards
 */
export interface EducationDisplayInfo {
  icon: string;
  label: string;
  value: string;
}

/**
 * Configuración de fechas formateadas
 */
export interface FormattedDateInfo {
  primary: string;
  secondary?: string;
  showDuration: boolean;
  duration?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EducationDisplayService {

  /**
   * Formatea las fechas de educación según el tipo y estado
   */
  formatEducationDates(education: EducationEntry): FormattedDateInfo {
    const config = getEducationConfig(education.type, education.status);
    
    switch (config.displayConfig.dateFormat) {
      case 'issue-only':
        return this.formatIssueOnlyDates(education);
      
      case 'start-ongoing':
        return this.formatStartOngoingDates(education);
      
      case 'start-end':
        return this.formatStartEndDates(education);
      
      case 'custom':
        return this.formatCustomDates(education);
      
      default:
        return this.formatStartEndDates(education);
    }
  }

  /**
   * Obtiene información adicional para mostrar en la card
   */
  getEducationAdditionalInfo(education: EducationEntry): EducationDisplayInfo[] {
    const config = getEducationConfig(education.type, education.status);
    const info: EducationDisplayInfo[] = [];

    // Agregar información según los campos adicionales configurados
    config.displayConfig.additionalFields.forEach(fieldName => {
      const fieldInfo = this.getFieldDisplayInfo(education, fieldName);
      if (fieldInfo) {
        info.push(fieldInfo);
      }
    });

    // Agregar promedio si está configurado y disponible
    if (config.displayConfig.showPromedio && (education as any).average) {
      info.push({
        icon: 'star',
        label: 'Promedio',
        value: `${(education as any).average}/10`
      });
    }

    return info;
  }

  /**
   * Obtiene la etiqueta del tipo de educación
   */
  getEducationTypeLabel(type: EducationType): string {
    return EDUCATION_TYPE_LABELS[type] || type;
  }

  /**
   * Obtiene la etiqueta del estado de educación
   */
  getEducationStatusLabel(status: EducationStatus): string {
    return EDUCATION_STATUS_LABELS[status] || status;
  }

  /**
   * Determina si debe mostrar la duración
   */
  shouldShowDuration(education: EducationEntry): boolean {
    const config = getEducationConfig(education.type, education.status);
    return config.displayConfig.showDuration;
  }

  /**
   * Calcula y formatea la duración de un estudio
   */
  calculateDuration(education: EducationEntry): string | null {
    if (!this.shouldShowDuration(education)) {
      return null;
    }

    // Para estudios en curso, calcular desde fecha de inicio hasta ahora
    if (education.status === EducationStatus.IN_PROGRESS && education.startDate) {
      const startDate = new Date(education.startDate);
      const now = new Date();
      return this.formatDurationBetweenDates(startDate, now);
    }

    // Para estudios completados, usar duración especificada o calcular
    if (education.status === EducationStatus.COMPLETED) {
      // Si hay duración especificada, usarla
      if ((education as any).durationYears) {
        const years = (education as any).durationYears;
        return years >= 1 ? `${years} años` : `${Math.round(years * 12)} meses`;
      }

      // Si hay fechas de inicio y fin, calcular
      if (education.startDate && education.endDate) {
        const startDate = new Date(education.startDate);
        const endDate = new Date(education.endDate);
        return this.formatDurationBetweenDates(startDate, endDate);
      }
    }

    return null;
  }

  /**
   * Formatea una fecha individual
   */
  formatSingleDate(date: Date | string): string {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';

    return dateObj.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Formato para carreras de grado finalizadas (solo fecha de emisión)
   */
  private formatIssueOnlyDates(education: EducationEntry): FormattedDateInfo {
    const issueDate = education.endDate || education.startDate; // endDate se usa como issueDate
    
    return {
      primary: issueDate ? `Título emitido: ${this.formatSingleDate(issueDate)}` : 'Sin fecha de emisión',
      showDuration: false
    };
  }

  /**
   * Formato para estudios en curso
   */
  private formatStartOngoingDates(education: EducationEntry): FormattedDateInfo {
    const startDate = education.startDate;
    const duration = this.calculateDuration(education);
    
    return {
      primary: startDate ? `Iniciado: ${this.formatSingleDate(startDate)}` : 'Sin fecha de inicio',
      secondary: 'En curso',
      showDuration: true,
      duration: duration || undefined
    };
  }

  /**
   * Formato para estudios con inicio y fin
   */
  private formatStartEndDates(education: EducationEntry): FormattedDateInfo {
    const startDate = education.startDate;
    const endDate = education.endDate;
    const duration = this.calculateDuration(education);
    
    if (!startDate && !endDate) {
      return {
        primary: 'Sin fechas',
        showDuration: false
      };
    }

    if (startDate && endDate) {
      return {
        primary: `Período: ${this.formatSingleDate(startDate)} - ${this.formatSingleDate(endDate)}`,
        showDuration: true,
        duration: duration || undefined
      };
    }

    if (startDate) {
      return {
        primary: `Iniciado: ${this.formatSingleDate(startDate)}`,
        secondary: education.status === EducationStatus.IN_PROGRESS ? 'En curso' : undefined,
        showDuration: true,
        duration: duration || undefined
      };
    }

    return {
      primary: endDate ? `Finalizado: ${this.formatSingleDate(endDate)}` : 'Sin fechas',
      showDuration: false
    };
  }

  /**
   * Formato personalizado para actividades científicas
   */
  private formatCustomDates(education: EducationEntry): FormattedDateInfo {
    const placeDate = (education as any).expositionPlaceDate;
    
    if (placeDate) {
      return {
        primary: `Realizada: ${placeDate}`,
        showDuration: false
      };
    }

    return {
      primary: education.status === EducationStatus.IN_PROGRESS ? 'En desarrollo' : 'Sin información de lugar/fecha',
      showDuration: false
    };
  }

  /**
   * Obtiene información de display para un campo específico
   */
  private getFieldDisplayInfo(education: EducationEntry, fieldName: string): EducationDisplayInfo | null {
    const value = (education as any)[fieldName];
    if (!value) return null;

    switch (fieldName) {
      case 'durationYears':
        const years = value;
        const formattedDuration = years >= 1 ? `${years} años` : `${Math.round(years * 12)} meses`;
        return {
          icon: 'clock',
          label: 'Duración',
          value: formattedDuration
        };

      case 'thesisTopic':
        return {
          icon: 'book',
          label: 'Tema de tesis',
          value: value.length > 50 ? `${value.substring(0, 50)}...` : value
        };

      case 'hourlyLoad':
        return {
          icon: 'clock',
          label: 'Carga horaria',
          value: `${value} horas`
        };

      case 'hadFinalEvaluation':
        return {
          icon: 'check-circle',
          label: 'Evaluación final',
          value: value ? 'Sí' : 'No'
        };

      case 'activityType':
        const activityLabels = {
          'RESEARCH': 'Investigación',
          'PRESENTATION': 'Presentación',
          'PUBLICATION': 'Publicación'
        };
        return {
          icon: 'flask',
          label: 'Tipo',
          value: (activityLabels as any)[value] || value
        };

      case 'role':
        const roleLabels = {
          'AUTHOR': 'Autor',
          'CO_AUTHOR': 'Coautor',
          'PRESENTER': 'Expositor',
          'RESEARCHER': 'Investigador'
        };
        return {
          icon: 'user',
          label: 'Carácter',
          value: (roleLabels as any)[value] || value
        };

      case 'topic':
        return {
          icon: 'lightbulb',
          label: 'Tema',
          value: value.length > 50 ? `${value.substring(0, 50)}...` : value
        };

      default:
        return null;
    }
  }

  /**
   * Calcula la duración entre dos fechas
   */
  private formatDurationBetweenDates(startDate: Date, endDate: Date): string {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.round(diffDays / 30.44); // Promedio de días por mes
    const diffYears = Math.round(diffMonths / 12);

    if (diffYears >= 1) {
      return `${diffYears} año${diffYears > 1 ? 's' : ''}`;
    } else if (diffMonths >= 1) {
      return `${diffMonths} mes${diffMonths > 1 ? 'es' : ''}`;
    } else {
      return 'Menos de 1 mes';
    }
  }
}
