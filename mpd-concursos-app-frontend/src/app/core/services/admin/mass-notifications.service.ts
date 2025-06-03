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
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
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
      subject: 'Nuevo concurso disponible: {{concurso.nombre}}',
      content: 'Estimado/a {{usuario.nombre}},\n\nNos complace informarle que se ha publicado un nuevo concurso "{{concurso.nombre}}" en la plataforma. Le invitamos a revisar los detalles y considerar su participación.\n\nFecha de inicio: {{concurso.fechaInicio}}\nFecha de fin: {{concurso.fechaFin}}\nInstitución: {{concurso.institucion}}\n\nPara más información, visite: {{sistema.url}}\n\nSaludos cordiales,\nEquipo MPD Concursos',
      type: NotificationType.CONTEST,
      acknowledgementLevel: AcknowledgementLevel.SIMPLE,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      createdBy: 'admin'
    },
    {
      id: '2',
      name: 'Recordatorio de fecha límite',
      subject: 'Recordatorio: Fecha límite de inscripción próxima',
      content: 'Estimado/a {{usuario.nombre}},\n\nLe recordamos que la fecha límite para inscribirse en el concurso "{{concurso.nombre}}" es el {{concurso.fechaFin}}. Asegúrese de completar su inscripción antes de esta fecha.\n\nCódigo del concurso: {{concurso.codigo}}\nInstitución: {{concurso.institucion}}\n\nPara inscribirse, visite: {{sistema.url}}\n\nSi tiene consultas, contáctenos en: {{sistema.soporte}}\n\nSaludos cordiales,\nEquipo MPD Concursos',
      type: NotificationType.CONTEST,
      acknowledgementLevel: AcknowledgementLevel.SIMPLE,
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20'),
      createdBy: 'admin'
    },
    {
      id: '3',
      name: 'Actualización del sistema',
      subject: 'Actualización importante del sistema - {{sistema.fecha}}',
      content: 'Estimado/a {{usuario.nombre}},\n\nLe informamos que el sistema estará en mantenimiento el día {{sistema.fecha}} desde las 02:00 hasta las 06:00. Durante este período, la plataforma no estará disponible.\n\nEste mantenimiento nos permitirá mejorar el rendimiento y la seguridad del sistema.\n\nDisculpe las molestias ocasionadas.\n\nPara consultas urgentes, contáctenos en: {{sistema.soporte}}\n\nSaludos cordiales,\nEquipo MPD Concursos',
      type: NotificationType.SYSTEM,
      acknowledgementLevel: AcknowledgementLevel.NONE,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-25'),
      createdBy: 'admin'
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
      const now = new Date();
      const newTemplate: NotificationTemplate = {
        ...template,
        id: Date.now().toString(),
        createdAt: now,
        updatedAt: now,
        createdBy: 'current-user' // En una app real, esto vendría del contexto de usuario
      };
      this.templates.push(newTemplate);
      observer.next(newTemplate);
      observer.complete();
    });
  }

  /**
   * Update an existing template
   * @param id Template ID
   * @param template Updated template data
   */
  updateTemplate(id: string, template: Partial<NotificationTemplate>): Observable<NotificationTemplate> {
    // In a real app, this would be an API call
    return new Observable(observer => {
      const index = this.templates.findIndex(t => t.id === id);
      if (index !== -1) {
        this.templates[index] = {
          ...this.templates[index],
          ...template,
          updatedAt: new Date()
        };
        observer.next(this.templates[index]);
      } else {
        observer.error(new Error('Template not found'));
      }
      observer.complete();
    });
  }

  /**
   * Delete a template
   * @param id Template ID
   */
  deleteTemplate(id: string): Observable<void> {
    // In a real app, this would be an API call
    return new Observable(observer => {
      const index = this.templates.findIndex(t => t.id === id);
      if (index !== -1) {
        this.templates.splice(index, 1);
        observer.next();
      } else {
        observer.error(new Error('Template not found'));
      }
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
