/**
 * Servicio de Validación de Educación
 * 
 * @description Servicio especializado para validación de formularios de educación
 * @author Augment Agent
 * @date 2025-06-29
 * @version 1.0.0
 */

import { Injectable } from '@angular/core';
import { FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import {
  EducationType,
  EducationStatus,
  EducationDto
} from '@core/models/cv';
import {
  getEducationRules,
  getEducationConfig,
  EducationTypeRules,
  EducationFieldConfig,
  EDUCATION_STATUS_LABELS,
  EDUCATION_TYPE_LABELS
} from '@core/models/cv/education-rules.model';

/**
 * Resultado de validación específico para educación
 */
export interface EducationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fieldErrors: Record<string, string>;
}

/**
 * Configuración dinámica de campos para el formulario
 */
export interface DynamicFieldConfiguration {
  fields: EducationFieldConfig[];
  requiredFields: string[];
  conditionalFields: Record<string, (formValue: any) => boolean>;
}

@Injectable({
  providedIn: 'root'
})
export class EducationValidationService {

  /**
   * Valida un DTO de educación completo
   */
  validateEducationDto(dto: EducationDto): EducationValidationResult {
    const result: EducationValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      fieldErrors: {}
    };

    try {
      const config = getEducationConfig(dto.type, dto.status);
      
      // Validar campos requeridos
      this.validateRequiredFields(dto, config.fields, result);
      
      // Validar fechas según las reglas del tipo
      this.validateDates(dto, config.dateValidation, result);
      
      // Validar campos específicos
      this.validateSpecificFields(dto, result);
      
      // Determinar si es válido
      result.isValid = result.errors.length === 0;
      
    } catch (error) {
      result.isValid = false;
      result.errors.push('Error interno de validación');
      console.error('[EducationValidationService] Error validating DTO:', error);
    }

    return result;
  }

  /**
   * Obtiene la configuración dinámica de campos para un tipo y estado específico
   */
  getDynamicFieldConfiguration(type: EducationType, status: EducationStatus): DynamicFieldConfiguration {
    const config = getEducationConfig(type, status);
    
    return {
      fields: config.fields,
      requiredFields: config.fields.filter(f => f.required).map(f => f.name),
      conditionalFields: this.buildConditionalFields(type, status)
    };
  }

  /**
   * Valida un FormGroup en tiempo real
   */
  validateFormGroup(form: FormGroup): EducationValidationResult {
    const formValue = form.value;
    
    if (!formValue.type || !formValue.status) {
      return {
        isValid: false,
        errors: ['Tipo y estado son requeridos'],
        warnings: [],
        fieldErrors: {}
      };
    }

    // Convertir FormGroup value a DTO
    const dto: EducationDto = {
      type: formValue.type,
      status: formValue.status,
      title: formValue.title || '',
      institution: formValue.institution || '',
      startDate: formValue.startDate || '',
      endDate: formValue.endDate,
      isOngoing: formValue.isOngoing || false,
      durationYears: formValue.durationYears,
      average: formValue.average,
      thesisTopic: formValue.thesisTopic,
      hourlyLoad: formValue.hourlyLoad,
      activityType: formValue.activityType,
      role: formValue.role,
      topic: formValue.topic,
      comments: formValue.comments
    };

    return this.validateEducationDto(dto);
  }

  /**
   * Obtiene las etiquetas de tipo y estado
   */
  getLabels() {
    return {
      types: EDUCATION_TYPE_LABELS,
      statuses: EDUCATION_STATUS_LABELS
    };
  }

  /**
   * Verifica si un campo debe mostrarse según el tipo y estado actual
   */
  shouldShowField(fieldName: string, type: EducationType, status: EducationStatus): boolean {
    const config = getEducationConfig(type, status);
    return config.fields.some(field => field.name === fieldName);
  }

  /**
   * Obtiene la configuración de un campo específico
   */
  getFieldConfig(fieldName: string, type: EducationType, status: EducationStatus): EducationFieldConfig | null {
    const config = getEducationConfig(type, status);
    return config.fields.find(field => field.name === fieldName) || null;
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Valida campos requeridos
   */
  private validateRequiredFields(
    dto: EducationDto, 
    fields: EducationFieldConfig[], 
    result: EducationValidationResult
  ): void {
    fields.forEach(field => {
      if (field.required) {
        const value = (dto as any)[field.name];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          result.errors.push(`${field.label} es requerido`);
          result.fieldErrors[field.name] = `${field.label} es requerido`;
        }
      }
    });
  }

  /**
   * Valida fechas según las reglas del tipo
   */
  private validateDates(dto: EducationDto, dateValidation: any, result: EducationValidationResult): void {
    // Validar fecha de inicio si es requerida
    if (dateValidation.requiresStartDate && !dto.startDate) {
      result.errors.push('Fecha de inicio es requerida');
      result.fieldErrors['startDate'] = 'Fecha de inicio es requerida';
    }

    // Validar fecha de emisión si es requerida
    if (dateValidation.requiresIssueDate && !dto.endDate) {
      result.errors.push('Fecha de emisión del título es requerida');
      result.fieldErrors['issueDate'] = 'Fecha de emisión del título es requerida';
    }

    // Validación personalizada si existe
    if (dateValidation.customValidation && dto.startDate && dto.endDate) {
      const customResult = dateValidation.customValidation({
        startDate: dto.startDate,
        issueDate: dto.endDate // En el DTO, endDate se usa como issueDate
      });
      
      if (!customResult.isValid && customResult.error) {
        result.errors.push(customResult.error);
        result.fieldErrors['issueDate'] = customResult.error;
      }
    }
  }

  /**
   * Valida campos específicos (promedio, carga horaria, etc.)
   */
  private validateSpecificFields(dto: EducationDto, result: EducationValidationResult): void {
    // Validar promedio
    if (dto.average !== undefined && dto.average !== null) {
      if (dto.average < 1 || dto.average > 10) {
        result.errors.push('El promedio debe estar entre 1 y 10');
        result.fieldErrors['average'] = 'El promedio debe estar entre 1 y 10';
      }
    }

    // Validar carga horaria
    if (dto.hourlyLoad !== undefined && dto.hourlyLoad !== null) {
      if (dto.hourlyLoad < 1 || dto.hourlyLoad > 2000) {
        result.errors.push('La carga horaria debe estar entre 1 y 2000 horas');
        result.fieldErrors['hourlyLoad'] = 'La carga horaria debe estar entre 1 y 2000 horas';
      }
    }

    // Validar duración en años
    if (dto.durationYears !== undefined && dto.durationYears !== null) {
      if (dto.durationYears < 0.5 || dto.durationYears > 15) {
        result.errors.push('La duración debe estar entre 0.5 y 15 años');
        result.fieldErrors['durationYears'] = 'La duración debe estar entre 0.5 y 15 años';
      }
    }
  }

  /**
   * Construye las reglas de campos condicionales
   */
  private buildConditionalFields(type: EducationType, status: EducationStatus): Record<string, (formValue: any) => boolean> {
    const conditionalFields: Record<string, (formValue: any) => boolean> = {};

    // Lógica específica según el tipo
    switch (type) {
      case EducationType.UNDERGRADUATE_CAREER:
        conditionalFields['issueDate'] = (formValue) => formValue.status === EducationStatus.COMPLETED;
        conditionalFields['startDate'] = (formValue) => formValue.status === EducationStatus.IN_PROGRESS;
        conditionalFields['average'] = (formValue) => formValue.status === EducationStatus.COMPLETED;
        break;

      case EducationType.SCIENTIFIC_ACTIVITY:
        conditionalFields['expositionPlaceDate'] = () => true; // Siempre visible para actividad científica
        break;

      default:
        conditionalFields['issueDate'] = (formValue) => formValue.status === EducationStatus.COMPLETED;
        conditionalFields['startDate'] = () => true; // Siempre requerido para otros tipos
        break;
    }

    return conditionalFields;
  }
}
