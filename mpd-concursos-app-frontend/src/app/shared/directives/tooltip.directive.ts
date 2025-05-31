import { Directive, Input, HostListener, ComponentRef, OnDestroy, OnInit } from  '@angular/core';
import { OverlayRef } from   '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { EnhancedTooltipComponent } from '../components/enhanced-tooltip/enhanced-tooltip.component';
import { ElementRef } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { OverlayPositionBuilder } from '@angular/cdk/overlay';

/**
 * Directiva para mostrar tooltips contextuales en cualquier elemento.
 * Ejemplo de uso:
 * <div appTooltip="Contenido del tooltip" tooltipTitle="Título" tooltipIcon="info-circle" tooltipPosition="top" tooltipTheme="primary">
 *   Elemento con tooltip
 * </div>
 */
@Directive({
  selector: '[appTooltip]',
  standalone: true
})
export class TooltipDirective implements OnInit, OnDestroy {


  @Input('appTooltip') content = '';
  @Input() tooltipTitle = '';
  @Input() tooltipIcon = '';
  @Input() tooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';
  @Input() tooltipTheme: 'default' | 'primary' | 'accent' | 'warn' | 'info' = 'default';
  @Input() tooltipShowArrow = true;
  @Input() tooltipShowOnClick = false;
  @Input() tooltipDelay = 300;

  private overlayRef: OverlayRef | null = null;
  private tooltipRef: ComponentRef<EnhancedTooltipComponent> | null = null;
  private showTimeout: ReturnType<typeof setTimeout> | null = null;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private elementRef: ElementRef,
    private overlay: Overlay,
    private overlayPositionBuilder: OverlayPositionBuilder
  ) {}



  ngOnInit(): void {
    // Añadir clase para indicar que el elemento tiene tooltip
    this.elementRef.nativeElement.classList.add('has-tooltip');

    // Si el tooltip se muestra al hacer clic, añadir cursor pointer
    if (this.tooltipShowOnClick) {
      this.elementRef.nativeElement.style.cursor = 'pointer';
    }
  }

  ngOnDestroy(): void {
    this.disposeTooltip();

    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
    }

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (!this.tooltipShowOnClick) {
      this.showTooltip();
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (!this.tooltipShowOnClick) {
      this.hideTooltip();
    }
  }

  @HostListener('focus')
  onFocus(): void {
    if (!this.tooltipShowOnClick) {
      this.showTooltip();
    }
  }

  @HostListener('blur')
  onBlur(): void {
    if (!this.tooltipShowOnClick) {
      this.hideTooltip();
    }
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (this.tooltipShowOnClick) {
      event.stopPropagation();

      if (this.overlayRef && this.overlayRef.hasAttached()) {
        this.disposeTooltip();
      } else {
        this.showTooltip();
      }
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.tooltipShowOnClick && this.overlayRef && this.overlayRef.hasAttached()) {
      const clickTarget = event.target as HTMLElement;
      const hostElement = this.elementRef.nativeElement;

      if (!hostElement.contains(clickTarget) &&
          !this.overlayRef.overlayElement.contains(clickTarget)) {
        this.disposeTooltip();
      }
    }
  }

  private showTooltip(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    this.showTimeout = setTimeout(() => {
      this.createTooltip();
    }, this.tooltipDelay);
  }

  private hideTooltip(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }

    this.hideTimeout = setTimeout(() => {
      this.disposeTooltip();
    }, 100);
  }

  private createTooltip(): void {
    if (this.overlayRef && this.overlayRef.hasAttached()) {
      return;
    }

    const positionStrategy = this.getPositionStrategy();

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition()
    });

    const portal = new ComponentPortal(EnhancedTooltipComponent);
    this.tooltipRef = this.overlayRef.attach(portal);

    if (this.tooltipRef && this.tooltipRef.instance) {
      this.tooltipRef.instance.content = this.content;
      this.tooltipRef.instance.title = this.tooltipTitle;
      this.tooltipRef.instance.icon = this.tooltipIcon;
      this.tooltipRef.instance.position = this.tooltipPosition;
      this.tooltipRef.instance.theme = this.tooltipTheme;
      this.tooltipRef.instance.showArrow = this.tooltipShowArrow;
    }
  }

  private disposeTooltip(): void {
    if (this.overlayRef) {
      this.overlayRef.detach();
    }
  }

  private getPositionStrategy() {
    const hostElement = this.elementRef.nativeElement;

    let position;

    switch (this.tooltipPosition) {
      case 'top':
        position = this.overlayPositionBuilder
          .flexibleConnectedTo(hostElement)
          .withPositions([
            {
              originX: 'center',
              originY: 'top',
              overlayX: 'center',
              overlayY: 'bottom',
              offsetY: -8
            }
          ]);
        break;
      case 'bottom':
        position = this.overlayPositionBuilder
          .flexibleConnectedTo(hostElement)
          .withPositions([
            {
              originX: 'center',
              originY: 'bottom',
              overlayX: 'center',
              overlayY: 'top',
              offsetY: 8
            }
          ]);
        break;
      case 'left':
        position = this.overlayPositionBuilder
          .flexibleConnectedTo(hostElement)
          .withPositions([
            {
              originX: 'start',
              originY: 'center',
              overlayX: 'end',
              overlayY: 'center',
              offsetX: -8
            }
          ]);
        break;
      case 'right':
        position = this.overlayPositionBuilder
          .flexibleConnectedTo(hostElement)
          .withPositions([
            {
              originX: 'end',
              originY: 'center',
              overlayX: 'start',
              overlayY: 'center',
              offsetX: 8
            }
          ]);
        break;
      default:
        position = this.overlayPositionBuilder
          .flexibleConnectedTo(hostElement)
          .withPositions([
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
