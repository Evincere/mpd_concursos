import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, Subscription, throwError, timer, of } from 'rxjs';
import { map, tap, startWith, switchMap, catchError, retry, retryWhen, delay, filter } from 'rxjs/operators';
import {
    Notification,
    NotificationAcknowledgementRequest,
    NotificationResponse,
    SignatureType
} from '../../models/notification.model';
import { environment } from '../../../../environments/environment';
import { TokenService } from '../auth/token.service';
import { AuthService } from '../auth/auth.service';

@Injectable({
    providedIn: 'root'
})
export class NotificationsService implements OnDestroy {
    private apiUrl = `${environment.apiUrl}/v1/notifications`;
    private notificationsSubject = new BehaviorSubject<Notification[]>([]);
    private pollingSubscription: Subscription = new Subscription();
    notifications$ = this.notificationsSubject.asObservable();

    constructor(
        private http: HttpClient,
        private tokenService: TokenService,
        private authService: AuthService
    ) {
        // Suscribirse a cambios en el token
        this.tokenService.getTokenObservable().subscribe(token => {
            if (token) {
                this.startPolling();
            } else {
                this.stopPolling();
                this.notificationsSubject.next([]);
            }
        });
    }

    ngOnDestroy(): void {
        this.stopPolling();
    }

    private startPolling(): void {
        if (this.pollingSubscription) {
            this.stopPolling();
        }

        // Cargar inmediatamente y luego cada 10 segundos
        this.pollingSubscription = timer(0, 10000)
            .pipe(
                filter(() => this.authService.isAuthenticated()),
                switchMap(() => this.loadNotifications().pipe(
                    catchError(error => {
                        if (error instanceof HttpErrorResponse && error.status === 401) {
                            this.stopPolling();
                            return of([]);
                        }
                        console.error('Error en el polling de notificaciones:', error);
                        return of(this.notificationsSubject.value); // Mantener el estado actual en caso de error
                    })
                ))
            )
            .subscribe({
                next: (notifications) => {
                    if (notifications && notifications.length > 0) {
                        const currentNotifications = this.notificationsSubject.value;
                        const hasNewNotifications = notifications.some(newNotif =>
                            !currentNotifications.some(currentNotif =>
                                currentNotif.id === newNotif.id
                            )
                        );

                        if (hasNewNotifications) {
                            console.log('Nuevas notificaciones recibidas:', notifications);
                            // Actualizar el estado con las nuevas notificaciones
                            this.notificationsSubject.next(notifications);
                        }
                    } else {
                        // Mantener el estado actual si no hay notificaciones
                        this.notificationsSubject.next(this.notificationsSubject.value);
                    }
                },
                error: (error) => {
                    console.error('Error en la suscripción de polling:', error);
                    // Mantener el estado actual en caso de error
                    this.notificationsSubject.next(this.notificationsSubject.value);
                }
            });
    }

    private stopPolling(): void {
        if (this.pollingSubscription) {
            this.pollingSubscription.unsubscribe();
        }
    }

    loadNotifications(): Observable<Notification[]> {
        return this.http.get<Notification[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
            map(notifications => notifications.sort((a, b) =>
                new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
            )),
            catchError(error => {
                console.error('Error loading notifications:', error);
                if (error instanceof HttpErrorResponse) {
                    if (error.status === 401) {
                        return throwError(() => new Error('Su sesión ha expirado. Por favor, vuelva a iniciar sesión.'));
                    }
                }
                return throwError(() => error);
            })
        );
    }

    private getHeaders(): HttpHeaders {
        const token = this.tokenService.getToken();
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }

    markAsRead(notificationId: string): Observable<Notification> {
        return this.http.patch<Notification>(
            `${this.apiUrl}/${notificationId}/read`,
            {},
            { headers: this.getHeaders() }
        ).pipe(
            tap(updatedNotification => {
                const currentNotifications = this.notificationsSubject.value;
                const updatedNotifications = currentNotifications.map(notification =>
                    notification.id === notificationId ? updatedNotification : notification
                );
                this.notificationsSubject.next(updatedNotifications);
            }),
            retry({
                count: 3,
                delay: (error, retryCount) => {
                    if (error instanceof HttpErrorResponse) {
                        if (error.status === 409 || error.status === 0) {
                            console.log(`Reintentando marcar como leído (${retryCount}/3)...`);
                            return timer(1000);
                        }
                    }
                    return throwError(() => error);
                }
            }),
            catchError(error => {
                console.error('Error marking notification as read:', error);
                if (error instanceof HttpErrorResponse) {
                    if (error.status === 401) {
                        return throwError(() => new Error('Su sesión ha expirado. Por favor, vuelva a iniciar sesión.'));
                    } else if (error.status === 409) {
                        return throwError(() => new Error('La notificación ya ha sido actualizada. Por favor, refresque la página.'));
                    }
                }
                return throwError(() => error);
            })
        );
    }

    acknowledge(
        notificationId: string,
        signatureType: string,
        signatureValue: string,
        declaration?: boolean
    ): Observable<Notification> {
        const payload: NotificationAcknowledgementRequest = {
            notificationId,
            signatureType: signatureType as SignatureType,
            signatureValue: signatureValue.trim(),
            declaration: declaration ? String(declaration) : undefined
        };

        return this.http.patch<Notification>(
            `${this.apiUrl}/${notificationId}/acknowledge`,
            payload,
            { headers: this.getHeaders() }
        ).pipe(
            retry({
                count: 3,
                delay: (error, retryCount) => {
                    if (error instanceof HttpErrorResponse) {
                        if (error.status === 409 || error.status === 0) {
                            console.log(`Reintentando acusar recibo (${retryCount}/3)...`);
                            return timer(1000);
                        }
                    }
                    return throwError(() => error);
                }
            }),
            tap({
                next: (response) => {
                    const currentNotifications = this.notificationsSubject.value;
                    const updatedNotifications = currentNotifications.map(n =>
                        n.id === notificationId ? response : n
                    );
                    this.notificationsSubject.next(updatedNotifications);
                },
                error: (error) => {
                    console.error('Error al acusar recibo:', error);
                    if (error instanceof HttpErrorResponse) {
                        if (error.status === 401) {
                            this.authService.logout();
                        }
                    }
                }
            }),
            catchError(error => {
                if (error instanceof HttpErrorResponse) {
                    if (error.status === 401) {
                        return throwError(() => new Error('Su sesión ha expirado. Por favor, vuelva a iniciar sesión.'));
                    } else if (error.status === 409) {
                        return throwError(() => new Error('La notificación ya ha sido acusada. Por favor, actualice la página.'));
                    } else if (error.status === 500) {
                        return throwError(() => new Error('Error en el servidor. Por favor, intente nuevamente en unos momentos.'));
                    }
                }
                return throwError(() => new Error('Error al acusar recibo. Por favor, intente nuevamente.'));
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
