import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { Observable, of } from 'rxjs';

import { MessageTemplate, TemplateType, TemplateCategory } from './message-templates.service';

/**
 * Plantilla del sistema predefinida
 */
export interface SystemTemplate {
  id: string;
  name: string;
  description: string;
  type: TemplateType;
  category: TemplateCategory;
  subject: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags: string[];
  variables: string[];
  isRequired: boolean;
  canModify: boolean;
  version: string;
}

/**
 * Servicio de plantillas del sistema
 */
@Injectable({
  providedIn: 'root'
})
export class SystemTemplatesService {

  // Plantillas predefinidas del sistema
  private systemTemplates: SystemTemplate[] = [
    {
      id: 'welcome-new-user',
      name: 'Bienvenida a Nuevo Usuario',
      description: 'Mensaje de bienvenida para usuarios que se registran por primera vez',
      type: 'welcome',
      category: 'general',
      subject: 'Bienvenido a {{system.appName}}',
      content: `Estimado/a {{user.name}},

¡Bienvenido/a a {{system.appName}}!

Nos complace informarte que tu registro se ha completado exitosamente. Ahora puedes acceder a nuestra plataforma y participar en los concursos disponibles.

**Datos de tu cuenta:**
- Nombre: {{user.name}}
- Email: {{user.email}}
- DNI: {{user.dni}}
- Fecha de registro: {{system.currentDate}}

**Próximos pasos:**
1. Completa tu perfil con toda la información requerida
2. Revisa los concursos disponibles
3. Prepara la documentación necesaria para tus postulaciones

Si tienes alguna consulta, no dudes en contactarnos a {{system.supportEmail}} o llamar al {{system.supportPhone}}.

¡Te deseamos mucho éxito en tus postulaciones!

Saludos cordiales,
Equipo de {{system.organizationName}}`,
      priority: 'normal',
      tags: ['bienvenida', 'registro', 'nuevo-usuario'],
      variables: ['user.name', 'user.email', 'user.dni', 'system.appName', 'system.currentDate', 'system.supportEmail', 'system.supportPhone', 'system.organizationName'],
      isRequired: true,
      canModify: true,
      version: '1.0'
    },
    {
      id: 'inscription-confirmation',
      name: 'Confirmación de Inscripción',
      description: 'Confirmación automática cuando un usuario se inscribe a un concurso',
      type: 'inscription_confirmation',
      category: 'inscription',
      subject: 'Confirmación de inscripción - {{contest.title}}',
      content: `Estimado/a {{user.name}},

Confirmamos que tu inscripción al concurso "{{contest.title}}" ha sido recibida exitosamente.

**Detalles del concurso:**
- Título: {{contest.title}}
- Categoría: {{contest.category}}
- Fecha de inicio: {{contest.startDate}}
- Fecha de finalización: {{contest.endDate}}
- Ubicación: {{contest.location}}

**Detalles de tu inscripción:**
- Fecha de inscripción: {{inscription.submittedAt}}
- Estado: {{inscription.status}}
- Completitud: {{inscription.completionPercentage}}
- Estado de documentos: {{inscription.documentsStatus}}

**Próximos pasos:**
1. Completa toda la documentación requerida antes del {{contest.inscriptionEndDate}}
2. Mantente atento a las comunicaciones sobre fechas de examen
3. Revisa regularmente el estado de tu inscripción en la plataforma

Puedes acceder a tu inscripción en: {{system.baseUrl}}

Para consultas, contáctanos en {{system.supportEmail}}

Saludos cordiales,
Equipo de {{system.organizationName}}`,
      priority: 'high',
      tags: ['inscripción', 'confirmación', 'concurso'],
      variables: ['user.name', 'contest.title', 'contest.category', 'contest.startDate', 'contest.endDate', 'contest.location', 'contest.inscriptionEndDate', 'inscription.submittedAt', 'inscription.status', 'inscription.completionPercentage', 'inscription.documentsStatus', 'system.baseUrl', 'system.supportEmail', 'system.organizationName'],
      isRequired: true,
      canModify: true,
      version: '1.0'
    },
    {
      id: 'document-request',
      name: 'Solicitud de Documentos',
      description: 'Solicitud para completar documentación faltante',
      type: 'document_request',
      category: 'documentation',
      subject: 'Documentación pendiente - {{contest.title}}',
      content: `Estimado/a {{user.name}},

Te escribimos para informarte que tu inscripción al concurso "{{contest.title}}" requiere documentación adicional para completar el proceso.

**Estado actual de tu inscripción:**
- Completitud: {{inscription.completionPercentage}}
- Estado de documentos: {{inscription.documentsStatus}}

**Documentos pendientes:**
Por favor, ingresa a la plataforma para revisar qué documentos específicos necesitas cargar.

**Fecha límite:**
Tienes hasta el {{contest.inscriptionEndDate}} para completar toda la documentación requerida.

**Instrucciones:**
1. Accede a {{system.baseUrl}}
2. Ve a "Mis Inscripciones"
3. Selecciona el concurso "{{contest.title}}"
4. Completa la carga de documentos pendientes

**Importante:** Si no completas la documentación antes de la fecha límite, tu inscripción podría ser rechazada.

Para asistencia técnica, contáctanos en {{system.supportEmail}}

Saludos cordiales,
Equipo de {{system.organizationName}}`,
      priority: 'high',
      tags: ['documentos', 'pendiente', 'recordatorio'],
      variables: ['user.name', 'contest.title', 'contest.inscriptionEndDate', 'inscription.completionPercentage', 'inscription.documentsStatus', 'system.baseUrl', 'system.supportEmail', 'system.organizationName'],
      isRequired: true,
      canModify: true,
      version: '1.0'
    },
    {
      id: 'document-approved',
      name: 'Documentos Aprobados',
      description: 'Notificación de aprobación de documentación',
      type: 'document_approved',
      category: 'documentation',
      subject: 'Documentación aprobada - {{contest.title}}',
      content: `Estimado/a {{user.name}},

¡Excelentes noticias! Tu documentación para el concurso "{{contest.title}}" ha sido revisada y aprobada.

**Estado de tu inscripción:**
- Estado: {{inscription.status}}
- Documentación: {{inscription.documentsStatus}}
- Completitud: {{inscription.completionPercentage}}

**Próximos pasos:**
1. Mantente atento a las comunicaciones sobre fechas de examen
2. Prepárate para las evaluaciones correspondientes
3. Revisa regularmente tu perfil para actualizaciones

Tu inscripción está ahora completa y en proceso. Te notificaremos sobre los siguientes pasos del concurso.

Puedes revisar el estado en: {{system.baseUrl}}

¡Te deseamos mucho éxito!

Saludos cordiales,
Equipo de {{system.organizationName}}`,
      priority: 'normal',
      tags: ['documentos', 'aprobado', 'éxito'],
      variables: ['user.name', 'contest.title', 'inscription.status', 'inscription.documentsStatus', 'inscription.completionPercentage', 'system.baseUrl', 'system.organizationName'],
      isRequired: true,
      canModify: true,
      version: '1.0'
    },
    {
      id: 'document-rejected',
      name: 'Documentos Rechazados',
      description: 'Notificación de rechazo de documentación con instrucciones',
      type: 'document_rejected',
      category: 'documentation',
      subject: 'Documentación requiere correcciones - {{contest.title}}',
      content: `Estimado/a {{user.name}},

Te escribimos para informarte que algunos documentos de tu inscripción al concurso "{{contest.title}}" requieren correcciones.

**Estado actual:**
- Estado de inscripción: {{inscription.status}}
- Estado de documentos: {{inscription.documentsStatus}}

**Acciones requeridas:**
1. Accede a {{system.baseUrl}}
2. Revisa los comentarios específicos sobre cada documento
3. Corrige y vuelve a cargar los documentos observados
4. Asegúrate de que cumplan con todos los requisitos

**Fecha límite para correcciones:**
Tienes hasta el {{contest.inscriptionEndDate}} para realizar las correcciones necesarias.

**Importante:** 
- Revisa cuidadosamente los comentarios de revisión
- Asegúrate de que los documentos sean legibles y estén completos
- Verifica que cumplan con los formatos requeridos

Para consultas específicas sobre los documentos, contáctanos en {{system.supportEmail}}

Saludos cordiales,
Equipo de {{system.organizationName}}`,
      priority: 'urgent',
      tags: ['documentos', 'rechazado', 'corrección'],
      variables: ['user.name', 'contest.title', 'contest.inscriptionEndDate', 'inscription.status', 'inscription.documentsStatus', 'system.baseUrl', 'system.supportEmail', 'system.organizationName'],
      isRequired: true,
      canModify: true,
      version: '1.0'
    },
    {
      id: 'exam-notification',
      name: 'Notificación de Examen',
      description: 'Información sobre fecha, hora y lugar del examen',
      type: 'exam_notification',
      category: 'examination',
      subject: 'Convocatoria a examen - {{contest.title}}',
      content: `Estimado/a {{user.name}},

Te convocamos a rendir el examen correspondiente al concurso "{{contest.title}}".

**Detalles del examen:**
- Título: {{exam.title}}
- Fecha: {{exam.date}}
- Hora de inicio: {{exam.startTime}}
- Duración: {{exam.duration}}
- Lugar: {{exam.location}}

**Instrucciones importantes:**
1. Presenta tu DNI original al momento del examen
2. Llega 30 minutos antes del horario de inicio
3. No se permitirá el ingreso después de la hora establecida
4. Trae elementos de escritura (lapicera azul o negra)

**Preparación:**
- Revisa el temario disponible en la plataforma
- Asegúrate de conocer la ubicación del lugar de examen
- Descansa bien la noche anterior

**Contacto:**
Para consultas urgentes, comunícate con {{system.supportEmail}} o {{system.supportPhone}}

¡Te deseamos mucho éxito en tu examen!

Saludos cordiales,
Equipo de {{system.organizationName}}`,
      priority: 'urgent',
      tags: ['examen', 'convocatoria', 'evaluación'],
      variables: ['user.name', 'contest.title', 'exam.title', 'exam.date', 'exam.startTime', 'exam.duration', 'exam.location', 'system.supportEmail', 'system.supportPhone', 'system.organizationName'],
      isRequired: true,
      canModify: true,
      version: '1.0'
    },
    {
      id: 'result-notification',
      name: 'Notificación de Resultados',
      description: 'Comunicación de resultados del concurso',
      type: 'result_notification',
      category: 'results',
      subject: 'Resultados del concurso - {{contest.title}}',
      content: `Estimado/a {{user.name}},

Te informamos que ya están disponibles los resultados del concurso "{{contest.title}}".

**Tu resultado:**
- Estado: {{inscription.resultStatus}}
- Puntuación obtenida: {{inscription.score}}
- Posición en el ranking: {{inscription.ranking}}

**Detalles del concurso:**
- Concurso: {{contest.title}}
- Categoría: {{contest.category}}
- Fecha de examen: {{exam.date}}

**Próximos pasos:**
Los resultados completos y el ranking general están disponibles en la plataforma.

Puedes consultar los detalles en: {{system.baseUrl}}

**Recursos adicionales:**
- Si tienes consultas sobre tu resultado, contáctanos en {{system.supportEmail}}
- Para información sobre próximos concursos, mantente atento a nuestras comunicaciones

Agradecemos tu participación en este concurso.

Saludos cordiales,
Equipo de {{system.organizationName}}`,
      priority: 'high',
      tags: ['resultados', 'puntuación', 'ranking'],
      variables: ['user.name', 'contest.title', 'contest.category', 'exam.date', 'inscription.resultStatus', 'inscription.score', 'inscription.ranking', 'system.baseUrl', 'system.supportEmail', 'system.organizationName'],
      isRequired: true,
      canModify: true,
      version: '1.0'
    },
    {
      id: 'reminder-deadline',
      name: 'Recordatorio de Fecha Límite',
      description: 'Recordatorio general para fechas límite importantes',
      type: 'reminder',
      category: 'general',
      subject: 'Recordatorio: Fecha límite próxima - {{contest.title}}',
      content: `Estimado/a {{user.name}},

Te recordamos que se acerca una fecha límite importante para el concurso "{{contest.title}}".

**Fecha límite:** {{contest.inscriptionEndDate}}

**Estado actual de tu inscripción:**
- Completitud: {{inscription.completionPercentage}}
- Estado: {{inscription.status}}
- Documentos: {{inscription.documentsStatus}}

**Acciones pendientes:**
Si aún no has completado tu inscripción, te recomendamos:
1. Revisar todos los requisitos
2. Completar la documentación faltante
3. Verificar que toda la información esté correcta

**Acceso rápido:**
Ingresa a {{system.baseUrl}} para completar tu inscripción.

**Importante:** Después de la fecha límite no se aceptarán modificaciones ni documentación adicional.

Para asistencia, contáctanos en {{system.supportEmail}}

Saludos cordiales,
Equipo de {{system.organizationName}}`,
      priority: 'high',
      tags: ['recordatorio', 'fecha-límite', 'urgente'],
      variables: ['user.name', 'contest.title', 'contest.inscriptionEndDate', 'inscription.completionPercentage', 'inscription.status', 'inscription.documentsStatus', 'system.baseUrl', 'system.supportEmail', 'system.organizationName'],
      isRequired: false,
      canModify: true,
      version: '1.0'
    }
  ];

  constructor(
    private loggingService: LoggingService
  ) {}

  /**
   * Obtiene todas las plantillas del sistema
   */
  public getSystemTemplates(): Observable<SystemTemplate[]> {
    return of([...this.systemTemplates]);
  }

  /**
   * Obtiene plantillas por tipo
   */
  public getTemplatesByType(type: TemplateType): Observable<SystemTemplate[]> {
    const filtered = this.systemTemplates.filter(template => template.type === type);
    return of(filtered);
  }

  /**
   * Obtiene plantillas por categoría
   */
  public getTemplatesByCategory(category: TemplateCategory): Observable<SystemTemplate[]> {
    const filtered = this.systemTemplates.filter(template => template.category === category);
    return of(filtered);
  }

  /**
   * Obtiene una plantilla específica
   */
  public getTemplate(id: string): Observable<SystemTemplate | undefined> {
    const template = this.systemTemplates.find(t => t.id === id);
    return of(template);
  }

  /**
   * Convierte plantilla del sistema a plantilla de mensaje
   */
  public convertToMessageTemplate(systemTemplate: SystemTemplate): Partial<MessageTemplate> {
    return {
      name: systemTemplate.name,
      description: systemTemplate.description,
      type: systemTemplate.type,
      category: systemTemplate.category,
      subject: systemTemplate.subject,
      content: systemTemplate.content,
      priority: systemTemplate.priority,
      tags: [...systemTemplate.tags],
      isActive: true,
      isSystem: true,
      settings: {
        allowHtml: false,
        autoSend: false,
        requireApproval: false
      },
      variables: systemTemplate.variables.map(key => ({
        key,
        label: key.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: `Variable del sistema: ${key}`,
        type: 'text' as const,
        required: false
      }))
    };
  }

  /**
   * Instala plantillas del sistema
   */
  public installSystemTemplates(): Observable<MessageTemplate[]> {
    const messageTemplates = this.systemTemplates.map(template => 
      this.convertToMessageTemplate(template) as MessageTemplate
    );
    
    return of(messageTemplates);
  }

  /**
   * Verifica si una plantilla es requerida
   */
  public isRequiredTemplate(id: string): boolean {
    const template = this.systemTemplates.find(t => t.id === id);
    return template?.isRequired || false;
  }

  /**
   * Verifica si una plantilla puede ser modificada
   */
  public canModifyTemplate(id: string): boolean {
    const template = this.systemTemplates.find(t => t.id === id);
    return template?.canModify || false;
  }

  /**
   * Obtiene plantillas requeridas faltantes
   */
  public getMissingRequiredTemplates(existingTemplateIds: string[]): Observable<SystemTemplate[]> {
    const missing = this.systemTemplates.filter(template => 
      template.isRequired && !existingTemplateIds.includes(template.id)
    );
    
    return of(missing);
  }
}
