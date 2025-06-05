import { Injectable } from '@angular/core';
import { UnifiedNotificationService } from '@shared/components/unified-notification/unified-notification.service';

/**
 * Servicio de Toast migrado al sistema unificado de notificaciones
 * Mantiene la compatibilidad con el código existente
 */
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private unifiedNotificationService: UnifiedNotificationService) {}

  success(message: string, duration: number = 3000): void {
    this.unifiedNotificationService.success(message, 'Éxito', {
      duration,
      position: 'top-end'
    });
  }

  error(message: string, duration: number = 5000): void {
    this.unifiedNotificationService.error(message, 'Error', {
      duration,
      position: 'top-end'
    });
  }

  info(message: string, duration: number = 3000): void {
    this.unifiedNotificationService.info(message, 'Información', {
      duration,
      position: 'top-end'
    });
  }

  warning(message: string, duration: number = 4000): void {
    this.unifiedNotificationService.warning(message, 'Advertencia', {
      duration,
      position: 'top-end'
    });
  }
}