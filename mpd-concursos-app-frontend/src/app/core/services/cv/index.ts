/**
 * Barrel Export para Servicios del Sistema CV
 * 
 * @description Exportación centralizada de todos los servicios del CV
 * @author Augment Agent
 * @date 2025-06-20
 * @version 2.0.0
 */

// ===== SERVICIOS PRINCIPALES =====
export { CvValidationService } from './cv-validation.service';
export { CvTransformService } from './cv-transform.service';
export { CvNotificationService, CvNotificationType } from './cv-notification.service';

export type { ValidationResult, FileValidationConfig } from './cv-validation.service';
export type { NotificationConfig } from './cv-notification.service';

// ===== RE-EXPORTACIÓN DE MODELOS Y CONTRATOS =====
export * from '@core/models/cv';
