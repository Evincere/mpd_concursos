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
    .custom-menu-container {
      position: absolute;
      /* Glassmorphism design system - consistent with notifications and other components */
      background: transparent; /* Let child components handle their own backgrounds */
      border-radius: 8px;
      z-index: 1000;
      overflow: visible; /* Allow child shadows to show */
      display: none;
      padding: 0; /* Remove padding to let child components control spacing */
      transform-origin: top left;
      animation: menuFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .custom-menu-container.open {
      display: block;
    }

    .menu-content {
      max-height: 400px; /* Increased for better notification viewing */
      overflow-y: auto;
      background: transparent; /* Inherit from child components */
    }

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

    /* Custom scrollbar for menu content */
    .menu-content::-webkit-scrollbar {
      width: 6px;
    }

    .menu-content::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 3px;
    }

    .menu-content::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
    }

    .menu-content::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.3);
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
    
    this.triggerElement = triggerElement;
    this.calculatePosition();
    this.isOpen = true;
    this.menuOpened.emit();
    
    // Enfocar el primer elemento del menú
    setTimeout(() => {
      if (this.menuItems && this.menuItems.first) {
        this.menuItems.first.focus();
      }
    });
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
    
    // Calcular posición X
    if (this.xPosition === 'before') {
      this.positionX = triggerRect.left - this.minWidth + triggerRect.width;
    } else {
      this.positionX = triggerRect.left;
    }
    
    // Calcular posición Y
    if (this.yPosition === 'above') {
      this.positionY = triggerRect.top - 40; // Altura aproximada del menú
    } else {
      this.positionY = triggerRect.bottom + 8;
    }
    
    // Ajustar si se sale de la pantalla
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (this.positionX + this.minWidth > viewportWidth) {
      this.positionX = viewportWidth - this.minWidth - 16;
    }
    
    if (this.positionY + 100 > viewportHeight) { // 100 es una altura aproximada mínima
      this.positionY = triggerRect.top - 100 - 8;
    }
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
