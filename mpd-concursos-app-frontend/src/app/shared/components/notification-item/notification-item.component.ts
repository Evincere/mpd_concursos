import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { Notification, NotificationStatus } from '../../../core/models/notification.model';

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

    get statusIcon(): string {
        switch (this.notification.status) {
            case NotificationStatus.ACKNOWLEDGED:
                return 'check_circle';
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
        return this.notification.status === NotificationStatus.READ;
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
