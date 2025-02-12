import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { NotificationsService } from '../../../core/services/notifications/notifications.service';
import { NotificationItemComponent } from '../notification-item/notification-item.component';
import { Notification } from '../../../core/models/notification.model';
import { NotificationAcknowledgeDialogComponent } from './notification-acknowledge-dialog/notification-acknowledge-dialog.component';

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatBadgeModule,
        MatButtonModule,
        MatRippleModule,
        MatDialogModule,
        NotificationItemComponent
    ],
    templateUrl: './notifications.component.html',
    styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit, OnDestroy {
    notifications: Notification[] = [];
    showNotifications = false;
    unreadCount = 0;
    private destroy$ = new Subject<void>();

    constructor(
        private notificationsService: NotificationsService,
        private dialog: MatDialog
    ) {}

    ngOnInit(): void {
        this.loadNotifications();
        this.subscribeToNotifications();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadNotifications(): void {
        this.notificationsService.getNotifications()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (notifications) => {
                    this.notifications = notifications;
                    this.updateUnreadCount();
                },
                error: (error) => {
                    console.error('Error loading notifications:', error);
                    // Aquí podrías mostrar un mensaje de error al usuario
                }
            });
    }

    private subscribeToNotifications(): void {
        this.notificationsService.notifications$
            .pipe(takeUntil(this.destroy$))
            .subscribe(notifications => {
                this.notifications = notifications;
                this.updateUnreadCount();
            });
    }

    private updateUnreadCount(): void {
        this.unreadCount = this.notifications.filter(n => 
            n.status === 'SENT' || n.status === 'PENDING'
        ).length;
    }

    toggleNotifications(): void {
        this.showNotifications = !this.showNotifications;
    }

    onNotificationRead(notification: Notification): void {
        this.notificationsService.markAsRead(notification.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                error: (error) => {
                    console.error('Error marking notification as read:', error);
                    // Aquí podrías mostrar un mensaje de error al usuario
                }
            });
    }

    onNotificationAcknowledge(notification: Notification): void {
        const dialogRef = this.dialog.open(NotificationAcknowledgeDialogComponent, {
            data: { notification },
            disableClose: true
        });

        dialogRef.afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe(signature => {
                if (signature) {
                    this.notificationsService.acknowledge(notification.id, signature.type, signature.value)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            error: (error) => {
                                console.error('Error acknowledging notification:', error);
                                // Aquí podrías mostrar un mensaje de error al usuario
                            }
                        });
                }
            });
    }
}
