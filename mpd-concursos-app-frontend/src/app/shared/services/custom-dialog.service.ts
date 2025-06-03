import { Injectable, ComponentRef, ViewContainerRef, Type } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface DialogConfig {
  width?: string;
  height?: string;
  maxWidth?: string;
  maxHeight?: string;
  data?: any;
  disableClose?: boolean;
  panelClass?: string | string[];
}

export interface DialogRef<T = any> {
  componentInstance: T;
  afterClosed(): Observable<any>;
  close(result?: any): void;
}

@Injectable({
  providedIn: 'root'
})
export class CustomDialogService {
  private dialogContainer: ViewContainerRef | null = null;
  private activeDialogs: Map<string, DialogRef> = new Map();

  constructor() {}

  /**
   * Establece el contenedor donde se renderizarán los diálogos
   */
  setContainer(container: ViewContainerRef): void {
    this.dialogContainer = container;
  }

  /**
   * Abre un diálogo con el componente especificado
   */
  open<T>(component: Type<T>, config: DialogConfig = {}): DialogRef<T> {
    if (!this.dialogContainer) {
      throw new Error('Dialog container not set. Call setContainer() first.');
    }

    // Crear el overlay
    const overlay = this.createOverlay(config);
    
    // Crear el componente del diálogo
    const componentRef = this.dialogContainer.createComponent(component);
    
    // Configurar los datos si se proporcionan
    if (config.data && componentRef.instance) {
      // Asignar los datos directamente al componente
      Object.assign(componentRef.instance, { data: config.data });

      // Si el componente tiene un método para recibir datos, llamarlo
      if (typeof (componentRef.instance as any).setData === 'function') {
        (componentRef.instance as any).setData(config.data);
      }
    }

    // Crear la referencia del diálogo
    const dialogRef = this.createDialogRef(componentRef, overlay);
    
    // Agregar el componente al overlay
    overlay.appendChild(componentRef.location.nativeElement);
    
    // Agregar el overlay al DOM
    document.body.appendChild(overlay);

    // Generar ID único para el diálogo
    const dialogId = this.generateDialogId();
    this.activeDialogs.set(dialogId, dialogRef);

    // Configurar el cierre del diálogo
    this.setupDialogClose(dialogRef, overlay, dialogId);

    return dialogRef;
  }

  /**
   * Cierra todos los diálogos abiertos
   */
  closeAll(): void {
    this.activeDialogs.forEach(dialog => dialog.close());
  }

  /**
   * Crea el overlay del diálogo
   */
  private createOverlay(config: DialogConfig): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'custom-dialog-overlay';
    
    // Aplicar estilos glassmorphism
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.3s ease-out;
    `;

    // Crear el contenedor del diálogo
    const dialogContainer = document.createElement('div');
    dialogContainer.className = 'custom-dialog-container';
    
    // Aplicar configuración de tamaño
    const containerStyles = [
      'background: rgba(55, 65, 81, 0.95)',
      'background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
      'border: 1px solid rgba(255, 255, 255, 0.1)',
      'border-radius: 16px',
      'backdrop-filter: blur(16px)',
      '-webkit-backdrop-filter: blur(16px)',
      'box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      'max-width: 90vw',
      'max-height: 90vh',
      'overflow: auto',
      'margin: 20px',
      'animation: slideIn 0.3s ease-out'
    ];

    if (config.width) containerStyles.push(`width: ${config.width}`);
    if (config.height) containerStyles.push(`height: ${config.height}`);
    if (config.maxWidth) containerStyles.push(`max-width: ${config.maxWidth}`);
    if (config.maxHeight) containerStyles.push(`max-height: ${config.maxHeight}`);

    dialogContainer.style.cssText = containerStyles.join('; ');

    overlay.appendChild(dialogContainer);

    // Agregar animaciones CSS
    this.addDialogAnimations();

    return overlay;
  }

  /**
   * Crea la referencia del diálogo
   */
  private createDialogRef<T>(componentRef: ComponentRef<T>, overlay: HTMLElement): DialogRef<T> {
    const afterClosedSubject = new Subject<any>();

    return {
      componentInstance: componentRef.instance,
      afterClosed: () => afterClosedSubject.asObservable(),
      close: (result?: any) => {
        // Animar salida
        overlay.style.animation = 'fadeOut 0.3s ease-out';
        const container = overlay.querySelector('.custom-dialog-container') as HTMLElement;
        if (container) {
          container.style.animation = 'slideOut 0.3s ease-out';
        }

        setTimeout(() => {
          componentRef.destroy();
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
          afterClosedSubject.next(result);
          afterClosedSubject.complete();
        }, 300);
      }
    };
  }

  /**
   * Configura el comportamiento de cierre del diálogo
   */
  private setupDialogClose(dialogRef: DialogRef, overlay: HTMLElement, dialogId: string): void {
    // Cerrar al hacer clic en el overlay (fuera del diálogo)
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        dialogRef.close();
      }
    });

    // Cerrar con la tecla Escape
    const escapeHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dialogRef.close();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);

    // Limpiar al cerrar
    dialogRef.afterClosed().subscribe(() => {
      this.activeDialogs.delete(dialogId);
      document.removeEventListener('keydown', escapeHandler);
    });
  }

  /**
   * Genera un ID único para el diálogo
   */
  private generateDialogId(): string {
    return `dialog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Agrega las animaciones CSS necesarias
   */
  private addDialogAnimations(): void {
    if (document.getElementById('custom-dialog-animations')) {
      return; // Ya están agregadas
    }

    const style = document.createElement('style');
    style.id = 'custom-dialog-animations';
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      
      @keyframes slideIn {
        from { 
          opacity: 0;
          transform: scale(0.9) translateY(-20px);
        }
        to { 
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      
      @keyframes slideOut {
        from { 
          opacity: 1;
          transform: scale(1) translateY(0);
        }
        to { 
          opacity: 0;
          transform: scale(0.9) translateY(-20px);
        }
      }
    `;
    document.head.appendChild(style);
  }
}
