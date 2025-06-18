/**
 * CV Mappers - Conversion utilities between legacy and new CV models
 * 
 * Provides safe conversion between old Spanish-terminology models and new
 * standardized English-terminology models for backward compatibility.
 */

import { 
  Experience, 
  ExperienceRequest, 
  ExperienceResponse, 
  ExperienciaData,
  Education,
  EducationRequest,
  EducationResponse,
  EducacionData,
  EducationType,
  EducationStatus,
  ScientificActivityType,
  ScientificActivityRole
} from '../models/cv';

export class CvMappers {

  /**
   * Convert legacy ExperienciaData to new Experience model
   */
  static fromLegacyExperience(legacy: ExperienciaData): Experience {
    return {
      id: legacy.id?.toString(),
      userId: '', // Will be set by service
      position: legacy.puesto || legacy.cargo || '',
      company: legacy.empresa || '',
      startDate: this.parseDate(legacy.fechaInicio) || new Date(),
      endDate: this.parseDate(legacy.fechaFin),
      description: legacy.descripcion,
      location: legacy.ubicacion,
      isCurrent: legacy.actual || false
    };
  }

  /**
   * Convert new Experience model to legacy ExperienciaData
   */
  static toLegacyExperience(experience: Experience): ExperienciaData {
    return {
      id: experience.id,
      puesto: experience.position,
      cargo: experience.position, // Duplicate for compatibility
      empresa: experience.company,
      descripcion: experience.description,
      fechaInicio: experience.startDate,
      fechaFin: experience.endDate,
      actual: experience.isCurrent,
      ubicacion: experience.location
    };
  }

  /**
   * Convert ExperienceResponse from API to Experience model
   */
  static fromExperienceResponse(response: ExperienceResponse): Experience {
    return {
      id: response.id,
      userId: response.userId,
      position: response.position,
      company: response.company,
      startDate: new Date(response.startDate),
      endDate: response.endDate ? new Date(response.endDate) : undefined,
      description: response.description,
      location: response.location,
      documentUrl: response.documentUrl,
      comments: response.comments,
      isCurrent: response.isCurrent || false
    };
  }

  /**
   * Convert Experience model to ExperienceRequest for API
   */
  static toExperienceRequest(experience: Experience): ExperienceRequest {
    return {
      position: experience.position,
      company: experience.company,
      startDate: experience.startDate,
      endDate: experience.endDate,
      description: experience.description,
      location: experience.location,
      comments: experience.comments,
      isCurrent: experience.isCurrent
    };
  }

  /**
   * Convert legacy EducacionData to new Education model
   */
  static fromLegacyEducation(legacy: EducacionData): Education {
    return {
      id: legacy.id?.toString(),
      userId: '', // Will be set by service
      type: this.mapLegacyEducationType(legacy.tipo),
      status: EducationStatus.COMPLETED, // Default assumption
      title: legacy.titulo || '',
      institution: legacy.institucion || '',
      issueDate: this.parseDate(legacy.fechaEmision || legacy.fechaFin)
    };
  }

  /**
   * Convert new Education model to legacy EducacionData
   */
  static toLegacyEducation(education: Education): EducacionData {
    return {
      id: education.id,
      tipo: this.mapEducationTypeToLegacy(education.type),
      institucion: education.institution,
      titulo: education.title,
      fechaEmision: education.issueDate?.toISOString().split('T')[0]
    };
  }

  /**
   * Convert EducationResponse from API to Education model
   */
  static fromEducationResponse(response: EducationResponse): Education {
    return {
      id: response.id,
      userId: response.userId,
      type: this.mapStringToEducationType(response.type),
      status: this.mapStringToEducationStatus(response.status),
      title: response.title,
      institution: response.institution,
      issueDate: response.issueDate ? new Date(response.issueDate) : undefined,
      documentUrl: response.documentUrl,
      durationYears: response.durationYears,
      average: response.average,
      thesisTopic: response.thesisTopic,
      hourlyLoad: response.hourlyLoad,
      hadFinalEvaluation: response.hadFinalEvaluation,
      activityType: response.activityType ? this.mapStringToActivityType(response.activityType) : undefined,
      topic: response.topic,
      activityRole: response.activityRole ? this.mapStringToActivityRole(response.activityRole) : undefined,
      expositionPlaceDate: response.expositionPlaceDate,
      comments: response.comments
    };
  }

  /**
   * Convert Education model to EducationRequest for API
   */
  static toEducationRequest(education: Education): EducationRequest {
    return {
      type: education.type,
      status: education.status,
      title: education.title,
      institution: education.institution,
      issueDate: education.issueDate,
      durationYears: education.durationYears,
      average: education.average,
      thesisTopic: education.thesisTopic,
      hourlyLoad: education.hourlyLoad,
      hadFinalEvaluation: education.hadFinalEvaluation,
      activityType: education.activityType,
      topic: education.topic,
      activityRole: education.activityRole,
      expositionPlaceDate: education.expositionPlaceDate,
      comments: education.comments
    };
  }

  /**
   * Parse date from various formats
   */
  private static parseDate(dateValue: string | Date | undefined): Date | undefined {
    if (!dateValue) {
      return undefined;
    }

    if (dateValue instanceof Date) {
      return dateValue;
    }

    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }

  /**
   * Map legacy education type to new enum
   */
  private static mapLegacyEducationType(legacyType?: string): EducationType {
    if (!legacyType) {
      return EducationType.UNIVERSITY_DEGREE;
    }

    const typeMap: { [key: string]: EducationType } = {
      'Título Terciario': EducationType.HIGHER_EDUCATION,
      'Título Universitario': EducationType.UNIVERSITY_DEGREE,
      'Especialización': EducationType.SPECIALIZATION,
      'Maestría': EducationType.MASTERS,
      'Doctorado': EducationType.DOCTORATE,
      'Diplomatura': EducationType.DIPLOMA,
      'Curso de Capacitación': EducationType.TRAINING_COURSE,
      'Actividad Científica': EducationType.SCIENTIFIC_ACTIVITY
    };

    return typeMap[legacyType] || EducationType.UNIVERSITY_DEGREE;
  }

  /**
   * Map new education type to legacy string
   */
  private static mapEducationTypeToLegacy(type: EducationType): string {
    const typeMap: { [key in EducationType]: string } = {
      [EducationType.HIGHER_EDUCATION]: 'Título Terciario',
      [EducationType.UNIVERSITY_DEGREE]: 'Título Universitario',
      [EducationType.SPECIALIZATION]: 'Especialización',
      [EducationType.MASTERS]: 'Maestría',
      [EducationType.DOCTORATE]: 'Doctorado',
      [EducationType.DIPLOMA]: 'Diplomatura',
      [EducationType.TRAINING_COURSE]: 'Curso de Capacitación',
      [EducationType.SCIENTIFIC_ACTIVITY]: 'Actividad Científica'
    };

    return typeMap[type];
  }

  /**
   * Map string to EducationType enum
   */
  private static mapStringToEducationType(type: string): EducationType {
    const enumValues = Object.values(EducationType);
    return enumValues.includes(type as EducationType) 
      ? type as EducationType 
      : EducationType.UNIVERSITY_DEGREE;
  }

  /**
   * Map string to EducationStatus enum
   */
  private static mapStringToEducationStatus(status: string): EducationStatus {
    const statusMap: { [key: string]: EducationStatus } = {
      'En Curso': EducationStatus.IN_PROGRESS,
      'Completado': EducationStatus.COMPLETED,
      'Abandonado': EducationStatus.ABANDONED,
      'IN_PROGRESS': EducationStatus.IN_PROGRESS,
      'COMPLETED': EducationStatus.COMPLETED,
      'ABANDONED': EducationStatus.ABANDONED
    };

    return statusMap[status] || EducationStatus.COMPLETED;
  }

  /**
   * Map string to ScientificActivityType enum
   */
  private static mapStringToActivityType(type: string): ScientificActivityType {
    const typeMap: { [key: string]: ScientificActivityType } = {
      'Investigación': ScientificActivityType.RESEARCH,
      'Publicación': ScientificActivityType.PUBLICATION,
      'Conferencia': ScientificActivityType.CONFERENCE,
      'Taller': ScientificActivityType.WORKSHOP,
      'Seminario': ScientificActivityType.SEMINAR,
      'Otro': ScientificActivityType.OTHER,
      'RESEARCH': ScientificActivityType.RESEARCH,
      'PUBLICATION': ScientificActivityType.PUBLICATION,
      'CONFERENCE': ScientificActivityType.CONFERENCE,
      'WORKSHOP': ScientificActivityType.WORKSHOP,
      'SEMINAR': ScientificActivityType.SEMINAR,
      'OTHER': ScientificActivityType.OTHER
    };

    return typeMap[type] || ScientificActivityType.OTHER;
  }

  /**
   * Map string to ScientificActivityRole enum
   */
  private static mapStringToActivityRole(role: string): ScientificActivityRole {
    const roleMap: { [key: string]: ScientificActivityRole } = {
      'Autor': ScientificActivityRole.AUTHOR,
      'Co-autor': ScientificActivityRole.CO_AUTHOR,
      'Expositor': ScientificActivityRole.PRESENTER,
      'Organizador': ScientificActivityRole.ORGANIZER,
      'Coordinador': ScientificActivityRole.COORDINATOR,
      'Participante': ScientificActivityRole.PARTICIPANT,
      'AUTHOR': ScientificActivityRole.AUTHOR,
      'CO_AUTHOR': ScientificActivityRole.CO_AUTHOR,
      'PRESENTER': ScientificActivityRole.PRESENTER,
      'ORGANIZER': ScientificActivityRole.ORGANIZER,
      'COORDINATOR': ScientificActivityRole.COORDINATOR,
      'PARTICIPANT': ScientificActivityRole.PARTICIPANT
    };

    return roleMap[role] || ScientificActivityRole.PARTICIPANT;
  }
}
