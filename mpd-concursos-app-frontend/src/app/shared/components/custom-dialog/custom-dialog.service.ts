import { Injectable, ApplicationRef, ComponentRef, createComponent, EnvironmentInjector, Type, TemplateRef, Injector, createEnvironmentInjector } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { CustomDialogRef, CustomDialogConfig } from './custom-dialog-ref';
import { CUSTOM_DIALOG_DATA, CUSTOM_DIALOG_REF } from './custom-dialog-tokens';
import { CustomDialogComponent } from './custom-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class CustomDialogService {
  private activeDialogs: ComponentRef<any>[] = [];

  constructor(
    
    private appRef: ApplicationRef,
    private environmentInjector: EnvironmentInjector
  ,
    private loggingService: LoggingService
  ) {}

  /**
   * Abre un diálogo con un componente personalizado
   * @param component Componente a mostrar en el diálogo
   * @param config Configuración del diálogo
   * @returns Referencia al diálogo
   */
  open<T, D = any, R = any>(component: Type<T>, config?: CustomDialogConfig<D>): CustomDialogRef<T, R> {
    // Crear el diálogo
    const dialogRef = new CustomDialogRef<T, R>();

    // Crear el componente de diálogo
    const dialogComponentRef = createComponent(CustomDialogComponent, {
      environmentInjector: this.environmentInjector,
      hostElement: document.createElement('div')
    });

    // Configurar el diálogo
    const dialogInstance = dialogComponentRef.instance;
    if (config?.data && typeof config.data === 'object' && config.data !== null && 'title' in config.data) {
      dialogInstance.title = String(config.data.title);
    }
    dialogInstance.width = config?.width;
    dialogInstance.height = config?.height;
    dialogInstance.position = config?.position || 'center';
    dialogInstance.disableClose = config?.disableClose || false;
    dialogInstance.disableEscClose = config?.disableEscClose || false;
    dialogInstance.visible = true;

    // Suscribirse a eventos del diálogo
    dialogInstance.closed.subscribe((result: R) => {
      this.closeDialog(dialogComponentRef, dialogRef, result);
    });

    // Crear un injector personalizado con los tokens necesarios
    const injector = Injector.create({
      providers: [
        { provide: CUSTOM_DIALOG_DATA, useValue: config?.data || {} },
        { provide: CUSTOM_DIALOG_REF, useValue: dialogRef }
      ],
      parent: this.environmentInjector
    });

    // Crear el componente de contenido con el injector personalizado
    const contentComponentRef = createComponent(component, {
      environmentInjector: injector as EnvironmentInjector,
      hostElement: document.createElement('div')
    });

    // Añadir el componente de contenido al diálogo
    const dialogContentElement = dialogComponentRef.location.nativeElement.querySelector('.dialog-content');
    if (dialogContentElement) {
      dialogContentElement.appendChild(contentComponentRef.location.nativeElement);
    }

    // Añadir el diálogo al DOM
    document.body.appendChild(dialogComponentRef.location.nativeElement);

    // Activar las vistas
    this.appRef.attachView(dialogComponentRef.hostView);
    this.appRef.attachView(contentComponentRef.hostView);

    // Guardar referencias
    this.activeDialogs.push(dialogComponentRef, contentComponentRef);

    return dialogRef;
  }

  /**
   * Abre un diálogo de confirmación
   * @param title Título del diálogo
   * @param message Mensaje del diálogo (puede contener HTML)
   * @param config Configuración adicional
   * @returns Referencia al diálogo
   */
  confirm(title: string, message: string, config?: Partial<CustomDialogConfig>): CustomDialogRef<any, boolean> {
    // Crear el diálogo
    const dialogRef = new CustomDialogRef<any, boolean>();

    // Crear el componente de diálogo
    const dialogComponentRef = createComponent(CustomDialogComponent, {
      environmentInjector: this.environmentInjector,
      hostElement: document.createElement('div')
    });

    // Configurar el diálogo
    const dialogInstance = dialogComponentRef.instance;
    dialogInstance.title = title;
    dialogInstance.width = config?.width || '400px';
    dialogInstance.position = config?.position || 'center';
    dialogInstance.disableClose = config?.disableClose || false;
    dialogInstance.disableEscClose = config?.disableEscClose || false;
    dialogInstance.showActions = true;
    dialogInstance.showCancelButton = true;
    dialogInstance.showConfirmButton = true;
    dialogInstance.cancelButtonText = 'Cancelar';
    dialogInstance.confirmButtonText = 'Aceptar';
    dialogInstance.visible = true;

    // Verificar si el mensaje contiene HTML
    if (message.includes('<') && message.includes('>')) {
      dialogInstance.htmlMessage = message;
    } else {
      dialogInstance.message = message;
    }

    // Suscribirse a eventos del diálogo
    dialogInstance.cancelled.subscribe(() => {
      this.closeDialog(dialogComponentRef, dialogRef, false);
    });

    dialogInstance.confirmed.subscribe(() => {
      this.closeDialog(dialogComponentRef, dialogRef, true);
    });

    // Añadir el diálogo al DOM
    document.body.appendChild(dialogComponentRef.location.nativeElement);

    // Activar la vista
    this.appRef.attachView(dialogComponentRef.hostView);

    // Guardar referencia
    this.activeDialogs.push(dialogComponentRef);

    return dialogRef;
  }

  /**
   * Cierra un diálogo
   * @param dialogComponentRef Referencia al componente de diálogo
   * @param dialogRef Referencia al diálogo
   * @param result Resultado del diálogo
   */
  private closeDialog<T, R>(dialogComponentRef: ComponentRef<any>, dialogRef: CustomDialogRef<T, R>, result?: R): void {
    // Eliminar del DOM
    const hostElement = dialogComponentRef.location.nativeElement;
    this.appRef.detachView(dialogComponentRef.hostView);

    if (hostElement.parentNode) {
      hostElement.parentNode.removeChild(hostElement);
    }

    // Eliminar de la lista de diálogos activos
    const index = this.activeDialogs.indexOf(dialogComponentRef);
    if (index > -1) {
      this.activeDialogs.splice(index, 1);
    }

    // Cerrar el diálogo
    dialogRef.close(result);

    // Destruir el componente
    dialogComponentRef.destroy();
  }

  /**
   * Cierra todos los diálogos activos
   */
  closeAll(): void {
    [...this.activeDialogs].forEach(dialogRef => {
      const hostElement = dialogRef.location.nativeElement;
      this.appRef.detachView(dialogRef.hostView);

      if (hostElement.parentNode) {
        hostElement.parentNode.removeChild(hostElement);
      }

      dialogRef.destroy();
    });

    this.activeDialogs = [];
  }

  /**
   * Cierra el diálogo activo con un resultado
   * @param result Resultado del diálogo
   */
  close<R>(result?: R): void {
    if (this.activeDialogs.length > 0) {
      const dialogComponentRef = this.activeDialogs[0];
      const dialogInstance = dialogComponentRef.instance;

      if (dialogInstance.closed) {
        dialogInstance.closed.emit(result);
      }
    }
  }

  /**
   * Muestra un diálogo de confirmación con configuración personalizada
   * @param config Configuración del diálogo de confirmación
   * @returns Referencia al diálogo
   */
  showConfirmDialog(config: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'info' | 'warning' | 'danger';
  }): CustomDialogRef<any, boolean> {
    return this.confirm(config.title, config.message, {
      width: '400px',
      position: 'center'
    });
  }

  /**
   * Muestra un diálogo de entrada de texto
   * @param config Configuración del diálogo de entrada
   * @returns Referencia al diálogo
   */
  showInputDialog(config: {
    title: string;
    message: string;
    placeholder?: string;
    confirmText?: string;
    cancelText?: string;
    inputType?: 'text' | 'textarea' | 'number' | 'select';
    options?: Array<{ value: string; label: string }>;
    defaultValue?: string;
    required?: boolean;
  }): CustomDialogRef<any, string | null> {
    // Para simplificar, retornamos un diálogo de confirmación
    // En una implementación completa, se crearía un componente específico para entrada de texto
    const dialogRef = new CustomDialogRef<any, string | null>();

    // Simular entrada de texto con prompt (temporal)
    setTimeout(() => {
      let result: string | null = null;

      if (config.inputType === 'select' && config.options) {
        // Para select, mostrar las opciones
        const optionsText = config.options.map(opt => `${opt.value}: ${opt.label}`).join('\n');
        result = prompt(`${config.message}\n\nOpciones:\n${optionsText}\n\nIngresa el valor:`, config.defaultValue || '');
      } else {
        result = prompt(config.message, config.placeholder || config.defaultValue || '');
      }

      dialogRef.close(result);
    }, 100);

    return dialogRef;
  }
}
