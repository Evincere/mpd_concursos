import { Component, Input, Output, EventEmitter, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-menu-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="custom-menu-item" 
      [class.disabled]="disabled"
      [attr.role]="role"
      [attr.aria-disabled]="disabled"
      tabindex="0"
    >
      <i *ngIf="icon" class="fas fa-{{ icon }} menu-item-icon" aria-hidden="true"></i>
      <span class="menu-item-text">
        <ng-content></ng-content>
      </span>
    </div>
  `,
  styles: [`
    /* ===== ENHANCED GLASSMORPHISM MENU ITEM DESIGN SYSTEM ===== */
    /* Consistent with admin dashboard and contest theme #4CAF50 */

    .custom-menu-item {
      display: flex;
      align-items: center;
      padding: 0.875rem 1.25rem;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;
      outline: none;
      border-radius: 8px;
      margin: 0.125rem 0; /* Reduced margin for better spacing */
      position: relative;

      /* Enhanced glassmorphism for better visibility and contrast */
      background: linear-gradient(135deg,
        rgba(71, 85, 105, 0.9) 0%,
        rgba(51, 65, 85, 0.95) 100%);
      background-image:
        linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(76, 175, 80, 0.1) 50%, rgba(255, 255, 255, 0.12) 100%);
      border: 1px solid rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.2),
        0 2px 4px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.15);

      color: #ffffff;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
      min-height: 44px; /* Ensure minimum touch target size */
    }

    .custom-menu-item:hover:not(.disabled) {
      background: linear-gradient(135deg,
        rgba(76, 175, 80, 0.8) 0%,
        rgba(56, 142, 60, 0.9) 100%);
      background-image:
        linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.1) 100%);
      transform: translateY(-2px);
      box-shadow:
        0 8px 20px rgba(0, 0, 0, 0.3),
        0 4px 8px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
      border-color: rgba(76, 175, 80, 0.6);
      color: #ffffff;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
    }

    .custom-menu-item:focus:not(.disabled) {
      background: linear-gradient(135deg,
        rgba(76, 175, 80, 0.7) 0%,
        rgba(56, 142, 60, 0.8) 100%);
      background-image:
        linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.08) 100%);
      box-shadow:
        0 6px 16px rgba(0, 0, 0, 0.25),
        0 2px 6px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.18),
        0 0 0 3px rgba(76, 175, 80, 0.4);
      border-color: rgba(76, 175, 80, 0.8);
      color: #ffffff;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
    }

    .custom-menu-item:active:not(.disabled) {
      transform: translateY(0);
      background: linear-gradient(135deg,
        rgba(56, 142, 60, 0.9) 0%,
        rgba(46, 125, 50, 0.95) 100%);
      box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.25),
        inset 0 1px 0 rgba(255, 255, 255, 0.15),
        inset 0 -1px 0 rgba(0, 0, 0, 0.1);
    }

    .custom-menu-item.disabled {
      color: #94a3b8;
      cursor: not-allowed;
      pointer-events: none;
      opacity: 0.6;
      background: linear-gradient(135deg,
        rgba(71, 85, 105, 0.5) 0%,
        rgba(51, 65, 85, 0.6) 100%);
      background-image: none;
      border-color: rgba(255, 255, 255, 0.1);
      box-shadow:
        0 2px 6px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }

    .menu-item-icon {
      margin-right: 0.875rem;
      font-size: 1.1rem;
      width: 1.1rem;
      text-align: center;
      filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.4));
      flex-shrink: 0;
    }

    .menu-item-text {
      flex: 1;
      font-weight: 600;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
      letter-spacing: 0.025em;
    }

    /* ===== RESPONSIVE DESIGN ===== */

    @media (max-width: 768px) {
      .custom-menu-item {
        padding: 0.875rem 1rem;
        font-size: 0.9rem;
      }

      .menu-item-icon {
        font-size: 1.1rem;
        margin-right: 0.875rem;
      }
    }

    /* ===== ACCESSIBILITY ===== */

    @media (prefers-reduced-motion: reduce) {
      .custom-menu-item {
        transition: none !important;
        transform: none !important;
      }
    }

    @media (prefers-contrast: high) {
      .custom-menu-item {
        border-width: 2px;
        border-color: rgba(255, 255, 255, 0.4);
      }

      .custom-menu-item:focus:not(.disabled) {
        border-color: rgba(76, 175, 80, 0.8);
        box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.8);
      }
    }

    /* Focus states for keyboard navigation */
    .custom-menu-item:focus-visible {
      outline: 2px solid rgba(76, 175, 80, 0.8);
      outline-offset: 2px;
    }
  `]
})
export class CustomMenuItemComponent {
  @Input() icon = '';
  @Input() disabled = false;
  @Input() role = 'menuitem';
  
  @Output() menuClosed = new EventEmitter<void>();
  @Output() itemSelected = new EventEmitter<void>();
  
  constructor(private elementRef: ElementRef) {}
  
  @HostListener('click')
  onClick(): void {
    if (!this.disabled) {
      this.itemSelected.emit();
      this.menuClosed.emit();
    }
  }
  
  @HostListener('keydown.enter')
  @HostListener('keydown.space', ['$event'])
  onKeyPress(event?: KeyboardEvent): void {
    if (event) {
      event.preventDefault();
    }
    
    if (!this.disabled) {
      this.itemSelected.emit();
      this.menuClosed.emit();
    }
  }
  
  focus(): void {
    this.elementRef.nativeElement.querySelector('.custom-menu-item').focus();
  }
}
