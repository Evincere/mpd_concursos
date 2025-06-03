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
      position: fixed; /* Changed from absolute to fixed for better positioning */
      z-index: 9999; /* Increased z-index to ensure it's above everything */
      display: none;
      transform-origin: top left;
      animation: menuFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      /* Enhanced glassmorphism for better visibility */
      background: linear-gradient(135deg,
        rgba(30, 41, 59, 0.95) 0%,
        rgba(51, 65, 85, 0.98) 100%);
      background-image:
        linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(76, 175, 80, 0.15) 30%, rgba(255, 255, 255, 0.18) 70%, rgba(76, 175, 80, 0.12) 100%);
      border: 2px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 12px;
      padding: 0.75rem;
      box-shadow:
        0 20px 40px rgba(0, 0, 0, 0.4),
        0 8px 16px rgba(0, 0, 0, 0.2),
        inset 0 2px 0 rgba(255, 255, 255, 0.25),
        inset 0 -2px 0 rgba(0, 0, 0, 0.15);
      overflow: visible; /* Allow child shadows to show */
      min-width: 180px; /* Ensure minimum width for readability */
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

    /* ===== ENHANCED GLASSMORPHISM SCROLLBAR ===== */

    .menu-content::-webkit-scrollbar {
      width: 6px;
    }

    .menu-content::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 3px;
    }

    .menu-content::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, rgba(76, 175, 80, 0.6) 0%, rgba(76, 175, 80, 0.8) 100%);
      border-radius: 3px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .menu-content::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(135deg, rgba(76, 175, 80, 0.8) 0%, rgba(76, 175, 80, 1) 100%);
    }

    /* ===== RESPONSIVE DESIGN ===== */

    @media (max-width: 768px) {
      .custom-menu-container {
        padding: 0.375rem;
        border-radius: 6px;
      }

      .menu-content {
        max-height: 300px;
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
    const menuWidth = Math.max(this.minWidth, 180); // Ensure minimum width
    const menuHeight = 200; // Estimated menu height

    // Calcular posición X
    if (this.xPosition === 'before') {
      this.positionX = triggerRect.right - menuWidth;
    } else {
      this.positionX = triggerRect.left;
    }

    // Calcular posición Y
    if (this.yPosition === 'above') {
      this.positionY = triggerRect.top - menuHeight - 8;
    } else {
      this.positionY = triggerRect.bottom + 8;
    }

    // Ajustar si se sale de la pantalla
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    // Ajustar posición X
    if (this.positionX + menuWidth > viewportWidth) {
      this.positionX = triggerRect.right - menuWidth;
    }
    if (this.positionX < 0) {
      this.positionX = 8;
    }

    // Ajustar posición Y
    if (this.positionY + menuHeight > viewportHeight) {
      this.positionY = triggerRect.top - menuHeight - 8;
    }
    if (this.positionY < 0) {
      this.positionY = triggerRect.bottom + 8;
    }

    console.log('Menu position calculated:', {
      triggerRect,
      positionX: this.positionX,
      positionY: this.positionY,
      viewportWidth,
      viewportHeight
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
}
