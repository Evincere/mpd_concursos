import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import { NotificationItemComponent } from '../notification-item/notification-item.component';
import { NotificationAcknowledgeDialogComponent } from './notification-acknowledge-dialog/notification-acknowledge-dialog.component';
import { Notification } from  '../../../core/models/notification.model';
import { NotificationsService } from '@core/services/notifications/notifications.service';


@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [
        CommonModule,
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
        private notificationsService: NotificationsService
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
                    // TODO: Implementar notificación error custom glassmorphism
                    console.error('Error al cargar las notificaciones');
                }
            });
    }

    private subscribeToNotifications(): void {
        this.notificationsService.notifications$
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (notifications: Notification[]) => {
                    this.notifications = notifications;
                    this.updateUnreadCount();
                },
                error: (error: Error) => {
                    console.error('Error loading notifications:', error);
                    // TODO: Implementar notificación error custom glassmorphism
                    console.error('Error al cargar las notificaciones');
                }
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
                        // TODO: Implementar notificación error custom glassmorphism
                        console.error('Error al marcar como leída la notificación');
                    }
                });
        }
    }

    onNotificationAcknowledge(notification: Notification): void {
        if (notification.status === 'ACKNOWLEDGED' || notification.acknowledgedAt) {
            // TODO: Implementar notificación info custom glassmorphism
            console.log('Esta notificación ya ha sido acusada');
            return;
        }

        // TODO: Implementar diálogo custom glassmorphism para acknowledge
        // Por ahora, simular el acknowledge directamente
        this.notificationsService.acknowledge(
            notification.id,
            'DIGITAL',
            'auto-acknowledge',
            true
        ).subscribe({
            next: () => {
                // La actualización del estado se maneja a través del BehaviorSubject
                // TODO: Implementar notificación success custom glassmorphism
                console.log('Notificación acusada correctamente');
            },
            error: (error: Error) => {
                console.error('Error acknowledging notification:', error);
                // TODO: Implementar notificación error custom glassmorphism
                console.error('Error al acusar recibo de la notificación');
            }
        });
    }

    // TODO: Implementar métodos de notificación custom glassmorphism
    // Estos métodos serán reemplazados por el sistema de notificaciones glassmorphism
}
