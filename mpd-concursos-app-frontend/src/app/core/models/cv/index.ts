/**
 * CV Models - Barrel exports for standardized CV interfaces
 *
 * This module provides a centralized export point for all CV-related models,
 * following the new standardized English terminology for consistency with backend.
 */

// Import types for local use in interfaces below
import type {
  Experience,
  ExperienceValidationErrors
} from './experience.model';
import type {
  Education,
  EducationType,
  EducationValidationErrors
} from './education.model';

// Experience models
export type {
  Experience,
  ExperienceRequest,
  ExperienceResponse,
  ExperienceFormData,
  ExperienceValidationErrors,
  ExperienceDisplayData,
  // Legacy - for backward compatibility
  ExperienciaData
} from './experience.model';

// Education models
export type {
  Education,
  EducationRequest,
  EducationResponse,
  EducationFormData,
  EducationValidationErrors,
  EducationDisplayData,
  // Legacy - for backward compatibility
  EducacionData
} from './education.model';

export {
  EducationType,
  EducationStatus,
  ScientificActivityType,
  ScientificActivityRole
} from './education.model';

// Common CV types
export interface CvData {
  experiences: Experience[];
  education: Education[];
  lastUpdated: Date;
}

export interface CvSummary {
  totalExperiences: number;
  totalEducation: number;
  yearsOfExperience: number;
  highestEducation: EducationType | null;
  hasDocuments: boolean;
}

export interface CvLoadingState {
  isLoading: boolean;
  error: string | null;
  lastLoaded: Date | null;
}

/**
 * CV operation result
 */
export interface CvOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}



/**
 * CV validation result
 */
export interface CvValidationResult {
  isValid: boolean;
  errors: {
    experiences: ExperienceValidationErrors[];
    education: EducationValidationErrors[];
    general: string[];
  };
}
