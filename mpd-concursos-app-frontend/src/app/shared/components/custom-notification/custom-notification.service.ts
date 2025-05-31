import { Injectable, ApplicationRef, ComponentRef, createComponent, EnvironmentInjector, Injector } from '@angular/core';
import { CustomNotificationComponent, CustomNotificationConfig, NotificationType } from './custom-notification.component';

@Injectable({
  providedIn: 'root'
})
export class CustomNotificationService {
  private activeNotifications: ComponentRef<CustomNotificationComponent>[] = [];
  private readonly maxNotifications = 5;

  constructor(
    private appRef: ApplicationRef,
    private injector: Injector,
    private environmentInjector: EnvironmentInjector
  ) {}

  /**
   * Muestra una notificación personalizada
   * @param config Configuración de la notificación
   */
  show(config: CustomNotificationConfig): void {
    // Limitar el número de notificaciones activas
    if (this.activeNotifications.length >= this.maxNotifications) {
      this.dismiss(this.activeNotifications[0]);
    }

    // Crear el componente de notificación
    const notificationRef = createComponent(CustomNotificationComponent, {
      environmentInjector: this.environmentInjector,
      hostElement: document.createElement('div')
    });

    // Configurar el componente
    const instance = notificationRef.instance;
    instance.message = config.message;
    instance.title = config.title;
    instance.type = config.type;
    instance.duration = config.duration ?? this.getDefaultDuration(config.type);
    instance.action = config.action ?? 'Cerrar';
    instance.horizontalPosition = config.horizontalPosition ?? 'end';
    instance.verticalPosition = config.verticalPosition ?? 'top';
    instance.data = config.data;

    // Suscribirse al evento de cierre
    instance.dismissed.subscribe(() => {
      this.dismiss(notificationRef);
    });

    // Añadir al DOM
    const hostElement = notificationRef.location.nativeElement;
    document.body.appendChild(hostElement);
    this.appRef.attachView(notificationRef.hostView);

    // Guardar la referencia
    this.activeNotifications.push(notificationRef);
  }

  /**
   * Elimina una notificación
   * @param notificationRef Referencia al componente de notificación
   */
  private dismiss(notificationRef: ComponentRef<CustomNotificationComponent>): void {
    const index = this.activeNotifications.indexOf(notificationRef);
    if (index > -1) {
      // Eliminar del DOM
      const hostElement = notificationRef.location.nativeElement;
      this.appRef.detachView(notificationRef.hostView);
      if (hostElement.parentNode) {
        hostElement.parentNode.removeChild(hostElement);
      }

      // Destruir el componente
      notificationRef.destroy();

      // Eliminar de la lista
      this.activeNotifications.splice(index, 1);
    }
  }

  /**
   * Elimina todas las notificaciones activas
   */
  dismissAll(): void {
    [...this.activeNotifications].forEach(ref => this.dismiss(ref));
  }

  /**
   * Muestra una notificación de éxito
   * @param message Mensaje de la notificación
   * @param title Título opcional
   */
  success(message: string, title = 'Éxito'): void {
    this.show({
      message,
      title,
      type: 'success'
    });
  }

  /**
   * Muestra una notificación de error
   * @param message Mensaje de la notificación
   * @param title Título opcional
   */
  error(message: string, title = 'Error'): void {
    this.show({
      message,
      title,
      type: 'error'
    });
  }

  /**
   * Muestra una notificación de advertencia
   * @param message Mensaje de la notificación
   * @param title Título opcional
   */
  warning(message: string, title = 'Advertencia'): void {
    this.show({
      message,
      title,
      type: 'warning'
    });
  }

  /**
   * Muestra una notificación informativa
   * @param message Mensaje de la notificación
   * @param title Título opcional
   */
  info(message: string, title = 'Información'): void {
    this.show({
      message,
      title,
      type: 'info'
    });
  }

  /**
   * Muestra una notificación de error con botón de reintento
   * @param message Mensaje de la notificación
   * @param retryCallback Función a ejecutar cuando se hace clic en el botón de reintento
   * @param duration Duración de la notificación en milisegundos
   */
  errorWithRetry(message: string, retryCallback: () => void, duration = 10000): void {
    this.show({
      message,
      title: 'Error',
      type: 'error',
      duration,
      action: 'Reintentar',
      data: { retryCallback }
    });
  }

  /**
   * Obtiene la duración predeterminada según el tipo de notificación
   * @param type Tipo de notificación
   * @returns Duración en milisegundos
   */
  private getDefaultDuration(type: NotificationType): number {
    switch (type) {
      case 'success': return 5000;
      case 'error': return 7000;
      case 'warning': return 6000;
      case 'info': return 5000;
      default: return 5000;
    }
  }
}
