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
  formatDateForDisplay(date: Date, format: 'short' | 'long' = 'short'): string {
    const options: Intl.DateTimeFormatOptions = format === 'short' 
      ? { year: 'numeric', month: 'short' }
      : { year: 'numeric', month: 'long', day: 'numeric' };
    
    return date.toLocaleDateString('es-ES', options);
  }

  /**
   * Formatea un rango de fechas para mostrar en la UI
   */
  formatDateRangeForDisplay(
    startDate: Date, 
    endDate?: Date, 
    isOngoing?: boolean,
    format: 'short' | 'long' = 'short'
  ): string {
    const start = this.formatDateForDisplay(startDate, format);
    
    if (isOngoing) {
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
      additionalInfo: this.getEducationAdditionalInfo(ed)
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
      [EducationType.TECHNICAL]: 'Educación Técnica',
      [EducationType.UNIVERSITY_DEGREE]: 'Carrera Universitaria',
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
   * Obtiene información adicional de educación según el tipo
   */
  private getEducationAdditionalInfo(education: EducationEntry): string {
    const info: string[] = [];

    switch (education.type) {
      case EducationType.UNIVERSITY_DEGREE:
        const universityEd = education as UniversityEducation;
        if (universityEd.average) info.push(`Promedio: ${universityEd.average}`);
        if (universityEd.durationYears) info.push(`Duración: ${universityEd.durationYears} años`);
        break;

      case EducationType.POSTGRADUATE_SPECIALIZATION:
      case EducationType.MASTER_DEGREE:
      case EducationType.DOCTORATE:
        const postgraduateEd = education as PostgraduateEducation;
        if (postgraduateEd.thesisTopic) info.push(`Tesis: ${postgraduateEd.thesisTopic}`);
        if (postgraduateEd.advisor) info.push(`Director: ${postgraduateEd.advisor}`);
        break;

      case EducationType.SCIENTIFIC_ACTIVITY:
        const scientificActivity = education as ScientificActivity;
        info.push(`Tipo: ${scientificActivity.activityType}`);
        info.push(`Rol: ${scientificActivity.role}`);
        if (scientificActivity.venue) info.push(`Lugar: ${scientificActivity.venue}`);
        break;
    }

    return info.join(' | ');
  }

  /**
   * Calcula la duración entre dos fechas
   */
  public calculateDuration(startDate: string | Date, endDate?: string | Date | null): string {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffMonths / 12);

    if (diffYears > 0) {
      const remainingMonths = diffMonths % 12;
      return remainingMonths > 0
        ? `${diffYears} año${diffYears > 1 ? 's' : ''} y ${remainingMonths} mes${remainingMonths > 1 ? 'es' : ''}`
        : `${diffYears} año${diffYears > 1 ? 's' : ''}`;
    } else if (diffMonths > 0) {
      return `${diffMonths} mes${diffMonths > 1 ? 'es' : ''}`;
    } else {
      return `${diffDays} día${diffDays > 1 ? 's' : ''}`;
    }
  }

  /**
   * Obtiene información específica de educación
   */
  public getEducationSpecificInfo(education: EducationEntry): any {
    return {
      type: this.getEducationTypeLabel(education.type),
      status: this.getEducationStatusLabel(education.status),
      duration: this.calculateDuration(education.startDate, education.endDate),
      isOngoing: education.isOngoing || false
    };
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
      day: 'numeric'
    });
  }
}
