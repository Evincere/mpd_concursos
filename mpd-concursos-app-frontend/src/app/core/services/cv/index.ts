/**
 * Barrel Export para Servicios del Sistema CV
 *
 * @description Exportación centralizada de todos los servicios del CV
 * @author Augment Agent
 * @date 2025-06-22
 * @version 3.0.0
 */

// ===== SERVICIOS HTTP REALES =====
export { ExperienceCvService } from './experience-cv.service';
export { EducationCvService } from './education-cv.service';
export { CvStateService } from './cv-state.service';

// ===== SERVICIOS DE VALIDACIÓN Y TRANSFORMACIÓN =====
export { CvValidationService } from './cv-validation.service';
export { CvTransformService } from './cv-transform.service';
export { CvNotificationService, CvNotificationType } from './cv-notification.service';

// ===== SERVICIOS ESPECIALIZADOS DE EDUCACIÓN =====
export { EducationValidationService } from './education-validation.service';
export { EducationDisplayService } from './education-display.service';

// ===== TIPOS DE SERVICIOS =====
export type { ValidationResult, FileValidationConfig } from './cv-validation.service';
export type { EducationValidationResult, DynamicFieldConfiguration } from './education-validation.service';
export type { EducationDisplayInfo, FormattedDateInfo } from './education-display.service';
export type { ExperienceApiResponse } from './experience-cv.service';
export type { EducationApiResponse } from './education-cv.service';
export type { CvState, CvLoadingState, CvErrorState } from './cv-state.service';

// ===== SERVICIOS AVANZADOS =====
export { CvPdfExportService } from './cv-pdf-export.service';
export { CvSearchService } from './cv-search.service';
export { CvDragDropService } from './cv-drag-drop.service';
export { CvAutocompleteService, AutocompleteCategory } from './cv-autocomplete.service';

export type { NotificationConfig } from './cv-notification.service';
export type { PdfExportConfig, PdfExportResult, CvTemplate } from './cv-pdf-export.service';
export type { AdvancedSearchFilters, SearchResult, SearchFacets } from './cv-search.service';
export type { ReorderEvent, DragDropConfig, DragDropContainer } from './cv-drag-drop.service';
export type { AutocompleteSuggestion, AutocompleteConfig } from './cv-autocomplete.service';

// ===== RE-EXPORTACIÓN DE MODELOS Y CONTRATOS =====
export * from '@core/models/cv';
