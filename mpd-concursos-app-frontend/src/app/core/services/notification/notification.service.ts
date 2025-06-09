import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { UnifiedNotificationService } from '@shared/components/unified-notification/unified-notification.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(
    private unifiedNotificationService: UnifiedNotificationService,
    private loggingService: LoggingService
  ) {}

  /**
   * Muestra un mensaje de éxito
   */
  showSuccess(message: string, title = 'Éxito'): void {
    this.unifiedNotificationService.success(message, title, {
      duration: 5000,
      position: 'top-end'
    });
  }

  /**
   * Muestra un mensaje de error
   */
  showError(message: string, title = 'Error'): void {
    this.unifiedNotificationService.error(message, title, {
      duration: 7000,
      position: 'top-end'
    });
  }

  /**
   * Muestra un mensaje de advertencia
   */
  showWarning(message: string, title = 'Advertencia'): void {
    this.unifiedNotificationService.warning(message, title, {
      duration: 6000,
      position: 'top-end'
    });
  }

  /**
   * Muestra un mensaje informativo
   */
  showInfo(message: string, title = 'Información'): void {
    this.unifiedNotificationService.info(message, title, {
      duration: 5000,
      position: 'top-end'
    });
  }
}
