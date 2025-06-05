import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      *ngIf="!href; else linkTemplate"
      class="custom-button"
      [class]="variant"
      [class.icon-only]="iconOnly"
      [class.loading]="loading"
      [disabled]="disabled || loading"
      [attr.aria-label]="ariaLabel || label"
      [attr.title]="tooltip"
      (click)="onClick()"
      (keydown.enter)="onClick()"
      (keydown.space)="onClick(); $event.preventDefault()">
      <i *ngIf="icon && !loading" [class]="'fas fa-' + icon" class="button-icon" aria-hidden="true"></i>
      <i *ngIf="loading" class="fas fa-spinner fa-spin button-icon" aria-hidden="true"></i>
      <span *ngIf="label && !iconOnly" class="button-label">{{ label }}</span>
    </button>

    <ng-template #linkTemplate>
      <a
        class="custom-button"
        [class]="variant"
        [class.icon-only]="iconOnly"
        [href]="href"
        [target]="target"
        [attr.aria-label]="ariaLabel || label"
        [attr.title]="tooltip">
        <i *ngIf="icon" [class]="'fas fa-' + icon" class="button-icon" aria-hidden="true"></i>
        <span *ngIf="label && !iconOnly" class="button-label">{{ label }}</span>
      </a>
    </ng-template>
  `,
  styleUrls: ['./custom-button.component.scss']
})
export class CustomButtonComponent {
  @Input() label = '';
  @Input() icon = '';
  @Input() variant: 'primary' | 'secondary' | 'stroked' | 'danger' | 'ghost' | 'success' | 'warning' | 'download' | 'navigation' = 'primary';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() ariaLabel = '';
  @Input() tooltip = '';
  @Input() href = '';
  @Input() target = '';
  @Input() iconOnly = false; // Para botones que solo tienen icono

  @Output() buttonClick = new EventEmitter<void>();

  onClick(): void {
    if (!this.disabled && !this.loading) {
      this.buttonClick.emit();
    }
  }
}
