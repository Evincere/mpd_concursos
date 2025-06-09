import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  QuickResponseTemplate,
  TicketCategory
} from '../../models/support-ticket.model';

/**
 * Servicio para gestión de plantillas de respuesta rápida
 */
@Injectable({
  providedIn: 'root'
})
export class QuickResponseService {
  private readonly apiUrl = `${environment.apiUrl}/support/quick-responses`;
  
  // Estados reactivos
  private templatesSubject = new BehaviorSubject<QuickResponseTemplate[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  // Observables públicos
  public templates$ = this.templatesSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  // Plantillas predefinidas
  private defaultTemplates: QuickResponseTemplate[] = [
    {
      id: 'welcome-template',
      name: 'Bienvenida y Confirmación',
      category: TicketCategory.GENERAL,
      subject: 'Hemos recibido su consulta - Ticket #{ticketNumber}',
      content: `Estimado/a {reporterName},

Hemos recibido su consulta y le hemos asignado el número de ticket #{ticketNumber}.

Nuestro equipo de soporte revisará su solicitud y le responderemos dentro de {responseTime}.

Detalles de su consulta:
- Categoría: {category}
- Prioridad: {priority}
- Fecha de creación: {createdAt}

Si tiene información adicional que pueda ayudarnos a resolver su consulta más rápidamente, no dude en responder a este mensaje.

Atentamente,
Equipo de Soporte MPD`,
      isActive: true,
      usageCount: 0,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'technical-investigation',
      name: 'Investigación Técnica',
      category: TicketCategory.TECHNICAL,
      subject: 'Investigando su problema técnico - Ticket #{ticketNumber}',
      content: `Estimado/a {reporterName},

Gracias por reportar este problema técnico. Nuestro equipo técnico está investigando el issue que ha reportado.

Para ayudarnos a resolver este problema más eficientemente, por favor proporcione la siguiente información si aún no lo ha hecho:

1. Navegador web y versión que está utilizando
2. Sistema operativo
3. Pasos exactos que siguió antes de encontrar el problema
4. Mensaje de error específico (si aplica)
5. Capturas de pantalla del problema

Estimamos resolver este problema dentro de {resolutionTime}.

Atentamente,
Equipo Técnico MPD`,
      isActive: true,
      usageCount: 0,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'account-verification',
      name: 'Verificación de Cuenta',
      category: TicketCategory.ACCOUNT,
      subject: 'Verificación de identidad requerida - Ticket #{ticketNumber}',
      content: `Estimado/a {reporterName},

Para procesar su solicitud relacionada con su cuenta, necesitamos verificar su identidad por motivos de seguridad.

Por favor, proporcione la siguiente información:

1. Número de documento de identidad
2. Fecha de nacimiento
3. Dirección de correo electrónico registrada en su cuenta
4. Última fecha de acceso a su cuenta (aproximada)

Esta información será tratada de forma confidencial y solo será utilizada para verificar su identidad.

Una vez verificada su identidad, procederemos con su solicitud inmediatamente.

Atentamente,
Equipo de Seguridad MPD`,
      isActive: true,
      usageCount: 0,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'inscription-help',
      name: 'Ayuda con Inscripción',
      category: TicketCategory.INSCRIPTION,
      subject: 'Asistencia con su proceso de inscripción - Ticket #{ticketNumber}',
      content: `Estimado/a {reporterName},

Entendemos que está experimentando dificultades con el proceso de inscripción. Estamos aquí para ayudarle.

Los problemas más comunes en el proceso de inscripción incluyen:

1. **Documentos requeridos**: Asegúrese de tener todos los documentos en formato PDF y que no excedan 10MB cada uno
2. **Formulario incompleto**: Verifique que todos los campos obligatorios estén completados
3. **Fechas límite**: Confirme que el período de inscripción esté abierto
4. **Requisitos específicos**: Revise que cumple con todos los requisitos del concurso

Si continúa experimentando problemas, por favor proporcione:
- Nombre del concurso al que intenta inscribirse
- Descripción específica del error o problema
- Capturas de pantalla si es posible

Le ayudaremos a completar su inscripción exitosamente.

Atentamente,
Equipo de Inscripciones MPD`,
      isActive: true,
      usageCount: 0,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'document-validation',
      name: 'Validación de Documentos',
      category: TicketCategory.DOCUMENTS,
      subject: 'Estado de validación de documentos - Ticket #{ticketNumber}',
      content: `Estimado/a {reporterName},

Hemos revisado los documentos que ha enviado para su inscripción.

**Estado actual de sus documentos:**

Documentos aprobados:
- [Lista de documentos aprobados]

Documentos que requieren corrección:
- [Lista de documentos con observaciones]

**Observaciones y recomendaciones:**
- Asegúrese de que los documentos estén completamente legibles
- Verifique que las fechas sean válidas y actuales
- Confirme que los documentos estén firmados donde sea requerido

**Próximos pasos:**
1. Corrija los documentos observados
2. Vuelva a cargar los documentos corregidos
3. Espere la nueva validación (tiempo estimado: 2-3 días hábiles)

Si tiene preguntas sobre las observaciones, no dude en contactarnos.

Atentamente,
Equipo de Validación de Documentos MPD`,
      isActive: true,
      usageCount: 0,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'resolution-confirmation',
      name: 'Confirmación de Resolución',
      category: TicketCategory.GENERAL,
      subject: 'Su consulta ha sido resuelta - Ticket #{ticketNumber}',
      content: `Estimado/a {reporterName},

Nos complace informarle que hemos resuelto su consulta (Ticket #{ticketNumber}).

**Resumen de la solución:**
[Descripción de la solución implementada]

**Pasos realizados:**
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

Si la solución proporcionada resuelve completamente su problema, este ticket será cerrado automáticamente en 24 horas.

Si aún experimenta problemas o tiene preguntas adicionales, por favor responda a este mensaje antes de que el ticket se cierre automáticamente.

**Su opinión es importante para nosotros:**
Por favor, tómese un momento para calificar la atención recibida. Su feedback nos ayuda a mejorar nuestro servicio.

Gracias por contactar al soporte de MPD.

Atentamente,
Equipo de Soporte MPD`,
      isActive: true,
      usageCount: 0,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'escalation-notification',
      name: 'Notificación de Escalamiento',
      category: TicketCategory.GENERAL,
      subject: 'Su consulta ha sido escalada - Ticket #{ticketNumber}',
      content: `Estimado/a {reporterName},

Su consulta (Ticket #{ticketNumber}) ha sido escalada a nuestro equipo especializado para garantizar una resolución más rápida y efectiva.

**Motivo del escalamiento:**
- Su consulta requiere atención especializada
- El tiempo de respuesta inicial ha sido excedido
- La complejidad del caso amerita revisión adicional

**Qué significa esto para usted:**
- Un especialista senior revisará su caso
- Recibirá una respuesta prioritaria
- Se asignará un agente dedicado a su consulta

**Tiempo estimado de resolución:** {escalatedResolutionTime}

Agradecemos su paciencia y le aseguramos que estamos trabajando diligentemente para resolver su consulta.

Atentamente,
Equipo de Soporte Especializado MPD`,
      isActive: true,
      usageCount: 0,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  constructor(
    private http: HttpClient,
    private loggingService: LoggingService
  ) {
    this.loadTemplates();
  }

  /**
   * Obtiene todas las plantillas de respuesta rápida
   */
  getTemplates(category?: TicketCategory): Observable<QuickResponseTemplate[]> {
    this.loadingSubject.next(true);
    
    let url = this.apiUrl;
    if (category) {
      url += `?category=${category}`;
    }

    return this.http.get<any>(url).pipe(
      map(response => response.data || this.getFilteredDefaultTemplates(category)),
      tap(templates => {
        this.templatesSubject.next(templates);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        // Si hay error, usar plantillas por defecto
        const templates = this.getFilteredDefaultTemplates(category);
        this.templatesSubject.next(templates);
        this.loadingSubject.next(false);
        console.warn('Error cargando plantillas, usando valores por defecto:', error);
        return of(templates);
      })
    );
  }

  /**
   * Obtiene una plantilla por ID
   */
  getTemplateById(id: string): Observable<QuickResponseTemplate | null> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data),
      catchError(error => {
        // Buscar en plantillas por defecto
        const template = this.defaultTemplates.find(t => t.id === id);
        return of(template || null);
      })
    );
  }

  /**
   * Crea una nueva plantilla
   */
  createTemplate(template: Omit<QuickResponseTemplate, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>): Observable<QuickResponseTemplate> {
    const newTemplate = {
      ...template,
      usageCount: 0
    };

    return this.http.post<any>(this.apiUrl, newTemplate).pipe(
      map(response => response.data),
      tap(() => this.loadTemplates()),
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza una plantilla existente
   */
  updateTemplate(id: string, updates: Partial<QuickResponseTemplate>): Observable<QuickResponseTemplate> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, updates).pipe(
      map(response => response.data),
      tap(() => this.loadTemplates()),
      catchError(this.handleError)
    );
  }

  /**
   * Elimina una plantilla
   */
  deleteTemplate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loadTemplates()),
      catchError(this.handleError)
    );
  }

  /**
   * Activa o desactiva una plantilla
   */
  toggleTemplate(id: string, isActive: boolean): Observable<QuickResponseTemplate> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/toggle`, { isActive }).pipe(
      map(response => response.data),
      tap(() => this.loadTemplates()),
      catchError(this.handleError)
    );
  }

  /**
   * Incrementa el contador de uso de una plantilla
   */
  incrementUsage(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/use`, {}).pipe(
      tap(() => this.loadTemplates()),
      catchError(this.handleError)
    );
  }

  /**
   * Procesa variables en el contenido de una plantilla
   */
  processTemplate(template: QuickResponseTemplate, variables: Record<string, any>): QuickResponseTemplate {
    let processedSubject = template.subject;
    let processedContent = template.content;

    // Reemplazar variables en el subject y content
    Object.keys(variables).forEach(key => {
      const value = variables[key] || '';
      const regex = new RegExp(`{${key}}`, 'g');
      processedSubject = processedSubject.replace(regex, value);
      processedContent = processedContent.replace(regex, value);
    });

    return {
      ...template,
      subject: processedSubject,
      content: processedContent
    };
  }

  /**
   * Obtiene plantillas por categoría
   */
  getTemplatesByCategory(category: TicketCategory): Observable<QuickResponseTemplate[]> {
    return this.templates$.pipe(
      map(templates => templates.filter(t => t.category === category && t.isActive))
    );
  }

  /**
   * Obtiene las plantillas más utilizadas
   */
  getMostUsedTemplates(limit = 5): Observable<QuickResponseTemplate[]> {
    return this.templates$.pipe(
      map(templates => 
        templates
          .filter(t => t.isActive)
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, limit)
      )
    );
  }

  /**
   * Métodos privados
   */
  private loadTemplates(): void {
    this.getTemplates().subscribe();
  }

  private getFilteredDefaultTemplates(category?: TicketCategory): QuickResponseTemplate[] {
    if (category) {
      return this.defaultTemplates.filter(t => t.category === category);
    }
    return this.defaultTemplates;
  }

  private handleError(error: any): Observable<never> {
    console.error('Error en QuickResponseService:', error);
    return throwError(() => error);
  }
}
