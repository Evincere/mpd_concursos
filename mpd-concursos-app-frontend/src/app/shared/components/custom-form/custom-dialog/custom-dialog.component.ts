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
    .dialog-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease-in-out;
    }

    .dialog-container {
      background-color: var(--color-surface, #fff);
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      width: 500px;
      max-width: 90vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      animation: slideIn 0.3s ease-in-out;
      overflow: hidden;
    }

    .dialog-container.small {
      width: 400px;
    }

    .dialog-container.large {
      width: 800px;
    }

    .dialog-container.fullscreen {
      width: 90vw;
      height: 90vh;
    }

    .dialog-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--color-border, #ddd);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .dialog-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 500;
      color: var(--color-text-primary, #333);
      display: flex;
      align-items: center;
    }

    .dialog-icon {
      margin-right: 0.75rem;
      color: var(--color-primary, #3f51b5);
    }

    .close-button {
      background: none;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      color: var(--color-text-secondary, #666);
      transition: color 0.2s ease-in-out;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-button:hover {
      color: var(--color-text-primary, #333);
    }

    .dialog-content {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
    }

    .dialog-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--color-border, #ddd);
      display: flex;
      justify-content: flex-end;
      align-items: center;
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

    /* Estilos para tema oscuro */
    @media (prefers-color-scheme: dark) {
      .dialog-container {
        background-color: var(--color-surface-dark, #333);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      }

      .dialog-header {
        border-bottom-color: var(--color-border-dark, #555);
      }

      .dialog-title {
        color: var(--color-text-primary-dark, #e0e0e0);
      }

      .dialog-icon {
        color: var(--color-primary-dark, #7986cb);
      }

      .close-button {
        color: var(--color-text-secondary-dark, #aaa);
      }

      .close-button:hover {
        color: var(--color-text-primary-dark, #e0e0e0);
      }

      .dialog-footer {
        border-top-color: var(--color-border-dark, #555);
      }
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
      console.log('Backdrop click detectado, emitiendo eventos de cierre');
      this.closeDialog();
    }
  }

  /**
   * Maneja la tecla Escape para cerrar el diálogo
   */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    console.log('Tecla Escape detectada, emitiendo eventos de cierre');
    this.closeDialog();
  }

  /**
   * Método centralizado para cerrar el diálogo
   * Emite todos los eventos de cierre en un orden específico
   *
   * Este método es público para que pueda ser llamado desde el exterior,
   * por ejemplo, desde un componente hijo que necesite cerrar el diálogo.
   */
  public closeDialog(): void {
    console.log('CustomDialogComponent.closeDialog() llamado');

    // Verificar si ya hay un proceso de cierre en curso
    if (this._isClosing) {
      console.log('Ya hay un proceso de cierre en curso, ignorando llamada duplicada');
      return;
    }

    // Marcar que estamos en proceso de cierre
    this._isClosing = true;

    // Emitir eventos en orden específico para garantizar que todos los listeners respondan
    console.log('Emitiendo eventos de cierre');
    this.dialogDismiss.emit();
    this.dialogCancel.emit();
    this.dialogClose.emit();

    // Intentar limpiar manualmente el DOM después de un breve retraso
    setTimeout(() => {
      try {
        // Buscar solo los elementos de diálogo que pertenecen a este componente
        // usando el ID único del diálogo
        console.log(`Buscando elemento de diálogo con ID ${this.dialogId}`);
        const dialogBackdrop = document.querySelector(`.dialog-backdrop[aria-labelledby="dialog-title-${this.dialogId}"]`);
        if (dialogBackdrop && dialogBackdrop.parentNode) {
          console.log('Eliminando elemento de diálogo del DOM');
          dialogBackdrop.parentNode.removeChild(dialogBackdrop);
        } else {
          console.log('No se encontró el elemento de diálogo en el DOM');
        }

        // Restaurar el scroll del body
        document.body.style.overflow = '';

        // Resetear el estado de cierre
        this._isClosing = false;
      } catch (error) {
        console.error('Error al limpiar el DOM manualmente:', error);
        this._isClosing = false;
      }
    }, 100);
  }
}
