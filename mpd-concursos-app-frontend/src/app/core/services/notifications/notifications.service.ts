import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { 
    Notification, 
    NotificationAcknowledgementRequest, 
    NotificationResponse 
} from '../../models/notification.model';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class NotificationsService {
    private apiUrl = `${environment.apiUrl}/v1/notifications`;
    private notificationsSubject = new BehaviorSubject<Notification[]>([]);
    notifications$ = this.notificationsSubject.asObservable();

    constructor(private http: HttpClient) {}

    getNotifications(): Observable<Notification[]> {
        return this.http.get<NotificationResponse[]>(`${this.apiUrl}/user`)
            .pipe(
                tap(notifications => this.notificationsSubject.next(notifications))
            );
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

    acknowledge(notificationId: string, signature: string): Observable<Notification> {
        const request: NotificationAcknowledgementRequest = {
            notificationId,
            signature
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
