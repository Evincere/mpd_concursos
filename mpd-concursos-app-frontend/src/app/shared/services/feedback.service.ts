import { Injectable, ComponentRef, EmbeddedViewRef } from    '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { ActionFeedbackComponent } from '../components/action-feedback/action-feedback.component';
import { ComponentFactoryResolver } from '@angular/core';
import { Injector } from '@angular/core';
import { ApplicationRef } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private feedbackRefs: ComponentRef<ActionFeedbackComponent>[] = [];

  constructor(
    
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector,
    private appRef: ApplicationRef
  ,
    private loggingService: LoggingService
  ) {}

  /**
   * Muestra un mensaje de éxito
   * @param message Mensaje a mostrar
   * @param duration Duración de la animación en ms
   * @param autoHide Si se debe ocultar automáticamente
   * @param autoHideDuration Duración antes de ocultar en ms
   * @returns Referencia al componente creado
   */
  showSuccess(message: string, duration = 300, autoHide = true, autoHideDuration = 3000): ComponentRef<ActionFeedbackComponent> {
    return this.showFeedback('success', message, duration, autoHide, autoHideDuration);
  }

  /**
   * Muestra un mensaje de error
   * @param message Mensaje a mostrar
   * @param duration Duración de la animación en ms
   * @param autoHide Si se debe ocultar automáticamente
   * @param autoHideDuration Duración antes de ocultar en ms
   * @returns Referencia al componente creado
   */
  showError(message: string, duration = 300, autoHide = true, autoHideDuration = 3000): ComponentRef<ActionFeedbackComponent> {
    return this.showFeedback('error', message, duration, autoHide, autoHideDuration);
  }

  /**
   * Muestra un mensaje informativo
   * @param message Mensaje a mostrar
   * @param duration Duración de la animación en ms
   * @param autoHide Si se debe ocultar automáticamente
   * @param autoHideDuration Duración antes de ocultar en ms
   * @returns Referencia al componente creado
   */
  showInfo(message: string, duration = 300, autoHide = true, autoHideDuration = 3000): ComponentRef<ActionFeedbackComponent> {
    return this.showFeedback('info', message, duration, autoHide, autoHideDuration);
  }

  /**
   * Muestra un mensaje de advertencia
   * @param message Mensaje a mostrar
   * @param duration Duración de la animación en ms
   * @param autoHide Si se debe ocultar automáticamente
   * @param autoHideDuration Duración antes de ocultar en ms
   * @returns Referencia al componente creado
   */
  showWarning(message: string, duration = 300, autoHide = true, autoHideDuration = 3000): ComponentRef<ActionFeedbackComponent> {
    return this.showFeedback('warning', message, duration, autoHide, autoHideDuration);
  }

  /**
   * Oculta todos los mensajes de feedback
   */
  hideAll(): void {
    this.feedbackRefs.forEach(ref => {
      ref.instance.hide();
    });

    // Limpiar referencias
    setTimeout(() => {
      this.feedbackRefs = [];
    }, 500);
  }

  /**
   * Muestra un mensaje de feedback
   * @param type Tipo de feedback
   * @param message Mensaje a mostrar
   * @param duration Duración de la animación en ms
   * @param autoHide Si se debe ocultar automáticamente
   * @param autoHideDuration Duración antes de ocultar en ms
   * @returns Referencia al componente creado
   */
  private showFeedback(
    type: 'success' | 'error' | 'info' | 'warning',
    message: string,
    duration: number,
    autoHide: boolean,
    autoHideDuration: number
  ): ComponentRef<ActionFeedbackComponent> {
    // Crear componente
    const componentRef = this.componentFactoryResolver
      .resolveComponentFactory(ActionFeedbackComponent)
      .create(this.injector);

    // Configurar propiedades
    componentRef.instance.type = type;
    componentRef.instance.message = message;
    componentRef.instance.duration = duration;
    componentRef.instance.autoHide = autoHide;
    componentRef.instance.autoHideDuration = autoHideDuration;

    // Añadir al DOM
    this.appRef.attachView(componentRef.hostView);
    const domElem = (componentRef.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;

    // Posicionar en la parte superior derecha
    domElem.style.position = 'fixed';
    domElem.style.top = '20px';
    domElem.style.right = '20px';
    domElem.style.zIndex = '9999';

    // Añadir al body
    document.body.appendChild(domElem);

    // Guardar referencia
    this.feedbackRefs.push(componentRef);

    // Limpiar referencia cuando se oculte
    if (autoHide) {
      setTimeout(() => {
        this.feedbackRefs = this.feedbackRefs.filter(ref => ref !== componentRef);
        this.appRef.detachView(componentRef.hostView);
        componentRef.destroy();
      }, autoHideDuration + duration);
    }

    return componentRef;
  }
}
