import { Injectable, ApplicationRef, ComponentRef, createComponent, EnvironmentInjector, Type, Injector } from '@angular/core';
import { Observable, Subject } from 'rxjs';

/**
 * Referencia a un diálogo unificado
 * @template T Tipo de dato que se devolverá al cerrar el diálogo
 */
export class UnifiedDialogRef<T = unknown> {
  private readonly _afterClosed = new Subject<T | undefined>();

  /**
   * Observable que emite cuando el diálogo se cierra
   * @returns Observable que emite el resultado del diálogo
   */
  afterClosed(): Observable<T | undefined> {
    return this._afterClosed.asObservable();
  }

  /**
   * Cierra el diálogo con un resultado opcional
   * @param result Resultado opcional a devolver
   */
  close(result?: T): void {
    this._afterClosed.next(result);
    this._afterClosed.complete();
  }
}

/**
 * Token de inyección para los datos del diálogo
 */
export const DIALOG_DATA = 'DIALOG_DATA';

/**
 * Configuración para un diálogo unificado
 */
export interface UnifiedDialogConfig<D = any> {
  /**
   * Título del diálogo
   */
  title?: string;

  /**
   * Icono del diálogo (nombre de clase de Font Awesome)
   */
  icon?: string;

  /**
   * Tamaño del diálogo
   */
  size?: 'small' | 'medium' | 'large' | 'fullscreen';

  /**
   * Datos que se pasarán al diálogo
   */
  data?: D;

  /**
   * Ancho del diálogo
   */
  width?: string;

  /**
   * Altura del diálogo
   */
  height?: string;

  /**
   * Si el diálogo se puede cerrar haciendo clic fuera de él
   */
  disableClose?: boolean;

  /**
   * Si el diálogo se puede cerrar con la tecla Escape
   */
  disableEscClose?: boolean;

  /**
   * Mostrar botón de cerrar
   */
  showCloseButton?: boolean;

  /**
   * Mostrar pie de diálogo
   */
  showFooter?: boolean;

  /**
   * Mostrar botón de cancelar
   */
  showCancelButton?: boolean;

  /**
   * Mostrar botón de confirmar
   */
  showConfirmButton?: boolean;

  /**
   * Texto del botón de cancelar
   */
  cancelButtonText?: string;

  /**
   * Texto del botón de confirmar
   */
  confirmButtonText?: string;

  /**
   * Color del botón de confirmar
   */
  confirmButtonColor?: 'primary' | 'accent' | 'warn';

  /**
   * Clase CSS personalizada para el diálogo
   */
  panelClass?: string | string[];

  /**
   * Posición del diálogo
   */
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * Componente de diálogo unificado
 * Este es un componente mínimo que se utilizará para crear el contenedor del diálogo
 */
@Injectable({
  providedIn: 'root'
})
export class UnifiedDialogService {
  private activeDialogs: ComponentRef<any>[] = [];

  constructor(
    private appRef: ApplicationRef,
    private environmentInjector: EnvironmentInjector
  ) {}

  /**
   * Abre un diálogo con un componente personalizado
   * @param component Componente a mostrar en el diálogo
   * @param config Configuración del diálogo
   * @returns Referencia al diálogo
   */
  open<T, D = any, R = any>(component: Type<T>, config?: UnifiedDialogConfig<D>): UnifiedDialogRef<R> {
    // Cerrar cualquier diálogo existente
    this.closeAll();

    // Crear referencia al diálogo
    const dialogRef = new UnifiedDialogRef<R>();

    // Importar dinámicamente el componente CustomDialogComponent
    import('@shared/components/custom-form/custom-dialog/custom-dialog.component').then(module => {
      const CustomDialogComponent = module.CustomDialogComponent;

      // Crear el contenedor del diálogo
      const hostElement = document.createElement('div');
      hostElement.classList.add('unified-dialog-container');
      document.body.appendChild(hostElement);

      // Crear el componente de diálogo
      const dialogComponentRef = createComponent(CustomDialogComponent, {
        environmentInjector: this.environmentInjector,
        hostElement: hostElement
      });

      // Crear un injector personalizado para el componente de contenido
      const injector = Injector.create({
        parent: this.environmentInjector,
        providers: [
          { provide: UnifiedDialogRef, useValue: dialogRef },
          { provide: DIALOG_DATA, useValue: config?.data || {} }
        ]
      });

      // Crear el componente de contenido con el injector personalizado
      const contentComponentRef = createComponent(component, {
        environmentInjector: this.environmentInjector,
        elementInjector: injector,
        hostElement: document.createElement('div')
      });

      // Configurar el diálogo
      const dialogInstance = dialogComponentRef.instance;
      dialogInstance.title = config?.title || '';
      dialogInstance.icon = config?.icon || '';
      dialogInstance.size = config?.size || 'medium';
      dialogInstance.showCloseButton = config?.showCloseButton !== false;
      dialogInstance.showFooter = config?.showFooter !== false;
      dialogInstance.showCancelButton = config?.showCancelButton !== false;
      dialogInstance.showConfirmButton = config?.showConfirmButton !== false;
      dialogInstance.cancelButtonText = config?.cancelButtonText || 'Cancelar';
      dialogInstance.confirmButtonText = config?.confirmButtonText || 'Confirmar';
      dialogInstance.confirmButtonColor = config?.confirmButtonColor || 'primary';

      // Configurar eventos
      dialogInstance.dialogClose.subscribe(() => {
        this.closeDialog(dialogComponentRef, contentComponentRef, dialogRef);
      });

      dialogInstance.dialogCancel.subscribe(() => {
        this.closeDialog(dialogComponentRef, contentComponentRef, dialogRef);
      });

      dialogInstance.dialogConfirm.subscribe(() => {
        let result: any = undefined;
        try {
          if (contentComponentRef?.instance && typeof (contentComponentRef.instance as any).getResult === 'function') {
            result = (contentComponentRef.instance as any).getResult();
          }
        } catch (error) {
          console.error('Error al obtener el resultado del componente de contenido:', error);
        }

        this.closeDialog(dialogComponentRef, contentComponentRef, dialogRef, result);
      });

      dialogInstance.dialogDismiss.subscribe(() => {
        this.closeDialog(dialogComponentRef, contentComponentRef, dialogRef);
      });

      // Adjuntar al árbol de componentes
      this.appRef.attachView(dialogComponentRef.hostView);
      this.appRef.attachView(contentComponentRef.hostView);

      // Esperar a que el DOM se actualice antes de agregar el componente de contenido
      setTimeout(() => {
        try {
          // Agregar el componente de contenido al diálogo
          const contentElement = contentComponentRef?.location?.nativeElement;
          const dialogContentElement = dialogComponentRef?.location?.nativeElement?.querySelector('.dialog-content');

          if (dialogContentElement && contentElement) {
            // Asegurarse de que el elemento no esté ya en el DOM
            if (contentElement.parentNode) {
              contentElement.parentNode.removeChild(contentElement);
            }

            dialogContentElement.appendChild(contentElement);
          }
        } catch (error) {
          console.error('Error al agregar el componente de contenido al diálogo:', error);
        }
      }, 0);

      // Guardar referencias
      this.activeDialogs.push(dialogComponentRef, contentComponentRef);
    });

    return dialogRef;
  }

  /**
   * Cierra un diálogo específico
   */
  private closeDialog<R>(
    dialogComponentRef: ComponentRef<any>,
    contentComponentRef: ComponentRef<any>,
    dialogRef: UnifiedDialogRef<R>,
    result?: R
  ): void {
    try {
      // Limpiar el componente de diálogo
      if (dialogComponentRef) {
        // Primero eliminar del DOM si es necesario
        const hostElement = dialogComponentRef?.location?.nativeElement;
        if (hostElement && hostElement.parentNode) {
          hostElement.parentNode.removeChild(hostElement);
        }

        // Luego desconectar la vista y destruir el componente
        this.appRef.detachView(dialogComponentRef.hostView);
        dialogComponentRef.destroy();
      }

      // Limpiar el componente de contenido
      if (contentComponentRef) {
        // Desconectar la vista y destruir el componente
        this.appRef.detachView(contentComponentRef.hostView);
        contentComponentRef.destroy();
      }

      // Eliminar de la lista de diálogos activos
      this.activeDialogs = this.activeDialogs.filter(ref =>
        ref !== dialogComponentRef && ref !== contentComponentRef);

      // Cerrar la referencia del diálogo
      dialogRef.close(result);

      // Restaurar el desplazamiento del body
      document.body.style.overflow = '';

      // Limpiar cualquier elemento de diálogo restante
      this.cleanupDialogElements();
    } catch (error) {
      console.error('Error al cerrar el diálogo:', error);
    }
  }

  /**
   * Cierra todos los diálogos activos
   */
  closeAll(): void {
    // Hacer una copia de los diálogos activos para evitar problemas al modificar el array durante la iteración
    const activeDialogsCopy = [...this.activeDialogs];

    // Limpiar todos los diálogos
    activeDialogsCopy.forEach(ref => {
      try {
        const hostElement = ref?.location?.nativeElement;
        if (hostElement && hostElement.parentNode) {
          hostElement.parentNode.removeChild(hostElement);
        }
        this.appRef.detachView(ref.hostView);
        ref.destroy();
      } catch (error) {
        console.error('Error al cerrar diálogo activo:', error);
      }
    });

    // Limpiar la lista de diálogos activos
    this.activeDialogs = [];

    // Restaurar el desplazamiento del body
    document.body.style.overflow = '';

    // Limpiar cualquier elemento de diálogo restante
    this.cleanupDialogElements();
  }

  /**
   * Abre un diálogo de confirmación
   * @param options Opciones del diálogo de confirmación
   * @returns Referencia al diálogo
   */
  openConfirm(options: {
    title?: string;
    message: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    confirmButtonColor?: 'primary' | 'accent' | 'warn';
    icon?: string;
    size?: 'small' | 'medium' | 'large';
  }): UnifiedDialogRef<boolean> {
    // Crear una referencia al diálogo
    const dialogRef = new UnifiedDialogRef<boolean>();

    // Importar dinámicamente el componente ConfirmDialogComponent
    import('@shared/components/confirm-dialog/confirm-dialog.component').then(module => {
      const ConfirmDialogComponent = module.ConfirmDialogComponent;

      const innerDialogRef = this.open<any, any, boolean>(ConfirmDialogComponent, {
        title: options.title || 'Confirmar',
        icon: options.icon || 'question-circle',
        size: options.size || 'small',
        data: {
          message: options.message
        },
        showCloseButton: true,
        showFooter: true,
        showCancelButton: true,
        showConfirmButton: true,
        cancelButtonText: options.cancelButtonText || 'Cancelar',
        confirmButtonText: options.confirmButtonText || 'Confirmar',
        confirmButtonColor: options.confirmButtonColor || 'primary'
      });

      // Conectar la referencia interna con la externa
      innerDialogRef.afterClosed().subscribe(result => {
        dialogRef.close(result);
      });
    });

    return dialogRef;
  }

  /**
   * Limpia cualquier elemento de diálogo restante en el DOM
   */
  private cleanupDialogElements(): void {
    try {
      // Limpiar todos los elementos de diálogo en un solo paso
      const selectors = [
        '.dialog-backdrop',
        '.dialog-container',
        '.unified-dialog-container',
        '.custom-dialog-container',
        '[class*="dialog"]:not(.mat-dialog)'
      ];

      // Combinar todos los selectores en una sola consulta
      const combinedSelector = selectors.join(', ');
      const dialogElements = document.querySelectorAll(combinedSelector);

      if (dialogElements.length > 0) {
        console.log(`Eliminando ${dialogElements.length} elementos de diálogo del DOM`);

        dialogElements.forEach(element => {
          try {
            if (element.parentNode) {
              element.parentNode.removeChild(element);
            }
          } catch (removeErr) {
            console.error('Error al eliminar elemento del DOM:', removeErr);
          }
        });
      }
    } catch (error) {
      console.error('Error al limpiar elementos de diálogo:', error);
    }
  }
}
