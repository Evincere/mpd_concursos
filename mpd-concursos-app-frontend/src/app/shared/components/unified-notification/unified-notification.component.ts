import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostBinding, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, animate, transition } from '@angular/animations';

export type UnifiedNotificationType = 'success' | 'error' | 'warning' | 'info';

export interface UnifiedNotificationConfig {
  message: string;
  title?: string;
  type: UnifiedNotificationType;
  duration?: number;
  dismissible?: boolean;
  position?: 'top-start' | 'top-center' | 'top-end' | 'bottom-start' | 'bottom-center' | 'bottom-end';
  showIcon?: boolean;
  actionText?: string;
  onAction?: () => void;
  data?: any;
}

@Component({
  selector: 'app-unified-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container" 
         [ngClass]="[type, position]"
         [@slideInOut]="animationState"
         role="alert"
         [attr.aria-live]="type === 'error' ? 'assertive' : 'polite'"
         [attr.aria-atomic]="true">
      
      <!-- Icono -->
      <div class="notification-icon" *ngIf="showIcon">
        <i class="fas" [ngClass]="getIconClass()" aria-hidden="true"></i>
      </div>
      
      <!-- Contenido -->
      <div class="notification-content">
        <div class="notification-header" *ngIf="title">
          <h4>{{ title }}</h4>
        </div>
        <div class="notification-message">
          {{ message }}
        </div>
      </div>
      
      <!-- Acciones -->
      <div class="notification-actions">
        <!-- Botón de acción personalizada -->
        <button 
          *ngIf="actionText && onAction"
          class="action-button"
          (click)="handleAction()"
          [attr.aria-label]="actionText"
          type="button">
          {{ actionText }}
        </button>
        
        <!-- Botón de cerrar -->
        <button 
          *ngIf="dismissible"
          class="close-button"
          (click)="dismiss()"
          [attr.aria-label]="'Cerrar notificación'"
          type="button">
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: fixed;
      z-index: 10000;
      max-width: 500px;
      min-width: 320px;
      pointer-events: auto;
      box-sizing: border-box;
      margin: 1rem;
    }

    /* Posicionamiento */
    :host.top-start { top: 0; left: 0; }
    :host.top-center { top: 0; left: 50%; transform: translateX(-50%); }
    :host.top-end { top: 0; right: 0; }
    :host.bottom-start { bottom: 0; left: 0; }
    :host.bottom-center { bottom: 0; left: 50%; transform: translateX(-50%); }
    :host.bottom-end { bottom: 0; right: 0; }

    .notification-container {
      display: flex;
      align-items: flex-start;
      padding: 1rem;
      border-radius: 8px;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.3),
        0 4px 16px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      position: relative;
      overflow: hidden;
      gap: 0.75rem;
    }

    /* Glassmorphism overlay */
    .notification-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      pointer-events: none;
      z-index: 1;
    }

    /* Contenido por encima del overlay */
    .notification-icon,
    .notification-content,
    .notification-actions {
      position: relative;
      z-index: 2;
    }

    /* Tipos de notificación */
    .notification-container.success {
      background: linear-gradient(135deg, rgba(76, 175, 80, 0.9) 0%, rgba(56, 142, 60, 0.8) 100%);
      border-left: 4px solid #4CAF50;
      color: #ffffff;
    }

    .notification-container.error {
      background: linear-gradient(135deg, rgba(244, 67, 54, 0.9) 0%, rgba(211, 47, 47, 0.8) 100%);
      border-left: 4px solid #F44336;
      color: #ffffff;
    }

    .notification-container.warning {
      background: linear-gradient(135deg, rgba(255, 152, 0, 0.9) 0%, rgba(245, 124, 0, 0.8) 100%);
      border-left: 4px solid #FF9800;
      color: #ffffff;
    }

    .notification-container.info {
      background: linear-gradient(135deg, rgba(33, 150, 243, 0.9) 0%, rgba(25, 118, 210, 0.8) 100%);
      border-left: 4px solid #2196F3;
      color: #ffffff;
    }

    /* Icono */
    .notification-icon {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .notification-icon i {
      font-size: 1.25rem;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
    }

    /* Contenido */
    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-header h4 {
      margin: 0 0 0.25rem 0;
      font-size: 1rem;
      font-weight: 600;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .notification-message {
      font-size: 0.875rem;
      line-height: 1.5;
      word-break: break-word;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    /* Acciones */
    .notification-actions {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .action-button,
    .close-button {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 4px;
      color: #ffffff;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
    }

    .action-button {
      padding: 0.5rem 0.75rem;
    }

    .close-button {
      padding: 0.5rem;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .action-button:hover,
    .close-button:hover {
      background: rgba(255, 255, 255, 0.3);
      border-color: rgba(255, 255, 255, 0.5);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .action-button:active,
    .close-button:active {
      transform: translateY(0);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    }

    .close-button i {
      font-size: 0.875rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
      :host {
        max-width: calc(100vw - 2rem);
        min-width: calc(100vw - 2rem);
      }

      .notification-container {
        padding: 0.875rem;
      }

      .notification-header h4 {
        font-size: 0.9rem;
      }

      .notification-message {
        font-size: 0.8rem;
      }
    }
  `],
  animations: [
    trigger('slideInOut', [
      state('void', style({
        transform: 'translateY(-100%) scale(0.95)',
        opacity: 0
      })),
      state('visible', style({
        transform: 'translateY(0) scale(1)',
        opacity: 1
      })),
      transition('void => visible', animate('300ms cubic-bezier(0.34, 1.56, 0.64, 1)')),
      transition('visible => void', animate('200ms cubic-bezier(0.4, 0, 1, 1)'))
    ])
  ]
})
export class UnifiedNotificationComponent implements OnInit, OnDestroy {
  @Input() message = '';
  @Input() title?: string;
  @Input() type: UnifiedNotificationType = 'info';
  @Input() duration = 0;
  @Input() dismissible = true;
  @Input() position: 'top-start' | 'top-center' | 'top-end' | 'bottom-start' | 'bottom-center' | 'bottom-end' = 'top-end';
  @Input() showIcon = true;
  @Input() actionText?: string;
  @Input() onAction?: () => void;
  @Input() data?: any;

  @Output() dismissed = new EventEmitter<void>();

  @HostBinding('@slideInOut') animationState = 'visible';
  @HostBinding('class') get hostClasses() { return this.position; }

  private timeoutId?: number;

  ngOnInit(): void {
    if (this.duration > 0) {
      this.timeoutId = window.setTimeout(() => {
        this.dismiss();
      }, this.duration);
    }
  }

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  @HostListener('keydown.escape')
  onEscapeKey(): void {
    if (this.dismissible) {
      this.dismiss();
    }
  }

  dismiss(): void {
    this.dismissed.emit();
  }

  handleAction(): void {
    if (this.onAction) {
      try {
        this.onAction();
      } catch (error) {
        console.error('Error al ejecutar la acción de la notificación:', error);
      }
    }
  }

  getIconClass(): string {
    switch (this.type) {
      case 'success': return 'fa-check-circle';
      case 'error': return 'fa-times-circle';
      case 'warning': return 'fa-exclamation-triangle';
      case 'info': return 'fa-info-circle';
      default: return 'fa-info-circle';
    }
  }
}
