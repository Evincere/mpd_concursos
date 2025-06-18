/**
 * Experience model - Standardized interface for work experience data
 * Following English terminology for consistency with backend
 */

export interface Experience {
  /** Unique identifier for the experience */
  id?: string;
  
  /** User ID who owns this experience */
  userId: string;
  
  /** Job position/title (unified from puesto/cargo) */
  position: string;
  
  /** Company name */
  company: string;
  
  /** Start date of employment */
  startDate: Date;
  
  /** End date of employment (null if current job) */
  endDate?: Date;
  
  /** Job description and responsibilities */
  description?: string;
  
  /** Work location */
  location?: string;
  
  /** URL to supporting document */
  documentUrl?: string;
  
  /** Additional comments */
  comments?: string;
  
  /** Whether this is the current job */
  isCurrent?: boolean;
}

/**
 * Experience request DTO for API calls
 */
export interface ExperienceRequest {
  position: string;
  company: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
  location?: string;
  comments?: string;
  isCurrent?: boolean;
}

/**
 * Experience response DTO from API
 */
export interface ExperienceResponse {
  id: string;
  userId: string;
  position: string;
  company: string;
  startDate: string; // ISO date string from API
  endDate?: string;  // ISO date string from API
  description?: string;
  location?: string;
  documentUrl?: string;
  comments?: string;
  isCurrent?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Legacy experience data interface for backward compatibility
 * @deprecated Use Experience interface instead
 */
export interface ExperienciaData {
  id?: number | string;
  puesto?: string;
  cargo?: string;
  empresa?: string;
  descripcion?: string;
  fechaInicio?: string | Date;
  fechaFin?: string | Date;
  actual?: boolean;
  ubicacion?: string;
}

/**
 * Experience form data interface
 */
export interface ExperienceFormData {
  position: string;
  company: string;
  startDate: Date | null;
  endDate: Date | null;
  description: string;
  location: string;
  comments: string;
  isCurrent: boolean;
}

/**
 * Experience validation errors
 */
export interface ExperienceValidationErrors {
  position?: string[];
  company?: string[];
  startDate?: string[];
  endDate?: string[];
  description?: string[];
  location?: string[];
  comments?: string[];
  dateRange?: string[];
}

/**
 * Experience display data for UI
 */
export interface ExperienceDisplayData {
  id: string;
  position: string;
  company: string;
  period: string; // Formatted date range
  description?: string;
  location?: string;
  hasDocument: boolean;
  isCurrent: boolean;
}
