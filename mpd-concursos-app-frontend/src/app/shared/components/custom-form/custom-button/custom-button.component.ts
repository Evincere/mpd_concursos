import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="custom-button"
      [class.primary]="color === 'primary'"
      [class.accent]="color === 'accent'"
      [class.warn]="color === 'warn'"
      [class.success]="color === 'success'"
      [class.danger]="color === 'danger'"
      [class.flat]="variant === 'flat'"
      [class.stroked]="variant === 'stroked'"
      [class.icon]="variant === 'icon'"
      [class.primary]="variant === 'primary'"
      [class.warn]="variant === 'warn'"
      [class.small]="size === 'small'"
      [class.medium]="size === 'medium'"
      [class.large]="size === 'large'"
      [class.loading]="loading"
      [disabled]="disabled || loading"
      [type]="type"
      [title]="tooltip"
      [attr.aria-label]="label || tooltip"
      [attr.aria-disabled]="disabled || loading"
      [attr.aria-busy]="loading"
      (click)="onClick($event)"
      (keydown.enter)="handleKeyboardEvent($event, 'enter')"
      (keydown.space)="handleKeyboardEvent($event, 'space')"
    >
      <div *ngIf="loading" class="spinner" aria-hidden="true"></div>
      <i *ngIf="icon && !loading" class="fas fa-{{ icon }} button-icon" aria-hidden="true"></i>
      <span *ngIf="label && variant !== 'icon'" class="button-label">{{ label }}</span>
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    .custom-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      position: relative;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: none;
      outline: none;
      min-height: 44px;
      gap: 0.5rem;

      /* Base glassmorphism styling */
      background: linear-gradient(135deg,
        rgba(55, 65, 81, 0.8) 0%,
        rgba(75, 85, 99, 0.9) 100%);
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.15),
        0 2px 4px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      color: #f9fafb;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .custom-button:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow:
        0 6px 16px rgba(0, 0, 0, 0.2),
        0 3px 6px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
    }

    /* Variantes */
    .custom-button.flat {
      /* Default glassmorphism styling already applied */
    }

    .custom-button.stroked {
      background: rgba(55, 65, 81, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.4);
      color: #f9fafb;
    }

    .custom-button.stroked:hover:not(:disabled) {
      background: rgba(55, 65, 81, 0.6);
      border-color: rgba(255, 255, 255, 0.5);
    }

    .custom-button.icon {
      padding: 0.75rem;
      min-width: 44px;
      border-radius: 8px;
    }

    .custom-button.text {
      background: transparent;
      border: none;
      box-shadow: none;
      padding: 0.5rem 0.75rem;
      backdrop-filter: none;
    }

    .custom-button.text:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
      box-shadow: none;
    }

    /* Colores con glassmorphism */
    .custom-button.primary {
      background: linear-gradient(135deg,
        rgba(59, 130, 246, 0.8) 0%,
        rgba(37, 99, 235, 0.9) 100%);
      border-color: rgba(59, 130, 246, 0.4);
      color: #ffffff;
    }

    .custom-button.primary:hover:not(:disabled) {
      background: linear-gradient(135deg,
        rgba(59, 130, 246, 0.9) 0%,
        rgba(37, 99, 235, 1) 100%);
      border-color: rgba(59, 130, 246, 0.6);
      box-shadow:
        0 6px 16px rgba(59, 130, 246, 0.3),
        0 3px 6px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    .custom-button.primary.stroked {
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.5);
      color: #3b82f6;
    }

    .custom-button.primary.stroked:hover:not(:disabled) {
      background: rgba(59, 130, 246, 0.2);
      border-color: rgba(59, 130, 246, 0.7);
      color: #ffffff;
    }

    .custom-button.accent {
      background: linear-gradient(135deg,
        rgba(236, 72, 153, 0.8) 0%,
        rgba(219, 39, 119, 0.9) 100%);
      border-color: rgba(236, 72, 153, 0.4);
      color: #ffffff;
    }

    .custom-button.accent:hover:not(:disabled) {
      background: linear-gradient(135deg,
        rgba(236, 72, 153, 0.9) 0%,
        rgba(219, 39, 119, 1) 100%);
      border-color: rgba(236, 72, 153, 0.6);
      box-shadow:
        0 6px 16px rgba(236, 72, 153, 0.3),
        0 3px 6px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    .custom-button.accent.stroked {
      background: rgba(236, 72, 153, 0.1);
      border: 1px solid rgba(236, 72, 153, 0.5);
      color: #ec4899;
    }

    .custom-button.accent.stroked:hover:not(:disabled) {
      background: rgba(236, 72, 153, 0.2);
      border-color: rgba(236, 72, 153, 0.7);
      color: #ffffff;
    }

    .custom-button.warn {
      background: linear-gradient(135deg,
        rgba(245, 158, 11, 0.8) 0%,
        rgba(217, 119, 6, 0.9) 100%);
      border-color: rgba(245, 158, 11, 0.4);
      color: #ffffff;
    }

    .custom-button.warn:hover:not(:disabled) {
      background: linear-gradient(135deg,
        rgba(245, 158, 11, 0.9) 0%,
        rgba(217, 119, 6, 1) 100%);
      border-color: rgba(245, 158, 11, 0.6);
      box-shadow:
        0 6px 16px rgba(245, 158, 11, 0.3),
        0 3px 6px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    .custom-button.warn.stroked {
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.5);
      color: #f59e0b;
    }

    .custom-button.warn.stroked:hover:not(:disabled) {
      background: rgba(245, 158, 11, 0.2);
      border-color: rgba(245, 158, 11, 0.7);
      color: #ffffff;
    }

    .custom-button.success {
      background: linear-gradient(135deg,
        rgba(76, 175, 80, 0.8) 0%,
        rgba(56, 142, 60, 0.9) 100%);
      border-color: rgba(76, 175, 80, 0.4);
      color: #ffffff;
    }

    .custom-button.success:hover:not(:disabled) {
      background: linear-gradient(135deg,
        rgba(76, 175, 80, 0.9) 0%,
        rgba(56, 142, 60, 1) 100%);
      border-color: rgba(76, 175, 80, 0.6);
      box-shadow:
        0 6px 16px rgba(76, 175, 80, 0.3),
        0 3px 6px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    .custom-button.success.stroked {
      background: rgba(76, 175, 80, 0.1);
      border: 1px solid rgba(76, 175, 80, 0.5);
      color: #4caf50;
    }

    .custom-button.success.stroked:hover:not(:disabled) {
      background: rgba(76, 175, 80, 0.2);
      border-color: rgba(76, 175, 80, 0.7);
      color: #ffffff;
    }

    .custom-button.danger {
      background: linear-gradient(135deg,
        rgba(244, 67, 54, 0.8) 0%,
        rgba(211, 47, 47, 0.9) 100%);
      border-color: rgba(244, 67, 54, 0.4);
      color: #ffffff;
    }

    .custom-button.danger:hover:not(:disabled) {
      background: linear-gradient(135deg,
        rgba(244, 67, 54, 0.9) 0%,
        rgba(211, 47, 47, 1) 100%);
      border-color: rgba(244, 67, 54, 0.6);
      box-shadow:
        0 6px 16px rgba(244, 67, 54, 0.3),
        0 3px 6px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    .custom-button.danger.stroked {
      background: rgba(244, 67, 54, 0.1);
      border: 1px solid rgba(244, 67, 54, 0.5);
      color: #f44336;
    }

    .custom-button.danger.stroked:hover:not(:disabled) {
      background: rgba(244, 67, 54, 0.2);
      border-color: rgba(244, 67, 54, 0.7);
      color: #ffffff;
    }

    /* Estados */
    .custom-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      box-shadow: none;
    }

    .custom-button:active:not(:disabled) {
      transform: translateY(1px);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .custom-button.loading {
      cursor: wait;
    }

    /* Spinner */
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Tamaños */
    .custom-button.small {
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      min-height: 28px;
    }

    .custom-button.small.icon {
      padding: 0.25rem;
      min-width: 28px;
    }

    .custom-button.medium {
      padding: 0.5rem 1.25rem;
      font-size: 0.875rem;
      min-height: 36px;
    }

    .custom-button.medium.icon {
      padding: 0.5rem;
      min-width: 36px;
    }

    .custom-button.large {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      min-height: 44px;
    }

    .custom-button.large.icon {
      padding: 0.75rem;
      min-width: 44px;
    }

    /* Iconos */
    .button-icon {
      font-size: 1rem;
    }

    /* Tema oscuro - Comentado para permitir que los estilos glassmorphism tomen precedencia */
    /*
    @media (prefers-color-scheme: dark) {
      .custom-button.primary {
        background-color: var(--color-primary-dark, #7986cb);
      }

      .custom-button.primary:hover:not(:disabled) {
        background-color: var(--color-primary, #3f51b5);
      }

      .custom-button.primary.stroked {
        color: var(--color-primary-dark, #7986cb);
        border-color: var(--color-primary-dark, #7986cb);
      }

      .custom-button.accent {
        background-color: var(--color-accent-dark, #ff80ab);
      }

      .custom-button.accent:hover:not(:disabled) {
        background-color: var(--color-accent, #ff4081);
      }

      .custom-button.accent.stroked {
        color: var(--color-accent-dark, #ff80ab);
        border-color: var(--color-accent-dark, #ff80ab);
      }

      .custom-button.warn {
        background-color: var(--color-warn-dark, #ef5350);
      }

      .custom-button.warn:hover:not(:disabled) {
        background-color: var(--color-warn, #f44336);
      }

      .custom-button.warn.stroked {
        color: var(--color-warn-dark, #ef5350);
        border-color: var(--color-warn-dark, #ef5350);
      }

      .custom-button.success {
        background-color: var(--color-success-dark, #66bb6a);
      }

      .custom-button.success:hover:not(:disabled) {
        background-color: var(--color-success, #4caf50);
      }

      .custom-button.success.stroked {
        color: var(--color-success-dark, #66bb6a);
        border-color: var(--color-success-dark, #66bb6a);
      }

      .custom-button.danger {
        background-color: var(--color-danger-dark, #ef5350);
      }

      .custom-button.danger:hover:not(:disabled) {
        background-color: var(--color-danger, #f44336);
      }

      .custom-button.danger.stroked {
        color: var(--color-danger-dark, #ef5350);
        border-color: var(--color-danger-dark, #ef5350);
      }
    }
    */
  `]
})
export class CustomButtonComponent {
  @Input() label = '';
  @Input() icon = '';
  @Input() color: 'primary' | 'accent' | 'warn' | 'success' | 'danger' = 'primary';
  @Input() variant: 'flat' | 'stroked' | 'icon' | 'text' | 'primary' | 'warn' = 'flat';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() tooltip = '';

  @Output() buttonClick = new EventEmitter<MouseEvent>();

  onClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.buttonClick.emit(event);
    }
  }

  handleKeyboardEvent(event: Event, _key: 'enter' | 'space'): void {
    // Convertir a KeyboardEvent para poder usar preventDefault
    (event as KeyboardEvent).preventDefault();

    if (!this.disabled && !this.loading) {
      // Crear un evento de mouse sintético
      const mouseEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });

      this.buttonClick.emit(mouseEvent);
    }
  }
}
