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
    .custom-menu-item {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      font-size: 14px;
      cursor: pointer;
      transition: background-color 0.2s;
      user-select: none;
      outline: none;
      color: var(--color-text-primary, #333);
    }
    
    .custom-menu-item:hover:not(.disabled),
    .custom-menu-item:focus:not(.disabled) {
      background-color: var(--color-hover, rgba(0, 0, 0, 0.04));
    }
    
    .custom-menu-item.disabled {
      color: var(--color-text-disabled, #999);
      cursor: default;
      pointer-events: none;
    }
    
    .menu-item-icon {
      margin-right: 8px;
      font-size: 16px;
      width: 16px;
      text-align: center;
    }
    
    /* Tema oscuro */
    @media (prefers-color-scheme: dark) {
      .custom-menu-item {
        color: var(--color-text-primary-dark, #eee);
      }
      
      .custom-menu-item:hover:not(.disabled),
      .custom-menu-item:focus:not(.disabled) {
        background-color: var(--color-hover-dark, rgba(255, 255, 255, 0.08));
      }
      
      .custom-menu-item.disabled {
        color: var(--color-text-disabled-dark, #777);
      }
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
