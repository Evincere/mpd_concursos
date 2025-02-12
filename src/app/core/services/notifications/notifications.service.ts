import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SignatureType, NotificationAcknowledgement } from '../../models/notification.model';

@Injectable({
    providedIn: 'root'
})
export class NotificationsService {
    private apiUrl = `${environment.apiUrl}/v1/notifications`;

    constructor(private http: HttpClient) {}

    acknowledge(
        notificationId: string,
        signatureType: SignatureType,
        signatureValue: string,
        declaration?: string
    ): Observable<any> {
        const payload = {
            signatureType,
            signatureValue,
            declaration: declaration || null,
            timestamp: new Date().toISOString()
        };

        console.log('Sending acknowledgement request:', {
            url: `${this.apiUrl}/${notificationId}/acknowledge`,
            payload
        });

        return this.http.patch(
            `${this.apiUrl}/${notificationId}/acknowledge`,
            payload
        ).pipe(
            tap({
                next: (response) => console.log('Acknowledgement success:', response),
                error: (error) => console.error('Acknowledgement error:', error)
            })
        );
    }
} 