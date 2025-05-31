import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="custom-spinner" 
      [class.small]="size === 'small'"
      [class.medium]="size === 'medium'"
      [class.large]="size === 'large'"
      [class.primary]="color === 'primary'"
      [class.accent]="color === 'accent'"
      [class.warn]="color === 'warn'"
      [class.success]="color === 'success'"
      [class.danger]="color === 'danger'"
      [attr.aria-label]="'Cargando'"
      role="progressbar"
    >
      <div class="spinner-inner"></div>
    </div>
  `,
  styles: [`
    .custom-spinner {
      display: inline-block;
      position: relative;
      width: 40px;
      height: 40px;
    }

    .spinner-inner {
      box-sizing: border-box;
      display: block;
      position: absolute;
      width: 100%;
      height: 100%;
      border: 4px solid transparent;
      border-radius: 50%;
      animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
      border-color: var(--color-primary, #3f51b5) transparent transparent transparent;
    }

    /* Tamaños */
    .custom-spinner.small {
      width: 24px;
      height: 24px;
    }

    .custom-spinner.small .spinner-inner {
      border-width: 3px;
    }

    .custom-spinner.medium {
      width: 40px;
      height: 40px;
    }

    .custom-spinner.medium .spinner-inner {
      border-width: 4px;
    }

    .custom-spinner.large {
      width: 64px;
      height: 64px;
    }

    .custom-spinner.large .spinner-inner {
      border-width: 5px;
    }

    /* Colores */
    .custom-spinner.primary .spinner-inner {
      border-color: var(--color-primary, #3f51b5) transparent transparent transparent;
    }

    .custom-spinner.accent .spinner-inner {
      border-color: var(--color-accent, #ff4081) transparent transparent transparent;
    }

    .custom-spinner.warn .spinner-inner {
      border-color: var(--color-warn, #f44336) transparent transparent transparent;
    }

    .custom-spinner.success .spinner-inner {
      border-color: var(--color-success, #4caf50) transparent transparent transparent;
    }

    .custom-spinner.danger .spinner-inner {
      border-color: var(--color-danger, #f44336) transparent transparent transparent;
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  `]
})
export class CustomSpinnerComponent {
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() color: 'primary' | 'accent' | 'warn' | 'success' | 'danger' = 'primary';
}
