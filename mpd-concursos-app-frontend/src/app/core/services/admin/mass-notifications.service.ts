import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

import {
  NotificationType,
  AcknowledgementLevel
} from '../../models/notification.model';

export interface MassNotificationRequest {
  recipientIds?: string[];
  recipientRoles?: string[];
  subject: string;
  content: string;
  type: NotificationType;
  acknowledgementLevel: AcknowledgementLevel;
  scheduledTime?: string;
  metadata?: Record<string, unknown>;
}

export interface MassNotificationResponse {
  batchId: string;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  sentNotificationIds: string[];
  processedAt: string;
  scheduledTime?: string;
  status: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: NotificationType;
  acknowledgementLevel: AcknowledgementLevel;
  metadata?: Record<string, unknown>;
}

@Injectable({
  providedIn: 'root'
})
export class MassNotificationsService {
  private apiUrl = `${environment.apiUrl}/v1/notifications/mass`;



  // Templates are stored locally for now, in a real app these would be stored in the backend
  private templates: NotificationTemplate[] = [
    {
      id: '1',
      name: 'Anuncio de nuevo concurso',
      subject: 'Nuevo concurso disponible',
      content: 'Estimado/a usuario/a,\n\nNos complace informarle que se ha publicado un nuevo concurso en la plataforma. Le invitamos a revisar los detalles y considerar su participación.\n\nSaludos cordiales,\nEquipo MPD Concursos',
      type: NotificationType.CONTEST,
      acknowledgementLevel: AcknowledgementLevel.SIMPLE
    },
    {
      id: '2',
      name: 'Recordatorio de fecha límite',
      subject: 'Recordatorio: Fecha límite de inscripción próxima',
      content: 'Estimado/a usuario/a,\n\nLe recordamos que la fecha límite para inscribirse en el concurso [NOMBRE_CONCURSO] es el [FECHA_LIMITE]. Asegúrese de completar su inscripción antes de esta fecha.\n\nSaludos cordiales,\nEquipo MPD Concursos',
      type: NotificationType.CONTEST,
      acknowledgementLevel: AcknowledgementLevel.SIMPLE
    },
    {
      id: '3',
      name: 'Actualización del sistema',
      subject: 'Actualización importante del sistema',
      content: 'Estimado/a usuario/a,\n\nLe informamos que el sistema estará en mantenimiento el día [FECHA_MANTENIMIENTO] desde las [HORA_INICIO] hasta las [HORA_FIN]. Durante este período, la plataforma no estará disponible.\n\nDisculpe las molestias.\n\nSaludos cordiales,\nEquipo MPD Concursos',
      type: NotificationType.SYSTEM,
      acknowledgementLevel: AcknowledgementLevel.NONE
    }
  ];



  /**
   * Send a mass notification
   * @param request The mass notification request
   */
  sendMassNotification(request: MassNotificationRequest): Observable<MassNotificationResponse> {
    // En una implementación real, esto sería una llamada a la API
    // return this.http.post<MassNotificationResponse>(
    //   this.apiUrl,
    //   request,
    //   { headers: this.getHeaders() }
    // ).pipe(
    //   catchError(error => {
    //     console.error('Error sending mass notification:', error);
    //     return throwError(() => new Error('Error al enviar notificación masiva. Por favor, intente nuevamente.'));
    //   })
    // );

    // Implementación mock para desarrollo
    return new Observable(observer => {
      const response: MassNotificationResponse = {
        batchId: Date.now().toString(),
        totalRecipients: 100,
        successCount: 98,
        failureCount: 2,
        sentNotificationIds: Array.from({ length: 98 }, (_, i) => `notif-${i + 1}`),
        processedAt: new Date().toISOString(),
        scheduledTime: request.scheduledTime,
        status: 'COMPLETED'
      };

      observer.next(response);
      observer.complete();
    });
  }

  /**
   * Get all notification templates
   */
  getTemplates(): Observable<NotificationTemplate[]> {
    // In a real app, this would be an API call
    return new Observable(observer => {
      observer.next(this.templates);
      observer.complete();
    });
  }

  /**
   * Get a template by ID
   * @param id Template ID
   */
  getTemplateById(id: string): Observable<NotificationTemplate | undefined> {
    // In a real app, this would be an API call
    return new Observable(observer => {
      const template = this.templates.find(t => t.id === id);
      observer.next(template);
      observer.complete();
    });
  }

  /**
   * Create a new template
   * @param template The template to create
   */
  createTemplate(template: Omit<NotificationTemplate, 'id'>): Observable<NotificationTemplate> {
    // In a real app, this would be an API call
    return new Observable(observer => {
      const newTemplate: NotificationTemplate = {
        ...template,
        id: Date.now().toString()
      };
      this.templates.push(newTemplate);
      observer.next(newTemplate);
      observer.complete();
    });
  }

  private getHeaders(): HttpHeaders {
    // En una implementación real, obtendríamos el token del servicio
    const token = 'mock-token';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
}
