import { Component, Input, TemplateRef, ViewChild, ElementRef, AfterViewInit, OnDestroy, Inject, ViewContainerRef } from  '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AnimateDirective } from '../../directives/animate.directive';
import { OverlayRef, OverlayModule, Overlay, OverlayPositionBuilder } from   '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { PortalModule } from '@angular/cdk/portal';

@Component({
  selector: 'app-enhanced-tooltip',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    AnimateDirective,
    OverlayModule,
    PortalModule
  ],
  template: `
    <div class="tooltip-trigger"
         #tooltipTrigger
         (mouseenter)="showTooltip()"
         (mouseleave)="hideTooltip()"
         (focus)="showTooltip()"
         (blur)="hideTooltip()"
         (click)="toggleTooltip($event)">
      <ng-content></ng-content>
      <i *ngIf="showHelpIcon" class="help-icon fas fa-question-circle"></i>
    </div>

    <ng-template #tooltipTemplate>
      <div class="enhanced-tooltip"
           [class]="'theme-' + theme"
           [appAnimate]="'fadeIn'"
           [animationDuration]="200">
        <div *ngIf="title" class="tooltip-title">
          <i *ngIf="icon" class="tooltip-icon fas fa-{{icon}}"></i>
          <span class="title-text">{{title}}</span>
        </div>
        <div class="tooltip-content">
          <ng-container *ngIf="!contentTemplate">
            <div class="content-text">{{content}}</div>
          </ng-container>
          <ng-container *ngIf="contentTemplate">
            <ng-container *ngTemplateOutlet="contentTemplate"></ng-container>
          </ng-container>
        </div>
        <div *ngIf="showArrow" class="tooltip-arrow" [class]="'position-' + position"></div>
      </div>
    </ng-template>
  `,
  styles: [`
    .tooltip-trigger {
      display: inline-flex;
      align-items: center;
      position: relative;
      cursor: help;
    }

    .help-icon {
      margin-left: 0.25rem;
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.9rem;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    .tooltip-trigger:hover .help-icon {
      color: rgba(255, 255, 255, 0.8);
      transform: scale(1.1);
    }

    .enhanced-tooltip {
      background: #424242;
      color: white;
      border-radius: 8px;
      padding: 1rem;
      max-width: 300px;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
      position: relative;
      z-index: 1000;
      overflow: hidden;
    }

    .enhanced-tooltip::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: linear-gradient(to right, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
    }

    .tooltip-title {
      font-weight: 600;
      margin-bottom: 0.75rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.15);
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .tooltip-icon {
      color: inherit;
      font-size: 1.1rem;
      opacity: 0.9;
    }

    .title-text {
      letter-spacing: 0.01em;
    }

    .tooltip-content {
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .content-text {
      position: relative;
      padding-left: 0.5rem;
    }

    .content-text::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 2px;
      background-color: rgba(255, 255, 255, 0.2);
      border-radius: 1px;
    }

    .tooltip-arrow {
      position: absolute;
      width: 0;
      height: 0;
      border: 8px solid transparent;
    }

    .tooltip-arrow.position-top {
      bottom: -16px;
      left: 50%;
      transform: translateX(-50%);
      border-top-color: #424242;
    }

    .tooltip-arrow.position-bottom {
      top: -16px;
      left: 50%;
      transform: translateX(-50%);
      border-bottom-color: #424242;
    }

    .tooltip-arrow.position-left {
      right: -16px;
      top: 50%;
      transform: translateY(-50%);
      border-left-color: #424242;
    }

    .tooltip-arrow.position-right {
      left: -16px;
      top: 50%;
      transform: translateY(-50%);
      border-right-color: #424242;
    }

    /* Themes */
    .enhanced-tooltip.theme-default {
      background: #424242;
      background: linear-gradient(145deg, #3a3a3a, #4a4a4a);
    }

    .enhanced-tooltip.theme-default::before {
      background: linear-gradient(to right, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
    }

    .enhanced-tooltip.theme-default .tooltip-arrow.position-top {
      border-top-color: #424242;
    }

    .enhanced-tooltip.theme-default .tooltip-arrow.position-bottom {
      border-bottom-color: #424242;
    }

    .enhanced-tooltip.theme-default .tooltip-arrow.position-left {
      border-left-color: #424242;
    }

    .enhanced-tooltip.theme-default .tooltip-arrow.position-right {
      border-right-color: #424242;
    }

    .enhanced-tooltip.theme-primary {
      background: #1976d2;
      background: linear-gradient(145deg, #1565c0, #1e88e5);
    }

    .enhanced-tooltip.theme-primary::before {
      background: linear-gradient(to right, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.1));
    }

    .enhanced-tooltip.theme-primary .tooltip-arrow.position-top {
      border-top-color: #1976d2;
    }

    .enhanced-tooltip.theme-primary .tooltip-arrow.position-bottom {
      border-bottom-color: #1976d2;
    }

    .enhanced-tooltip.theme-primary .tooltip-arrow.position-left {
      border-left-color: #1976d2;
    }

    .enhanced-tooltip.theme-primary .tooltip-arrow.position-right {
      border-right-color: #1976d2;
    }

    .enhanced-tooltip.theme-accent {
      background: #ff4081;
      background: linear-gradient(145deg, #f50057, #ff4081);
    }

    .enhanced-tooltip.theme-accent::before {
      background: linear-gradient(to right, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
    }

    .enhanced-tooltip.theme-accent .tooltip-arrow.position-top {
      border-top-color: #ff4081;
    }

    .enhanced-tooltip.theme-accent .tooltip-arrow.position-bottom {
      border-bottom-color: #ff4081;
    }

    .enhanced-tooltip.theme-accent .tooltip-arrow.position-left {
      border-left-color: #ff4081;
    }

    .enhanced-tooltip.theme-accent .tooltip-arrow.position-right {
      border-right-color: #ff4081;
    }

    .enhanced-tooltip.theme-warn {
      background: #f44336;
      background: linear-gradient(145deg, #e53935, #f44336);
    }

    .enhanced-tooltip.theme-warn::before {
      background: linear-gradient(to right, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
    }

    .enhanced-tooltip.theme-warn .tooltip-arrow.position-top {
      border-top-color: #f44336;
    }

    .enhanced-tooltip.theme-warn .tooltip-arrow.position-bottom {
      border-bottom-color: #f44336;
    }

    .enhanced-tooltip.theme-warn .tooltip-arrow.position-left {
      border-left-color: #f44336;
    }

    .enhanced-tooltip.theme-warn .tooltip-arrow.position-right {
      border-right-color: #f44336;
    }

    .enhanced-tooltip.theme-info {
      background: #03a9f4;
      background: linear-gradient(145deg, #039be5, #29b6f6);
    }

    .enhanced-tooltip.theme-info::before {
      background: linear-gradient(to right, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.1));
    }

    .enhanced-tooltip.theme-info .tooltip-arrow.position-top {
      border-top-color: #03a9f4;
    }

    .enhanced-tooltip.theme-info .tooltip-arrow.position-bottom {
      border-bottom-color: #03a9f4;
    }

    .enhanced-tooltip.theme-info .tooltip-arrow.position-left {
      border-left-color: #03a9f4;
    }

    .enhanced-tooltip.theme-info .tooltip-arrow.position-right {
      border-right-color: #03a9f4;
    }
  `]
})
export class EnhancedTooltipComponent implements AfterViewInit, OnDestroy {


  @Input() content = '';
  @Input() contentTemplate: TemplateRef<unknown> | null = null;
  @Input() title = '';
  @Input() icon = '';
  @Input() position: 'top' | 'bottom' | 'left' | 'right' = 'top';
  @Input() theme: 'default' | 'primary' | 'accent' | 'warn' | 'info' = 'default';
  @Input() showArrow = true;
  @Input() showHelpIcon = false;
  @Input() showOnClick = false;
  @Input() hideOnClickOutside = true;
  @Input() delay = 300;

  @ViewChild('tooltipTrigger') tooltipTrigger!: ElementRef;
  @ViewChild('tooltipTemplate') tooltipTemplate!: TemplateRef<unknown>;

  private overlayRef: OverlayRef | null = null;
  private showTimeout: ReturnType<typeof setTimeout> | null = null;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;
  private clickListener: ((event: MouseEvent) => void) | null = null;

  constructor(
    private overlay: Overlay,
    private overlayPositionBuilder: OverlayPositionBuilder,
    private viewContainerRef: ViewContainerRef
  ) {}



  ngAfterViewInit(): void {
    if (this.hideOnClickOutside) {
      this.clickListener = (event: MouseEvent) => {
        if (this.overlayRef && this.overlayRef.hasAttached()) {
          const clickTarget = event.target as HTMLElement;
          const tooltipElement = this.tooltipTrigger.nativeElement;

          if (!tooltipElement.contains(clickTarget) &&
              !this.overlayRef.overlayElement.contains(clickTarget)) {
            this.hideTooltip();
          }
        }
      };

      document.addEventListener('click', this.clickListener);
    }
  }

  ngOnDestroy(): void {
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener);
      this.clickListener = null;
    }

    this.disposeOverlay();

    if (this.showTimeout !== null) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }

    if (this.hideTimeout !== null) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  showTooltip(): void {
    if (this.showOnClick) {
      return;
    }

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    this.showTimeout = setTimeout(() => {
      this.createOverlay();
    }, this.delay);
  }

  hideTooltip(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }

    this.hideTimeout = setTimeout(() => {
      this.disposeOverlay();
    }, 100);
  }

  toggleTooltip(event: MouseEvent): void {
    event.stopPropagation();

    if (!this.showOnClick) {
      return;
    }

    if (this.overlayRef && this.overlayRef.hasAttached()) {
      this.disposeOverlay();
    } else {
      this.createOverlay();
    }
  }

  private createOverlay(): void {
    if (this.overlayRef && this.overlayRef.hasAttached()) {
      return;
    }

    const positionStrategy = this.getPositionStrategy();

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition()
    });

    const portal = new TemplatePortal(this.tooltipTemplate, this.viewContainerRef);
    if (this.overlayRef) {
      this.overlayRef.attach(portal);
    }
  }

  private disposeOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.detach();
    }
  }

  private getPositionStrategy() {
    const trigger = this.tooltipTrigger.nativeElement;

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
            }
          ]);
        break;
      default:
        position = this.overlayPositionBuilder
          .flexibleConnectedTo(trigger)
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
