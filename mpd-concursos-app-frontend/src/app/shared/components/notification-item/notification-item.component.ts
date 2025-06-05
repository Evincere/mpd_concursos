import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UnifiedNotificationService } from '@shared/components/unified-notification/unified-notification.service';
import {
  Notification,
  NotificationStatus,
  AcknowledgementLevel,
  requiresAcknowledgment,
  requiresSignature,
  NOTIFICATION_STATUS_LABELS,
  ACKNOWLEDGEMENT_LEVEL_LABELS,
  getNotificationStatusColor,
  getAcknowledgementLevelColor
} from '../../../core/models/notification.model';
import { InscriptionNotificationItemComponent } from './inscription-notification-item/inscription-notification-item.component';
import { NotificationsService } from '@core/services/notifications/notifications.service';
// Removed external component imports - implementing badge system directly

@Component({
    selector: 'app-notification-item',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatRippleModule,
        MatTooltipModule,
        InscriptionNotificationItemComponent
    ],
    templateUrl: './notification-item.component.html',
    styleUrls: ['./notification-item.component.scss']
})
export class NotificationItemComponent {
    @Input() notification!: Notification;
    @Output() read = new EventEmitter<Notification>();
    @Output() acknowledge = new EventEmitter<Notification>();

    showAcknowledgmentSection = false;
    isAcknowledging = false;
    protected AcknowledgementLevel = AcknowledgementLevel;

    constructor(
        private notificationsService: NotificationsService,
        private unifiedNotificationService: UnifiedNotificationService
    ) {}

    get statusIcon(): string {
        switch (this.notification.status) {
            case NotificationStatus.ACKNOWLEDGED:
                return 'verified';
            case NotificationStatus.READ:
                return 'mark_email_read';
            case NotificationStatus.SENT:
            case NotificationStatus.PENDING:
            default:
                return 'mark_email_unread';
        }
    }

    get isUnread(): boolean {
        return this.notification.status === NotificationStatus.SENT ||
               this.notification.status === NotificationStatus.PENDING;
    }

    get canAcknowledge(): boolean {
        return this.notification.status === NotificationStatus.READ &&
               this.notification.acknowledgementLevel !== AcknowledgementLevel.NONE &&
               !this.isAcknowledged;
    }

    get isAcknowledged(): boolean {
        return this.notification.status === NotificationStatus.ACKNOWLEDGED ||
               this.notification.acknowledgedAt !== null;
    }

    getStatusText(status: NotificationStatus): string {
        switch (status) {
            case NotificationStatus.ACKNOWLEDGED:
                return 'Acusado';
            case NotificationStatus.READ:
                return 'Leído';
            case NotificationStatus.SENT:
                return 'Enviado';
            case NotificationStatus.PENDING:
                return 'Pendiente';
            default:
                return status;
        }
    }

    getAcknowledgementLevelText(level: AcknowledgementLevel): string {
        switch (level) {
            case AcknowledgementLevel.SIGNATURE_ADVANCED:
                return 'Firma Avanzada';
            case AcknowledgementLevel.SIGNATURE_BASIC:
                return 'Firma Básica';
            case AcknowledgementLevel.SIMPLE:
                return 'Acuse Simple';
            default:
                return level;
        }
    }

    onNotificationClick(): void {
        if (this.notification && this.isUnread) {
            this.markAsRead();
        }
    }

    onNotificationRead(notification: Notification): void {
        this.read.emit(notification);
    }

    onNotificationAcknowledge(notification: Notification): void {
        this.acknowledge.emit(notification);
    }

    private markAsRead(): void {
        if (!this.notification) return;

        this.notificationsService.markAsRead(this.notification.id).subscribe({
            next: (updatedNotification) => {
                this.notification = updatedNotification;
                this.read.emit(updatedNotification);
                this.showSuccessMessage('Notificación marcada como leída');
            },
            error: (error) => {
                console.error('Error marking notification as read:', error);
                this.showErrorMessage('Error al marcar la notificación como leída');
            }
        });
    }

    onShowAcknowledgment(event: Event): void {
        event.stopPropagation();
        this.showAcknowledgmentSection = true;
    }

    // Acknowledgment functionality would be implemented here when needed

    private showSuccessMessage(message: string): void {
        this.unifiedNotificationService.success(message, 'Éxito', {
            duration: 3000,
            position: 'bottom-center'
        });
    }

    private showErrorMessage(message: string): void {
        this.unifiedNotificationService.error(message, 'Error', {
            duration: 5000,
            position: 'bottom-center'
        });
    }

    onRead(event: Event): void {
        event.stopPropagation();
        if (this.isUnread) {
            this.read.emit(this.notification);
        }
    }

    // Badge system methods
    getStatusLabel(): string {
        return NOTIFICATION_STATUS_LABELS[this.notification?.status || NotificationStatus.PENDING] || 'Desconocido';
    }

    getStatusColor(): string {
        return getNotificationStatusColor(this.notification?.status || NotificationStatus.PENDING);
    }

    getStatusIcon(): string {
        switch (this.notification?.status) {
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
        switch (this.notification?.status) {
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
        return this.notification?.acknowledgementLevel !== AcknowledgementLevel.NONE;
    }

    getAcknowledgmentLabel(): string {
        return ACKNOWLEDGEMENT_LEVEL_LABELS[this.notification?.acknowledgementLevel || AcknowledgementLevel.NONE] || 'Desconocido';
    }

    getAcknowledgmentColor(): string {
        return getAcknowledgementLevelColor(this.notification?.acknowledgementLevel || AcknowledgementLevel.NONE);
    }

    getAcknowledgmentIcon(): string {
        switch (this.notification?.acknowledgementLevel) {
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
        switch (this.notification?.acknowledgementLevel) {
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
        return this.notification ? requiresSignature(this.notification) &&
               this.notification.status !== NotificationStatus.ACKNOWLEDGED : false;
    }

    getSignatureTooltip(): string {
        if (this.notification?.acknowledgementLevel === AcknowledgementLevel.SIGNATURE_ADVANCED) {
            return 'Esta notificación requiere firma digital avanzada para ser acusada de recibo';
        }
        return 'Esta notificación requiere firma para ser acusada de recibo';
    }
}
