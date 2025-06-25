/**
 * Servicio de Transformación de Datos del Sistema CV
 * 
 * @description Servicio para transformar datos entre DTOs y entidades del CV
 * @author Augment Agent
 * @date 2025-06-20
 * @version 2.0.0
 */

import { Injectable } from '@angular/core';
import {
  ICvTransformService,
  WorkExperience,
  WorkExperienceDto,
  EducationEntry,
  EducationDto,
  EducationType,
  EducationStatus,
  CvEntryStatus,
  UniversityEducation,
  PostgraduateEducation,
  DiplomaEducation,
  ScientificActivity,
  ScientificActivityType,
  ScientificActivityRole
} from '@core/models/cv';

@Injectable({
  providedIn: 'root'
})
export class CvTransformService implements ICvTransformService {

  // ===== TRANSFORMACIONES DE EXPERIENCIA LABORAL =====

  /**
   * Convierte DTO de experiencia laboral a entidad
   */
  workExperienceDtoToEntity(dto: WorkExperienceDto, userId: string): WorkExperience {
    return {
      id: undefined, // Se asignará en el backend
      userId,
      status: CvEntryStatus.ACTIVE,
      position: dto.position,
      company: dto.company,
      description: dto.description,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      isCurrentJob: dto.isCurrentJob,
      location: dto.location,
      achievements: dto.achievements || [],
      technologies: dto.technologies || [],
      comments: dto.comments,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Convierte entidad de experiencia laboral a DTO
   */
  workExperienceEntityToDto(entity: WorkExperience): WorkExperienceDto {
    // Validar fechas antes de la conversión
    if (!entity.startDate || isNaN(entity.startDate.getTime())) {
      console.warn('Invalid startDate in WorkExperience entity:', entity);
      entity.startDate = new Date(); // Usar fecha actual como fallback
    }

    if (entity.endDate && isNaN(entity.endDate.getTime())) {
      console.warn('Invalid endDate in WorkExperience entity:', entity);
      entity.endDate = undefined; // Eliminar fecha inválida
    }

    return {
      position: entity.position || '',
      company: entity.company || '',
      description: entity.description || '',
      startDate: this.dateToISOString(entity.startDate),
      endDate: entity.endDate ? this.dateToISOString(entity.endDate) : undefined,
      isCurrentJob: entity.isCurrentJob || false,
      location: entity.location,
      achievements: entity.achievements || [],
      technologies: entity.technologies || [],
      comments: entity.comments
    };
  }

  // ===== TRANSFORMACIONES DE EDUCACIÓN =====

  /**
   * Convierte DTO de educación a entidad
   */
  educationDtoToEntity(dto: EducationDto, userId: string): EducationEntry {
    const baseEducation = {
      id: undefined,
      userId,
      type: dto.type,
      status: dto.status,
      title: dto.title,
      institution: dto.institution,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      isOngoing: dto.isOngoing,
      comments: dto.comments,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Crear entidad específica según el tipo
    switch (dto.type) {
      case EducationType.UNIVERSITY_DEGREE:
        return {
          ...baseEducation,
          type: EducationType.UNIVERSITY_DEGREE,
          durationYears: dto.durationYears,
          average: dto.average,
          graduationDate: dto.endDate ? new Date(dto.endDate) : undefined,
          honors: undefined // Se puede agregar en el futuro
        } as UniversityEducation;

      case EducationType.POSTGRADUATE_SPECIALIZATION:
      case EducationType.MASTER_DEGREE:
      case EducationType.DOCTORATE:
        return {
          ...baseEducation,
          type: dto.type,
          thesisTopic: dto.thesisTopic,
          advisor: dto.advisor,
          defenseDate: dto.endDate ? new Date(dto.endDate) : undefined,
          grade: undefined // Se puede agregar en el futuro
        } as PostgraduateEducation;

      case EducationType.DIPLOMA:
      case EducationType.CERTIFICATION:
        return {
          ...baseEducation,
          type: dto.type,
          hourlyLoad: dto.hourlyLoad,
          certificateNumber: undefined, // Se puede agregar en el futuro
          expirationDate: undefined // Se puede agregar en el futuro
        } as DiplomaEducation;

      case EducationType.SCIENTIFIC_ACTIVITY:
        return {
          ...baseEducation,
          type: EducationType.SCIENTIFIC_ACTIVITY,
          activityType: dto.activityType || ScientificActivityType.CONFERENCE,
          role: dto.role || ScientificActivityRole.ATTENDEE,
          topic: dto.topic || '',
          venue: dto.venue,
          presentationDate: dto.presentationDate ? new Date(dto.presentationDate) : undefined,
          publicationDetails: undefined // Se puede agregar en el futuro
        } as ScientificActivity;

      default:
        return baseEducation as EducationEntry;
    }
  }

  /**
   * Convierte entidad de educación a DTO
   */
  educationEntityToDto(entity: EducationEntry): EducationDto {
    const baseDto: EducationDto = {
      type: entity.type,
      status: entity.status,
      title: entity.title,
      institution: entity.institution,
      startDate: this.dateToISOString(entity.startDate),
      endDate: entity.endDate ? this.dateToISOString(entity.endDate) : undefined,
      isOngoing: entity.isOngoing,
      comments: entity.comments
    };

    // Agregar campos específicos según el tipo
    switch (entity.type) {
      case EducationType.UNIVERSITY_DEGREE:
        const universityEd = entity as UniversityEducation;
        return {
          ...baseDto,
          durationYears: universityEd.durationYears,
          average: universityEd.average
        };

      case EducationType.POSTGRADUATE_SPECIALIZATION:
      case EducationType.MASTER_DEGREE:
      case EducationType.DOCTORATE:
        const postgraduateEd = entity as PostgraduateEducation;
        return {
          ...baseDto,
          thesisTopic: postgraduateEd.thesisTopic,
          advisor: postgraduateEd.advisor
        };

      case EducationType.DIPLOMA:
      case EducationType.CERTIFICATION:
        const diplomaEd = entity as DiplomaEducation;
        return {
          ...baseDto,
          hourlyLoad: diplomaEd.hourlyLoad
        };

      case EducationType.SCIENTIFIC_ACTIVITY:
        const scientificActivity = entity as ScientificActivity;
        return {
          ...baseDto,
          activityType: scientificActivity.activityType,
          role: scientificActivity.role,
          topic: scientificActivity.topic,
          venue: scientificActivity.venue,
          presentationDate: scientificActivity.presentationDate ? 
            this.dateToISOString(scientificActivity.presentationDate) : undefined
        };

      default:
        return baseDto;
    }
  }

  // ===== ORDENAMIENTO =====

  /**
   * Ordena experiencias laborales por fecha (más reciente primero)
   */
  sortExperiencesByDate(experiences: WorkExperience[]): WorkExperience[] {
    return [...experiences].sort((a, b) => {
      // Trabajos actuales van primero
      if (a.isCurrentJob && !b.isCurrentJob) return -1;
      if (!a.isCurrentJob && b.isCurrentJob) return 1;

      // Si ambos son actuales o ambos no son actuales, ordenar por fecha de inicio
      const dateA = a.endDate || a.startDate;
      const dateB = b.endDate || b.startDate;
      
      return dateB.getTime() - dateA.getTime();
    });
  }

  /**
   * Ordena educación por fecha (más reciente primero)
   */
  sortEducationByDate(education: EducationEntry[]): EducationEntry[] {
    return [...education].sort((a, b) => {
      // Estudios en curso van primero
      if (a.isOngoing && !b.isOngoing) return -1;
      if (!a.isOngoing && b.isOngoing) return 1;

      // Ordenar por fecha de fin o inicio
      const dateA = a.endDate || a.startDate;
      const dateB = b.endDate || b.startDate;
      
      return dateB.getTime() - dateA.getTime();
    });
  }

  // ===== TRANSFORMACIONES DE FECHAS =====

  /**
   * Convierte Date a string ISO
   */
  private dateToISOString(date: Date): string {
    // Validar que la fecha sea válida
    if (!date || isNaN(date.getTime())) {
      console.warn('Invalid date provided to dateToISOString:', date);
      return new Date().toISOString().split('T')[0]; // Retornar fecha actual como fallback
    }
    return date.toISOString().split('T')[0];
  }

  /**
   * Convierte string ISO a Date
   */
  private isoStringToDate(isoString: string): Date {
    return new Date(isoString);
  }

  // ===== TRANSFORMACIONES ADICIONALES =====

  /**
   * Calcula la duración de una experiencia laboral en meses
   */
  calculateExperienceDurationInMonths(experience: WorkExperience): number {
    const startDate = experience.startDate;
    const endDate = experience.endDate || new Date();
    
    const yearDiff = endDate.getFullYear() - startDate.getFullYear();
    const monthDiff = endDate.getMonth() - startDate.getMonth();
    
    return yearDiff * 12 + monthDiff;
  }

  /**
   * Calcula la duración de educación en años
   */
  calculateEducationDurationInYears(education: EducationEntry): number {
    const startDate = education.startDate;
    const endDate = education.endDate || new Date();
    
    const timeDiff = endDate.getTime() - startDate.getTime();
    const yearDiff = timeDiff / (1000 * 60 * 60 * 24 * 365.25);
    
    return Math.round(yearDiff * 10) / 10; // Redondear a 1 decimal
  }

  /**
   * Formatea una fecha para mostrar en la UI
   */
  formatDateForDisplay(date: Date | undefined, format: 'short' | 'long' = 'short'): string {
    if (!date) return 'Sin fecha';

    // Usar UTC para evitar problemas de zona horaria
    const options: Intl.DateTimeFormatOptions = format === 'short'
      ? { year: 'numeric', month: 'short', timeZone: 'UTC' }
      : { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };

    return date.toLocaleDateString('es-ES', options);
  }

  /**
   * Formatea un rango de fechas para mostrar en la UI
   */
  formatDateRangeForDisplay(
    startDate: Date | undefined,
    endDate?: Date | undefined,
    isOngoing?: boolean,
    format: 'short' | 'long' = 'short'
  ): string {
    // Si no hay fechas, mostrar mensaje apropiado
    if (!startDate && !endDate) {
      return isOngoing ? 'En curso' : 'Sin fechas';
    }

    const start = this.formatDateForDisplay(startDate, format);

    // Solo mostrar "Presente" si realmente está en curso (isOngoing = true)
    // y no hay fecha de fin
    if (isOngoing && !endDate) {
      return `${start} - Presente`;
    }

    if (endDate) {
      const end = this.formatDateForDisplay(endDate, format);
      return `${start} - ${end}`;
    }

    return start;
  }

  /**
   * Genera un resumen de experiencia laboral
   */
  generateExperienceSummary(experiences: WorkExperience[]): {
    totalExperiences: number;
    totalMonths: number;
    currentJobs: number;
    companies: string[];
    technologies: string[];
  } {
    const totalExperiences = experiences.length;
    const totalMonths = experiences.reduce((sum, exp) => 
      sum + this.calculateExperienceDurationInMonths(exp), 0);
    const currentJobs = experiences.filter(exp => exp.isCurrentJob).length;
    
    const companies = [...new Set(experiences.map(exp => exp.company))];
    const technologies = [...new Set(
      experiences.flatMap(exp => exp.technologies || [])
    )];

    return {
      totalExperiences,
      totalMonths,
      currentJobs,
      companies,
      technologies
    };
  }

  /**
   * Genera un resumen de educación
   */
  generateEducationSummary(education: EducationEntry[]): {
    totalEducation: number;
    completedEducation: number;
    ongoingEducation: number;
    institutions: string[];
    educationTypes: EducationType[];
    highestLevel: EducationType | null;
  } {
    const totalEducation = education.length;
    const completedEducation = education.filter(ed => 
      ed.status === EducationStatus.COMPLETED).length;
    const ongoingEducation = education.filter(ed => ed.isOngoing).length;
    
    const institutions = [...new Set(education.map(ed => ed.institution))];
    const educationTypes = [...new Set(education.map(ed => ed.type))];
    
    // Determinar el nivel más alto de educación
    const levelHierarchy = [
      EducationType.SECONDARY,
      EducationType.TECHNICAL,
      EducationType.DIPLOMA,
      EducationType.CERTIFICATION,
      EducationType.UNIVERSITY_DEGREE,
      EducationType.POSTGRADUATE_SPECIALIZATION,
      EducationType.MASTER_DEGREE,
      EducationType.DOCTORATE,
      EducationType.SCIENTIFIC_ACTIVITY
    ];
    
    let highestLevel: EducationType | null = null;
    for (let i = levelHierarchy.length - 1; i >= 0; i--) {
      if (educationTypes.includes(levelHierarchy[i] as any)) {
        highestLevel = levelHierarchy[i];
        break;
      }
    }

    return {
      totalEducation,
      completedEducation,
      ongoingEducation,
      institutions,
      educationTypes,
      highestLevel
    };
  }

  /**
   * Convierte entidades a formato para exportación
   */
  prepareForExport(experiences: WorkExperience[], education: EducationEntry[]): {
    experiences: any[];
    education: any[];
  } {
    const exportExperiences = experiences.map(exp => ({
      position: exp.position,
      company: exp.company,
      description: exp.description,
      dateRange: this.formatDateRangeForDisplay(exp.startDate, exp.endDate, exp.isCurrentJob),
      duration: `${this.calculateExperienceDurationInMonths(exp)} meses`,
      location: exp.location,
      technologies: exp.technologies?.join(', '),
      achievements: exp.achievements?.join('; ')
    }));

    const exportEducation = education.map(ed => ({
      type: this.getEducationTypeLabel(ed.type),
      title: ed.title,
      institution: ed.institution,
      dateRange: this.formatDateRangeForDisplay(ed.startDate, ed.endDate, ed.isOngoing),
      status: this.getEducationStatusLabel(ed.status),
      duration: `${this.calculateEducationDurationInYears(ed)} años`,
      additionalInfo: this.getEducationAdditionalInfo(ed).map(info => `${info.label}: ${info.value}`).join(' | ')
    }));

    return {
      experiences: exportExperiences,
      education: exportEducation
    };
  }

  // ===== MÉTODOS AUXILIARES =====

  /**
   * Obtiene la etiqueta de tipo de educación
   */
  public getEducationTypeLabel(type: EducationType): string {
    const labels = {
      [EducationType.SECONDARY]: 'Educación Secundaria',
      [EducationType.TECHNICAL]: 'Título Terciario',
      [EducationType.UNIVERSITY_DEGREE]: 'Título Universitario',
      [EducationType.POSTGRADUATE_SPECIALIZATION]: 'Especialización',
      [EducationType.MASTER_DEGREE]: 'Maestría',
      [EducationType.DOCTORATE]: 'Doctorado',
      [EducationType.DIPLOMA]: 'Diplomatura',
      [EducationType.CERTIFICATION]: 'Certificación',
      [EducationType.SCIENTIFIC_ACTIVITY]: 'Actividad Científica'
    };
    return labels[type] || type;
  }

  /**
   * Formatea un número decimal usando coma como separador decimal
   */
  public formatDecimalNumber(value: number | string): string {
    if (value === null || value === undefined) {
      return '';
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      return '';
    }

    // Formatear con coma decimal (estilo argentino/español)
    return numValue.toLocaleString('es-AR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2
    });
  }

  /**
   * Obtiene la etiqueta de estado de educación
   */
  public getEducationStatusLabel(status: EducationStatus): string {
    const labels = {
      [EducationStatus.IN_PROGRESS]: 'En Curso',
      [EducationStatus.COMPLETED]: 'Completado',
      [EducationStatus.SUSPENDED]: 'Suspendido',
      [EducationStatus.ABANDONED]: 'Abandonado'
    };
    return labels[status] || status;
  }



  /**
   * Calcula la duración entre dos fechas
   */
  public calculateDuration(startDate: string | Date | undefined, endDate?: string | Date | null | undefined): string {
    if (!startDate) return 'Sin duración';

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    // Calcular diferencia en meses de forma más precisa
    const startYear = start.getFullYear();
    const startMonth = start.getMonth();
    const endYear = end.getFullYear();
    const endMonth = end.getMonth();

    let diffMonths = (endYear - startYear) * 12 + (endMonth - startMonth);

    // Ajustar si el día de fin es menor que el día de inicio
    if (end.getDate() < start.getDate()) {
      diffMonths--;
    }

    // Asegurar que no sea negativo
    diffMonths = Math.max(0, diffMonths);

    const diffYears = Math.floor(diffMonths / 12);
    const remainingMonths = diffMonths % 12;

    if (diffYears > 0) {
      return remainingMonths > 0
        ? `${diffYears} año${diffYears > 1 ? 's' : ''} y ${remainingMonths} mes${remainingMonths > 1 ? 'es' : ''}`
        : `${diffYears} año${diffYears > 1 ? 's' : ''}`;
    } else if (diffMonths > 0) {
      return `${diffMonths} mes${diffMonths > 1 ? 'es' : ''}`;
    } else {
      // Si es menos de un mes, calcular días
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} día${diffDays > 1 ? 's' : ''}`;
    }
  }

  /**
   * Obtiene información específica de educación
   */
  public getEducationSpecificInfo(education: EducationEntry): Array<{icon: string, label: string, value: string}> {
    const info: Array<{icon: string, label: string, value: string}> = [];

    // Tipo de educación
    if (education.type) {
      info.push({
        icon: 'school',
        label: 'Tipo',
        value: this.getEducationTypeLabel(education.type)
      });
    }

    // Estado
    if (education.status) {
      info.push({
        icon: 'info',
        label: 'Estado',
        value: this.getEducationStatusLabel(education.status)
      });
    }

    // Duración
    const duration = this.calculateDuration(education.startDate, education.endDate);
    if (duration) {
      info.push({
        icon: 'schedule',
        label: 'Duración',
        value: duration
      });
    }

    // Información específica según el tipo
    if (education.type === 'UNIVERSITY_DEGREE' && (education as any).average) {
      info.push({
        icon: 'grade',
        label: 'Promedio',
        value: (education as any).average.toString()
      });
    }

    if ((education.type === 'DIPLOMA' || education.type === 'CERTIFICATION') && (education as any).hourlyLoad) {
      info.push({
        icon: 'access_time',
        label: 'Carga Horaria',
        value: `${(education as any).hourlyLoad} horas`
      });
    }

    return info;
  }

  /**
   * Obtiene información adicional específica de educación (sin duplicar tipo, estado, duración)
   */
  public getEducationAdditionalInfo(education: EducationEntry): Array<{icon: string, label: string, value: string}> {
    const info: Array<{icon: string, label: string, value: string}> = [];

    // Solo información específica según el tipo, sin duplicar lo que ya se muestra en badges
    switch (education.type) {
      case 'UNIVERSITY_DEGREE':
        if ((education as any).average) {
          info.push({
            icon: 'grade',
            label: 'Promedio',
            value: this.formatDecimalNumber((education as any).average)
          });
        }
        break;

      case 'POSTGRADUATE_SPECIALIZATION':
      case 'MASTER_DEGREE':
      case 'DOCTORATE':
        if ((education as any).thesisTopic) {
          info.push({
            icon: 'description',
            label: 'Tema de Tesis',
            value: (education as any).thesisTopic
          });
        }
        break;

      case 'DIPLOMA':
      case 'CERTIFICATION':
        if ((education as any).hourlyLoad) {
          info.push({
            icon: 'access_time',
            label: 'Carga Horaria',
            value: `${(education as any).hourlyLoad} horas`
          });
        }
        break;

      case 'SCIENTIFIC_ACTIVITY':
        if ((education as any).topic) {
          info.push({
            icon: 'science',
            label: 'Tema',
            value: (education as any).topic
          });
        }
        if ((education as any).activityType) {
          info.push({
            icon: 'category',
            label: 'Tipo de Actividad',
            value: (education as any).activityType
          });
        }
        break;
    }

    return info;
  }

  /**
   * Formatea una fecha individual
   */
  public formatSingleDate(date: string | Date): string {
    if (!date) return '';

    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
  }
}
