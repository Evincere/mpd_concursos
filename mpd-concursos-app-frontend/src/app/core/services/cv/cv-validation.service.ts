/**
 * Servicio de Validación del Sistema CV
 * 
 * @description Servicio para validación de datos con sanitización XSS integrada
 * @author Augment Agent
 * @date 2025-06-20
 * @version 2.0.0
 */

import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  ICvValidationService,
  WorkExperienceDto,
  EducationDto,
  EducationType,
  EducationStatus,
  CV_CONSTANTS
} from '@core/models/cv';

/**
 * Resultado de validación extendido
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedData?: any;
}

/**
 * Configuración de validación de archivos
 */
export interface FileValidationConfig {
  maxSize: number;
  allowedTypes: string[];
  requireSignature?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CvValidationService implements ICvValidationService {

  private readonly emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private readonly phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  private readonly urlRegex = /^https?:\/\/.+/;

  constructor(private sanitizer: DomSanitizer) {}

  // ===== VALIDACIÓN DE EXPERIENCIA LABORAL =====

  /**
   * Valida una experiencia laboral completa
   */
  validateWorkExperience(experience: WorkExperienceDto): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitizedData: Partial<WorkExperienceDto> = {};

    // Validar y sanitizar campos obligatorios
    const positionResult = this.validateAndSanitizeText(experience.position, 'Puesto', true, 3, 200);
    if (!positionResult.isValid) errors.push(...positionResult.errors);
    sanitizedData.position = positionResult.sanitizedValue;

    const companyResult = this.validateAndSanitizeText(experience.company, 'Empresa', true, 2, 100);
    if (!companyResult.isValid) errors.push(...companyResult.errors);
    sanitizedData.company = companyResult.sanitizedValue;

    const descriptionResult = this.validateAndSanitizeText(experience.description, 'Descripción', true, 10, 2000);
    if (!descriptionResult.isValid) errors.push(...descriptionResult.errors);
    sanitizedData.description = descriptionResult.sanitizedValue;

    // Validar fechas
    const dateValidation = this.validateWorkExperienceDates(experience);
    if (!dateValidation.isValid) errors.push(...dateValidation.errors);
    warnings.push(...dateValidation.warnings);

    // Validar campos opcionales
    if (experience.location) {
      const locationResult = this.validateAndSanitizeText(experience.location, 'Ubicación', false, 0, 100);
      if (!locationResult.isValid) warnings.push(...locationResult.errors);
      sanitizedData.location = locationResult.sanitizedValue;
    }

    // Validar tecnologías
    if (experience.technologies && experience.technologies.length > 0) {
      const techValidation = this.validateTechnologies(experience.technologies);
      if (!techValidation.isValid) warnings.push(...techValidation.errors);
      sanitizedData.technologies = techValidation.sanitizedValue;
    }

    // Validar logros
    if (experience.achievements && experience.achievements.length > 0) {
      const achievementsValidation = this.validateAchievements(experience.achievements);
      if (!achievementsValidation.isValid) warnings.push(...achievementsValidation.errors);
      sanitizedData.achievements = achievementsValidation.sanitizedValue;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData
    };
  }

  /**
   * Valida fechas de experiencia laboral
   */
  private validateWorkExperienceDates(experience: WorkExperienceDto): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!experience.startDate) {
      errors.push('La fecha de inicio es obligatoria');
      return { isValid: false, errors, warnings };
    }

    const startDate = new Date(experience.startDate);
    const today = new Date();

    // Validar fecha de inicio
    if (isNaN(startDate.getTime())) {
      errors.push('La fecha de inicio no es válida');
    } else if (startDate > today) {
      errors.push('La fecha de inicio no puede ser futura');
    }

    // Validar fecha de fin si no es trabajo actual
    if (!experience.isCurrentJob && experience.endDate) {
      const endDate = new Date(experience.endDate);
      
      if (isNaN(endDate.getTime())) {
        errors.push('La fecha de fin no es válida');
      } else if (endDate > today) {
        warnings.push('La fecha de fin es futura');
      } else if (endDate <= startDate) {
        errors.push('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      // Validar duración mínima
      const durationDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      if (durationDays < CV_CONSTANTS.MIN_EXPERIENCE_DURATION_DAYS) {
        warnings.push('La duración de la experiencia es muy corta');
      }
    }

    // Validar trabajo actual
    if (experience.isCurrentJob && experience.endDate) {
      warnings.push('Se marcó como trabajo actual pero se especificó fecha de fin');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  // ===== VALIDACIÓN DE EDUCACIÓN =====

  /**
   * Valida una entrada de educación completa
   */
  validateEducation(education: EducationDto): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitizedData: Partial<EducationDto> = {};

    // Validar campos base
    if (!education.type) {
      errors.push('El tipo de educación es obligatorio');
    }

    if (!education.status) {
      errors.push('El estado de la educación es obligatorio');
    }

    // Validar y sanitizar título
    const titleResult = this.validateAndSanitizeText(education.title, 'Título', true, 3, 200);
    if (!titleResult.isValid) errors.push(...titleResult.errors);
    sanitizedData.title = titleResult.sanitizedValue;

    // Validar y sanitizar institución
    const institutionResult = this.validateAndSanitizeText(education.institution, 'Institución', true, 3, 200);
    if (!institutionResult.isValid) errors.push(...institutionResult.errors);
    sanitizedData.institution = institutionResult.sanitizedValue;

    // Validar fechas
    const dateValidation = this.validateEducationDates(education);
    if (!dateValidation.isValid) errors.push(...dateValidation.errors);
    warnings.push(...dateValidation.warnings);

    // Validaciones específicas por tipo
    const typeValidation = this.validateEducationByType(education);
    if (!typeValidation.isValid) errors.push(...typeValidation.errors);
    warnings.push(...typeValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData
    };
  }

  /**
   * Valida fechas de educación
   */
  private validateEducationDates(education: EducationDto): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!education.startDate) {
      errors.push('La fecha de inicio es obligatoria');
      return { isValid: false, errors, warnings };
    }

    const startDate = new Date(education.startDate);
    const today = new Date();

    if (isNaN(startDate.getTime())) {
      errors.push('La fecha de inicio no es válida');
    }

    // Validar fecha de fin según el estado
    if (education.status === EducationStatus.COMPLETED && !education.endDate) {
      errors.push('La fecha de fin es obligatoria para estudios completados');
    }

    if (education.endDate) {
      const endDate = new Date(education.endDate);
      
      if (isNaN(endDate.getTime())) {
        errors.push('La fecha de fin no es válida');
      } else if (endDate <= startDate) {
        errors.push('La fecha de fin debe ser posterior a la fecha de inicio');
      }
    }

    // Validar coherencia con estado
    if (education.isOngoing && education.status === EducationStatus.COMPLETED) {
      errors.push('No puede estar en curso y completado al mismo tiempo');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validaciones específicas por tipo de educación
   */
  private validateEducationByType(education: EducationDto): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (education.type) {
      case EducationType.UNIVERSITY_DEGREE:
        if (education.average && (education.average < 1 || education.average > 10)) {
          errors.push('El promedio debe estar entre 1 y 10');
        }
        if (education.durationYears && (education.durationYears < 1 || education.durationYears > 10)) {
          warnings.push('La duración parece inusual');
        }
        break;

      case EducationType.POSTGRADUATE_SPECIALIZATION:
      case EducationType.MASTER_DEGREE:
      case EducationType.DOCTORATE:
        if (education.thesisTopic) {
          const topicResult = this.validateAndSanitizeText(education.thesisTopic, 'Tema de tesis', false, 10, 500);
          if (!topicResult.isValid) warnings.push(...topicResult.errors);
        }
        break;

      case EducationType.SCIENTIFIC_ACTIVITY:
        if (!education.activityType) {
          errors.push('El tipo de actividad científica es obligatorio');
        }
        if (!education.role) {
          errors.push('El rol en la actividad científica es obligatorio');
        }
        if (!education.topic) {
          errors.push('El tema de la actividad científica es obligatorio');
        }
        break;

      case EducationType.DIPLOMA:
      case EducationType.CERTIFICATION:
        if (education.hourlyLoad && education.hourlyLoad < 1) {
          warnings.push('La carga horaria debe ser positiva');
        }
        break;
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  // ===== VALIDACIÓN DE RANGOS DE FECHAS =====

  /**
   * Valida un rango de fechas genérico
   */
  validateDateRange(startDate: Date, endDate?: Date, isOngoing?: boolean): { isValid: boolean; error?: string } {
    if (!startDate) {
      return { isValid: false, error: 'La fecha de inicio es obligatoria' };
    }

    const today = new Date();
    
    if (startDate > today) {
      return { isValid: false, error: 'La fecha de inicio no puede ser futura' };
    }

    if (endDate && !isOngoing) {
      if (endDate <= startDate) {
        return { isValid: false, error: 'La fecha de fin debe ser posterior a la fecha de inicio' };
      }
    }

    if (isOngoing && endDate) {
      return { isValid: false, error: 'No se puede especificar fecha de fin si está en curso' };
    }

    return { isValid: true };
  }

  // ===== VALIDACIÓN DE ARCHIVOS =====

  /**
   * Valida un archivo subido
   */
  validateFileUpload(file: File, config?: FileValidationConfig): { isValid: boolean; error?: string } {
    const maxSize = config?.maxSize || CV_CONSTANTS.MAX_FILE_SIZE;
    const allowedTypes = config?.allowedTypes || CV_CONSTANTS.ALLOWED_FILE_TYPES;

    if (file.size > maxSize) {
      return { 
        isValid: false, 
        error: `El archivo es demasiado grande. Máximo permitido: ${Math.round(maxSize / 1024 / 1024)}MB` 
      };
    }

    if (!allowedTypes.includes(file.type as any)) {
      return { 
        isValid: false, 
        error: `Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}` 
      };
    }

    // Validar nombre del archivo
    if (file.name.length > 255) {
      return { isValid: false, error: 'El nombre del archivo es demasiado largo' };
    }

    // Validar caracteres especiales en el nombre
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(file.name)) {
      return { isValid: false, error: 'El nombre del archivo contiene caracteres no válidos' };
    }

    return { isValid: true };
  }

  // ===== SANITIZACIÓN XSS =====

  /**
   * Sanitiza entrada de texto para prevenir XSS
   */
  sanitizeInput(input: string): string {
    if (!input) return '';

    // Remover scripts y elementos peligrosos
    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/on\w+\s*=/gi, '');

    // Escapar caracteres HTML
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');

    return sanitized.trim();
  }

  // ===== MÉTODOS AUXILIARES =====

  /**
   * Valida y sanitiza texto con configuración específica
   */
  private validateAndSanitizeText(
    value: string, 
    fieldName: string, 
    required: boolean, 
    minLength: number, 
    maxLength: number
  ): { isValid: boolean; errors: string[]; sanitizedValue: string } {
    const errors: string[] = [];
    
    if (!value || value.trim().length === 0) {
      if (required) {
        errors.push(`${fieldName} es obligatorio`);
      }
      return { isValid: !required, errors, sanitizedValue: '' };
    }

    const sanitized = this.sanitizeInput(value);
    
    if (sanitized.length < minLength) {
      errors.push(`${fieldName} debe tener al menos ${minLength} caracteres`);
    }
    
    if (sanitized.length > maxLength) {
      errors.push(`${fieldName} no puede exceder ${maxLength} caracteres`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitized
    };
  }

  /**
   * Valida array de tecnologías
   */
  private validateTechnologies(technologies: string[]): { isValid: boolean; errors: string[]; sanitizedValue: string[] } {
    const errors: string[] = [];
    const sanitized: string[] = [];

    if (technologies.length > 20) {
      errors.push('Máximo 20 tecnologías permitidas');
    }

    technologies.forEach((tech, index) => {
      const sanitizedTech = this.sanitizeInput(tech);
      if (sanitizedTech.length > 50) {
        errors.push(`Tecnología ${index + 1} es demasiado larga`);
      } else if (sanitizedTech.length > 0) {
        sanitized.push(sanitizedTech);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitized
    };
  }

  /**
   * Valida array de logros
   */
  private validateAchievements(achievements: string[]): { isValid: boolean; errors: string[]; sanitizedValue: string[] } {
    const errors: string[] = [];
    const sanitized: string[] = [];

    if (achievements.length > 10) {
      errors.push('Máximo 10 logros permitidos');
    }

    achievements.forEach((achievement, index) => {
      const sanitizedAchievement = this.sanitizeInput(achievement);
      if (sanitizedAchievement.length > 200) {
        errors.push(`Logro ${index + 1} es demasiado largo`);
      } else if (sanitizedAchievement.length > 0) {
        sanitized.push(sanitizedAchievement);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitized
    };
  }
}
