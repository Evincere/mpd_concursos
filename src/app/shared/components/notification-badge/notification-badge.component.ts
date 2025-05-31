import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { 
  Notification, 
  NotificationStatus, 
  AcknowledgementLevel,
  NOTIFICATION_STATUS_LABELS,
  ACKNOWLEDGEMENT_LEVEL_LABELS,
  getNotificationStatusColor,
  getAcknowledgementLevelColor,
  requiresAcknowledgment,
  requiresSignature
} from '@core/models/notification.model';

@Component({
  selector: 'app-notification-badge',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="notification-badges">
      <!-- Status Badge -->
      <div 
        class="notification-badge status-badge"
        [ngClass]="'badge-' + getStatusColor()"
        [matTooltip]="getStatusTooltip()"
        matTooltipPosition="above">
        <mat-icon class="badge-icon">{{ getStatusIcon() }}</mat-icon>
        <span class="badge-text">{{ getStatusLabel() }}</span>
      </div>

      <!-- Acknowledgment Badge (only if requires acknowledgment) -->
      <div 
        *ngIf="showAcknowledgmentBadge()"
        class="notification-badge acknowledgment-badge"
        [ngClass]="'badge-' + getAcknowledgmentColor()"
        [matTooltip]="getAcknowledgmentTooltip()"
        matTooltipPosition="above">
        <mat-icon class="badge-icon">{{ getAcknowledgmentIcon() }}</mat-icon>
        <span class="badge-text">{{ getAcknowledgmentLabel() }}</span>
      </div>

      <!-- Signature Required Badge (only if requires signature) -->
      <div 
        *ngIf="showSignatureBadge()"
        class="notification-badge signature-badge badge-red"
        [matTooltip]="getSignatureTooltip()"
        matTooltipPosition="above">
        <mat-icon class="badge-icon">security</mat-icon>
        <span class="badge-text">Firma requerida</span>
      </div>
    </div>
  `,
  styleUrls: ['./notification-badge.component.scss']
})
export class NotificationBadgeComponent {
  @Input() notification!: Notification;

  getStatusLabel(): string {
    return NOTIFICATION_STATUS_LABELS[this.notification.status] || 'Desconocido';
  }

  getStatusColor(): string {
    return getNotificationStatusColor(this.notification.status);
  }

  getStatusIcon(): string {
    switch (this.notification.status) {
      case NotificationStatus.PENDING:
        return 'schedule';
      case NotificationStatus.SENT:
        return 'send';
      case NotificationStatus.READ:
        return 'visibility';
      case NotificationStatus.ACKNOWLEDGED:
        return 'verified';
      default:
        return 'info';
    }
  }

  getStatusTooltip(): string {
    switch (this.notification.status) {
      case NotificationStatus.PENDING:
        return 'Esta notificación está pendiente de envío';
      case NotificationStatus.SENT:
        return 'Esta notificación ha sido enviada';
      case NotificationStatus.READ:
        return 'Esta notificación ha sido leída';
      case NotificationStatus.ACKNOWLEDGED:
        return 'Esta notificación ha sido acusada de recibo';
      default:
        return 'Estado de notificación desconocido';
    }
  }

  showAcknowledgmentBadge(): boolean {
    return this.notification.acknowledgementLevel !== AcknowledgementLevel.NONE;
  }

  getAcknowledgmentLabel(): string {
    return ACKNOWLEDGEMENT_LEVEL_LABELS[this.notification.acknowledgementLevel] || 'Desconocido';
  }

  getAcknowledgmentColor(): string {
    return getAcknowledgementLevelColor(this.notification.acknowledgementLevel);
  }

  getAcknowledgmentIcon(): string {
    switch (this.notification.acknowledgementLevel) {
      case AcknowledgementLevel.SIMPLE:
        return 'check_circle_outline';
      case AcknowledgementLevel.SIGNATURE_BASIC:
        return 'edit';
      case AcknowledgementLevel.SIGNATURE_ADVANCED:
        return 'verified_user';
      default:
        return 'info';
    }
  }

  getAcknowledgmentTooltip(): string {
    switch (this.notification.acknowledgementLevel) {
      case AcknowledgementLevel.SIMPLE:
        return 'Esta notificación requiere acuse de recibo simple';
      case AcknowledgementLevel.SIGNATURE_BASIC:
        return 'Esta notificación requiere firma básica';
      case AcknowledgementLevel.SIGNATURE_ADVANCED:
        return 'Esta notificación requiere firma avanzada';
      default:
        return 'Nivel de acuse desconocido';
    }
  }

  showSignatureBadge(): boolean {
    return requiresSignature(this.notification) && 
           this.notification.status !== NotificationStatus.ACKNOWLEDGED;
  }

  getSignatureTooltip(): string {
    if (this.notification.acknowledgementLevel === AcknowledgementLevel.SIGNATURE_ADVANCED) {
      return 'Esta notificación requiere firma digital avanzada para ser acusada de recibo';
    }
    return 'Esta notificación requiere firma para ser acusada de recibo';
  }
}
