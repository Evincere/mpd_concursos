import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { NotificationAcknowledgeDialogComponent } from './notification-acknowledge-dialog/notification-acknowledge-dialog.component';
import { NotificationsService } from '../../../core/services/notifications/notifications.service';
import { Notification, SignatureType } from '../../../core/models/notification.model';

@Component({
    selector: 'app-notifications',
    templateUrl: './notifications.component.html',
    styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    private isProcessingAcknowledge = false;

    constructor(
        private dialog: MatDialog,
        private notificationsService: NotificationsService,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        // Inicialización del componente
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onNotificationRead(notification: Notification): void {
        if (notification.status === 'READ') {
            return;
        }

        this.notificationsService.markAsRead(notification.id)
            .pipe(
                takeUntil(this.destroy$)
            )
            .subscribe({
                next: () => {
                    notification.status = 'READ';
                },
                error: (error) => {
                    console.error('Error marking notification as read:', error);
                    this.snackBar.open(
                        'Error al marcar como leída. Por favor, intente nuevamente.',
                        'Cerrar',
                        { duration: 5000 }
                    );
                }
            });
    }

    onNotificationAcknowledge(notification: Notification): void {
        if (notification.status === 'ACKNOWLEDGED' || this.isProcessingAcknowledge) {
            return;
        }

        this.isProcessingAcknowledge = true;

        const dialogRef = this.dialog.open(NotificationAcknowledgeDialogComponent, {
            data: { notification },
            disableClose: true,
            panelClass: ['app-dialog', 'app-dialog-dark', 'acknowledge-dialog'],
            width: '500px'
        });

        // Agregar logs para debug
        console.log('Opening dialog with data:', { notification });

        dialogRef.afterClosed()
            .pipe(
                finalize(() => this.isProcessingAcknowledge = false)
            )
            .subscribe(result => {
                console.log('Dialog closed with result:', result);
                if (result) {
                    this.notificationsService.acknowledge(
                        notification.id,
                        result.type as SignatureType,
                        result.value,
                        result.declaration
                    ).subscribe({
                        next: (response) => {
                            console.log('Acknowledge success:', response);
                            this.snackBar.open('Acuse registrado correctamente', 'Cerrar', {
                                duration: 3000
                            });
                        },
                        error: (error) => {
                            console.error('Error acknowledging notification:', error);
                            this.snackBar.open(
                                'Error al registrar el acuse. Por favor, intente nuevamente.',
                                'Cerrar',
                                { duration: 5000 }
                            );
                        }
                    });
                }
            });
    }
} 