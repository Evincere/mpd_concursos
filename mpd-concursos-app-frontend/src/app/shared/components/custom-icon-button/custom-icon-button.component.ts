import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-icon-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="custom-icon-button"
      [class]="variant"
      [disabled]="disabled"
      [attr.aria-label]="ariaLabel"
      [attr.title]="tooltip"
      (click)="onClick()"
      (keydown.enter)="onClick()"
      (keydown.space)="onClick(); $event.preventDefault()">
      <i [class]="'fas fa-' + icon" aria-hidden="true"></i>
    </button>
  `,
  styleUrls: ['./custom-icon-button.component.scss']
})
export class CustomIconButtonComponent {
  @Input() icon = 'times';
  @Input() variant: 'primary' | 'secondary' | 'danger' | 'ghost' = 'ghost';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() disabled = false;
  @Input() ariaLabel = '';
  @Input() tooltip = '';
  
  @Output() buttonClick = new EventEmitter<void>();

  onClick(): void {
    if (!this.disabled) {
      this.buttonClick.emit();
    }
  }
}
