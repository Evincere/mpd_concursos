import { Injectable, ApplicationRef, ComponentRef, createComponent, EnvironmentInjector, Injector } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { UnifiedNotificationComponent, UnifiedNotificationConfig, UnifiedNotificationType } from './unified-notification.component';

@Injectable({
  providedIn: 'root'
})
export class UnifiedNotificationService {
  private activeNotifications: ComponentRef<UnifiedNotificationComponent>[] = [];
  private readonly maxNotifications = 5;
  private readonly stackSpacing = 80; // Espaciado entre notificaciones apiladas

  constructor(
    
    private appRef: ApplicationRef,
    private injector: Injector,
    private environmentInjector: EnvironmentInjector
  ,
    private loggingService: LoggingService
  ) {}

  /**
   * Muestra una notificación unificada
   * @param config Configuración de la notificación
   */
  show(config: UnifiedNotificationConfig): ComponentRef<UnifiedNotificationComponent> {
    // Limitar el número de notificaciones activas
    if (this.activeNotifications.length >= this.maxNotifications) {
      this.dismiss(this.activeNotifications[0]);
    }

    // Crear el componente de notificación
    const notificationRef = createComponent(UnifiedNotificationComponent, {
      environmentInjector: this.environmentInjector,
      hostElement: document.createElement('div')
    });

    // Configurar el componente
    const instance = notificationRef.instance;
    instance.message = config.message;
    instance.title = config.title;
    instance.type = config.type;
    instance.duration = config.duration ?? this.getDefaultDuration(config.type);
    instance.dismissible = config.dismissible ?? true;
    instance.position = config.position ?? 'top-end';
    instance.showIcon = config.showIcon ?? true;
    instance.actionText = config.actionText;
    instance.onAction = config.onAction;
    instance.data = config.data;

    // Suscribirse al evento de cierre
    instance.dismissed.subscribe(() => {
      this.dismiss(notificationRef);
    });

    // CRITICAL FIX: Diferir operaciones DOM para evitar congelamiento durante detección de cambios
    setTimeout(() => {
      // Añadir al DOM
      const hostElement = notificationRef.location.nativeElement;
      document.body.appendChild(hostElement);
      this.appRef.attachView(notificationRef.hostView);

      // Aplicar posicionamiento apilado
      this.applyStackPositioning(notificationRef, config.position ?? 'top-end');
    }, 0);

    // Guardar la referencia
    this.activeNotifications.push(notificationRef);

    return notificationRef;
  }

  /**
   * Aplica posicionamiento apilado para múltiples notificaciones
   */
  private applyStackPositioning(notificationRef: ComponentRef<UnifiedNotificationComponent>, position: string): void {
    const hostElement = notificationRef.location.nativeElement;
    const existingNotifications = this.activeNotifications.filter(ref => 
      ref.instance.position === position
    );
    
    const stackIndex = existingNotifications.length;
    const offset = stackIndex * this.stackSpacing;

    // Aplicar offset según la posición
    if (position.includes('top')) {
      hostElement.style.top = `${16 + offset}px`;
    } else if (position.includes('bottom')) {
      hostElement.style.bottom = `${16 + offset}px`;
    }
  }

  /**
   * Elimina una notificación
   */
  private dismiss(notificationRef: ComponentRef<UnifiedNotificationComponent>): void {
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

      // Reposicionar notificaciones restantes
      this.repositionNotifications();
    }
  }

  /**
   * Reposiciona las notificaciones después de eliminar una
   */
  private repositionNotifications(): void {
    const positionGroups: { [key: string]: ComponentRef<UnifiedNotificationComponent>[] } = {};
    
    // Agrupar por posición
    this.activeNotifications.forEach(ref => {
      const position = ref.instance.position;
      if (!positionGroups[position]) {
        positionGroups[position] = [];
      }
      positionGroups[position].push(ref);
    });

    // Reposicionar cada grupo
    Object.keys(positionGroups).forEach(position => {
      positionGroups[position].forEach((ref, index) => {
        const hostElement = ref.location.nativeElement;
        const offset = index * this.stackSpacing;

        if (position.includes('top')) {
          hostElement.style.top = `${16 + offset}px`;
        } else if (position.includes('bottom')) {
          hostElement.style.bottom = `${16 + offset}px`;
        }
      });
    });
  }

  /**
   * Elimina todas las notificaciones activas
   */
  dismissAll(): void {
    [...this.activeNotifications].forEach(ref => this.dismiss(ref));
  }

  /**
   * Elimina todas las notificaciones de un tipo específico
   */
  dismissByType(type: UnifiedNotificationType): void {
    const notificationsToRemove = this.activeNotifications.filter(ref => ref.instance.type === type);
    notificationsToRemove.forEach(ref => this.dismiss(ref));
  }

  /**
   * Muestra una notificación de éxito
   */
  success(message: string, title = 'Éxito', options?: Partial<UnifiedNotificationConfig>): ComponentRef<UnifiedNotificationComponent> {
    return this.show({
      message,
      title,
      type: 'success',
      ...options
    });
  }

  /**
   * Muestra una notificación de error
   */
  error(message: string, title = 'Error', options?: Partial<UnifiedNotificationConfig>): ComponentRef<UnifiedNotificationComponent> {
    return this.show({
      message,
      title,
      type: 'error',
      duration: 7000, // Errores duran más tiempo
      ...options
    });
  }

  /**
   * Muestra una notificación de advertencia
   */
  warning(message: string, title = 'Advertencia', options?: Partial<UnifiedNotificationConfig>): ComponentRef<UnifiedNotificationComponent> {
    return this.show({
      message,
      title,
      type: 'warning',
      duration: 6000,
      ...options
    });
  }

  /**
   * Muestra una notificación informativa
   */
  info(message: string, title = 'Información', options?: Partial<UnifiedNotificationConfig>): ComponentRef<UnifiedNotificationComponent> {
    return this.show({
      message,
      title,
      type: 'info',
      ...options
    });
  }

  /**
   * Muestra una notificación de error con botón de reintento
   */
  errorWithRetry(message: string, retryCallback: () => void, title = 'Error'): ComponentRef<UnifiedNotificationComponent> {
    return this.show({
      message,
      title,
      type: 'error',
      duration: 0, // No auto-dismiss para permitir al usuario decidir
      actionText: 'Reintentar',
      onAction: retryCallback
    });
  }

  /**
   * Muestra una notificación persistente (no se cierra automáticamente)
   */
  persistent(message: string, type: UnifiedNotificationType = 'info', title?: string): ComponentRef<UnifiedNotificationComponent> {
    return this.show({
      message,
      title,
      type,
      duration: 0 // Sin auto-dismiss
    });
  }

  /**
   * Muestra una notificación en una posición específica
   */
  showAt(
    message: string, 
    position: 'top-start' | 'top-center' | 'top-end' | 'bottom-start' | 'bottom-center' | 'bottom-end',
    type: UnifiedNotificationType = 'info',
    title?: string
  ): ComponentRef<UnifiedNotificationComponent> {
    return this.show({
      message,
      title,
      type,
      position
    });
  }

  /**
   * Obtiene la duración predeterminada según el tipo de notificación
   */
  private getDefaultDuration(type: UnifiedNotificationType): number {
    switch (type) {
      case 'success': return 5000;
      case 'error': return 7000;
      case 'warning': return 6000;
      case 'info': return 5000;
      default: return 5000;
    }
  }

  /**
   * Obtiene el número de notificaciones activas
   */
  getActiveCount(): number {
    return this.activeNotifications.length;
  }

  /**
   * Obtiene el número de notificaciones activas por tipo
   */
  getActiveCountByType(type: UnifiedNotificationType): number {
    return this.activeNotifications.filter(ref => ref.instance.type === type).length;
  }
}
