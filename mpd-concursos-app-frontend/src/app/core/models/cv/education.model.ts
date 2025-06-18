/**
 * Education model - Standardized interface for education data
 * Following English terminology for consistency with backend
 */

/**
 * Education types enum
 */
export enum EducationType {
  HIGHER_EDUCATION = 'HIGHER_EDUCATION',           // Título Terciario
  UNIVERSITY_DEGREE = 'UNIVERSITY_DEGREE',         // Título Universitario
  SPECIALIZATION = 'SPECIALIZATION',               // Especialización
  MASTERS = 'MASTERS',                             // Maestría
  DOCTORATE = 'DOCTORATE',                         // Doctorado
  DIPLOMA = 'DIPLOMA',                             // Diplomatura
  TRAINING_COURSE = 'TRAINING_COURSE',             // Curso de Capacitación
  SCIENTIFIC_ACTIVITY = 'SCIENTIFIC_ACTIVITY'     // Actividad Científica
}

/**
 * Education status enum
 */
export enum EducationStatus {
  IN_PROGRESS = 'IN_PROGRESS',     // En Curso
  COMPLETED = 'COMPLETED',         // Completado
  ABANDONED = 'ABANDONED'          // Abandonado
}

/**
 * Scientific activity types
 */
export enum ScientificActivityType {
  RESEARCH = 'RESEARCH',           // Investigación
  PUBLICATION = 'PUBLICATION',     // Publicación
  CONFERENCE = 'CONFERENCE',       // Conferencia
  WORKSHOP = 'WORKSHOP',           // Taller
  SEMINAR = 'SEMINAR',            // Seminario
  OTHER = 'OTHER'                 // Otro
}

/**
 * Scientific activity roles
 */
export enum ScientificActivityRole {
  AUTHOR = 'AUTHOR',               // Autor
  CO_AUTHOR = 'CO_AUTHOR',         // Co-autor
  PRESENTER = 'PRESENTER',         // Expositor
  ORGANIZER = 'ORGANIZER',         // Organizador
  COORDINATOR = 'COORDINATOR',     // Coordinador
  PARTICIPANT = 'PARTICIPANT'      // Participante
}

/**
 * Main education interface
 */
export interface Education {
  /** Unique identifier */
  id?: string;
  
  /** User ID who owns this education */
  userId: string;
  
  /** Type of education */
  type: EducationType;
  
  /** Current status */
  status: EducationStatus;
  
  /** Title or name of the education */
  title: string;
  
  /** Educational institution */
  institution: string;
  
  /** Date when degree was issued */
  issueDate?: Date;
  
  /** URL to supporting document */
  documentUrl?: string;
  
  // Fields for higher education and university degrees
  /** Duration in years */
  durationYears?: number;
  
  /** Academic average/GPA */
  average?: number;
  
  // Fields for postgraduate studies
  /** Thesis topic for masters/doctorate */
  thesisTopic?: string;
  
  // Fields for diplomas and training courses
  /** Course duration in hours */
  hourlyLoad?: number;
  
  /** Whether there was a final evaluation */
  hadFinalEvaluation?: boolean;
  
  // Fields for scientific activities
  /** Type of scientific activity */
  activityType?: ScientificActivityType;
  
  /** Research/activity topic */
  topic?: string;
  
  /** Role in the activity */
  activityRole?: ScientificActivityRole;
  
  /** Place and date of exposition/presentation */
  expositionPlaceDate?: string;
  
  /** Additional comments */
  comments?: string;
}

/**
 * Education request DTO for API calls
 */
export interface EducationRequest {
  type: string; // String representation for API
  status: string; // String representation for API
  title: string;
  institution: string;
  issueDate?: Date;
  durationYears?: number;
  average?: number;
  thesisTopic?: string;
  hourlyLoad?: number;
  hadFinalEvaluation?: boolean;
  activityType?: string;
  topic?: string;
  activityRole?: string;
  expositionPlaceDate?: string;
  comments?: string;
}

/**
 * Education response DTO from API
 */
export interface EducationResponse {
  id: string;
  userId: string;
  type: string;
  status: string;
  title: string;
  institution: string;
  issueDate?: string; // ISO date string
  documentUrl?: string;
  durationYears?: number;
  average?: number;
  thesisTopic?: string;
  hourlyLoad?: number;
  hadFinalEvaluation?: boolean;
  activityType?: string;
  topic?: string;
  activityRole?: string;
  expositionPlaceDate?: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Legacy education interface for backward compatibility
 * @deprecated Use Education interface instead
 */
export interface EducacionData {
  id?: number | string;
  tipo?: string;
  institucion?: string;
  titulo?: string;
  fechaInicio?: string;
  fechaFin?: string;
  fechaEmision?: string;
}

/**
 * Education form data interface
 */
export interface EducationFormData {
  type: EducationType;
  status: EducationStatus;
  title: string;
  institution: string;
  issueDate: Date | null;
  durationYears: number | null;
  average: number | null;
  thesisTopic: string;
  hourlyLoad: number | null;
  hadFinalEvaluation: boolean;
  activityType: ScientificActivityType | null;
  topic: string;
  activityRole: ScientificActivityRole | null;
  expositionPlaceDate: string;
  comments: string;
}

/**
 * Education validation errors
 */
export interface EducationValidationErrors {
  type?: string[];
  status?: string[];
  title?: string[];
  institution?: string[];
  issueDate?: string[];
  durationYears?: string[];
  average?: string[];
  thesisTopic?: string[];
  hourlyLoad?: string[];
  activityType?: string[];
  topic?: string[];
  activityRole?: string[];
  expositionPlaceDate?: string[];
  comments?: string[];
}

/**
 * Education display data for UI
 */
export interface EducationDisplayData {
  id: string;
  type: EducationType;
  status: EducationStatus;
  title: string;
  institution: string;
  issueDate?: string; // Formatted date
  hasDocument: boolean;
  statusLabel: string;
  typeLabel: string;
}
