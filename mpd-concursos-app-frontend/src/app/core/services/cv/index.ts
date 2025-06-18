/**
 * CV Services - Barrel exports for CV-related services
 * 
 * This module provides a centralized export point for all CV services,
 * including the new standardized services and state management.
 */

// Core CV Services
export { ExperienceCvService } from './experience-cv.service';
export { EducationCvService } from './education-cv.service';
export { CvStateService } from './cv-state.service';
export { CvMigrationService } from './cv-migration.service';

// Service interfaces and types
export type { 
  ExperienceLoadingState, 
  ExperienceUploadProgress 
} from './experience-cv.service';

export type {
  EducationLoadingState,
  EducationUploadProgress
} from './education-cv.service';

export type {
  MigrationStrategy,
  MigrationStatus
} from './cv-migration.service';

// Re-export CV models for convenience
export type {
  Experience,
  Education,
  CvData,
  CvSummary,
  CvLoadingState,
  CvOperationResult
} from '../../models/cv';

// Re-export mappers for convenience
export { CvMappers } from '../../mappers';

// Re-export validators for convenience
export { CvValidators } from '../../validators';
