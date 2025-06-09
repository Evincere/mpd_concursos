import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, Subscription, throwError, timer, of, fromEvent } from 'rxjs';
import { map, tap, switchMap, catchError, retry, filter } from 'rxjs/operators';
import { Notification, NotificationAcknowledgementRequest, SignatureType } from '../../models/notification.model';
import { environment } from '../../../../environments/environment';
import { TokenService } from '../auth/token.service';
import { AuthService } from '../auth/auth.service';
import { LoggingService } from '../logging/logging.service'; // Import LoggingService

@Injectable({
  providedIn: 'root'
})
export class NotificationsService implements OnDestroy {
  private apiUrl = `${environment.apiUrl}/v1/notifications`;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private pollingSubscription: Subscription = new Subscription();
  notifications$ = this.notificationsSubject.asObservable();

  private visibilitySubscription: Subscription = new Subscription();
  private isTabActive = true; // Tracks if the browser tab is active

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private authService: AuthService,
    private loggingService: LoggingService // Inject LoggingService
  ) {
    this.loggingService.debug('[NotificationsService] Initializing NotificationsService.', undefined, 'NotificationsService');

    // Subscribe to token changes to start/stop polling
    this.tokenService.getTokenObservable().pipe(
      tap(token => {
        this.loggingService.debug('[NotificationsService] Token changed. Token present:', !!token, 'NotificationsService');
      })
    ).subscribe(token => {
      if (token) {
        this.startPolling();
      } else {
        this.stopPolling();
        this.notificationsSubject.next([]); // Clear notifications on logout
        this.loggingService.info('[NotificationsService] User logged out. Polling stopped and notifications cleared.', undefined, 'NotificationsService');
      }
    });

    // Monitor tab visibility to optimize polling
    this.visibilitySubscription = fromEvent(document, 'visibilitychange').pipe(
      tap(() => {
        this.isTabActive = !document.hidden;
        this.loggingService.debug(`[NotificationsService] Tab visibility changed. Tab is active: ${this.isTabActive}`, undefined, 'NotificationsService');
        // If tab becomes active, force an immediate notification load
        if (this.isTabActive && this.authService.isAuthenticated()) {
          this.loggingService.info('[NotificationsService] Tab became active and user is authenticated. Forcing immediate notification load.', undefined, 'NotificationsService');
          this.loadNotifications().subscribe({
            next: (notifications) => this.notificationsSubject.next(notifications),
            error: (err) => this.loggingService.error('[NotificationsService] Error loading notifications on tab active:', err, 'NotificationsService')
          });
        }
      })
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.loggingService.info('[NotificationsService] Service destroyed. Unsubscribing all subscriptions.', undefined, 'NotificationsService');
    this.stopPolling();
    if (this.visibilitySubscription) {
      this.visibilitySubscription.unsubscribe();
    }
  }

  /**
   * Starts polling for new notifications. Clears any existing polling subscription first.
   * Polling occurs every 60 seconds (optimized for reduced load) and only when authenticated and tab is active.
   */
  private startPolling(): void {
    if (this.pollingSubscription && !this.pollingSubscription.closed) {
      this.stopPolling();
      this.loggingService.warn('[NotificationsService] Existing polling subscription found and stopped before starting new one.', undefined, 'NotificationsService');
    }

    this.loggingService.info('[NotificationsService] Starting notification polling. Interval: 60 seconds.', undefined, 'NotificationsService');

    // Load immediately on start, then every 60 seconds
    this.pollingSubscription = timer(0, 60000)
      .pipe(
        filter(() => {
          const isAuthenticated = this.authService.isAuthenticated();
          if (!isAuthenticated) {
            this.loggingService.debug('[NotificationsService] Skipping polling: User not authenticated.', undefined, 'NotificationsService');
          }
          if (!this.isTabActive) {
            this.loggingService.debug('[NotificationsService] Skipping polling: Tab is not active.', undefined, 'NotificationsService');
          }
          return isAuthenticated && this.isTabActive;
        }),
        switchMap(() => this.loadNotifications().pipe(
          catchError(error => {
            this.loggingService.error('[NotificationsService] Error during notification polling (loadNotifications pipe):', error, 'NotificationsService');
            if (error instanceof HttpErrorResponse && error.status === 401) {
              this.loggingService.warn('[NotificationsService] Polling received 401. Stopping polling.', undefined, 'NotificationsService');
              this.authService.logout(); // Force logout on auth failure
              this.stopPolling();
              return of([]); // Return empty array to avoid breaking the stream
            }
            // Return current state to maintain UI consistency on other errors
            return of(this.notificationsSubject.value);
          })
        ))
      )
      .subscribe({
        next: (notifications) => {
          this.loggingService.debug('[NotificationsService] Polling cycle completed. New notifications received count:', notifications.length, 'NotificationsService');
          const currentNotifications = this.notificationsSubject.value;
          const hasNewNotifications = notifications.some(newNotif =>
            !currentNotifications.some(currentNotif =>
              currentNotif.id === newNotif.id && currentNotif.readAt === newNotif.readAt && currentNotif.acknowledgedAt === newNotif.acknowledgedAt
            )
          );

          if (hasNewNotifications || notifications.length !== currentNotifications.length) {
            this.loggingService.info('[NotificationsService] New or updated notifications detected. Updating subject.', undefined, 'NotificationsService');
            this.notificationsSubject.next(notifications); // Update subject only if there's a change
          } else {
            this.loggingService.debug('[NotificationsService] No new notifications or state changes detected. Subject not updated.', undefined, 'NotificationsService');
          }
        },
        error: (error) => {
          this.loggingService.error('[NotificationsService] Error in polling subscription:', error, 'NotificationsService');
          // Maintain current state in case of subscription-level error
          this.notificationsSubject.next(this.notificationsSubject.value);
        }
      });
  }

  /**
   * Stops the active polling subscription.
   */
  private stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.loggingService.info('[NotificationsService] Notification polling stopped.', undefined, 'NotificationsService');
    }
  }

  /**
   * Loads notifications from the backend.
   * @returns An Observable of Notification array.
   */
  loadNotifications(): Observable<Notification[]> {
    this.loggingService.info('[NotificationsService] Fetching notifications from API.', undefined, 'NotificationsService');
    return this.http.get<Notification[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(notifications => notifications.sort((a, b) =>
        new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime() // Sort by sentAt descending
      )),
      tap(notifications => {
        this.loggingService.debug('[NotificationsService] Notifications loaded successfully and sorted. Count:', notifications.length, 'NotificationsService');
      }),
      catchError(error => {
        this.loggingService.error('[NotificationsService] Error loading notifications from API:', error, 'NotificationsService');
        if (error instanceof HttpErrorResponse) {
          if (error.status === 401) {
            this.loggingService.warn('[NotificationsService] 401 Unauthorized during loadNotifications. Session might be expired.', undefined, 'NotificationsService');
            this.authService.logout(); // Force logout
            return throwError(() => new Error('Su sesión ha expirado. Por favor, vuelva a iniciar sesión.'));
          } else if (error.status === 404) {
            return throwError(() => new Error('Recurso de notificaciones no encontrado.'));
          }
        }
        return throwError(() => new Error('Error al cargar notificaciones. Por favor, intente más tarde.'));
      })
    );
  }

  /**
   * Generates HTTP headers including the Authorization token.
   * @returns HttpHeaders instance.
   */
  private getHeaders(): HttpHeaders {
    const token = this.tokenService.getToken();
    if (!token) {
      this.loggingService.warn('[NotificationsService] No authentication token available for API request. Headers will be missing Authorization.', undefined, 'NotificationsService');
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Marks a specific notification as read.
   * @param notificationId The ID of the notification to mark as read.
   * @returns An Observable of the updated Notification.
   */
  markAsRead(notificationId: string): Observable<Notification> {
    this.loggingService.info(`[NotificationsService] Marking notification ${notificationId} as read.`, undefined, 'NotificationsService');
    return this.http.patch<Notification>(
      `${this.apiUrl}/${notificationId}/read`,
      {}, // Empty body for PATCH request
      { headers: this.getHeaders() }
    ).pipe(
      tap(updatedNotification => {
        this.loggingService.debug(`[NotificationsService] Notification ${notificationId} successfully marked as read. Updating local state.`, updatedNotification, 'NotificationsService');
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.map(notification =>
          notification.id === notificationId ? updatedNotification : notification
        );
        this.notificationsSubject.next(updatedNotifications); // Update the BehaviorSubject
      }),
      retry({
        count: 3, // Retry up to 3 times
        delay: (error, retryCount) => {
          if (error instanceof HttpErrorResponse) {
            if (error.status === 409) { // Conflict (e.g., already read)
              this.loggingService.warn(`[NotificationsService] Notification ${notificationId} already updated (409 Conflict). Retrying... attempt ${retryCount}.`, undefined, 'NotificationsService');
              return timer(1000); // Retry after 1 second
            }
            if (error.status === 0) { // Network error
              this.loggingService.warn(`[NotificationsService] Network error during markAsRead for ${notificationId}. Retrying... attempt ${retryCount}.`, undefined, 'NotificationsService');
              return timer(1000); // Retry after 1 second
            }
          }
          this.loggingService.error(`[NotificationsService] Non-retryable error for markAsRead ${notificationId}. Not retrying.`, error, 'NotificationsService');
          return throwError(() => error); // For other errors, don't retry, just propagate
        }
      }),
      catchError(error => {
        this.loggingService.error(`[NotificationsService] Error marking notification ${notificationId} as read (final catchError):`, error, 'NotificationsService');
        if (error instanceof HttpErrorResponse) {
          if (error.status === 401) {
            this.loggingService.warn('[NotificationsService] 401 Unauthorized during markAsRead. Logging out.', undefined, 'NotificationsService');
            this.authService.logout();
            return throwError(() => new Error('Su sesión ha expirado. Por favor, vuelva a iniciar sesión.'));
          } else if (error.status === 409) {
            return throwError(() => new Error('La notificación ya ha sido actualizada. Por favor, refresque la página.'));
          } else if (error.status === 404) {
            return throwError(() => new Error('Notificación no encontrada.'));
          }
        }
        return throwError(() => new Error('Error al marcar notificación como leída. Por favor, intente nuevamente.'));
      })
    );
  }

  /**
   * Acknowledges a notification, potentially requiring a signature.
   * @param notificationId The ID of the notification to acknowledge.
   * @param signatureType The type of signature (e.g., 'DIGITAL_SIGNATURE', 'PIN').
   * @param signatureValue The value of the signature.
   * @param declaration Optional: boolean indicating a declaration (converted to string).
   * @returns An Observable of the updated Notification.
   */
  acknowledge(
    notificationId: string,
    signatureType: string,
    signatureValue: string,
    declaration?: boolean
  ): Observable<Notification> {
    this.loggingService.info(`[NotificationsService] Acknowledging notification ${notificationId} with signature type: ${signatureType}.`, undefined, 'NotificationsService');
    const payload: NotificationAcknowledgementRequest = {
      notificationId,
      signatureType: signatureType as SignatureType,
      signatureValue: signatureValue.trim(),
      declaration: declaration ? String(declaration) : undefined // Convert boolean to string "true" or "false" if needed by backend
    };
    this.loggingService.debug('[NotificationsService] Acknowledgment payload:', payload, 'NotificationsService');

    return this.http.patch<Notification>(
      `${this.apiUrl}/${notificationId}/acknowledge`,
      payload,
      { headers: this.getHeaders() }
    ).pipe(
      retry({
        count: 3,
        delay: (error, retryCount) => {
          if (error instanceof HttpErrorResponse) {
            if (error.status === 409) { // Conflict (e.g., already acknowledged)
              this.loggingService.warn(`[NotificationsService] Notification ${notificationId} already acknowledged (409 Conflict). Retrying... attempt ${retryCount}.`, undefined, 'NotificationsService');
              return timer(1000);
            }
            if (error.status === 0) { // Network error
              this.loggingService.warn(`[NotificationsService] Network error during acknowledge for ${notificationId}. Retrying... attempt ${retryCount}.`, undefined, 'NotificationsService');
              return timer(1000);
            }
          }
          this.loggingService.error(`[NotificationsService] Non-retryable error for acknowledge ${notificationId}. Not retrying.`, error, 'NotificationsService');
          return throwError(() => error);
        }
      }),
      tap({
        next: (response) => {
          this.loggingService.info(`[NotificationsService] Notification ${notificationId} acknowledged successfully. Updating local state.`, response, 'NotificationsService');
          const currentNotifications = this.notificationsSubject.value;
          const updatedNotifications = currentNotifications.map(n =>
            n.id === notificationId ? response : n // Replace the acknowledged notification with the updated one
          );
          this.notificationsSubject.next(updatedNotifications); // Update the BehaviorSubject
        },
        error: (error) => {
          // This tap error handler is for side effects before catchError
          this.loggingService.error(`[NotificationsService] Tap error during acknowledgment for ${notificationId}:`, error, 'NotificationsService');
          if (error instanceof HttpErrorResponse && error.status === 401) {
            this.loggingService.warn('[NotificationsService] 401 Unauthorized during acknowledge. Logging out.', undefined, 'NotificationsService');
            this.authService.logout();
          }
        }
      }),
      catchError(error => {
        this.loggingService.error(`[NotificationsService] Error acknowledging notification ${notificationId} (final catchError):`, error, 'NotificationsService');
        if (error instanceof HttpErrorResponse) {
          if (error.status === 401) {
            return throwError(() => new Error('Su sesión ha expirado. Por favor, vuelva a iniciar sesión.'));
          } else if (error.status === 400) {
            return throwError(() => new Error('Firma o declaración inválida.'));
          }
          else if (error.status === 409) {
            return throwError(() => new Error('La notificación ya ha sido acusada. Por favor, actualice la página.'));
          } else if (error.status === 500) {
            return throwError(() => new Error('Error en el servidor. Por favor, intente nuevamente en unos momentos.'));
          } else if (error.status === 404) {
            return throwError(() => new Error('Notificación no encontrada.'));
          }
        }
        return throwError(() => new Error('Error al acusar recibo. Por favor, intente nuevamente.'));
      })
    );
  }

  /**
   * Gets the count of unread notifications from the current list.
   * Unread means status is 'SENT' or 'PENDING'.
   * @returns An Observable of the number of unread notifications.
   */
  getUnreadCount(): Observable<number> {
    return this.notifications$.pipe(
      map(notifications => {
        const unreadCount = notifications.filter(n =>
          n.status === 'SENT' || n.status === 'PENDING'
        ).length;
        this.loggingService.debug('[NotificationsService] Calculated unread notification count:', unreadCount, 'NotificationsService');
        return unreadCount;
      })
    );
  }
}
