import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { NotificationsService } from '../../../core/services/notifications/notifications.service';
import { NotificationItemComponent } from '../notification-item/notification-item.component';
import { NotificationAcknowledgeDialogComponent } from './notification-acknowledge-dialog/notification-acknowledge-dialog.component';
import { Notification, AcknowledgementLevel } from '../../../core/models/notification.model';
import { MatSnackBar } from '@angular/material/snack-bar';

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
        private dialog: MatDialog,
        private snackBar: MatSnackBar
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
        this.notificationsService.loadNotifications()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (notifications: Notification[]) => {
                    this.notifications = notifications;
                    this.updateUnreadCount();
                },
                error: (error: Error) => {
                    console.error('Error loading notifications:', error);
                    this.showErrorMessage('Error al cargar las notificaciones');
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
        if (!notification.readAt) {
            this.notificationsService.markAsRead(notification.id)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: () => {
                        // La actualización del estado se maneja a través del BehaviorSubject
                    },
                    error: (error: Error) => {
                        console.error('Error marking notification as read:', error);
                        this.showErrorMessage('Error al marcar como leída la notificación');
                    }
                });
        }
    }

    onNotificationAcknowledge(notification: Notification): void {
        if (notification.status === 'ACKNOWLEDGED' || notification.acknowledgedAt) {
            this.showInfoMessage('Esta notificación ya ha sido acusada');
            return;
        }

        const dialogRef = this.dialog.open(NotificationAcknowledgeDialogComponent, {
            data: { notification },
            width: '500px',
            disableClose: true
        });

        dialogRef.afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe(result => {
                if (result) {
                    this.notificationsService.acknowledge(
                        notification.id,
                        result.signatureType,
                        result.signatureValue,
                        result.declaration
                    ).subscribe({
                        next: () => {
                            // La actualización del estado se maneja a través del BehaviorSubject
                            this.showSuccessMessage('Notificación acusada correctamente');
                        },
                        error: (error: Error) => {
                            console.error('Error acknowledging notification:', error);
                            this.showErrorMessage('Error al acusar recibo de la notificación');
                        }
                    });
                }
            });
    }

    private showErrorMessage(message: string): void {
        this.snackBar.open(message, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
        });
    }

    private showSuccessMessage(message: string): void {
        this.snackBar.open(message, 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
        });
    }

    private showInfoMessage(message: string): void {
        this.snackBar.open(message, 'Cerrar', {
            duration: 3000,
            panelClass: ['info-snackbar']
        });
    }
}
