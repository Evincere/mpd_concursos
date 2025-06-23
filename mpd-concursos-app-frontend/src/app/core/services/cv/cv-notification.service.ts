/**
 * Servicio de Notificaciones del Sistema CV
 * 
 * @description Servicio especializado para notificaciones del CV con mensajes contextuales
 * @author Augment Agent
 * @date 2025-06-20
 * @version 2.0.0
 */

import { Injectable } from '@angular/core';
import { ICvNotificationService } from '@core/models/cv';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';

/**
 * Tipos de notificación específicos del CV
 */
export enum CvNotificationType {
  EXPERIENCE_SAVED = 'EXPERIENCE_SAVED',
  EXPERIENCE_UPDATED = 'EXPERIENCE_UPDATED',
  EXPERIENCE_DELETED = 'EXPERIENCE_DELETED',
  EDUCATION_SAVED = 'EDUCATION_SAVED',
  EDUCATION_UPDATED = 'EDUCATION_UPDATED',
  EDUCATION_DELETED = 'EDUCATION_DELETED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_DELETED = 'DOCUMENT_DELETED',
  CV_EXPORTED = 'CV_EXPORTED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  VALIDATION_WARNING = 'VALIDATION_WARNING',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNAUTHORIZED_ERROR = 'UNAUTHORIZED_ERROR',
  SERVER_ERROR = 'SERVER_ERROR'
}

/**
 * Configuración de notificación
 */
export interface NotificationConfig {
  type: CvNotificationType;
  duration?: number;
  showAction?: boolean;
  actionText?: string;
  actionCallback?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class CvNotificationService implements ICvNotificationService {

  private readonly defaultDuration = 5000; // 5 segundos
  private readonly errorDuration = 8000; // 8 segundos para errores
  private readonly warningDuration = 6000; // 6 segundos para warnings

  constructor(private notificationService: CustomNotificationService) {}

  // ===== MÉTODOS BÁSICOS =====

  /**
   * Muestra notificación de éxito
   */
  showSuccess(message: string, duration?: number): void {
    this.notificationService.show({
      message,
      title: 'Éxito',
      type: 'success',
      duration: duration || this.defaultDuration
    });
  }

  /**
   * Muestra notificación de error
   */
  showError(message: string, duration?: number): void {
    this.notificationService.show({
      message,
      title: 'Error',
      type: 'error',
      duration: duration || this.errorDuration
    });
  }

  /**
   * Muestra notificación de advertencia
   */
  showWarning(message: string, duration?: number): void {
    this.notificationService.show({
      message,
      title: 'Advertencia',
      type: 'warning',
      duration: duration || this.warningDuration
    });
  }

  /**
   * Muestra notificación informativa
   */
  showInfo(message: string, duration?: number): void {
    this.notificationService.show({
      message,
      title: 'Información',
      type: 'info',
      duration: duration || this.defaultDuration
    });
  }

  /**
   * Muestra errores de validación
   */
  showValidationErrors(errors: string[]): void {
    if (errors.length === 0) return;

    if (errors.length === 1) {
      this.showError(errors[0]);
    } else {
      const message = `Se encontraron ${errors.length} errores de validación:`;
      const errorList = errors.map(error => `• ${error}`).join('\n');
      this.showError(`${message}\n${errorList}`, this.errorDuration + 2000);
    }
  }

  // ===== NOTIFICACIONES ESPECÍFICAS DEL CV =====

  /**
   * Notificación para experiencia laboral guardada
   */
  showExperienceSaved(companyName: string): void {
    this.showContextualNotification({
      type: CvNotificationType.EXPERIENCE_SAVED,
      duration: this.defaultDuration
    }, `Experiencia en ${companyName} guardada correctamente`);
  }

  /**
   * Notificación para experiencia laboral actualizada
   */
  showExperienceUpdated(companyName: string): void {
    this.showContextualNotification({
      type: CvNotificationType.EXPERIENCE_UPDATED,
      duration: this.defaultDuration
    }, `Experiencia en ${companyName} actualizada correctamente`);
  }

  /**
   * Notificación para experiencia laboral eliminada
   */
  showExperienceDeleted(companyName: string): void {
    this.showContextualNotification({
      type: CvNotificationType.EXPERIENCE_DELETED,
      duration: this.defaultDuration,
      showAction: true,
      actionText: 'Deshacer',
      actionCallback: () => this.handleUndoAction('experience')
    }, `Experiencia en ${companyName} eliminada`);
  }

  /**
   * Notificación para educación guardada
   */
  showEducationSaved(title: string): void {
    this.showContextualNotification({
      type: CvNotificationType.EDUCATION_SAVED,
      duration: this.defaultDuration
    }, `${title} guardado correctamente`);
  }

  /**
   * Notificación para educación actualizada
   */
  showEducationUpdated(title: string): void {
    this.showContextualNotification({
      type: CvNotificationType.EDUCATION_UPDATED,
      duration: this.defaultDuration
    }, `${title} actualizado correctamente`);
  }

  /**
   * Notificación para educación eliminada
   */
  showEducationDeleted(title: string): void {
    this.showContextualNotification({
      type: CvNotificationType.EDUCATION_DELETED,
      duration: this.defaultDuration,
      showAction: true,
      actionText: 'Deshacer',
      actionCallback: () => this.handleUndoAction('education')
    }, `${title} eliminado`);
  }

  /**
   * Notificación para documento subido
   */
  showDocumentUploaded(fileName: string): void {
    this.showContextualNotification({
      type: CvNotificationType.DOCUMENT_UPLOADED,
      duration: this.defaultDuration
    }, `Documento ${fileName} subido correctamente`);
  }

  /**
   * Notificación para documento eliminado
   */
  showDocumentDeleted(fileName: string): void {
    this.showContextualNotification({
      type: CvNotificationType.DOCUMENT_DELETED,
      duration: this.defaultDuration
    }, `Documento ${fileName} eliminado`);
  }

  /**
   * Notificación para CV exportado
   */
  showCvExported(format: string): void {
    this.showContextualNotification({
      type: CvNotificationType.CV_EXPORTED,
      duration: this.defaultDuration,
      showAction: true,
      actionText: 'Descargar',
      actionCallback: () => this.handleDownloadAction()
    }, `CV exportado en formato ${format.toUpperCase()}`);
  }

  /**
   * Notificación para errores de validación
   */
  showValidationError(field: string, error: string): void {
    this.showContextualNotification({
      type: CvNotificationType.VALIDATION_ERROR,
      duration: this.errorDuration
    }, `Error en ${field}: ${error}`);
  }

  /**
   * Notificación para advertencias de validación
   */
  showValidationWarning(field: string, warning: string): void {
    this.showContextualNotification({
      type: CvNotificationType.VALIDATION_WARNING,
      duration: this.warningDuration
    }, `Advertencia en ${field}: ${warning}`);
  }

  /**
   * Notificación para errores de red
   */
  showNetworkError(operation: string): void {
    this.showContextualNotification({
      type: CvNotificationType.NETWORK_ERROR,
      duration: this.errorDuration,
      showAction: true,
      actionText: 'Reintentar',
      actionCallback: () => this.handleRetryAction(operation)
    }, `Error de conexión al ${operation}. Verifique su conexión a internet.`);
  }

  /**
   * Notificación para errores de autorización
   */
  showUnauthorizedError(): void {
    this.showContextualNotification({
      type: CvNotificationType.UNAUTHORIZED_ERROR,
      duration: this.errorDuration,
      showAction: true,
      actionText: 'Iniciar Sesión',
      actionCallback: () => this.handleLoginAction()
    }, 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
  }

  /**
   * Notificación para errores del servidor
   */
  showServerError(operation: string): void {
    this.showContextualNotification({
      type: CvNotificationType.SERVER_ERROR,
      duration: this.errorDuration,
      showAction: true,
      actionText: 'Reportar',
      actionCallback: () => this.handleReportErrorAction(operation)
    }, `Error del servidor al ${operation}. El equipo técnico ha sido notificado.`);
  }

  // ===== NOTIFICACIONES CONTEXTUALES AVANZADAS =====

  /**
   * Muestra notificación con progreso para operaciones largas
   */
  showProgressNotification(message: string, progress: number): void {
    // TODO: Implementar notificación con barra de progreso
    this.showInfo(`${message} (${progress}%)`);
  }

  /**
   * Muestra notificación de confirmación antes de acciones destructivas
   */
  showConfirmationNotification(
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): void {
    // TODO: Implementar notificación de confirmación
    if (confirm(message)) {
      onConfirm();
    } else if (onCancel) {
      onCancel();
    }
  }

  /**
   * Muestra notificación con múltiples acciones
   */
  showMultiActionNotification(
    message: string,
    actions: { text: string; callback: () => void }[]
  ): void {
    // TODO: Implementar notificación con múltiples acciones
    this.showInfo(message);
  }

  /**
   * Muestra notificación persistente que requiere acción del usuario
   */
  showPersistentNotification(message: string, actionText: string, actionCallback: () => void): void {
    // TODO: Implementar notificación persistente
    this.showWarning(message, 0); // Duración 0 = persistente
  }

  // ===== MÉTODOS AUXILIARES =====

  /**
   * Muestra notificación contextual según el tipo
   */
  private showContextualNotification(config: NotificationConfig, message: string): void {
    switch (config.type) {
      case CvNotificationType.EXPERIENCE_SAVED:
      case CvNotificationType.EXPERIENCE_UPDATED:
      case CvNotificationType.EDUCATION_SAVED:
      case CvNotificationType.EDUCATION_UPDATED:
      case CvNotificationType.DOCUMENT_UPLOADED:
      case CvNotificationType.CV_EXPORTED:
        this.showSuccess(message, config.duration);
        break;

      case CvNotificationType.VALIDATION_WARNING:
        this.showWarning(message, config.duration);
        break;

      case CvNotificationType.VALIDATION_ERROR:
      case CvNotificationType.NETWORK_ERROR:
      case CvNotificationType.UNAUTHORIZED_ERROR:
      case CvNotificationType.SERVER_ERROR:
        this.showError(message, config.duration);
        break;

      case CvNotificationType.EXPERIENCE_DELETED:
      case CvNotificationType.EDUCATION_DELETED:
      case CvNotificationType.DOCUMENT_DELETED:
        this.showInfo(message, config.duration);
        break;

      default:
        this.showInfo(message, config.duration);
    }

    // Manejar acciones si están configuradas
    if (config.showAction && config.actionCallback) {
      // TODO: Implementar acciones en notificaciones
      console.log(`Acción disponible: ${config.actionText}`);
    }
  }

  /**
   * Maneja la acción de deshacer
   */
  private handleUndoAction(type: 'experience' | 'education'): void {
    // TODO: Implementar lógica de deshacer
    this.showInfo(`Función de deshacer ${type} en desarrollo`);
  }

  /**
   * Maneja la acción de descarga
   */
  private handleDownloadAction(): void {
    // TODO: Implementar lógica de descarga
    this.showInfo('Iniciando descarga...');
  }

  /**
   * Maneja la acción de reintentar
   */
  private handleRetryAction(operation: string): void {
    // TODO: Implementar lógica de reintento
    this.showInfo(`Reintentando ${operation}...`);
  }

  /**
   * Maneja la acción de iniciar sesión
   */
  private handleLoginAction(): void {
    // TODO: Implementar redirección a login
    this.showInfo('Redirigiendo a inicio de sesión...');
  }

  /**
   * Maneja la acción de reportar error
   */
  private handleReportErrorAction(operation: string): void {
    // TODO: Implementar reporte de errores
    this.showInfo(`Error en ${operation} reportado al equipo técnico`);
  }

  // ===== MÉTODOS DE UTILIDAD =====

  /**
   * Limpia todas las notificaciones activas
   */
  clearAllNotifications(): void {
    // TODO: Implementar limpieza de notificaciones
    console.log('Limpiando todas las notificaciones');
  }

  /**
   * Obtiene el número de notificaciones activas
   */
  getActiveNotificationsCount(): number {
    // TODO: Implementar contador de notificaciones
    return 0;
  }

  /**
   * Configura las preferencias de notificación del usuario
   */
  setNotificationPreferences(preferences: {
    enableSound: boolean;
    enableDesktop: boolean;
    duration: number;
  }): void {
    // TODO: Implementar configuración de preferencias
    console.log('Configurando preferencias de notificación', preferences);
  }
}
