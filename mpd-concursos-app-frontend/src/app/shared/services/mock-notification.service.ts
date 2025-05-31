import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { delay } from 'rxjs/operators';

// Modelo de notificación para el componente
export interface Notification {
  id: string;
  title: string;
  message: string;
  status: 'SENT' | 'READ' | 'ACKNOWLEDGED' | 'PENDING';
  sentAt: string;
  readAt?: string;
  acknowledgedAt?: string;
  type: string;
  requiresAcknowledgement: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MockNotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  private mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'Inscripción completada',
      message: 'Su inscripción al concurso "Defensor Público Oficial" ha sido completada y está pendiente de validación.',
      status: 'SENT',
      sentAt: new Date().toISOString(),
      type: 'INFO',
      requiresAcknowledgement: false
    },
    {
      id: '2',
      title: 'Inscripción aprobada',
      message: 'Su inscripción al concurso "Defensor Público Oficial" ha sido aprobada.',
      status: 'PENDING',
      sentAt: new Date(Date.now() - 86400000).toISOString(),
      type: 'SUCCESS',
      requiresAcknowledgement: true
    }
  ];

  constructor() {
    this.notificationsSubject.next(this.mockNotifications);
  }

  loadNotifications(): Observable<Notification[]> {
    return of(this.mockNotifications).pipe(delay(500));
  }

  markAsRead(notificationId: string): Observable<Notification> {
    const notification = this.mockNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.status = 'READ';
      notification.readAt = new Date().toISOString();
      this.notificationsSubject.next([...this.mockNotifications]);
      return of(notification).pipe(delay(300));
    }
    // Crear una notificación vacía para evitar errores de tipo
    return of({
      id: '',
      title: '',
      message: '',
      status: 'SENT',
      sentAt: new Date().toISOString(),
      type: '',
      requiresAcknowledgement: false
    });
  }

  acknowledge(
    notificationId: string,
    signatureType: string,
    signatureValue: string,
    declaration?: string
  ): Observable<Notification> {
    // Usar los parámetros para evitar advertencias de "nunca leído"
    console.log(`Acknowledging notification with signature type: ${signatureType}, value: ${signatureValue}, declaration: ${declaration || 'none'}`);

    const notification = this.mockNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.status = 'ACKNOWLEDGED';
      notification.acknowledgedAt = new Date().toISOString();
      this.notificationsSubject.next([...this.mockNotifications]);
      return of(notification).pipe(delay(300));
    }
    // Crear una notificación vacía para evitar errores de tipo
    return of({
      id: '',
      title: '',
      message: '',
      status: 'SENT',
      sentAt: new Date().toISOString(),
      type: '',
      requiresAcknowledgement: false
    });
  }
}
