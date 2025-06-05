import { Injectable } from '@angular/core';
import { UnifiedNotificationService } from '@shared/components/unified-notification/unified-notification.service';
import { Observable, Subject } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
  duration?: number;
  horizontalPosition?: 'start' | 'center' | 'end';
  verticalPosition?: 'top' | 'bottom';
  action?: string | { text: string; callback: () => void };
  panelClass?: string[];
  data?: Record<string, unknown>;
}

export interface Notification {
  message: string;
  title?: string;
  type: NotificationType;
  options?: NotificationOptions;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new Subject<Notification>();

  constructor(private unifiedNotificationService: UnifiedNotificationService) {}

  /**
   * Limpia los recursos utilizados por el servicio
   */
  cleanup(): void {
    // Método requerido por compatibilidad con ExamenRendicionComponent
    console.log('Limpiando recursos del servicio de notificaciones');
  }

  /**
   * Muestra un mensaje de error
   * @param message Mensaje de error
   */
  mostrarError(message: string): void {
    this.error(message);
  }

  /**
   * Muestra un mensaje de advertencia
   * @param message Mensaje de advertencia
   */
  mostrarAdvertencia(message: string): void {
    this.warning(message);
  }

  /**
   * Muestra un mensaje de éxito
   * @param message Mensaje de éxito
   */
  mostrarExito(message: string): void {
    this.success(message);
  }

  // Duración predeterminada por tipo de notificación
  private defaultDurations: Record<NotificationType, number> = {
    success: 5000,
    error: 7000,
    warning: 6000,
    info: 5000
  };

  // Clases CSS predeterminadas por tipo de notificación
  private defaultPanelClasses: Record<NotificationType, string[]> = {
    success: ['success-snackbar'],
    error: ['error-snackbar'],
    warning: ['warning-snackbar'],
    info: ['info-snackbar']
  };



  /**
   * Obtiene un Observable para suscribirse a las notificaciones
   */
  getNotifications(): Observable<Notification> {
    return this.notificationSubject.asObservable();
  }

  /**
   * Muestra una notificación de éxito
   * @param message Mensaje de la notificación
   * @param title Título opcional
   * @param options Opciones adicionales
   */
  success(message: string, title?: string, options?: NotificationOptions): void {
    this.show(message, 'success', title, options);
  }

  /**
   * Muestra una notificación de error
   * @param message Mensaje de la notificación
   * @param titleOrOptions Título opcional o opciones adicionales
   */
  error(message: string, titleOrOptions?: string | NotificationOptions): void {
    // Sobrecarga para manejar diferentes tipos de parámetros
    if (typeof titleOrOptions === 'string') {
      // Si es un string, es el título
      this.show(message, 'error', titleOrOptions);
    } else if (titleOrOptions) {
      // Si es un objeto, son las opciones
      this.show(message, 'error', undefined, titleOrOptions);
    } else {
      // Si no hay segundo parámetro
      this.show(message, 'error');
    }
  }

  /**
   * Muestra una notificación de advertencia
   * @param message Mensaje de la notificación
   * @param title Título opcional
   * @param options Opciones adicionales
   */
  warning(message: string, title?: string, options?: NotificationOptions): void {
    this.show(message, 'warning', title, options);
  }

  /**
   * Muestra una notificación informativa
   * @param message Mensaje de la notificación
   * @param title Título opcional
   * @param options Opciones adicionales
   */
  info(message: string, title?: string, options?: NotificationOptions): void {
    this.show(message, 'info', title, options);
  }

  /**
   * Muestra una notificación de error con botón de reintento
   * @param message Mensaje de la notificación
   * @param retryCallback Función a ejecutar cuando se hace clic en el botón de reintento
   * @param duration Duración de la notificación en milisegundos
   */
  errorWithRetry(message: string, retryCallback: () => void, duration: number = 10000): void {
    const options: NotificationOptions = {
      duration: duration,
      action: {
        text: 'Reintentar',
        callback: retryCallback
      }
    };

    this.show(message, 'error', undefined, options);
  }

  /**
   * Muestra una notificación
   * @param message Mensaje de la notificación
   * @param type Tipo de notificación
   * @param title Título opcional
   * @param options Opciones adicionales
   */
  private show(message: string, type: NotificationType, title?: string, options?: NotificationOptions): void {
    const notification: Notification = {
      message,
      title,
      type,
      options
    };

    // Emitir la notificación para componentes que estén escuchando
    this.notificationSubject.next(notification);

    // Mostrar la notificación usando MatSnackBar
    this.showSnackBar(notification);
  }

  /**
   * Muestra una notificación usando el sistema unificado
   * @param notification Datos de la notificación
   */
  private showSnackBar(notification: Notification): void {
    const { message, title, type, options } = notification;

    // Mapear posición horizontal y vertical a posición unificada
    const horizontalPosition = options?.horizontalPosition || 'end';
    const verticalPosition = options?.verticalPosition || 'top';
    const position = `${verticalPosition}-${horizontalPosition}` as any;

    // Configuración para el sistema unificado
    const unifiedConfig = {
      duration: options?.duration || this.defaultDurations[type],
      position: position,
      data: options?.data
    };

    // Manejar diferentes tipos de acción
    if (options?.action && typeof options.action === 'object') {
      // Si la acción es un objeto con texto y callback
      const actionText = options.action.text || 'Cerrar';
      const actionCallback = options.action.callback;

      this.unifiedNotificationService.show({
        message,
        title,
        type,
        ...unifiedConfig,
        actionText,
        onAction: actionCallback
      });
    } else {
      // Notificación simple
      switch (type) {
        case 'success':
          this.unifiedNotificationService.success(message, title, unifiedConfig);
          break;
        case 'error':
          this.unifiedNotificationService.error(message, title, unifiedConfig);
          break;
        case 'warning':
          this.unifiedNotificationService.warning(message, title, unifiedConfig);
          break;
        case 'info':
          this.unifiedNotificationService.info(message, title, unifiedConfig);
          break;
      }
    }
  }
}
