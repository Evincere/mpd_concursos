/**
 * Contratos e Interfaces del Sistema CV
 * 
 * @description Definición de contratos para servicios, repositorios y casos de uso
 * @author Augment Agent
 * @date 2025-06-20
 * @version 2.0.0
 */

import { Observable } from 'rxjs';
import {
  WorkExperience,
  WorkExperienceDto,
  Education,
  EducationDto,
  EducationEntry,
  CurriculumVitae,
  CvApiResponse,
  CvSearchFilters,
  PaginationConfig,
  PaginatedResult,
  CvExportConfig,
  CvExportResult,
  CvDocument
} from './cv.model';

// ===== CONTRATOS DE REPOSITORIO =====

/**
 * Contrato para el repositorio de experiencias laborales
 */
export interface IWorkExperienceRepository {
  findByUserId(userId: string, filters?: CvSearchFilters, pagination?: PaginationConfig): Observable<PaginatedResult<WorkExperience>>;
  findById(id: string): Observable<WorkExperience | null>;
  create(experience: WorkExperienceDto, userId: string): Observable<WorkExperience>;
  update(id: string, experience: Partial<WorkExperienceDto>): Observable<WorkExperience>;
  delete(id: string): Observable<boolean>;
  uploadDocument(experienceId: string, file: File): Observable<CvDocument>;
  deleteDocument(experienceId: string, documentId: string): Observable<boolean>;
}

/**
 * Contrato para el repositorio de educación
 */
export interface IEducationRepository {
  findByUserId(userId: string, filters?: CvSearchFilters, pagination?: PaginationConfig): Observable<PaginatedResult<EducationEntry>>;
  findById(id: string): Observable<EducationEntry | null>;
  create(education: EducationDto, userId: string): Observable<EducationEntry>;
  update(id: string, education: Partial<EducationDto>): Observable<EducationEntry>;
  delete(id: string): Observable<boolean>;
  uploadDocument(educationId: string, file: File): Observable<CvDocument>;
  deleteDocument(educationId: string, documentId: string): Observable<boolean>;
}

/**
 * Contrato para el repositorio del CV completo
 */
export interface ICvRepository {
  findByUserId(userId: string): Observable<CurriculumVitae | null>;
  export(userId: string, config: CvExportConfig): Observable<CvExportResult>;
  generatePublicUrl(userId: string): Observable<string>;
  updateVisibility(userId: string, isPublic: boolean): Observable<boolean>;
}

// ===== CONTRATOS DE CASOS DE USO =====

/**
 * Casos de uso para experiencias laborales
 */
export interface IWorkExperienceUseCases {
  getAllExperiences(userId: string, filters?: CvSearchFilters): Observable<WorkExperience[]>;
  getExperienceById(id: string): Observable<WorkExperience>;
  createExperience(experience: WorkExperienceDto, userId: string): Observable<WorkExperience>;
  updateExperience(id: string, experience: Partial<WorkExperienceDto>): Observable<WorkExperience>;
  deleteExperience(id: string): Observable<boolean>;
  validateExperience(experience: WorkExperienceDto): Observable<{ isValid: boolean; errors: string[] }>;
  uploadCertificate(experienceId: string, file: File): Observable<CvDocument>;
}

/**
 * Casos de uso para educación
 */
export interface IEducationUseCases {
  getAllEducation(userId: string, filters?: CvSearchFilters): Observable<EducationEntry[]>;
  getEducationById(id: string): Observable<EducationEntry>;
  createEducation(education: EducationDto, userId: string): Observable<EducationEntry>;
  updateEducation(id: string, education: Partial<EducationDto>): Observable<EducationEntry>;
  deleteEducation(id: string): Observable<boolean>;
  validateEducation(education: EducationDto): Observable<{ isValid: boolean; errors: string[] }>;
  uploadCertificate(educationId: string, file: File): Observable<CvDocument>;
}

/**
 * Casos de uso para el CV completo
 */
export interface ICvUseCases {
  getCompleteCv(userId: string): Observable<CurriculumVitae>;
  exportCv(userId: string, config: CvExportConfig): Observable<CvExportResult>;
  generatePublicCv(userId: string): Observable<string>;
  importFromLinkedIn(userId: string, linkedInData: any): Observable<CurriculumVitae>;
  validateCompleteCv(userId: string): Observable<{ isValid: boolean; errors: string[]; warnings: string[] }>;
}

// ===== CONTRATOS DE SERVICIOS DE DOMINIO =====

/**
 * Servicio de validación de CV
 */
export interface ICvValidationService {
  validateWorkExperience(experience: WorkExperienceDto): { isValid: boolean; errors: string[]; warnings: string[] };
  validateEducation(education: EducationDto): { isValid: boolean; errors: string[]; warnings: string[] };
  validateDateRange(startDate: Date, endDate?: Date, isOngoing?: boolean): { isValid: boolean; error?: string };
  validateFileUpload(file: File): { isValid: boolean; error?: string };
  sanitizeInput(input: string): string;
}

/**
 * Servicio de exportación de CV
 */
export interface ICvExportService {
  exportToPdf(cv: CurriculumVitae, config: CvExportConfig): Observable<Blob>;
  exportToDocx(cv: CurriculumVitae, config: CvExportConfig): Observable<Blob>;
  exportToHtml(cv: CurriculumVitae, config: CvExportConfig): Observable<string>;
  getAvailableTemplates(): Observable<string[]>;
  previewTemplate(templateId: string, cv: CurriculumVitae): Observable<string>;
}

/**
 * Servicio de transformación de datos
 */
export interface ICvTransformService {
  workExperienceDtoToEntity(dto: WorkExperienceDto, userId: string): WorkExperience;
  workExperienceEntityToDto(entity: WorkExperience): WorkExperienceDto;
  educationDtoToEntity(dto: EducationDto, userId: string): EducationEntry;
  educationEntityToDto(entity: EducationEntry): EducationDto;
  sortExperiencesByDate(experiences: WorkExperience[]): WorkExperience[];
  sortEducationByDate(education: EducationEntry[]): EducationEntry[];
}

// ===== CONTRATOS DE SERVICIOS DE INFRAESTRUCTURA =====

/**
 * Servicio de almacenamiento de archivos
 */
export interface IFileStorageService {
  uploadFile(file: File, path: string): Observable<{ url: string; fileName: string }>;
  deleteFile(fileName: string): Observable<boolean>;
  getFileUrl(fileName: string): string;
  validateFile(file: File): { isValid: boolean; error?: string };
}

/**
 * Servicio de notificaciones
 */
export interface ICvNotificationService {
  showSuccess(message: string): void;
  showError(message: string): void;
  showWarning(message: string): void;
  showInfo(message: string): void;
  showValidationErrors(errors: string[]): void;
}

/**
 * Servicio de cache
 */
export interface ICvCacheService {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl?: number): void;
  remove(key: string): void;
  clear(): void;
  has(key: string): boolean;
}

// ===== CONTRATOS DE COMPONENTES =====

/**
 * Interfaz para componentes de formulario de CV
 */
export interface ICvFormComponent<T> {
  formData: T;
  isLoading: boolean;
  isEditing: boolean;
  validationErrors: string[];
  
  onSave(): void;
  onCancel(): void;
  onReset(): void;
  validateForm(): boolean;
}

/**
 * Interfaz para componentes de lista de CV
 */
export interface ICvListComponent<T> {
  items: T[];
  isLoading: boolean;
  selectedItem: T | null;
  searchFilters: CvSearchFilters;
  
  onAdd(): void;
  onEdit(item: T): void;
  onDelete(item: T): void;
  onSearch(filters: CvSearchFilters): void;
  onSort(field: string, direction: 'ASC' | 'DESC'): void;
}

/**
 * Configuración de componentes de CV
 */
export interface CvComponentConfig {
  allowAdd: boolean;
  allowEdit: boolean;
  allowDelete: boolean;
  allowExport: boolean;
  showValidation: boolean;
  enableFileUpload: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
}

// ===== EVENTOS DEL SISTEMA CV =====

/**
 * Eventos del sistema CV
 */
export enum CvEventType {
  EXPERIENCE_CREATED = 'EXPERIENCE_CREATED',
  EXPERIENCE_UPDATED = 'EXPERIENCE_UPDATED',
  EXPERIENCE_DELETED = 'EXPERIENCE_DELETED',
  EDUCATION_CREATED = 'EDUCATION_CREATED',
  EDUCATION_UPDATED = 'EDUCATION_UPDATED',
  EDUCATION_DELETED = 'EDUCATION_DELETED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_DELETED = 'DOCUMENT_DELETED',
  CV_EXPORTED = 'CV_EXPORTED',
  CV_VALIDATED = 'CV_VALIDATED'
}

/**
 * Estructura de eventos del CV
 */
export interface CvEvent<T = any> {
  type: CvEventType;
  userId: string;
  entityId?: string;
  data?: T;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Servicio de eventos del CV
 */
export interface ICvEventService {
  emit<T>(event: CvEvent<T>): void;
  subscribe<T>(eventType: CvEventType, callback: (event: CvEvent<T>) => void): () => void;
  unsubscribe(eventType: CvEventType): void;
  getEventHistory(userId: string, eventType?: CvEventType): Observable<CvEvent[]>;
}

// ===== TOKENS DE INYECCIÓN =====

/**
 * Tokens para inyección de dependencias
 */
export const CV_TOKENS = {
  // Repositorios
  WORK_EXPERIENCE_REPOSITORY: 'IWorkExperienceRepository',
  EDUCATION_REPOSITORY: 'IEducationRepository',
  CV_REPOSITORY: 'ICvRepository',
  
  // Casos de uso
  WORK_EXPERIENCE_USE_CASES: 'IWorkExperienceUseCases',
  EDUCATION_USE_CASES: 'IEducationUseCases',
  CV_USE_CASES: 'ICvUseCases',
  
  // Servicios de dominio
  CV_VALIDATION_SERVICE: 'ICvValidationService',
  CV_EXPORT_SERVICE: 'ICvExportService',
  CV_TRANSFORM_SERVICE: 'ICvTransformService',
  
  // Servicios de infraestructura
  FILE_STORAGE_SERVICE: 'IFileStorageService',
  CV_NOTIFICATION_SERVICE: 'ICvNotificationService',
  CV_CACHE_SERVICE: 'ICvCacheService',
  CV_EVENT_SERVICE: 'ICvEventService'
} as const;
