/**
 * Interfaces para Integración con Backend del Sistema CV
 * 
 * @description Definiciones de tipos para comunicación con APIs REST del backend hexagonal
 * @author Augment Agent
 * @date 2025-06-21
 * @version 1.0.0
 */

import { WorkExperience, EducationEntry } from '@core/models/cv';

// ===== INTERFACES BASE =====

/**
 * Respuesta estándar de la API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: ApiError[];
  metadata?: ApiMetadata;
}

/**
 * Respuesta paginada de la API
 */
export interface PaginatedApiResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: PaginationInfo;
  metadata?: ApiMetadata;
}

/**
 * Error de la API
 */
export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
  timestamp?: string;
}

/**
 * Metadatos de la API
 */
export interface ApiMetadata {
  timestamp: string;
  version: string;
  requestId: string;
  executionTime?: number;
  source?: string;
}

/**
 * Información de paginación
 */
export interface PaginationInfo {
  page: number;
  size: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  first: boolean;
  last: boolean;
}

// ===== INTERFACES DE BÚSQUEDA =====

/**
 * Parámetros de búsqueda
 */
export interface SearchRequest {
  query?: string;
  filters?: SearchFilters;
  sort?: SortOptions;
  pagination?: PaginationRequest;
  includeMetadata?: boolean;
}

/**
 * Filtros de búsqueda
 */
export interface SearchFilters {
  // Filtros de experiencia
  companies?: string[];
  positions?: string[];
  technologies?: string[];
  locations?: string[];
  salaryRange?: {
    min?: number;
    max?: number;
  };
  experienceYears?: {
    min?: number;
    max?: number;
  };
  isCurrentJob?: boolean;
  
  // Filtros de educación
  institutions?: string[];
  educationTypes?: string[];
  educationStatuses?: string[];
  gradeRange?: {
    min?: number;
    max?: number;
  };
  isOngoing?: boolean;
  
  // Filtros de fecha
  dateRange?: {
    from?: string; // ISO date string
    to?: string;   // ISO date string
    preset?: 'last_month' | 'last_3_months' | 'last_6_months' | 'last_year' | 'last_2_years';
  };
  
  // Filtros adicionales
  keywords?: string[];
  excludeKeywords?: string[];
  hasProjects?: boolean;
  hasAchievements?: boolean;
  hasReferences?: boolean;
}

/**
 * Opciones de ordenamiento
 */
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
  secondary?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

/**
 * Solicitud de paginación
 */
export interface PaginationRequest {
  page: number;
  size: number;
  offset?: number;
}

/**
 * Respuesta de búsqueda
 */
export interface SearchResponse {
  experiences: WorkExperience[];
  education: EducationEntry[];
  totalResults: number;
  searchTime: number;
  facets: SearchFacets;
  suggestions?: string[];
}

/**
 * Facetas de búsqueda
 */
export interface SearchFacets {
  companies: FacetItem[];
  technologies: FacetItem[];
  institutions: FacetItem[];
  locations: FacetItem[];
  educationTypes: FacetItem[];
  years: FacetItem[];
}

/**
 * Elemento de faceta
 */
export interface FacetItem {
  value: string;
  count: number;
  selected?: boolean;
}

// ===== INTERFACES DE EXPERIENCIA LABORAL =====

/**
 * DTO para crear experiencia laboral
 */
export interface CreateExperienceRequest {
  position: string;
  company: string;
  startDate: string; // ISO date string
  endDate?: string;  // ISO date string
  description: string;
  technologies?: string[];
  achievements?: string[];
  projects?: string[];
  isCurrentJob: boolean;
  location?: string;
  salary?: number;
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship';
  industry?: string;
  companySize?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  references?: ExperienceReference[];
}

/**
 * DTO para actualizar experiencia laboral
 */
export interface UpdateExperienceRequest extends Partial<CreateExperienceRequest> {
  id: string;
  version?: number; // Para control de concurrencia optimista
}

/**
 * Referencia de experiencia laboral
 */
export interface ExperienceReference {
  name: string;
  position: string;
  email?: string;
  phone?: string;
  relationship: 'supervisor' | 'colleague' | 'subordinate' | 'client' | 'other';
}

// ===== INTERFACES DE EDUCACIÓN =====

/**
 * DTO para crear entrada de educación
 */
export interface CreateEducationRequest {
  type: string;
  title: string;
  institution: string;
  startDate: string; // ISO date string
  endDate?: string;  // ISO date string
  status: string;
  description?: string;
  grade?: number;
  isOngoing: boolean;
  
  // Campos específicos por tipo
  duration?: string;           // Para cursos
  hourlyLoad?: number;         // Para cursos
  thesisTitle?: string;        // Para postgrados
  advisor?: string;            // Para postgrados
  activityType?: string;       // Para actividades científicas
  role?: string;               // Para actividades científicas
  topic?: string;              // Para actividades científicas
  
  // Campos adicionales
  credits?: number;
  curriculum?: string;
  accreditation?: string;
  certificate?: string;
  projects?: string[];
  publications?: string[];
}

/**
 * DTO para actualizar entrada de educación
 */
export interface UpdateEducationRequest extends Partial<CreateEducationRequest> {
  id: string;
  version?: number; // Para control de concurrencia optimista
}

// ===== INTERFACES DE PREFERENCIAS =====

/**
 * Preferencias del usuario
 */
export interface UserPreferences {
  searchPreferences: SearchPreferences;
  displayPreferences: DisplayPreferences;
  exportPreferences: ExportPreferences;
  notificationPreferences: NotificationPreferences;
  privacySettings: PrivacySettings;
}

/**
 * Preferencias de búsqueda
 */
export interface SearchPreferences {
  defaultSortBy: string;
  defaultSortOrder: 'asc' | 'desc';
  enableFuzzySearch: boolean;
  enableAutoComplete: boolean;
  saveSearchHistory: boolean;
  maxSearchHistoryItems: number;
  defaultFilters?: SearchFilters;
}

/**
 * Preferencias de visualización
 */
export interface DisplayPreferences {
  itemsPerPage: number;
  showThumbnails: boolean;
  compactView: boolean;
  showFacets: boolean;
  defaultView: 'list' | 'grid' | 'timeline';
  enableAnimations: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

/**
 * Preferencias de exportación
 */
export interface ExportPreferences {
  defaultFormat: 'pdf' | 'docx' | 'html' | 'json';
  includePhotos: boolean;
  includeReferences: boolean;
  templateStyle: 'modern' | 'classic' | 'minimal' | 'creative';
  paperSize: 'A4' | 'Letter' | 'Legal';
  margins: 'normal' | 'narrow' | 'wide';
  fontSize: 'small' | 'medium' | 'large';
  colorScheme: 'color' | 'grayscale' | 'black-white';
}

/**
 * Preferencias de notificaciones
 */
export interface NotificationPreferences {
  enableSaveNotifications: boolean;
  enableValidationAlerts: boolean;
  enableSuccessMessages: boolean;
  enableErrorMessages: boolean;
  notificationDuration: number;
  soundEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

/**
 * Configuración de privacidad
 */
export interface PrivacySettings {
  shareUsageData: boolean;
  enableAnalytics: boolean;
  autoSaveEnabled: boolean;
  autoSaveInterval: number; // en minutos
  dataRetentionPeriod: number; // en días
  allowDataExport: boolean;
  allowDataDeletion: boolean;
}

// ===== INTERFACES DE SINCRONIZACIÓN =====

/**
 * Estado de sincronización
 */
export interface SyncStatus {
  isOnline: boolean;
  lastSync: string; // ISO date string
  pendingChanges: number;
  syncInProgress: boolean;
  conflicts: SyncConflict[];
  errors: SyncError[];
}

/**
 * Conflicto de sincronización
 */
export interface SyncConflict {
  id: string;
  type: 'experience' | 'education' | 'preferences';
  entityId: string;
  localVersion: any;
  serverVersion: any;
  timestamp: string; // ISO date string
  conflictFields: string[];
}

/**
 * Error de sincronización
 */
export interface SyncError {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entityType: 'experience' | 'education' | 'preferences';
  entityId: string;
  error: ApiError;
  timestamp: string; // ISO date string
  retryCount: number;
  maxRetries: number;
}

/**
 * Solicitud de resolución de conflicto
 */
export interface ConflictResolutionRequest {
  conflictId: string;
  resolution: 'local' | 'server' | 'merge';
  mergeData?: any; // Solo para resolución 'merge'
}

// ===== INTERFACES DE SUGERENCIAS =====

/**
 * Solicitud de sugerencias
 */
export interface SuggestionsRequest {
  query: string;
  type: 'companies' | 'technologies' | 'institutions' | 'positions' | 'locations';
  limit?: number;
  includeCount?: boolean;
}

/**
 * Respuesta de sugerencias
 */
export interface SuggestionsResponse {
  suggestions: SuggestionItem[];
  totalCount: number;
}

/**
 * Elemento de sugerencia
 */
export interface SuggestionItem {
  value: string;
  count?: number;
  category?: string;
  metadata?: Record<string, any>;
}

// ===== INTERFACES DE EXPORTACIÓN =====

/**
 * Solicitud de exportación
 */
export interface ExportRequest {
  format: 'pdf' | 'docx' | 'html' | 'json';
  includeExperiences: boolean;
  includeEducation: boolean;
  includePreferences?: boolean;
  template?: string;
  options?: ExportOptions;
  filters?: SearchFilters; // Para exportar solo resultados filtrados
}

/**
 * Opciones de exportación
 */
export interface ExportOptions {
  includePhotos?: boolean;
  includeReferences?: boolean;
  paperSize?: 'A4' | 'Letter' | 'Legal';
  margins?: 'normal' | 'narrow' | 'wide';
  fontSize?: 'small' | 'medium' | 'large';
  colorScheme?: 'color' | 'grayscale' | 'black-white';
  watermark?: string;
  password?: string;
}

/**
 * Respuesta de exportación
 */
export interface ExportResponse {
  downloadUrl: string;
  filename: string;
  fileSize: number;
  expiresAt: string; // ISO date string
  format: string;
}

// ===== INTERFACES DE VALIDACIÓN =====

/**
 * Resultado de validación
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Error de validación
 */
export interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: any;
}

/**
 * Advertencia de validación
 */
export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  suggestion?: string;
}

// ===== INTERFACES DE ESTADÍSTICAS =====

/**
 * Estadísticas del CV
 */
export interface CvStatistics {
  totalExperiences: number;
  totalEducation: number;
  totalYearsExperience: number;
  topTechnologies: FacetItem[];
  topCompanies: FacetItem[];
  topInstitutions: FacetItem[];
  completenessScore: number;
  lastUpdated: string; // ISO date string
}

/**
 * Métricas de uso
 */
export interface UsageMetrics {
  searchCount: number;
  exportCount: number;
  lastActivity: string; // ISO date string
  popularFilters: FacetItem[];
  averageSessionDuration: number;
  deviceTypes: FacetItem[];
}
