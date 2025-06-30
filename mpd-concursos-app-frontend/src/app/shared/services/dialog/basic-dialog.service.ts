import { Injectable, ComponentRef, createComponent, EnvironmentInjector, Type, ApplicationRef, InjectionToken, Injector } from '@angular/core';
import { LoggingService } from '../../../core/services/logging/logging.service';
import { Subject } from 'rxjs';

export const BASIC_DIALOG_DATA = new InjectionToken<any>('BasicDialogData');

export interface BasicDialogConfig {
  title?: string;
  size?: 'small' | 'medium' | 'large';
  data?: any;
  showCloseButton?: boolean;
}

export class BasicDialogRef<T = any> {
  private _afterClosed = new Subject<T | undefined>();

  afterClosed() {
    return this._afterClosed.asObservable();
  }

  close(result?: T) {
    this._afterClosed.next(result);
    this._afterClosed.complete();
  }
}

@Injectable({
  providedIn: 'root'
})
export class BasicDialogService {
  private activeDialogs: { element: HTMLElement; componentRef: ComponentRef<any>; dialogRef: BasicDialogRef }[] = [];

  constructor(
    private environmentInjector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private loggingService: LoggingService
  ) {}

  open<T>(component: Type<T>, config: BasicDialogConfig = {}): BasicDialogRef {
    this.loggingService.info('[BasicDialogService] Opening dialog', { component: component.name, config });

    const dialogRef = new BasicDialogRef();

    try {
      // Create backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'basic-dialog-backdrop';
      backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1050;
        animation: fadeIn 0.3s ease-out;
      `;

      // Create dialog container
      const container = document.createElement('div');
      container.className = 'basic-dialog-container';
      const sizeClass = config.size || 'medium';
      let width = '600px';
      if (sizeClass === 'small') width = '400px';
      if (sizeClass === 'large') width = '800px';
      
      container.style.cssText = `
        background: rgba(55, 65, 81, 0.85);
        background-image: linear-gradient(135deg,
          rgba(255, 255, 255, 0.15) 0%,
          rgba(76, 175, 80, 0.08) 30%,
          rgba(255, 255, 255, 0.12) 70%,
          rgba(76, 175, 80, 0.06) 100%);
        border: 1px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 16px;
        box-shadow:
          0 20px 50px rgba(0, 0, 0, 0.5),
          0 10px 20px rgba(0, 0, 0, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.2),
          inset 0 -1px 0 rgba(0, 0, 0, 0.1);
        max-width: 90vw;
        max-height: 90vh;
        width: ${width};
        overflow: hidden;
        display: flex;
        flex-direction: column;
        color: #f9fafb;
        animation: slideInUp 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
      `;

      // Add animation keyframes to document if not already present
      if (!document.querySelector('#basic-dialog-animations')) {
        const style = document.createElement('style');
        style.id = 'basic-dialog-animations';
        style.textContent = `
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translate3d(0, 30px, 0) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        `;
        document.head.appendChild(style);
      }

      // Create header if title is provided
      if (config.title) {
        const header = document.createElement('div');
        header.className = 'basic-dialog-header';
        header.style.cssText = `
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        `;

        const title = document.createElement('h2');
        title.textContent = config.title;
        title.style.cssText = `
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #f9fafb;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        `;

        if (config.showCloseButton !== false) {
          const closeButton = document.createElement('button');
          closeButton.innerHTML = '&times;';
          closeButton.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            font-size: 1.5rem;
            cursor: pointer;
            padding: 8px 12px;
            border-radius: 8px;
            color: #f9fafb;
            transition: all 0.2s ease;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
          `;
          closeButton.onmouseenter = () => {
            closeButton.style.background = 'rgba(255, 255, 255, 0.2)';
            closeButton.style.transform = 'scale(1.05)';
          };
          closeButton.onmouseleave = () => {
            closeButton.style.background = 'rgba(255, 255, 255, 0.1)';
            closeButton.style.transform = 'scale(1)';
          };
          closeButton.onclick = () => this.closeDialog(backdrop, dialogRef);
          
          header.appendChild(title);
          header.appendChild(closeButton);
        } else {
          header.appendChild(title);
        }

        container.appendChild(header);
      }

      // Create content area
      const content = document.createElement('div');
      content.className = 'basic-dialog-content';
      content.style.cssText = `
        padding: 24px;
        flex: 1;
        overflow: auto;
        color: #f9fafb;
        background: rgba(255, 255, 255, 0.02);
      `;

      container.appendChild(content);

      // Create component with data injection
      const injector = Injector.create({
        parent: this.environmentInjector,
        providers: [
          { provide: BASIC_DIALOG_DATA, useValue: config.data || {} }
        ]
      });

      const componentRef = createComponent(component, {
        environmentInjector: this.environmentInjector,
        elementInjector: injector
      });

      // Attach to app
      this.appRef.attachView(componentRef.hostView);

      // Add component to content
      content.appendChild(componentRef.location.nativeElement);

      // Add to backdrop
      backdrop.appendChild(container);

      // Close on backdrop click
      backdrop.onclick = (e) => {
        if (e.target === backdrop) {
          this.closeDialog(backdrop, dialogRef);
        }
      };

      // Add to body
      document.body.appendChild(backdrop);

      // Store reference
      this.activeDialogs.push({ element: backdrop, componentRef, dialogRef });

      this.loggingService.info('[BasicDialogService] Dialog opened successfully');

    } catch (error) {
      this.loggingService.error('[BasicDialogService] Error creating dialog:', error);
      dialogRef.close();
    }

    return dialogRef;
  }

  private closeDialog(backdrop: HTMLElement, dialogRef: BasicDialogRef) {
    try {
      // Find and remove from active dialogs
      const index = this.activeDialogs.findIndex(d => d.element === backdrop);
      if (index >= 0) {
        const dialog = this.activeDialogs[index];
        
        // Detach component
        this.appRef.detachView(dialog.componentRef.hostView);
        dialog.componentRef.destroy();
        
        // Remove from array
        this.activeDialogs.splice(index, 1);
      }

      // Remove from DOM
      if (backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }

      // Close dialog ref
      dialogRef.close();

      this.loggingService.info('[BasicDialogService] Dialog closed successfully');

    } catch (error) {
      this.loggingService.error('[BasicDialogService] Error closing dialog:', error);
    }
  }

  closeAll() {
    this.activeDialogs.forEach(dialog => {
      this.closeDialog(dialog.element, dialog.dialogRef);
    });
  }
}
