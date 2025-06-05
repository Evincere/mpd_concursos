import { Injectable } from '@angular/core';
import { UnifiedNotificationService } from '@shared/components/unified-notification/unified-notification.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private unifiedNotificationService: UnifiedNotificationService) {}

  /**
   * Muestra un mensaje de éxito
   */
  mostrarExito(mensaje: string, duracion = 5000): void {
    this.unifiedNotificationService.success(mensaje, 'Éxito', {
      duration: duracion,
      position: 'bottom-center'
    });
  }

  /**
   * Muestra un mensaje de error
   */
  mostrarError(mensaje: string, duracion = 7000): void {
    this.unifiedNotificationService.error(mensaje, 'Error', {
      duration: duracion,
      position: 'bottom-center'
    });
  }

  /**
   * Muestra un mensaje de advertencia
   */
  mostrarAdvertencia(mensaje: string, duracion = 6000): void {
    this.unifiedNotificationService.warning(mensaje, 'Advertencia', {
      duration: duracion,
      position: 'bottom-center'
    });
  }

  /**
   * Muestra un mensaje informativo
   */
  mostrarInfo(mensaje: string, duracion = 5000): void {
    this.unifiedNotificationService.info(mensaje, 'Información', {
      duration: duracion,
      position: 'bottom-center'
    });
  }

  /**
   * Limpia cualquier notificación activa
   */
  cleanup(): void {
    this.unifiedNotificationService.dismissAll();
  }

  /**
   * Deshabilita las notificaciones
   */
  disableNotifications(): void {
    // Esta función es un placeholder para mantener compatibilidad con ExamenNotificationService
    console.log('Notificaciones deshabilitadas');
  }
}
