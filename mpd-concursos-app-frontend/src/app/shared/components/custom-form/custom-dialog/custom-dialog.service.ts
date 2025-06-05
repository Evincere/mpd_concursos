import { Injectable, ComponentRef, Type, createComponent, ApplicationRef, EnvironmentInjector, Injector } from '@angular/core';
import { CustomDialogComponent } from './custom-dialog.component';
import { CustomDialogRef } from './custom-dialog-ref';
import { DIALOG_DATA } from './dialog-ref';

// Export CUSTOM_DIALOG_DATA for backward compatibility
export { DIALOG_DATA as CUSTOM_DIALOG_DATA } from './dialog-ref';
// Export CustomDialogRef for external use
export { CustomDialogRef } from './custom-dialog-ref';

export interface DialogConfig {
  title?: string;
  icon?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  width?: string;
  height?: string;
  maxWidth?: string;
  maxHeight?: string;
  showCloseButton?: boolean;
  showFooter?: boolean;
  showCancelButton?: boolean;
  showConfirmButton?: boolean;
  cancelButtonText?: string;
  confirmButtonText?: string;
  confirmButtonColor?: 'primary' | 'accent' | 'warn';
  data?: Record<string, unknown>;
}

@Injectable({
  providedIn: 'root'
})
export class CustomDialogService {
  private dialogComponentRef: ComponentRef<CustomDialogComponent> | null = null;
  private contentComponentRef: ComponentRef<unknown> | null = null;
  private dialogRef: CustomDialogRef<any> | null = null;
  private _isClosing = false;

  constructor(
    private appRef: ApplicationRef,
    private environmentInjector: EnvironmentInjector
  ) {}


  open<T, R = unknown>(component: Type<T>, config: DialogConfig = {}): CustomDialogRef<R> {
    // Limpiar cualquier diálogo existente para evitar problemas
    this.close();

    // Crear el contenedor del diálogo
    const hostElement = document.createElement('div');
    hostElement.classList.add('custom-dialog-container');
    document.body.appendChild(hostElement);

    this.dialogComponentRef = createComponent(CustomDialogComponent, {
      environmentInjector: this.environmentInjector,
      hostElement: hostElement
    });

    // Crear referencia al diálogo
    this.dialogRef = new CustomDialogRef<R>();

    // Crear un injector personalizado para el componente de contenido
    const injector = Injector.create({
      parent: this.environmentInjector,
      providers: [
        { provide: CustomDialogRef, useValue: this.dialogRef },
        { provide: DIALOG_DATA, useValue: config.data || {} }
      ]
    });

    // Crear el componente de contenido con el injector personalizado
    this.contentComponentRef = createComponent(component, {
      environmentInjector: this.environmentInjector,
      elementInjector: injector,
      hostElement: document.createElement('div')
    });

    // Verificar que el componente de diálogo exista
    if (!this.dialogComponentRef) {
      console.error('El componente de diálogo es nulo');
      return new CustomDialogRef<R>();
    }

    // Configurar el diálogo
    const dialogInstance = this.dialogComponentRef.instance;
    if (!dialogInstance) {
      console.error('La instancia del componente de diálogo es nula');
      return new CustomDialogRef<R>();
    }

    dialogInstance.title = config.title || '';
    dialogInstance.icon = config.icon || '';
    dialogInstance.size = config.size || 'medium';
    dialogInstance.showCloseButton = config.showCloseButton !== false;
    dialogInstance.showFooter = config.showFooter !== false;
    dialogInstance.showCancelButton = config.showCancelButton !== false;
    dialogInstance.showConfirmButton = config.showConfirmButton !== false;
    dialogInstance.cancelButtonText = config.cancelButtonText || 'Cancelar';
    dialogInstance.confirmButtonText = config.confirmButtonText || 'Confirmar';
    dialogInstance.confirmButtonColor = config.confirmButtonColor || 'primary';

    // Ya no necesitamos pasar datos manualmente al componente de contenido
    // ya que lo estamos haciendo a través del injector

    // Configurar eventos
    try {
      // Escuchar cuando el CustomDialogRef se cierra desde el componente de contenido
      this.dialogRef.afterClosed().subscribe((result) => {
        console.log('[CustomDialogService] CustomDialogRef cerrado con resultado:', result);
        this.close();
      });

      dialogInstance.dialogClose.subscribe(() => {
        console.log('Evento dialogClose recibido');
        this.close();
      });

      dialogInstance.dialogCancel.subscribe(() => {
        console.log('Evento dialogCancel recibido');
        this.close();
      });

      dialogInstance.dialogConfirm.subscribe(() => {
        console.log('Evento dialogConfirm recibido');
        let result: any = undefined;
        try {
          if (this.contentComponentRef?.instance && typeof (this.contentComponentRef.instance as any).getResult === 'function') {
            result = (this.contentComponentRef.instance as any).getResult();
          }
        } catch (error) {
          console.error('Error al obtener el resultado del componente de contenido:', error);
        }

        if (this.dialogRef) {
          this.dialogRef.close(result);
        } else {
          this.close();
        }
      });

      dialogInstance.dialogDismiss.subscribe(() => {
        console.log('Evento dialogDismiss recibido');
        this.close();

        // Intento alternativo de cerrar el diálogo
        try {
          // Buscar y eliminar manualmente cualquier diálogo restante del DOM
          const dialogOverlays = document.querySelectorAll('.dialog-backdrop');
          if (dialogOverlays.length > 0) {
            console.log('Cerrando diálogos restantes manualmente:', dialogOverlays.length);
            dialogOverlays.forEach(overlay => {
              try {
                if (overlay.parentNode) {
                  overlay.parentNode.removeChild(overlay);
                } else {
                  document.body.removeChild(overlay);
                }
              } catch (removeErr) {
                console.error('Error al eliminar overlay del DOM:', removeErr);
              }
            });
          }
        } catch (domErr) {
          console.error('Error al intentar limpiar el DOM manualmente:', domErr);
        }
      });
    } catch (error) {
      console.error('Error al configurar los eventos del diálogo:', error);
    }

    // Adjuntar al árbol de componentes
    this.appRef.attachView(this.dialogComponentRef.hostView);
    this.appRef.attachView(this.contentComponentRef.hostView);

    // Esperar a que el DOM se actualice antes de agregar el componente de contenido
    setTimeout(() => {
      try {
        // Verificar que los componentes existan antes de acceder a sus propiedades
        if (!this.contentComponentRef || !this.dialogComponentRef) {
          console.error('Los componentes de diálogo o contenido son nulos');
          return;
        }

        // Agregar el componente de contenido al diálogo
        const contentElement = this.contentComponentRef?.location?.nativeElement;
        const dialogContentElement = this.dialogComponentRef?.location?.nativeElement?.querySelector('.dialog-content');

        if (dialogContentElement && contentElement) {
          // Asegurarse de que el elemento no esté ya en el DOM
          if (contentElement.parentNode) {
            contentElement.parentNode.removeChild(contentElement);
          }

          dialogContentElement.appendChild(contentElement);
        } else {
          console.error('No se pudo encontrar el elemento .dialog-content o el elemento de contenido es nulo');
        }
      } catch (error) {
        console.error('Error al agregar el componente de contenido al diálogo:', error);
      }
    }, 0);

    // Bloquear el desplazamiento del body
    document.body.style.overflow = 'hidden';

    return this.dialogRef as CustomDialogRef<R>;
  }

  public close(): void {
    console.log('Cerrando diálogo desde el servicio');

    // Verificar si ya hay un proceso de cierre en curso
    if (this._isClosing) {
      console.log('Ya hay un proceso de cierre en curso, ignorando llamada duplicada');
      return;
    }

    // Marcar que estamos en proceso de cierre
    this._isClosing = true;

    try {
      // Limpiar el componente de diálogo
      if (this.dialogComponentRef) {
        try {
          // Primero eliminar del DOM si es necesario
          const hostElement = this.dialogComponentRef?.location?.nativeElement;
          if (hostElement && hostElement.parentNode) {
            hostElement.parentNode.removeChild(hostElement);
          }

          // Luego desconectar la vista y destruir el componente
          this.appRef.detachView(this.dialogComponentRef.hostView);
          this.dialogComponentRef.destroy();
        } catch (err) {
          console.error('Error al limpiar el componente de diálogo:', err);
        } finally {
          this.dialogComponentRef = null;
        }
      }

      // Limpiar el componente de contenido
      if (this.contentComponentRef) {
        try {
          // Desconectar la vista y destruir el componente
          this.appRef.detachView(this.contentComponentRef.hostView);
          this.contentComponentRef.destroy();
        } catch (err) {
          console.error('Error al limpiar el componente de contenido:', err);
        } finally {
          this.contentComponentRef = null;
        }
      }

      // Cerrar la referencia del diálogo
      if (this.dialogRef) {
        try {
          this.dialogRef.close();
        } catch (err) {
          console.error('Error al cerrar la referencia del diálogo:', err);
        } finally {
          this.dialogRef = null;
        }
      }

      // Restaurar el desplazamiento del body
      document.body.style.overflow = '';

      // Intento alternativo de cerrar el diálogo
      try {
        // Limpiar todos los elementos de diálogo en un solo paso
        const selectors = [
          '.dialog-backdrop',
          '.dialog-container',
          '.custom-dialog-container',
          '.unified-dialog-container',
          '.cdk-overlay-container',
          '.cdk-overlay-backdrop',
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
              } else if (element.parentElement) {
                element.parentElement.removeChild(element);
              } else {
                try {
                  document.body.removeChild(element);
                } catch (bodyErr) {
                  console.error('Error al eliminar elemento del body:', bodyErr);
                }
              }
            } catch (removeErr) {
              console.error('Error al eliminar elemento del DOM:', removeErr);
            }
          });
        }

        // Emitir un evento personalizado para notificar que se ha cerrado el diálogo
        const event = new CustomEvent('dialogClosed');
        document.dispatchEvent(event);

        // Forzar una actualización del DOM
        setTimeout(() => {
          // Forzar un reflow del DOM
          document.body.getBoundingClientRect();
        }, 0);

      } catch (domErr) {
        console.error('Error al intentar limpiar el DOM manualmente:', domErr);
      }
    } catch (error) {
      console.error('Error al cerrar el diálogo:', error);
    } finally {
      // Resetear el estado de cierre
      this._isClosing = false;
    }
  }
}
