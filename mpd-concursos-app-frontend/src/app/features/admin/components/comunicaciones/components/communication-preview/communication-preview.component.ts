import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  NotificationType,
  AcknowledgementLevel
} from '@core/models/notification.model';
// Definición del servicio TemplateVariablesService
class TemplateVariablesService {
  processTemplate(template: string, data: Record<string, unknown>): string {
    // Implementación simple para reemplazar variables en la plantilla
    let result = template;

    // Reemplazar variables de usuario
    if (data['user']) {
      const user = data['user'] as Record<string, unknown>;
      result = result.replace(/\{\{user\.fullName\}\}/g, user['fullName'] as string || '');
      result = result.replace(/\{\{user\.firstName\}\}/g, user['firstName'] as string || '');
      result = result.replace(/\{\{user\.lastName\}\}/g, user['lastName'] as string || '');
      result = result.replace(/\{\{user\.email\}\}/g, user['email'] as string || '');
      result = result.replace(/\{\{user\.dni\}\}/g, user['dni'] as string || '');
    }

    // Reemplazar variables de concurso
    if (data['contest']) {
      const contest = data['contest'] as Record<string, unknown>;
      result = result.replace(/\{\{contest\.title\}\}/g, contest['title'] as string || '');
      result = result.replace(/\{\{contest\.position\}\}/g, contest['position'] as string || '');
      result = result.replace(/\{\{contest\.dependency\}\}/g, contest['dependency'] as string || '');
      result = result.replace(/\{\{contest\.startDate\}\}/g, contest['startDate'] as string || '');
      result = result.replace(/\{\{contest\.endDate\}\}/g, contest['endDate'] as string || '');
    }

    // Reemplazar variables de inscripción
    if (data['inscription']) {
      const inscription = data['inscription'] as Record<string, unknown>;
      result = result.replace(/\{\{inscription\.status\}\}/g, inscription['status'] as string || '');
      result = result.replace(/\{\{inscription\.date\}\}/g, inscription['date'] as string || '');
    }

    return result;
  }
}


@Component({
  selector: 'app-communication-preview',
  templateUrl: './communication-preview.component.html',
  styleUrls: ['./communication-preview.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule
  ]
})
export class CommunicationPreviewComponent implements OnChanges {
  constructor(private templateVariablesService: TemplateVariablesService) {}
  @Input() subject = '';
  @Input() content = '';
  @Input() type: NotificationType = NotificationType.SYSTEM;
  @Input() acknowledgementLevel: AcknowledgementLevel = AcknowledgementLevel.NONE;

  processedSubject = '';
  processedContent = '';

  // Método para obtener la fecha actual formateada
  getCurrentDate(): string {
    return new Date().toLocaleDateString();
  }

  // Datos de ejemplo para la vista previa
  private previewData = {
    user: {
      fullName: 'Juan Pérez',
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@example.com',
      dni: '12345678'
    },
    contest: {
      title: 'Concurso para Defensor Público',
      position: 'Defensor Público',
      dependency: 'Defensoría Pública Oficial',
      startDate: '01/01/2023',
      endDate: '31/01/2023'
    },
    inscription: {
      status: 'PENDIENTE',
      date: '15/01/2023'
    }
  };



  ngOnChanges(changes: SimpleChanges): void {
    if (changes['subject'] || changes['content']) {
      this.processTemplate();
    }
  }

  /**
   * Procesa la plantilla reemplazando las variables con valores de ejemplo
   */
  processTemplate(): void {
    this.processedSubject = this.templateVariablesService.processTemplate(
      this.subject,
      this.previewData
    );

    this.processedContent = this.templateVariablesService.processTemplate(
      this.content,
      this.previewData
    );
  }

  /**
   * Obtiene el icono para el tipo de notificación
   * @returns Nombre del icono
   */
  getNotificationTypeIcon(): string {
    switch (this.type) {
      case NotificationType.INSCRIPTION:
        return 'how_to_reg';
      case NotificationType.CONTEST:
        return 'gavel';
      case NotificationType.DOCUMENT:
        return 'description';
      case NotificationType.EXAM:
        return 'school';
      case NotificationType.SYSTEM:
      default:
        return 'notifications';
    }
  }

  /**
   * Obtiene el color para el tipo de notificación
   * @returns Clase CSS para el color
   */
  getNotificationTypeColor(): string {
    switch (this.type) {
      case NotificationType.INSCRIPTION:
        return 'notification-inscription';
      case NotificationType.CONTEST:
        return 'notification-contest';
      case NotificationType.DOCUMENT:
        return 'notification-document';
      case NotificationType.EXAM:
        return 'notification-exam';
      case NotificationType.SYSTEM:
      default:
        return 'notification-system';
    }
  }

  /**
   * Obtiene el nombre para el tipo de notificación
   * @returns Nombre del tipo de notificación
   */
  getNotificationTypeName(): string {
    switch (this.type) {
      case NotificationType.INSCRIPTION:
        return 'Inscripción';
      case NotificationType.CONTEST:
        return 'Concurso';
      case NotificationType.DOCUMENT:
        return 'Documento';
      case NotificationType.EXAM:
        return 'Examen';
      case NotificationType.SYSTEM:
      default:
        return 'Sistema';
    }
  }

  /**
   * Obtiene el nombre para el nivel de acuse de recibo
   * @returns Nombre del nivel de acuse de recibo
   */
  getAcknowledgementLevelName(): string {
    switch (this.acknowledgementLevel) {
      case AcknowledgementLevel.SIMPLE:
        return 'Simple';
      case AcknowledgementLevel.SIGNATURE_BASIC:
        return 'Firma Básica';
      case AcknowledgementLevel.SIGNATURE_ADVANCED:
        return 'Firma Avanzada';
      case AcknowledgementLevel.NONE:
      default:
        return 'Ninguno';
    }
  }

  /**
   * Obtiene el icono para el nivel de acuse de recibo
   * @returns Nombre del icono
   */
  getAcknowledgementLevelIcon(): string {
    switch (this.acknowledgementLevel) {
      case AcknowledgementLevel.SIMPLE:
        return 'check';
      case AcknowledgementLevel.SIGNATURE_BASIC:
        return 'edit';
      case AcknowledgementLevel.SIGNATURE_ADVANCED:
        return 'verified';
      case AcknowledgementLevel.NONE:
      default:
        return 'visibility';
    }
  }
}
