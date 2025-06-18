/**
 * Core Module - Barrel exports for all core functionality
 * 
 * This module provides centralized access to all core CV refactoring components:
 * - Standardized models with English terminology
 * - Robust validators with XSS protection
 * - Feature toggle system for gradual migration
 * - Model mappers for backward compatibility
 */

// Models
export * from './models/cv';

// Validators
export * from './validators';

// Mappers
export * from './mappers';

// Services
export * from './services';

// Re-export commonly used types for convenience
export type {
  Experience,
  Education,
  ExperienceFormData,
  EducationFormData,
  CvData,
  CvSummary,
  CvLoadingState,
  CvOperationResult,
  CvValidationResult
} from './models/cv';
