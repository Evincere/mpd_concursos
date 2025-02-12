import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, Subscription } from 'rxjs';
import { map, tap, startWith, switchMap } from 'rxjs/operators';
import {
    Notification,
    NotificationAcknowledgementRequest,
    NotificationResponse,
    SignatureType
} from '../../models/notification.model';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class NotificationsService implements OnDestroy {
    private apiUrl = `${environment.apiUrl}/v1/notifications`;
    private notificationsSubject = new BehaviorSubject<Notification[]>([]);
    private pollingSubscription: Subscription;
    notifications$ = this.notificationsSubject.asObservable();

    constructor(private http: HttpClient) {
        // Iniciar el polling cada 10 segundos
        this.pollingSubscription = interval(10000)
            .pipe(
                startWith(0), // Empezar inmediatamente
                switchMap(() => this.fetchNotifications())
            )
            .subscribe();
    }

    ngOnDestroy() {
        if (this.pollingSubscription) {
            this.pollingSubscription.unsubscribe();
        }
    }

    private fetchNotifications(): Observable<Notification[]> {
        return this.http.get<NotificationResponse[]>(this.apiUrl)
            .pipe(
                tap(notifications => this.notificationsSubject.next(notifications))
            );
    }

    getNotifications(): Observable<Notification[]> {
        return this.fetchNotifications();
    }

    markAsRead(notificationId: string): Observable<Notification> {
        return this.http.patch<NotificationResponse>(
            `${this.apiUrl}/${notificationId}/read`,
            {}
        ).pipe(
            tap(updatedNotification => {
                const currentNotifications = this.notificationsSubject.value;
                const index = currentNotifications.findIndex(n => n.id === notificationId);
                if (index !== -1) {
                    currentNotifications[index] = updatedNotification;
                    this.notificationsSubject.next([...currentNotifications]);
                }
            })
        );
    }

    acknowledge(notificationId: string, signatureType: SignatureType, signatureValue: string, declaration?: string): Observable<Notification> {
        const request: NotificationAcknowledgementRequest = {
            notificationId,
            signatureType,
            signatureValue,
            declaration,
            metadata: {
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            }
        };

        return this.http.patch<NotificationResponse>(
            `${this.apiUrl}/${notificationId}/acknowledge`,
            request
        ).pipe(
            tap(updatedNotification => {
                const currentNotifications = this.notificationsSubject.value;
                const index = currentNotifications.findIndex(n => n.id === notificationId);
                if (index !== -1) {
                    currentNotifications[index] = updatedNotification;
                    this.notificationsSubject.next([...currentNotifications]);
                }
            })
        );
    }

    getUnreadCount(): Observable<number> {
        return this.notifications$.pipe(
            map(notifications =>
                notifications.filter(n =>
                    n.status === 'SENT' || n.status === 'PENDING'
                ).length
            )
        );
    }
}
