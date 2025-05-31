import { Component, Input, Output, EventEmitter, HostListener, ElementRef, ViewChild, ContentChild, TemplateRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-custom-dialog',
  standalone: true,
  imports: [CommonModule, CustomButtonComponent],
  template: `
    <div class="dialog-backdrop" (click)="onBackdropClick($event)" [class.visible]="visible">
      <div
        #dialogContainer
        class="dialog-container"
        [ngClass]="getPositionClass()"
        [ngStyle]="getDialogStyle()"
        (click)="$event.stopPropagation()">

        <div class="dialog-header" *ngIf="title">
          <h2 class="dialog-title">{{ title }}</h2>
          <app-custom-button
            *ngIf="showCloseButton"
            [variant]="'icon'"
            [icon]="'times'"
            [tooltip]="'Cerrar'"
            (buttonClick)="close()">
          </app-custom-button>
        </div>

        <div class="dialog-content">
          <ng-content></ng-content>
          <ng-container *ngIf="contentTemplate" [ngTemplateOutlet]="contentTemplate"></ng-container>
          <div *ngIf="htmlContent" [innerHTML]="htmlContent"></div>
          <div *ngIf="message && !htmlContent">{{ message }}</div>
        </div>

        <div class="dialog-actions" *ngIf="showActions">
          <ng-content select="[dialog-actions]"></ng-content>
          <ng-container *ngIf="actionsTemplate" [ngTemplateOutlet]="actionsTemplate"></ng-container>

          <div *ngIf="!hasCustomActions" class="default-actions">
            <app-custom-button
              *ngIf="showCancelButton"
              [label]="cancelButtonText"
              [variant]="'stroked'"
              [color]="'primary'"
              (buttonClick)="cancel()">
            </app-custom-button>

            <app-custom-button
              *ngIf="showConfirmButton"
              [label]="confirmButtonText"
              [variant]="'flat'"
              [color]="'primary'"
              (buttonClick)="confirm()">
            </app-custom-button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./confirmation-dialog.scss'],
  styles: [`
    :host {
      display: contents;
    }

    .dialog-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s ease, visibility 0.2s ease;
      backdrop-filter: blur(2px);
    }

    .dialog-backdrop.visible {
      opacity: 1;
      visibility: visible;
    }

    .dialog-container {
      background-color: var(--color-surface, #FFFFFF);
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      max-width: 90vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform: scale(0.9);
      transition: transform 0.2s ease;
      position: relative;
      min-width: 300px;
    }

    .dialog-backdrop.visible .dialog-container {
      transform: scale(1);
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid var(--color-border, #E0E0E0);
    }

    .dialog-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 500;
      color: var(--color-text-primary, #333333);
    }

    .dialog-content {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      padding: 16px 24px;
      border-top: 1px solid var(--color-border, #E0E0E0);
      gap: 12px;
    }

    .default-actions {
      display: flex;
      gap: 12px;
    }

    /* Posiciones */
    .dialog-container.position-center {
      margin: auto;
    }

    .dialog-container.position-top {
      margin-top: 5vh;
      align-self: center;
    }

    .dialog-container.position-bottom {
      margin-bottom: 5vh;
      align-self: center;
    }

    .dialog-container.position-left {
      margin-left: 5vw;
      align-self: center;
    }

    .dialog-container.position-right {
      margin-right: 5vw;
      align-self: center;
    }

    .dialog-container.position-top-left {
      margin-top: 5vh;
      margin-left: 5vw;
      align-self: flex-start;
    }

    .dialog-container.position-top-right {
      margin-top: 5vh;
      margin-right: 5vw;
      align-self: flex-start;
    }

    .dialog-container.position-bottom-left {
      margin-bottom: 5vh;
      margin-left: 5vw;
      align-self: flex-end;
    }

    .dialog-container.position-bottom-right {
      margin-bottom: 5vh;
      margin-right: 5vw;
      align-self: flex-end;
    }

    @media (prefers-color-scheme: dark) {
      .dialog-container {
        background-color: var(--color-surface-dark, #333333);
      }

      .dialog-header {
        border-bottom-color: var(--color-border-dark, #444444);
      }

      .dialog-title {
        color: var(--color-text-primary-dark, #E0E0E0);
      }

      .dialog-actions {
        border-top-color: var(--color-border-dark, #444444);
      }
    }
  `],
  animations: [
    trigger('dialogAnimation', [
      state('void', style({
        transform: 'scale(0.9)',
        opacity: 0
      })),
      state('visible', style({
        transform: 'scale(1)',
        opacity: 1
      })),
      transition('void => visible', animate('200ms cubic-bezier(0, 0, 0.2, 1)')),
      transition('visible => void', animate('150ms cubic-bezier(0.4, 0, 1, 1)'))
    ])
  ]
})
export class CustomDialogComponent implements AfterViewInit, OnDestroy {
  @Input() title?: string;
  @Input() width?: string;
  @Input() height?: string;
  @Input() position: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'center';
  @Input() disableClose = false;
  @Input() disableEscClose = false;
  @Input() showCloseButton = true;
  @Input() showActions = true;
  @Input() showCancelButton = true;
  @Input() showConfirmButton = true;
  @Input() cancelButtonText = 'Cancelar';
  @Input() confirmButtonText = 'Aceptar';
  @Input() visible = false;
  @Input() contentTemplate?: TemplateRef<any>;
  @Input() actionsTemplate?: TemplateRef<any>;
  @Input() hasCustomActions = false;
  @Input() message?: string;

  @Output() closed = new EventEmitter<any>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  @ViewChild('dialogContainer') dialogContainer?: ElementRef;

  // Propiedad para contenido HTML sanitizado
  htmlContent?: SafeHtml;

  constructor(private sanitizer: DomSanitizer) {}

  // Setter para el mensaje que permite HTML
  @Input() set htmlMessage(value: string | undefined) {
    if (value) {
      this.htmlContent = this.sanitizer.bypassSecurityTrustHtml(value);
    } else {
      this.htmlContent = undefined;
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent): void {
    if (!this.disableEscClose && this.visible) {
      this.cancel();
      event.preventDefault();
    }
  }

  ngAfterViewInit(): void {
    // Asegurarse de que el diálogo esté centrado
    if (this.dialogContainer && this.visible) {
      this.centerDialog();
    }
  }

  ngOnDestroy(): void {
    // Limpiar cualquier evento o suscripción
  }

  /**
   * Centra el diálogo en la pantalla
   */
  private centerDialog(): void {
    if (!this.dialogContainer) return;

    const element = this.dialogContainer.nativeElement;
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const dialogHeight = element.offsetHeight;
    const dialogWidth = element.offsetWidth;

    if (this.position === 'center') {
      element.style.marginTop = `${Math.max(0, (windowHeight - dialogHeight) / 2)}px`;
      element.style.marginLeft = `${Math.max(0, (windowWidth - dialogWidth) / 2)}px`;
    }
  }

  /**
   * Maneja el clic en el fondo del diálogo
   */
  onBackdropClick(event: MouseEvent): void {
    if (!this.disableClose) {
      this.cancel();
    }
  }

  /**
   * Cierra el diálogo sin emitir resultado
   */
  close(result?: any): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.closed.emit(result);
  }

  /**
   * Cancela el diálogo
   */
  cancel(): void {
    this.cancelled.emit();
    this.close();
  }

  /**
   * Confirma el diálogo
   */
  confirm(): void {
    this.confirmed.emit();
    this.close(true);
  }

  /**
   * Obtiene la clase CSS para la posición del diálogo
   */
  getPositionClass(): string {
    return `position-${this.position}`;
  }

  /**
   * Obtiene los estilos para el diálogo
   */
  getDialogStyle(): { [key: string]: string } {
    const style: { [key: string]: string } = {};

    if (this.width) {
      style['width'] = this.width;
    }

    if (this.height) {
      style['height'] = this.height;
    }

    return style;
  }
}
