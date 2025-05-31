import { Injectable } from '@angular/core';
import { CustomNotificationService as OriginalNotificationService } from '../components/custom-notification/custom-notification.service';

/**
 * Servicio de notificaciones personalizado que actúa como un wrapper para el servicio original
 * Esto permite mantener la compatibilidad con el código existente
 */
@Injectable({
  providedIn: 'root'
})
export class CustomNotificationService {
  constructor(private notificationService: OriginalNotificationService) {}

  /**
   * Muestra un mensaje de éxito
   * @param message Mensaje a mostrar
   * @param title Título opcional
   */
  showSuccess(message: string, title = 'Éxito'): void {
    this.notificationService.success(message, title);
  }

  /**
   * Muestra un mensaje de error
   * @param message Mensaje a mostrar
   * @param title Título opcional
   */
  showError(message: string, title = 'Error'): void {
    this.notificationService.error(message, title);
  }

  /**
   * Muestra un mensaje de advertencia
   * @param message Mensaje a mostrar
   * @param title Título opcional
   */
  showWarning(message: string, title = 'Advertencia'): void {
    this.notificationService.warning(message, title);
  }

  /**
   * Muestra un mensaje informativo
   * @param message Mensaje a mostrar
   * @param title Título opcional
   */
  showInfo(message: string, title = 'Información'): void {
    this.notificationService.info(message, title);
  }

  /**
   * Muestra un mensaje de error con opción de reintento
   * @param message Mensaje a mostrar
   * @param retryCallback Función a ejecutar cuando se hace clic en el botón de reintento
   * @param duration Duración de la notificación en milisegundos
   */
  showErrorWithRetry(message: string, retryCallback: () => void, duration = 10000): void {
    this.notificationService.errorWithRetry(message, retryCallback, duration);
  }

  /**
   * Cierra todas las notificaciones activas
   */
  dismissAll(): void {
    this.notificationService.dismissAll();
  }
}
