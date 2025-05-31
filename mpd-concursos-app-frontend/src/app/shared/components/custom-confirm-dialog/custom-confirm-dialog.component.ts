import { Component, OnInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomButtonComponent } from '../custom-form/custom-button/custom-button.component';
import { CustomDialogService } from '../custom-dialog/custom-dialog.service';

export interface CustomConfirmDialogData {
  message: string;
  title?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: 'primary' | 'accent' | 'warn' | 'success' | 'danger';
  cancelButtonColor?: 'primary' | 'accent' | 'warn' | 'success' | 'danger';
  html?: boolean;
}

@Component({
  selector: 'app-custom-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    CustomButtonComponent
  ],
  template: `
    <div class="custom-confirm-dialog">
      <div class="dialog-content">
        <div *ngIf="data.html" [innerHTML]="data.message"></div>
        <div *ngIf="!data.html">{{ data.message }}</div>
      </div>
      <div class="dialog-actions">
        <app-custom-button
          *ngIf="data.cancelButtonText"
          [color]="data.cancelButtonColor || 'primary'"
          variant="stroked"
          (buttonClick)="onCancel()">
          {{ data.cancelButtonText }}
        </app-custom-button>
        <app-custom-button
          [color]="data.confirmButtonColor || 'primary'"
          variant="flat"
          (buttonClick)="onConfirm()">
          {{ data.confirmButtonText || 'Confirmar' }}
        </app-custom-button>
      </div>
    </div>
  `,
  styles: [`
    .custom-confirm-dialog {
      padding: 1rem;
    }
    .dialog-content {
      margin-bottom: 1.5rem;
      font-size: 1rem;
      line-height: 1.5;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
  `]
})
export class CustomConfirmDialogComponent implements OnInit {
  public data: CustomConfirmDialogData = {
    message: '¿Está seguro que desea continuar?'
  };

  constructor(
    private dialogService: CustomDialogService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    // Asegurarse de que los datos existan
    if (!this.data) {
      this.data = {
        message: '¿Está seguro que desea continuar?'
      };
    }
  }

  onCancel(): void {
    // Cerrar el diálogo con resultado false
    console.log('CustomConfirmDialogComponent: onCancel');

    // Cerrar manualmente el diálogo
    this.closeDialog(false);
  }

  onConfirm(): void {
    // Cerrar el diálogo con resultado true
    console.log('CustomConfirmDialogComponent: onConfirm');

    // Cerrar manualmente el diálogo
    this.closeDialog(true);
  }

  /**
   * Cierra el diálogo y emite el evento de resultado
   */
  private closeDialog(result: boolean): void {
    // Emitir evento personalizado para indicar el resultado
    const event = new CustomEvent('dialog-closed', { detail: { result } });
    window.dispatchEvent(event);

    // Buscar el elemento de diálogo más cercano
    const dialogElement = this.findDialogElement();
    if (dialogElement) {
      console.log('Encontrado elemento de diálogo para cerrar:', dialogElement);

      // Añadir clase para animación de cierre
      dialogElement.classList.add('closing');

      // Cerrar el diálogo después de un breve retraso para la animación
      setTimeout(() => {
        // Intentar cerrar usando el servicio
        this.dialogService.close(result);

        // Como respaldo, intentar eliminar el diálogo del DOM
        try {
          const dialogBackdrop = dialogElement.closest('.dialog-backdrop');
          if (dialogBackdrop && dialogBackdrop.parentNode) {
            dialogBackdrop.parentNode.removeChild(dialogBackdrop);
          }
        } catch (error) {
          console.error('Error al eliminar el diálogo del DOM:', error);
        }
      }, 100);
    } else {
      console.log('No se encontró elemento de diálogo, usando método alternativo');
      this.dialogService.close(result);

      // Como último recurso, intentar cerrar todos los diálogos
      setTimeout(() => {
        this.dialogService.closeAll();
      }, 200);
    }
  }

  /**
   * Encuentra el elemento de diálogo en el DOM
   */
  private findDialogElement(): HTMLElement | null {
    // Intentar encontrar el elemento de diálogo más cercano
    const element = this.elementRef.nativeElement;

    // Buscar el elemento con la clase 'custom-dialog'
    let dialogElement = element.closest('.custom-dialog');

    // Si no se encuentra, buscar el elemento con la clase 'dialog-content'
    if (!dialogElement) {
      dialogElement = element.closest('.dialog-content');
    }

    // Si aún no se encuentra, buscar cualquier elemento con ID que comience con 'dialog-'
    if (!dialogElement) {
      const allDialogs = document.querySelectorAll('[id^="dialog-"]');
      if (allDialogs.length > 0) {
        dialogElement = allDialogs[allDialogs.length - 1] as HTMLElement;
      }
    }

    return dialogElement;
  }
}
