import { Injectable } from '@angular/core';
import { UnifiedNotificationService } from '@shared/components/unified-notification/unified-notification.service';

/**
 * Servicio de notificaciones personalizado migrado al sistema unificado
 * Mantiene la compatibilidad con el código existente
 */
@Injectable({
  providedIn: 'root'
})
export class CustomNotificationService {
  constructor(private unifiedNotificationService: UnifiedNotificationService) {}

  /**
   * Muestra un mensaje de éxito
   * @param message Mensaje a mostrar
   * @param title Título opcional
   */
  showSuccess(message: string, title = 'Éxito'): void {
    this.unifiedNotificationService.success(message, title);
  }

  /**
   * Muestra un mensaje de error
   * @param message Mensaje a mostrar
   * @param title Título opcional
   */
  showError(message: string, title = 'Error'): void {
    this.unifiedNotificationService.error(message, title);
  }

  /**
   * Muestra un mensaje de advertencia
   * @param message Mensaje a mostrar
   * @param title Título opcional
   */
  showWarning(message: string, title = 'Advertencia'): void {
    this.unifiedNotificationService.warning(message, title);
  }

  /**
   * Muestra un mensaje informativo
   * @param message Mensaje a mostrar
   * @param title Título opcional
   */
  showInfo(message: string, title = 'Información'): void {
    this.unifiedNotificationService.info(message, title);
  }

  /**
   * Muestra un mensaje de error con opción de reintento
   * @param message Mensaje a mostrar
   * @param retryCallback Función a ejecutar cuando se hace clic en el botón de reintento
   * @param title Título de la notificación
   */
  showErrorWithRetry(message: string, retryCallback: () => void, title = 'Error'): void {
    this.unifiedNotificationService.errorWithRetry(message, retryCallback, title);
  }

  /**
   * Cierra todas las notificaciones activas
   */
  dismissAll(): void {
    this.unifiedNotificationService.dismissAll();
  }

  // Métodos de compatibilidad con la API anterior
  success(message: string, title?: string): void {
    this.showSuccess(message, title);
  }

  error(message: string, title?: string): void {
    this.showError(message, title);
  }

  warning(message: string, title?: string): void {
    this.showWarning(message, title);
  }

  info(message: string, title?: string): void {
    this.showInfo(message, title);
  }
}
