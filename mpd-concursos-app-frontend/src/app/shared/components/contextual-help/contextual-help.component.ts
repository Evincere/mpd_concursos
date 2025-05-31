import { Component, Input, TemplateRef, ViewChild, ElementRef, AfterViewInit, OnDestroy, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AnimateDirective } from '../../directives/animate.directive';
import { OverlayRef, OverlayModule, Overlay, OverlayPositionBuilder } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { PortalModule } from '@angular/cdk/portal';

@Component({
  selector: 'app-contextual-help',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    AnimateDirective,
    OverlayModule,
    PortalModule
  ],
  template: `
    <div class="help-trigger"
         #helpTrigger
         (click)="toggleHelp($event)"
         (keydown.enter)="handleKeyboardEvent($event, 'enter')"
         (keydown.space)="handleKeyboardEvent($event, 'space')"
         tabindex="0"
         role="button"
         [attr.aria-label]="'Mostrar ayuda: ' + title"
         [attr.aria-expanded]="isHelpVisible">
      <ng-content></ng-content>
      <i *ngIf="showIcon" class="help-icon fas fa-{{icon}}" aria-hidden="true"></i>
    </div>

    <ng-template #helpTemplate>
      <div class="contextual-help"
           [class]="'theme-' + theme"
           [appAnimate]="'fadeIn'"
           [animationDuration]="300">
        <div class="help-header">
          <div class="help-title">
            <i *ngIf="headerIcon" class="header-icon fas fa-{{headerIcon}}" aria-hidden="true"></i>
            {{title}}
          </div>
          <button mat-icon-button
                  class="close-button"
                  (click)="hideHelp()"
                  aria-label="Cerrar ayuda">
            <i class="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>
        <div class="help-content">
          <ng-container *ngIf="!contentTemplate">
            <p *ngFor="let paragraph of contentParagraphs">{{paragraph}}</p>
          </ng-container>
          <ng-container *ngIf="contentTemplate">
            <ng-container *ngTemplateOutlet="contentTemplate"></ng-container>
          </ng-container>
        </div>
        <div *ngIf="showFooter" class="help-footer">
          <button *ngIf="showDismissButton"
                  mat-button
                  class="dismiss-button"
                  (click)="hideHelp()">
            {{dismissButtonText}}
          </button>
          <button *ngIf="showActionButton"
                  mat-raised-button
                  [color]="actionButtonColor"
                  class="action-button"
                  (click)="onActionClick()">
            {{actionButtonText}}
          </button>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    .help-trigger {
      display: inline-flex;
      align-items: center;
      position: relative;
      cursor: pointer;
    }

    .help-icon {
      margin-left: 0.25rem;
      color: rgba(255, 255, 255, 0.7);
      font-size: 1rem;
      transition: color 0.2s ease;
    }

    .help-trigger:hover .help-icon {
      color: rgba(255, 255, 255, 0.9);
    }

    .contextual-help {
      background: #424242;
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      min-width: 280px;
      max-width: 400px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .help-header {
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .help-title {
      font-weight: 500;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .header-icon {
      font-size: 1.2rem;
    }

    .close-button {
      margin: -0.5rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .help-content {
      padding: 1rem;
      font-size: 0.95rem;
      line-height: 1.5;
      overflow-y: auto;
      max-height: 300px;
    }

    .help-content p {
      margin: 0 0 0.75rem;
    }

    .help-content p:last-child {
      margin-bottom: 0;
    }

    .help-footer {
      padding: 0.75rem 1rem;
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    /* Themes */
    .contextual-help.theme-default {
      background: #424242;
    }

    .contextual-help.theme-primary {
      background: #1e3a8a;
    }

    .contextual-help.theme-primary .help-header {
      background: #1e40af;
    }

    .contextual-help.theme-accent {
      background: #9d174d;
    }

    .contextual-help.theme-accent .help-header {
      background: #be185d;
    }

    .contextual-help.theme-warn {
      background: #991b1b;
    }

    .contextual-help.theme-warn .help-header {
      background: #b91c1c;
    }

    .contextual-help.theme-info {
      background: #0e7490;
    }

    .contextual-help.theme-info .help-header {
      background: #0891b2;
    }
  `]
})
export class ContextualHelpComponent implements AfterViewInit, OnDestroy {
  @Input() title = 'Ayuda';
  @Input() content = '';
  @Input() contentTemplate: TemplateRef<unknown> | null = null;
  @Input() icon = 'question-circle';
  @Input() headerIcon = 'info-circle';
  @Input() theme: 'default' | 'primary' | 'accent' | 'warn' | 'info' = 'info';
  @Input() showIcon = true;
  @Input() showFooter = true;
  @Input() showDismissButton = true;
  @Input() dismissButtonText = 'Cerrar';
  @Input() showActionButton = false;
  @Input() actionButtonText = 'Entendido';
  @Input() actionButtonColor: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() position: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
  @Input() width = 'auto';

  @ViewChild('helpTrigger') helpTrigger!: ElementRef;
  @ViewChild('helpTemplate') helpTemplate!: TemplateRef<unknown>;

  isHelpVisible = false;
  private overlayRef: OverlayRef | null = null;
  private clickListener: (event: MouseEvent) => void = () => {};

  constructor(
    private overlay: Overlay,
    private overlayPositionBuilder: OverlayPositionBuilder,
    private viewContainerRef: ViewContainerRef
  ) {}

  // Dividir el contenido en párrafos
  get contentParagraphs(): string[] {
    if (!this.content) return [];
    return this.content.split('\n\n');
  }

  // Método para manejar eventos de teclado
  handleKeyboardEvent(event: Event, key: 'enter' | 'space'): void {
    const keyboardEvent = event as KeyboardEvent;
    event.preventDefault();
    event.stopPropagation();

    // Crear un evento de mouse sintético
    const mouseEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });

    this.toggleHelp(mouseEvent);
  }

  ngAfterViewInit(): void {
    this.clickListener = (event: MouseEvent) => {
      if (this.overlayRef && this.overlayRef.hasAttached()) {
        const clickTarget = event.target as HTMLElement;
        const helpElement = this.helpTrigger.nativeElement;

        if (!helpElement.contains(clickTarget) &&
            !this.overlayRef.overlayElement.contains(clickTarget)) {
          this.hideHelp();
        }
      }
    };

    document.addEventListener('click', this.clickListener);
  }

  ngOnDestroy(): void {
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener);
    }

    this.disposeOverlay();
  }

  toggleHelp(event: MouseEvent): void {
    event.stopPropagation();

    if (this.overlayRef && this.overlayRef.hasAttached()) {
      this.hideHelp();
    } else {
      this.showHelp();
    }
  }

  showHelp(): void {
    if (this.overlayRef && this.overlayRef.hasAttached()) {
      return;
    }

    const positionStrategy = this.getPositionStrategy();

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      width: this.width !== 'auto' ? this.width : undefined,
      minWidth: '280px',
      maxWidth: '400px'
    });

    const portal = new TemplatePortal(this.helpTemplate, this.viewContainerRef);
    this.overlayRef.attach(portal);
    this.isHelpVisible = true;
  }

  hideHelp(): void {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.isHelpVisible = false;
    }
  }

  onActionClick(): void {
    this.hideHelp();
    // Aquí se podría emitir un evento para que el componente padre pueda realizar acciones adicionales
  }

  private disposeOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  private getPositionStrategy() {
    const trigger = this.helpTrigger.nativeElement;

    let position;

    switch (this.position) {
      case 'top':
        position = this.overlayPositionBuilder
          .flexibleConnectedTo(trigger)
          .withPositions([
            {
              originX: 'center',
              originY: 'top',
              overlayX: 'center',
              overlayY: 'bottom',
              offsetY: -8
            },
            {
              originX: 'center',
              originY: 'bottom',
              overlayX: 'center',
              overlayY: 'top',
              offsetY: 8
            }
          ]);
        break;
      case 'bottom':
        position = this.overlayPositionBuilder
          .flexibleConnectedTo(trigger)
          .withPositions([
            {
              originX: 'center',
              originY: 'bottom',
              overlayX: 'center',
              overlayY: 'top',
              offsetY: 8
            },
            {
              originX: 'center',
              originY: 'top',
              overlayX: 'center',
              overlayY: 'bottom',
              offsetY: -8
            }
          ]);
        break;
      case 'left':
        position = this.overlayPositionBuilder
          .flexibleConnectedTo(trigger)
          .withPositions([
            {
              originX: 'start',
              originY: 'center',
              overlayX: 'end',
              overlayY: 'center',
              offsetX: -8
            },
            {
              originX: 'end',
              originY: 'center',
              overlayX: 'start',
              overlayY: 'center',
              offsetX: 8
            }
          ]);
        break;
      case 'right':
        position = this.overlayPositionBuilder
          .flexibleConnectedTo(trigger)
          .withPositions([
            {
              originX: 'end',
              originY: 'center',
              overlayX: 'start',
              overlayY: 'center',
              offsetX: 8
            },
            {
              originX: 'start',
              originY: 'center',
              overlayX: 'end',
              overlayY: 'center',
              offsetX: -8
            }
          ]);
        break;
      default:
        position = this.overlayPositionBuilder
          .flexibleConnectedTo(trigger)
          .withPositions([
            {
              originX: 'center',
              originY: 'bottom',
              overlayX: 'center',
              overlayY: 'top',
              offsetY: 8
            },
            {
              originX: 'center',
              originY: 'top',
              overlayX: 'center',
              overlayY: 'bottom',
              offsetY: -8
            }
          ]);
    }

    return position;
  }
}
