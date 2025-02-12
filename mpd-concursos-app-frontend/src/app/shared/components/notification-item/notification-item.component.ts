import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import {
    Notification,
    NotificationStatus,
    AcknowledgementLevel
} from '../../../core/models/notification.model';

@Component({
    selector: 'app-notification-item',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatRippleModule
    ],
    templateUrl: './notification-item.component.html',
    styleUrls: ['./notification-item.component.scss']
})
export class NotificationItemComponent {
    @Input() notification!: Notification;
    @Output() read = new EventEmitter<Notification>();
    @Output() acknowledge = new EventEmitter<Notification>();

    protected AcknowledgementLevel = AcknowledgementLevel;

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

    onRead(event: Event): void {
        event.stopPropagation();
        if (this.isUnread) {
            this.read.emit(this.notification);
        }
    }

    onAcknowledge(event: Event): void {
        event.stopPropagation();
        if (this.canAcknowledge) {
            this.acknowledge.emit(this.notification);
        }
    }
}
