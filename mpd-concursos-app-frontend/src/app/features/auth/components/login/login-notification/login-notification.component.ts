import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface LoginNotification {
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  suggestions?: string[];
  autoHide?: boolean;
  hideDelay?: number;
}

@Component({
  selector: 'app-login-notification',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div 
      class="login-notification-overlay" 
      *ngIf="visible"
      [@slideInOut]="visible ? 'in' : 'out'"
      [ngClass]="'notification-' + notification.type">
      
      <div class="notification-content">
        <div class="notification-header">
          <div class="notification-icon">
            <i class="material-icons">{{ getIcon() }}</i>
          </div>
          <h4 class="notification-title">{{ notification.title }}</h4>
          <button 
            class="close-button" 
            (click)="onClose()"
            aria-label="Cerrar notificación">
            <i class="material-icons">close</i>
          </button>
        </div>
        
        <div class="notification-body">
          <p class="notification-message">{{ notification.message }}</p>
          
          <div class="notification-suggestions" *ngIf="notification.suggestions && notification.suggestions.length > 0">
            <ul>
              <li *ngFor="let suggestion of notification.suggestions">{{ suggestion }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./login-notification.component.scss'],
  animations: [
    trigger('slideInOut', [
      state('in', style({
        transform: 'translateY(0)',
        opacity: 1
      })),
      state('out', style({
        transform: 'translateY(-100%)',
        opacity: 0
      })),
      transition('out => in', [
        style({
          transform: 'translateY(-100%)',
          opacity: 0
        }),
        animate('300ms ease-out', style({
          transform: 'translateY(0)',
          opacity: 1
        }))
      ]),
      transition('in => out', [
        animate('250ms ease-in', style({
          transform: 'translateY(-100%)',
          opacity: 0
        }))
      ])
    ])
  ]
})
export class LoginNotificationComponent implements OnInit, OnDestroy {
  @Input() notification!: LoginNotification;
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();

  private autoHideTimer?: number;

  ngOnInit(): void {
    if (this.notification?.autoHide !== false && this.visible) {
      this.startAutoHideTimer();
    }
  }

  ngOnDestroy(): void {
    this.clearAutoHideTimer();
  }

  onClose(): void {
    this.clearAutoHideTimer();
    this.close.emit();
  }

  getIcon(): string {
    switch (this.notification?.type) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'success':
        return 'check_circle';
      default:
        return 'info';
    }
  }

  private startAutoHideTimer(): void {
    const delay = this.notification?.hideDelay || 8000; // 8 segundos por defecto
    this.autoHideTimer = window.setTimeout(() => {
      this.dismiss.emit();
    }, delay);
  }

  private clearAutoHideTimer(): void {
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = undefined;
    }
  }
}
