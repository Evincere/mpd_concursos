import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, ContentChildren, QueryList, AfterContentInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomMenuItemComponent } from './custom-menu-item.component';

@Component({
  selector: 'app-custom-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      #menuContainer
      class="custom-menu-container"
      [class.open]="isOpen"
      [style.top.px]="positionY"
      [style.left.px]="positionX"
      [style.width.px]="maxWidth"
      [style.min-width.px]="minWidth"
      [style.max-width.px]="maxWidth"
      [attr.aria-hidden]="!isOpen"
      role="menu"
    >
      <div class="menu-content">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    /* ===== ENHANCED GLASSMORPHISM MENU DESIGN SYSTEM ===== */
    /* Consistent with admin dashboard and contest theme #4CAF50 */

    .custom-menu-container {
      position: fixed;
      z-index: 9999;
      display: none;
      transform-origin: top left;
      animation: menuFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      /* Less transparent glassmorphism for better readability */
      background: linear-gradient(135deg,
        rgba(31, 41, 55, 0.98) 0%,
        rgba(55, 65, 81, 0.99) 100%);
      background-image:
        linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.1) 100%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 8px;
      padding: 0.5rem;
      box-shadow:
        0 12px 24px rgba(0, 0, 0, 0.3),
        0 6px 12px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1),
        inset 0 -1px 0 rgba(0, 0, 0, 0.1);
      overflow: visible;
      min-width: 180px;
    }

    .custom-menu-container.open {
      display: block;
    }

    .menu-content {
      max-height: 400px; /* Increased for better viewing */
      overflow-y: auto;
      background: transparent; /* Let child components handle their backgrounds */
      border-radius: 6px;
    }

    /* ===== ANIMATIONS ===== */

    @keyframes menuFadeIn {
      from {
        opacity: 0;
        transform: translateY(-10px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /* ===== SUBTLE GLASSMORPHISM SCROLLBAR ===== */

    .menu-content::-webkit-scrollbar {
      width: 4px;
    }

    .menu-content::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 2px;
    }

    .menu-content::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, rgba(156, 163, 175, 0.4) 0%, rgba(156, 163, 175, 0.6) 100%);
      border-radius: 2px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .menu-content::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(135deg, rgba(156, 163, 175, 0.6) 0%, rgba(156, 163, 175, 0.8) 100%);
    }

    /* ===== ENHANCED RESPONSIVE DESIGN ===== */

    /* Prevent horizontal overflow on all screen sizes */
    .custom-menu-container {
      max-width: calc(100vw - 32px); /* Always respect viewport width */
      box-sizing: border-box;
    }

    @media (max-width: 480px) {
      .custom-menu-container {
        padding: 0.5rem;
        border-radius: 8px;
        /* Mobile-specific adjustments */
        max-width: calc(100vw - 16px);
        min-width: 260px;
      }

      .menu-content {
        max-height: 280px;
        padding: 0.25rem;
      }
    }

    @media (min-width: 481px) and (max-width: 768px) {
      .custom-menu-container {
        padding: 0.5rem;
        border-radius: 8px;
        /* Tablet-specific adjustments */
        max-width: calc(100vw - 24px);
        min-width: 300px;
      }

      .menu-content {
        max-height: 350px;
      }
    }

    @media (min-width: 769px) {
      .custom-menu-container {
        /* Desktop - standard behavior but with overflow protection */
        max-width: calc(100vw - 32px);
        min-width: 320px;
      }

      .menu-content {
        max-height: 400px;
      }
    }

    /* ===== ACCESSIBILITY ===== */

    @media (prefers-reduced-motion: reduce) {
      .custom-menu-container {
        animation: none !important;
      }

      @keyframes menuFadeIn {
        from, to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    }

    @media (prefers-contrast: high) {
      .custom-menu-container {
        border-width: 2px;
        border-color: rgba(255, 255, 255, 0.4);
        background: rgba(55, 65, 81, 0.95);
      }
    }

    /* Focus states for keyboard navigation */
    .custom-menu-container:focus-within {
      box-shadow:
        0 12px 32px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        inset 0 -1px 0 rgba(0, 0, 0, 0.1),
        0 0 0 2px rgba(76, 175, 80, 0.6);
    }
  `]
})
export class CustomMenuComponent implements AfterContentInit {
  @Input() minWidth = 112;
  @Input() maxWidth = 280;
  @Input() xPosition: 'before' | 'after' = 'after';
  @Input() yPosition: 'above' | 'below' = 'below';
  
  @Output() menuClosed = new EventEmitter<void>();
  @Output() menuOpened = new EventEmitter<void>();
  
  @ViewChild('menuContainer') menuContainer!: ElementRef;
  @ContentChildren(CustomMenuItemComponent) menuItems!: QueryList<CustomMenuItemComponent>;
  
  isOpen = false;
  positionX = 0;
  positionY = 0;
  
  private triggerElement: HTMLElement | null = null;
  
  ngAfterContentInit(): void {
    // Configurar los elementos del menú
    if (this.menuItems) {
      this.menuItems.forEach((item, index) => {
        item.menuClosed.subscribe(() => this.close());
      });
    }
  }
  
  open(triggerElement: HTMLElement): void {
    if (this.isOpen) return;

    console.log('Opening menu with trigger element:', triggerElement);

    this.triggerElement = triggerElement;
    this.calculatePosition();
    this.isOpen = true;
    this.menuOpened.emit();

    console.log('Menu opened. Position:', { x: this.positionX, y: this.positionY, isOpen: this.isOpen });

    // Enfocar el primer elemento del menú
    setTimeout(() => {
      if (this.menuItems && this.menuItems.first) {
        this.menuItems.first.focus();
      }
    }, 100);
  }
  
  close(): void {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    this.menuClosed.emit();
    
    // Devolver el foco al elemento que abrió el menú
    if (this.triggerElement) {
      this.triggerElement.focus();
    }
  }
  
  private calculatePosition(): void {
    if (!this.triggerElement) return;

    const triggerRect = this.triggerElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    // Responsive width calculation - prevent horizontal overflow
    const viewportPadding = 16; // Minimum padding from viewport edges
    const maxAvailableWidth = viewportWidth - (viewportPadding * 2);

    // Dynamic width based on viewport and trigger position
    let calculatedWidth: number;

    if (viewportWidth <= 480) {
      // Mobile: Use most of the screen width
      calculatedWidth = Math.min(maxAvailableWidth, 280);
    } else if (viewportWidth <= 768) {
      // Tablet: Moderate width
      calculatedWidth = Math.min(maxAvailableWidth, 320);
    } else {
      // Desktop: Standard width but respect viewport limits
      calculatedWidth = Math.min(maxAvailableWidth, Math.max(this.minWidth, 320));
    }

    // Update component width dynamically
    this.maxWidth = calculatedWidth;

    const menuHeight = 400; // Estimated menu height

    // Smart X positioning - prevent horizontal overflow
    let calculatedX: number;

    if (this.xPosition === 'before') {
      // Try to position before (to the left)
      calculatedX = triggerRect.right - calculatedWidth;

      // If it goes off the left edge, position after instead
      if (calculatedX < viewportPadding) {
        calculatedX = triggerRect.left;

        // If positioning after also causes overflow, center on trigger
        if (calculatedX + calculatedWidth > viewportWidth - viewportPadding) {
          calculatedX = triggerRect.left + (triggerRect.width / 2) - (calculatedWidth / 2);
        }
      }
    } else {
      // Try to position after (to the right)
      calculatedX = triggerRect.left;

      // If it goes off the right edge, position before instead
      if (calculatedX + calculatedWidth > viewportWidth - viewportPadding) {
        calculatedX = triggerRect.right - calculatedWidth;

        // If positioning before also causes overflow, center on trigger
        if (calculatedX < viewportPadding) {
          calculatedX = triggerRect.left + (triggerRect.width / 2) - (calculatedWidth / 2);
        }
      }
    }

    // Final X position bounds check
    calculatedX = Math.max(viewportPadding, Math.min(calculatedX, viewportWidth - calculatedWidth - viewportPadding));

    // Y positioning with overflow prevention
    let calculatedY: number;

    if (this.yPosition === 'above') {
      calculatedY = triggerRect.top - menuHeight - 8;

      // If it goes above viewport, position below instead
      if (calculatedY < viewportPadding) {
        calculatedY = triggerRect.bottom + 8;
      }
    } else {
      calculatedY = triggerRect.bottom + 8;

      // If it goes below viewport, position above instead
      if (calculatedY + menuHeight > viewportHeight - viewportPadding) {
        calculatedY = triggerRect.top - menuHeight - 8;

        // If positioning above also causes overflow, position at top of viewport
        if (calculatedY < viewportPadding) {
          calculatedY = viewportPadding;
        }
      }
    }

    // Final Y position bounds check
    calculatedY = Math.max(viewportPadding, Math.min(calculatedY, viewportHeight - menuHeight - viewportPadding));

    // Set final positions
    this.positionX = calculatedX;
    this.positionY = calculatedY;

    console.log('Smart menu position calculated:', {
      triggerRect,
      viewportWidth,
      viewportHeight,
      calculatedWidth,
      positionX: this.positionX,
      positionY: this.positionY,
      maxWidth: this.maxWidth
    });
  }
  
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (this.isOpen && this.menuContainer && !this.menuContainer.nativeElement.contains(event.target)) {
      // Verificar si el clic fue en el elemento trigger
      if (this.triggerElement && !this.triggerElement.contains(event.target as Node)) {
        this.close();
      }
    }
  }
  
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen) {
      this.close();
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.isOpen) {
      // Recalculate position on window resize to prevent overflow
      setTimeout(() => {
        this.calculatePosition();
      }, 100);
    }
  }
}
