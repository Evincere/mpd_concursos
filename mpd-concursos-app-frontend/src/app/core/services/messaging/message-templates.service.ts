import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '@environments/environment';

/**
 * Tipos de plantilla
 */
export type TemplateType = 
  | 'welcome' 
  | 'inscription_confirmation' 
  | 'document_request' 
  | 'document_approved' 
  | 'document_rejected' 
  | 'exam_notification' 
  | 'result_notification' 
  | 'reminder' 
  | 'custom';

/**
 * Categorías de plantilla
 */
export type TemplateCategory = 
  | 'inscription' 
  | 'documentation' 
  | 'examination' 
  | 'results' 
  | 'general' 
  | 'administrative';

/**
 * Variable de plantilla
 */
export interface TemplateVariable {
  key: string;
  label: string;
  description: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'object';
  required: boolean;
  defaultValue?: any;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
  examples?: string[];
}

/**
 * Plantilla de mensaje
 */
export interface MessageTemplate {
  id: string;
  name: string;
  description: string;
  type: TemplateType;
  category: TemplateCategory;
  subject: string;
  content: string;
  variables: TemplateVariable[];
  isActive: boolean;
  isSystem: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags: string[];
  metadata: {
    createdBy: string;
    createdAt: Date;
    updatedBy: string;
    updatedAt: Date;
    version: number;
    usageCount: number;
    lastUsed?: Date;
  };
  settings: {
    allowHtml: boolean;
    autoSend: boolean;
    requireApproval: boolean;
    expiresAfter?: number; // días
    maxRecipients?: number;
  };
}

/**
 * Contexto para renderizado de plantilla
 */
export interface TemplateContext {
  [key: string]: any;
  user?: {
    id: string;
    name: string;
    email: string;
    dni: string;
    role: string;
  };
  contest?: {
    id: string;
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
  };
  inscription?: {
    id: string;
    status: string;
    submittedAt: Date;
    documents: any[];
  };
  exam?: {
    id: string;
    title: string;
    date: Date;
    location: string;
    duration: number;
  };
  system?: {
    appName: string;
    supportEmail: string;
    baseUrl: string;
    currentDate: Date;
  };
}

/**
 * Resultado de renderizado
 */
export interface RenderedTemplate {
  subject: string;
  content: string;
  variables: { [key: string]: any };
  errors: string[];
  warnings: string[];
}

/**
 * Filtros de plantillas
 */
export interface TemplateFilters {
  type?: TemplateType;
  category?: TemplateCategory;
  isActive?: boolean;
  isSystem?: boolean;
  tags?: string[];
  search?: string;
  createdBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Estadísticas de plantillas
 */
export interface TemplateStats {
  totalTemplates: number;
  activeTemplates: number;
  systemTemplates: number;
  customTemplates: number;
  byCategory: Record<TemplateCategory, number>;
  byType: Record<TemplateType, number>;
  mostUsed: Array<{ templateId: string; name: string; usageCount: number }>;
  recentlyCreated: Array<{ templateId: string; name: string; createdAt: Date }>;
}

/**
 * Servicio de plantillas de mensajes
 */
@Injectable({
  providedIn: 'root'
})
export class MessageTemplatesService {

  private readonly apiUrl = `${environment.apiUrl}/messaging/templates`;

  // Estados reactivos
  private templatesSubject = new BehaviorSubject<MessageTemplate[]>([]);
  private filtersSubject = new BehaviorSubject<TemplateFilters>({});
  private statsSubject = new BehaviorSubject<TemplateStats | null>(null);

  // Observables públicos
  public templates$ = this.templatesSubject.asObservable();
  public filters$ = this.filtersSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();

  // Variables del sistema disponibles
  private systemVariables: TemplateVariable[] = [
    {
      key: 'user.name',
      label: 'Nombre del usuario',
      description: 'Nombre completo del usuario destinatario',
      type: 'text',
      required: false,
      examples: ['Juan Pérez', 'María García']
    },
    {
      key: 'user.email',
      label: 'Email del usuario',
      description: 'Dirección de correo electrónico del usuario',
      type: 'text',
      required: false,
      examples: ['juan.perez@email.com']
    },
    {
      key: 'user.dni',
      label: 'DNI del usuario',
      description: 'Documento Nacional de Identidad',
      type: 'text',
      required: false,
      examples: ['12345678']
    },
    {
      key: 'contest.title',
      label: 'Título del concurso',
      description: 'Nombre del concurso al que se refiere el mensaje',
      type: 'text',
      required: false,
      examples: ['Concurso Docente 2024']
    },
    {
      key: 'contest.startDate',
      label: 'Fecha de inicio del concurso',
      description: 'Fecha de inicio de inscripciones',
      type: 'date',
      required: false,
      examples: ['2024-01-15']
    },
    {
      key: 'contest.endDate',
      label: 'Fecha de fin del concurso',
      description: 'Fecha de cierre de inscripciones',
      type: 'date',
      required: false,
      examples: ['2024-02-15']
    },
    {
      key: 'inscription.status',
      label: 'Estado de inscripción',
      description: 'Estado actual de la inscripción del usuario',
      type: 'text',
      required: false,
      examples: ['PENDING', 'APPROVED', 'REJECTED']
    },
    {
      key: 'system.appName',
      label: 'Nombre de la aplicación',
      description: 'Nombre del sistema',
      type: 'text',
      required: false,
      defaultValue: 'MPD Concursos',
      examples: ['MPD Concursos']
    },
    {
      key: 'system.supportEmail',
      label: 'Email de soporte',
      description: 'Dirección de correo para soporte técnico',
      type: 'text',
      required: false,
      defaultValue: 'soporte@mpdconcursos.gov.ar',
      examples: ['soporte@mpdconcursos.gov.ar']
    },
    {
      key: 'system.currentDate',
      label: 'Fecha actual',
      description: 'Fecha y hora actual del sistema',
      type: 'date',
      required: false,
      examples: ['2024-01-15 10:30:00']
    }
  ];

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todas las plantillas
   */
  public getTemplates(filters?: TemplateFilters): Observable<MessageTemplate[]> {
    let params = new HttpParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            params = params.set(key, value.toISOString());
          } else if (Array.isArray(value)) {
            value.forEach(v => params = params.append(key, v.toString()));
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<MessageTemplate[]>(this.apiUrl, { params }).pipe(
      map(templates => templates.map(this.mapTemplate)),
      tap(templates => this.templatesSubject.next(templates)),
      catchError(this.handleError<MessageTemplate[]>('getTemplates', []))
    );
  }

  /**
   * Obtiene una plantilla por ID
   */
  public getTemplate(id: string): Observable<MessageTemplate> {
    return this.http.get<MessageTemplate>(`${this.apiUrl}/${id}`).pipe(
      map(this.mapTemplate),
      catchError(this.handleError<MessageTemplate>('getTemplate'))
    );
  }

  /**
   * Crea una nueva plantilla
   */
  public createTemplate(template: Partial<MessageTemplate>): Observable<MessageTemplate> {
    return this.http.post<MessageTemplate>(this.apiUrl, template).pipe(
      map(this.mapTemplate),
      tap(newTemplate => {
        const current = this.templatesSubject.value;
        this.templatesSubject.next([newTemplate, ...current]);
      }),
      catchError(this.handleError<MessageTemplate>('createTemplate'))
    );
  }

  /**
   * Actualiza una plantilla existente
   */
  public updateTemplate(id: string, template: Partial<MessageTemplate>): Observable<MessageTemplate> {
    return this.http.put<MessageTemplate>(`${this.apiUrl}/${id}`, template).pipe(
      map(this.mapTemplate),
      tap(updatedTemplate => {
        const current = this.templatesSubject.value;
        const index = current.findIndex(t => t.id === id);
        if (index !== -1) {
          current[index] = updatedTemplate;
          this.templatesSubject.next([...current]);
        }
      }),
      catchError(this.handleError<MessageTemplate>('updateTemplate'))
    );
  }

  /**
   * Elimina una plantilla
   */
  public deleteTemplate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const current = this.templatesSubject.value;
        this.templatesSubject.next(current.filter(t => t.id !== id));
      }),
      catchError(this.handleError<void>('deleteTemplate'))
    );
  }

  /**
   * Duplica una plantilla
   */
  public duplicateTemplate(id: string, newName: string): Observable<MessageTemplate> {
    return this.http.post<MessageTemplate>(`${this.apiUrl}/${id}/duplicate`, { name: newName }).pipe(
      map(this.mapTemplate),
      tap(duplicatedTemplate => {
        const current = this.templatesSubject.value;
        this.templatesSubject.next([duplicatedTemplate, ...current]);
      }),
      catchError(this.handleError<MessageTemplate>('duplicateTemplate'))
    );
  }

  /**
   * Renderiza una plantilla con contexto
   */
  public renderTemplate(templateId: string, context: TemplateContext): Observable<RenderedTemplate> {
    return this.http.post<RenderedTemplate>(`${this.apiUrl}/${templateId}/render`, context).pipe(
      catchError(this.handleError<RenderedTemplate>('renderTemplate'))
    );
  }

  /**
   * Previsualiza una plantilla sin guardar
   */
  public previewTemplate(template: Partial<MessageTemplate>, context: TemplateContext): Observable<RenderedTemplate> {
    return this.http.post<RenderedTemplate>(`${this.apiUrl}/preview`, { template, context }).pipe(
      catchError(this.handleError<RenderedTemplate>('previewTemplate'))
    );
  }

  /**
   * Valida una plantilla
   */
  public validateTemplate(template: Partial<MessageTemplate>): Observable<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    return this.http.post<{ isValid: boolean; errors: string[]; warnings: string[] }>(`${this.apiUrl}/validate`, template).pipe(
      catchError(this.handleError<{ isValid: boolean; errors: string[]; warnings: string[] }>('validateTemplate', {
        isValid: false,
        errors: ['Error de validación'],
        warnings: []
      }))
    );
  }

  /**
   * Obtiene estadísticas de plantillas
   */
  public getTemplateStats(): Observable<TemplateStats> {
    return this.http.get<TemplateStats>(`${this.apiUrl}/stats`).pipe(
      tap(stats => this.statsSubject.next(stats)),
      catchError(this.handleError<TemplateStats>('getTemplateStats'))
    );
  }

  /**
   * Obtiene variables del sistema disponibles
   */
  public getSystemVariables(): TemplateVariable[] {
    return [...this.systemVariables];
  }

  /**
   * Obtiene variables por categoría
   */
  public getVariablesByCategory(category: TemplateCategory): TemplateVariable[] {
    const categoryVariables: Record<TemplateCategory, string[]> = {
      inscription: ['user.*', 'contest.*', 'inscription.*', 'system.*'],
      documentation: ['user.*', 'contest.*', 'inscription.*', 'system.*'],
      examination: ['user.*', 'contest.*', 'exam.*', 'system.*'],
      results: ['user.*', 'contest.*', 'exam.*', 'system.*'],
      general: ['user.*', 'system.*'],
      administrative: ['user.*', 'contest.*', 'system.*']
    };

    const patterns = categoryVariables[category] || [];
    return this.systemVariables.filter(variable => 
      patterns.some(pattern => {
        if (pattern.endsWith('*')) {
          return variable.key.startsWith(pattern.slice(0, -1));
        }
        return variable.key === pattern;
      })
    );
  }

  /**
   * Actualiza filtros
   */
  public updateFilters(filters: Partial<TemplateFilters>): void {
    const currentFilters = this.filtersSubject.value;
    this.filtersSubject.next({ ...currentFilters, ...filters });
  }

  /**
   * Limpia filtros
   */
  public clearFilters(): void {
    this.filtersSubject.next({});
  }

  /**
   * Exporta plantillas
   */
  public exportTemplates(templateIds?: string[]): Observable<Blob> {
    const params = templateIds ? { templateIds } : {};
    return this.http.post(`${this.apiUrl}/export`, params, {
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError<Blob>('exportTemplates'))
    );
  }

  /**
   * Importa plantillas
   */
  public importTemplates(file: File): Observable<{ imported: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ imported: number; errors: string[] }>(`${this.apiUrl}/import`, formData).pipe(
      tap(() => {
        // Recargar plantillas después de importar
        this.getTemplates().subscribe();
      }),
      catchError(this.handleError<{ imported: number; errors: string[] }>('importTemplates', {
        imported: 0,
        errors: ['Error al importar plantillas']
      }))
    );
  }

  /**
   * Mapea plantilla desde API
   */
  private mapTemplate = (template: any): MessageTemplate => ({
    ...template,
    metadata: {
      ...template.metadata,
      createdAt: new Date(template.metadata.createdAt),
      updatedAt: new Date(template.metadata.updatedAt),
      lastUsed: template.metadata.lastUsed ? new Date(template.metadata.lastUsed) : undefined
    }
  });

  /**
   * Maneja errores de HTTP
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return new Observable(observer => {
        if (result !== undefined) {
          observer.next(result as T);
        }
        observer.complete();
      });
    };
  }
}
