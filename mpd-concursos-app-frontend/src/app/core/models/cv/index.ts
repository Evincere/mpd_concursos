/**
 * Barrel Export para Modelos del Sistema CV
 * 
 * @description Exportación centralizada de todos los modelos, interfaces y contratos del CV
 * @author Augment Agent
 * @date 2025-06-20
 * @version 2.0.0
 */

// ===== MODELOS PRINCIPALES =====
export {
  // Enums
  CvEntryStatus,
  EducationType,
  EducationStatus,
  ScientificActivityType,
  ScientificActivityRole
} from './cv.model';

export type {
  // Interfaces base
  CvEntry,
  DateRange,
  CvDocument,

  // Modelos de experiencia laboral
  WorkExperience,
  WorkExperienceDto,
  WorkExperienceValidation,

  // Modelos de educación
  Education,
  UniversityEducation,
  PostgraduateEducation,
  DiplomaEducation,
  ScientificActivity,
  EducationEntry,
  EducationDto,

  // Modelo completo del CV
  CurriculumVitae,
  CvExportConfig,
  CvExportResult,

  // Interfaces de API
  CvApiResponse,
  CvSearchFilters,
  PaginationConfig,
  PaginatedResult
} from './cv.model';

// ===== REGLAS DE EDUCACIÓN =====
export type {
  EducationFieldConfig,
  EducationDateValidation,
  EducationDisplayConfig,
  EducationTypeRules
} from './education-rules.model';

export {
  EDUCATION_STATUS_LABELS,
  EDUCATION_TYPE_LABELS,
  EDUCATION_RULES_REGISTRY,
  getEducationRules,
  getEducationConfig,
  UNDERGRADUATE_CAREER_RULES,
  HIGHER_EDUCATION_CAREER_RULES,
  POSTGRADUATE_SPECIALIZATION_RULES,
  POSTGRADUATE_MASTERS_RULES,
  POSTGRADUATE_DOCTORATE_RULES,
  DIPLOMA_RULES,
  TRAINING_COURSE_RULES,
  SCIENTIFIC_ACTIVITY_RULES
} from './education-rules.model';

// ===== CONTRATOS E INTERFACES =====
export {
  // Eventos del sistema
  CvEventType,

  // Tokens de inyección
  CV_TOKENS
} from './cv.contracts';

export type {
  // Contratos de repositorio
  IWorkExperienceRepository,
  IEducationRepository,
  ICvRepository,

  // Contratos de casos de uso
  IWorkExperienceUseCases,
  IEducationUseCases,
  ICvUseCases,

  // Contratos de servicios de dominio
  ICvValidationService,
  ICvExportService,
  ICvTransformService,

  // Contratos de servicios de infraestructura
  IFileStorageService,
  ICvNotificationService,
  ICvCacheService,

  // Contratos de componentes
  ICvFormComponent,
  ICvListComponent,
  CvComponentConfig,

  // Eventos del sistema
  CvEvent,
  ICvEventService
} from './cv.contracts';

// ===== TIPOS UTILITARIOS =====

/**
 * Tipo para identificadores únicos del CV
 */
export type CvId = string;

/**
 * Tipo para identificadores de usuario
 */
export type UserId = string;

/**
 * Tipo para operaciones CRUD
 */
export type CrudOperation = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';

/**
 * Tipo para estados de carga
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Tipo para configuración de formularios
 */
export type FormMode = 'create' | 'edit' | 'view';

/**
 * Tipo para validación de formularios
 */
export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
}

/**
 * Tipo para configuración de componentes
 */
export interface ComponentState<T> {
  data: T[];
  selectedItem: T | null;
  isLoading: boolean;
  error: string | null;
  filters: any; // CvSearchFilters;
  pagination: any; // PaginationConfig;
}

/**
 * Tipo para acciones de componentes
 */
export type ComponentAction<T> = 
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: T[] }
  | { type: 'LOAD_ERROR'; payload: string }
  | { type: 'SELECT_ITEM'; payload: T }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_FILTERS'; payload: any }
  | { type: 'SET_PAGINATION'; payload: any };

/**
 * Tipo para configuración de exportación
 */
export interface ExportOptions {
  format: 'PDF' | 'DOCX' | 'HTML';
  template: string;
  sections: {
    personalInfo: boolean;
    workExperience: boolean;
    education: boolean;
    skills: boolean;
  };
  styling: {
    theme: string;
    fontSize: number;
    margins: number;
  };
}

/**
 * Tipo para metadatos de archivos
 */
export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: Date;
  checksum?: string;
}

/**
 * Tipo para configuración de validación
 */
export interface ValidationConfig {
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => string | null;
}

/**
 * Tipo para configuración de campos de formulario
 */
export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'date' | 'select' | 'textarea' | 'file';
  validation: ValidationConfig;
  options?: { value: any; label: string }[];
  placeholder?: string;
  helpText?: string;
  dependsOn?: string;
  showWhen?: (formValue: any) => boolean;
}

/**
 * Tipo para configuración de formularios dinámicos
 */
export interface DynamicFormConfig {
  fields: FieldConfig[];
  layout: 'vertical' | 'horizontal' | 'grid';
  submitText: string;
  cancelText: string;
  resetText?: string;
}

// ===== CONSTANTES =====

/**
 * Constantes del sistema CV
 */
export const CV_CONSTANTS = {
  // Límites de archivos
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
  
  // Límites de texto
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_TITLE_LENGTH: 200,
  MAX_COMPANY_LENGTH: 100,
  
  // Configuración de paginación
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  
  // Configuración de cache
  CACHE_TTL: 5 * 60 * 1000, // 5 minutos
  
  // Configuración de validación
  MIN_EXPERIENCE_DURATION_DAYS: 1,
  MAX_FUTURE_DATE_YEARS: 1,
  
  // Configuración de exportación
  EXPORT_TIMEOUT: 30000, // 30 segundos
  
  // Mensajes de error comunes
  ERROR_MESSAGES: {
    REQUIRED_FIELD: 'Este campo es obligatorio',
    INVALID_DATE: 'Fecha inválida',
    INVALID_EMAIL: 'Email inválido',
    FILE_TOO_LARGE: 'El archivo es demasiado grande',
    INVALID_FILE_TYPE: 'Tipo de archivo no permitido',
    NETWORK_ERROR: 'Error de conexión',
    UNAUTHORIZED: 'No autorizado',
    SERVER_ERROR: 'Error del servidor'
  }
} as const;

/**
 * Configuraciones por defecto
 */
export const CV_DEFAULTS = {
  PAGINATION: {
    page: 0,
    size: CV_CONSTANTS.DEFAULT_PAGE_SIZE,
    sortBy: 'createdAt',
    sortDirection: 'DESC' as const
  },
  
  SEARCH_FILTERS: {
    status: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    searchTerm: '',
    type: undefined
  } as any, // CvSearchFilters,
  
  EXPORT_CONFIG: {
    format: 'PDF' as const,
    template: 'modern',
    includePhoto: true,
    includePersonalInfo: true,
    includeWorkExperience: true,
    includeEducation: true
  } as any, // CvExportConfig,
  
  COMPONENT_CONFIG: {
    allowAdd: true,
    allowEdit: true,
    allowDelete: true,
    allowExport: true,
    showValidation: true,
    enableFileUpload: true,
    maxFileSize: CV_CONSTANTS.MAX_FILE_SIZE,
    allowedFileTypes: CV_CONSTANTS.ALLOWED_FILE_TYPES
  } as any // CvComponentConfig
} as const;
