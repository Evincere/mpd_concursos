import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface CustomNotificationConfig {
  message: string;
  title?: string;
  type: NotificationType;
  duration?: number;
  action?: string;
  horizontalPosition?: 'start' | 'center' | 'end';
  verticalPosition?: 'top' | 'bottom';
  data?: any;
}

@Component({
  selector: 'app-custom-notification',
  standalone: true,
  imports: [CommonModule, CustomButtonComponent],
  template: `
    <div class="notification-container" [ngClass]="type">
      <div class="notification-icon">
        <i class="fas" [ngClass]="getIconClass()"></i>
      </div>
      <div class="notification-content">
        <div class="notification-header" *ngIf="title">
          <h4>{{ title }}</h4>
        </div>
        <div class="notification-message">
          {{ message }}
        </div>
      </div>
      <div class="notification-actions">
        <app-custom-button
          [variant]="'text'"
          [label]="action"
          [color]="getButtonColor()"
          (buttonClick)="dismiss()"
        ></app-custom-button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: fixed;
      z-index: 1000;
      max-width: 500px;
      min-width: 300px;
      pointer-events: auto;
      box-sizing: border-box;
    }

    :host.top {
      top: 20px;
    }

    :host.bottom {
      bottom: 20px;
    }

    :host.start {
      left: 20px;
    }

    :host.center {
      left: 50%;
      transform: translateX(-50%);
    }

    :host.end {
      right: 20px;
    }

    .notification-container {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      background-color: var(--color-surface, #FFFFFF);
      color: var(--color-text-primary, #333333);
      border-left: 4px solid;
      overflow: hidden;
      position: relative;
    }

    .notification-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 60%);
      z-index: 1;
    }

    .notification-container.success {
      border-left-color: var(--color-success, #4CAF50);
    }

    .notification-container.error {
      border-left-color: var(--color-error, #F44336);
    }

    .notification-container.warning {
      border-left-color: var(--color-warning, #FF9800);
    }

    .notification-container.info {
      border-left-color: var(--color-info, #2196F3);
    }

    .notification-icon {
      flex-shrink: 0;
      margin-right: 16px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .notification-icon i {
      font-size: 20px;
    }

    .success .notification-icon i {
      color: var(--color-success, #4CAF50);
    }

    .error .notification-icon i {
      color: var(--color-error, #F44336);
    }

    .warning .notification-icon i {
      color: var(--color-warning, #FF9800);
    }

    .info .notification-icon i {
      color: var(--color-info, #2196F3);
    }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-header h4 {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
    }

    .notification-message {
      font-size: 14px;
      line-height: 1.5;
      word-break: break-word;
    }

    .notification-actions {
      margin-left: 16px;
      flex-shrink: 0;
    }

    @media (prefers-color-scheme: dark) {
      .notification-container {
        background-color: var(--color-surface-dark, #333333);
        color: var(--color-text-primary-dark, #E0E0E0);
      }
    }
  `],
  animations: [
    trigger('notificationAnimation', [
      state('void', style({
        transform: 'translateY(20px)',
        opacity: 0
      })),
      state('visible', style({
        transform: 'translateY(0)',
        opacity: 1
      })),
      transition('void => visible', animate('200ms cubic-bezier(0, 0, 0.2, 1)')),
      transition('visible => void', animate('150ms cubic-bezier(0.4, 0, 1, 1)'))
    ])
  ]
})
export class CustomNotificationComponent implements OnInit, OnDestroy {
  @Input() message = '';
  @Input() title?: string;
  @Input() type: NotificationType = 'info';
  @Input() duration = 5000;
  @Input() action = 'Cerrar';
  @Input() horizontalPosition: 'start' | 'center' | 'end' = 'end';
  @Input() verticalPosition: 'top' | 'bottom' = 'top';
  @Input() data?: any;

  @Output() dismissed = new EventEmitter<void>();

  @HostBinding('@notificationAnimation') animation = 'visible';
  @HostBinding('class.top') get isTop() { return this.verticalPosition === 'top'; }
  @HostBinding('class.bottom') get isBottom() { return this.verticalPosition === 'bottom'; }
  @HostBinding('class.start') get isStart() { return this.horizontalPosition === 'start'; }
  @HostBinding('class.center') get isCenter() { return this.horizontalPosition === 'center'; }
  @HostBinding('class.end') get isEnd() { return this.horizontalPosition === 'end'; }

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

  dismiss(): void {
    // Si hay un callback de reintento en los datos y la acción es "Reintentar", ejecutarlo
    if (this.data?.retryCallback && this.action === 'Reintentar') {
      try {
        this.data.retryCallback();
      } catch (error) {
        console.error('Error al ejecutar el callback de reintento:', error);
      }
    }

    this.dismissed.emit();
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

  getButtonColor(): 'primary' | 'accent' | 'warn' | 'danger' | 'success' {
    switch (this.type) {
      case 'success': return 'success';
      case 'error': return 'danger';
      case 'warning': return 'warn';
      case 'info': return 'primary';
      default: return 'primary';
    }
  }
}
