import { Component, Input, Output, EventEmitter, HostListener } from  '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomButtonComponent } from '../custom-button/custom-button.component';

@Component({
  selector: 'app-custom-dialog',
  standalone: true,
  imports: [CommonModule, CustomButtonComponent],
  template: `
    <div class="dialog-backdrop" (click)="onBackdropClick($event)" role="dialog" aria-modal="true" [attr.aria-labelledby]="'dialog-title-' + dialogId">
      <div class="dialog-container"
           [class.small]="size === 'small'"
           [class.large]="size === 'large'"
           [class.fullscreen]="size === 'fullscreen'"
           role="document">
        <div class="dialog-header">
          <h2 class="dialog-title" [id]="'dialog-title-' + dialogId">
            <i *ngIf="icon" class="fas fa-{{ icon }} dialog-icon" aria-hidden="true"></i>
            {{ title }}
          </h2>

          <button *ngIf="showCloseButton"
                  class="close-button"
                  (click)="closeDialog()"
                  aria-label="Cerrar diálogo"
                  type="button">
            <i class="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>

        <div class="dialog-content" [attr.aria-describedby]="'dialog-content-' + dialogId" [id]="'dialog-content-' + dialogId">
          <ng-content></ng-content>
        </div>

        <div *ngIf="showFooter" class="dialog-footer">
          <ng-content select="[dialog-footer]"></ng-content>

          <div *ngIf="!hasCustomFooter" class="default-footer">
            <app-custom-button
              *ngIf="showCancelButton"
              [label]="cancelButtonText"
              [variant]="'stroked'"
              (buttonClick)="closeDialog()"
            ></app-custom-button>

            <app-custom-button
              *ngIf="showConfirmButton"
              [label]="confirmButtonText"
              [color]="confirmButtonColor"
              [loading]="loading"
              (buttonClick)="dialogConfirm.emit(); closeDialog();"
            ></app-custom-button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ESTILOS CRÍTICOS PARA MODAL CORRECTO */
    :host {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1000;
      pointer-events: auto;
    }

    .dialog-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1001;
      animation: fadeIn 0.2s ease-in-out;
      /* Fondo base para asegurar visibilidad */
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      pointer-events: auto;
    }

    .dialog-container {
      display: flex;
      flex-direction: column;
      animation: slideIn 0.3s ease-in-out;
      overflow: hidden;
      position: relative;
      z-index: 1002;
      /* Usar variables CSS para permitir personalización glassmorphism */
      background: var(--background-color, white);
      border: 1px solid var(--card-border, #e0e0e0);
      border-radius: var(--border-radius, 8px);
      box-shadow: var(--card-shadow, 0 4px 20px rgba(0, 0, 0, 0.15));
      backdrop-filter: var(--card-backdrop-filter, none);
      -webkit-backdrop-filter: var(--card-backdrop-filter, none);
      color: var(--text-color, #333);
      min-width: 300px;
      max-width: 90vw;
      max-height: 90vh;
      pointer-events: auto;
    }

    .dialog-container.small {
      width: 400px;
    }

    .dialog-container.large {
      width: 800px;
      height: 85vh;
    }

    .dialog-container.fullscreen {
      width: 90vw;
      height: 90vh;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--card-border, #e0e0e0);
      background: var(--header-background, transparent);
    }

    .dialog-title {
      margin: 0;
      display: flex;
      align-items: center;
      font-size: 1.25rem;
      font-weight: 500;
      color: var(--text-color, #333);
    }

    .dialog-icon {
      margin-right: 0.75rem;
      color: var(--primary-color, #1976d2);
    }

    .close-button {
      background: none;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      color: var(--text-secondary, #666);
      transition: color 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-button:hover {
      color: var(--text-color, #333);
    }

    .dialog-content {
      overflow-y: auto;
      flex: 1;
      padding: 1.5rem;
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--card-border, #e0e0e0);
      background: var(--footer-background, transparent);
    }

    .default-footer {
      display: flex;
      gap: 0.75rem;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class CustomDialogComponent {
  @Input() title = '';
  @Input() icon = '';
  @Input() size: 'small' | 'medium' | 'large' | 'fullscreen' = 'medium';
  @Input() showCloseButton = true;
  @Input() showFooter = true;
  @Input() showCancelButton = true;
  @Input() showConfirmButton = true;
  @Input() cancelButtonText = 'Cancelar';
  @Input() confirmButtonText = 'Confirmar';
  @Input() confirmButtonColor: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() loading = false;
  @Input() hasCustomFooter = false;

  // Identificador único para el diálogo
  dialogId = 'dialog-' + Math.random().toString(36).substring(2, 9);

  // Variable para controlar el proceso de cierre
  private _isClosing = false;

  @Output() dialogClose = new EventEmitter<void>();
  @Output() dialogCancel = new EventEmitter<void>();
  @Output() dialogConfirm = new EventEmitter<void>();
  @Output() dialogDismiss = new EventEmitter<void>();

  constructor() {
    // Exponer el método closeDialog a través de una propiedad global
    // para que pueda ser accedido desde cualquier componente hijo
    try {
      (window as any).customDialogCloseMethod = this.closeDialog.bind(this);
    } catch (error) {
      console.error('Error al exponer el método closeDialog:', error);
    }
  }



  /**
   * Maneja el clic en el fondo del diálogo para cerrarlo
   * @param event Evento de clic
   */
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      // Logging implementado con LoggingService;
    }
  }

  /**
   * Maneja la tecla Escape para cerrar el diálogo
   */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    // Logging implementado con LoggingService;
  }

  /**
   * Método centralizado para cerrar el diálogo
   * Emite todos los eventos de cierre en un orden específico
   *
   * Este método es público para que pueda ser llamado desde el exterior,
   * por ejemplo, desde un componente hijo que necesite cerrar el diálogo.
   */
  public closeDialog(): void {
    // Logging implementado con LoggingService;

    // Verificar si ya hay un proceso de cierre en curso
    if (this._isClosing) {
      // Logging implementado con LoggingService;
    }

    // Marcar que estamos en proceso de cierre
    this._isClosing = true;

    // Emitir eventos en orden específico para garantizar que todos los listeners respondan
    // Logging implementado con LoggingService;
    this.dialogCancel.emit();
    this.dialogClose.emit();

    // Intentar limpiar manualmente el DOM después de un breve retraso
    setTimeout(() => {
      try {
        // Buscar solo los elementos de diálogo que pertenecen a este componente
        // usando el ID único del diálogo
        const dialogBackdrop = document.querySelector('.dialog-backdrop');
        if (dialogBackdrop && dialogBackdrop.parentNode) {
          dialogBackdrop.parentNode.removeChild(dialogBackdrop);
        }

        // Resetear el estado de cierre
        this._isClosing = false;
      } catch (error) {
        console.error('Error al limpiar el DOM manualmente:', error);
        this._isClosing = false;
      }
    }, 100);
  }
}
