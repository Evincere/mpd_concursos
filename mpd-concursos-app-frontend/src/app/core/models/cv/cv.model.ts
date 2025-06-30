/**
 * Modelos del Sistema CV - Arquitectura Limpia
 * 
 * @description Modelos TypeScript con tipos seguros para el sistema de Curriculum Vitae
 * @author Augment Agent
 * @date 2025-06-20
 * @version 2.0.0
 */

// ===== ENUMS Y TIPOS BASE =====

/**
 * Estados posibles de una entrada del CV
 */
export enum CvEntryStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED'
}

/**
 * Tipos de educación disponibles
 */
export enum EducationType {
  SECONDARY = 'SECONDARY',
  HIGHER_EDUCATION_CAREER = 'HIGHER_EDUCATION_CAREER',
  UNDERGRADUATE_CAREER = 'UNDERGRADUATE_CAREER',
  POSTGRADUATE_SPECIALIZATION = 'POSTGRADUATE_SPECIALIZATION',
  POSTGRADUATE_MASTERS = 'POSTGRADUATE_MASTERS',
  POSTGRADUATE_DOCTORATE = 'POSTGRADUATE_DOCTORATE',
  DIPLOMA = 'DIPLOMA',
  TRAINING_COURSE = 'TRAINING_COURSE',
  SCIENTIFIC_ACTIVITY = 'SCIENTIFIC_ACTIVITY'
}

/**
 * Estados de finalización de estudios
 */
export enum EducationStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

/**
 * Tipos de actividad científica
 */
export enum ScientificActivityType {
  RESEARCH = 'RESEARCH',
  PRESENTATION = 'PRESENTATION',
  PUBLICATION = 'PUBLICATION'
}

/**
 * Roles en actividades científicas
 */
export enum ScientificActivityRole {
  ASSISTANT_PARTICIPANT = 'ASSISTANT_PARTICIPANT',
  AUTHOR_SPEAKER_PANELIST_PRESENTER = 'AUTHOR_SPEAKER_PANELIST_PRESENTER'
}

// ===== INTERFACES BASE =====

/**
 * Interfaz base para todas las entradas del CV
 */
export interface CvEntry {
  id?: string;
  userId: string;
  status: CvEntryStatus;
  createdAt?: Date;
  updatedAt?: Date;
  documentUrl?: string;
  comments?: string;
}

/**
 * Interfaz para validación de fechas
 */
export interface DateRange {
  startDate: Date;
  endDate?: Date;
  isOngoing?: boolean;
}

/**
 * Interfaz para documentos adjuntos
 */
export interface CvDocument {
  id?: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  uploadDate: Date;
  isValidated?: boolean;
  validatedBy?: string;
  validatedAt?: Date;
}

// ===== MODELOS DE EXPERIENCIA LABORAL =====

/**
 * Modelo para experiencia laboral
 */
export interface WorkExperience extends CvEntry {
  position: string;
  company: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  isCurrentJob: boolean;
  location?: string;
  achievements?: string[];
  technologies?: string[];
  document?: CvDocument;
}

/**
 * DTO para crear/actualizar experiencia laboral
 */
export interface WorkExperienceDto {
  position: string;
  company: string;
  description: string;
  startDate: string; // ISO string format
  endDate?: string;
  isCurrentJob: boolean;
  location?: string;
  achievements?: string[];
  technologies?: string[];
  comments?: string;
}

/**
 * Validaciones para experiencia laboral
 */
export interface WorkExperienceValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ===== MODELOS DE EDUCACIÓN =====

/**
 * Modelo base para educación
 */
export interface Education extends Omit<CvEntry, 'status'> {
  type: EducationType;
  status: EducationStatus;
  title: string;
  institution: string;
  startDate: Date;
  endDate?: Date;
  isOngoing: boolean;
  document?: CvDocument;
}

/**
 * Educación universitaria (grado y nivel superior)
 */
export interface UniversityEducation extends Education {
  type: EducationType.HIGHER_EDUCATION_CAREER | EducationType.UNDERGRADUATE_CAREER;
  durationYears?: number;
  average?: number; // Promedio académico (1-10)
  graduationDate?: Date;
  honors?: string;
}

/**
 * Educación de posgrado
 */
export interface PostgraduateEducation extends Education {
  type: EducationType.POSTGRADUATE_SPECIALIZATION | EducationType.POSTGRADUATE_MASTERS | EducationType.POSTGRADUATE_DOCTORATE;
  thesisTopic?: string;
  advisor?: string;
  defenseDate?: Date;
  grade?: string;
}

/**
 * Diplomatura o curso de capacitación
 */
export interface DiplomaEducation extends Education {
  type: EducationType.DIPLOMA | EducationType.TRAINING_COURSE;
  hourlyLoad?: number;
  certificateNumber?: string;
  expirationDate?: Date;
}

/**
 * Actividad científica
 */
export interface ScientificActivity extends Education {
  type: EducationType.SCIENTIFIC_ACTIVITY;
  activityType: ScientificActivityType;
  role: ScientificActivityRole;
  topic: string;
  venue?: string;
  presentationDate?: Date;
  publicationDetails?: string;
}

/**
 * Unión de todos los tipos de educación
 */
export type EducationEntry = UniversityEducation | PostgraduateEducation | DiplomaEducation | ScientificActivity;

/**
 * DTO para crear/actualizar educación
 */
export interface EducationDto {
  type: EducationType;
  status: EducationStatus;
  title: string;
  institution: string;
  startDate: string;
  endDate?: string;
  isOngoing: boolean;
  
  // Campos específicos por tipo
  durationYears?: number;
  average?: number;
  thesisTopic?: string;
  advisor?: string;
  hourlyLoad?: number;
  activityType?: ScientificActivityType;
  role?: ScientificActivityRole;
  topic?: string;
  venue?: string;
  presentationDate?: string;
  
  comments?: string;
}

// ===== MODELO COMPLETO DEL CV =====

/**
 * Modelo completo del Curriculum Vitae
 */
export interface CurriculumVitae {
  id?: string;
  userId: string;
  workExperiences: WorkExperience[];
  education: EducationEntry[];
  lastUpdated: Date;
  isPublic: boolean;
  version: number;
}

/**
 * Configuración de exportación del CV
 */
export interface CvExportConfig {
  format: 'PDF' | 'DOCX' | 'HTML';
  template: string;
  includePhoto: boolean;
  includePersonalInfo: boolean;
  includeWorkExperience: boolean;
  includeEducation: boolean;
  customSections?: string[];
}

/**
 * Resultado de exportación del CV
 */
export interface CvExportResult {
  success: boolean;
  downloadUrl?: string;
  fileName?: string;
  error?: string;
}

// ===== INTERFACES DE SERVICIOS =====

/**
 * Respuesta de la API para operaciones CRUD
 */
export interface CvApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

/**
 * Filtros para búsqueda de entradas del CV
 */
export interface CvSearchFilters {
  status?: CvEntryStatus;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
  type?: EducationType;
}

/**
 * Configuración de paginación
 */
export interface PaginationConfig {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

/**
 * Resultado paginado
 */
export interface PaginatedResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}
