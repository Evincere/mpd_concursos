import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';

/**
 * Interfaz para los campos de un reporte
 */
export interface ReportField {
  id: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'boolean' | 'enum';
  group: 'user' | 'contest' | 'inscription' | 'document';
  options?: { value: string, label: string }[];
}

/**
 * Interfaz para las plantillas de reportes
 */
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  fields: string[];
  filters: Record<string, unknown>;
  groupBy?: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

/**
 * Interfaz para los parámetros de generación de reportes
 */
export interface ReportParams {
  reportName: string;
  fields: string[];
  filters: {
    inscriptionState?: InscripcionState;
    dateRange?: {
      startDate: Date | null;
      endDate: Date | null;
    };
    contestId?: string;
    searchText?: string;
    [key: string]: unknown;
  };
  grouping: {
    groupBy?: string;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
  };
}

/**
 * Interfaz para las opciones de exportación
 */
export interface ExportOptions {
  format: 'excel' | 'csv' | 'pdf';
  includeHeaders: boolean;
  fileName: string;
}

/**
 * Interfaz para las estadísticas del sistema
 */
export interface SystemStats {
  users: {
    total: number;
    active: number;
    byRole: Record<string, number>;
    newByPeriod: Record<string, number>;
  };
  contests: {
    total: number;
    active: number;
    upcoming: number;
    finished: number;
    byDepartment: Record<string, number>;
  };
  inscriptions: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    byState: Record<string, number>;
    byPeriod: Record<string, number>;
  };
  documents: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    byType: Record<string, number>;
  };
  performance: {
    averageResponseTime: number;
    errorRate: number;
    serverLoad: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AdminReportsService {
  private apiUrl = `${environment.apiUrl}/admin/reports`;
  private http: HttpClient;

  constructor() {
    // En una implementación real, se inyectaría HttpClient
    this.http = {
      get: <T>(_url: string): Observable<T> => {
        return of({} as T);
      },
      post: <T>(_url: string, _body: unknown, _options?: unknown): Observable<T> => {
        return of({} as T);
      }
    } as HttpClient;
  }


  // Campos disponibles para reportes
  private availableFields: ReportField[] = [
    // Campos de usuario
    { id: 'userFullName', label: 'Nombre completo', type: 'text', group: 'user' },
    { id: 'userDni', label: 'DNI', type: 'text', group: 'user' },
    { id: 'userEmail', label: 'Email', type: 'text', group: 'user' },
    { id: 'userPhone', label: 'Teléfono', type: 'text', group: 'user' },
    { id: 'userAddress', label: 'Dirección', type: 'text', group: 'user' },
    { id: 'userRole', label: 'Rol', type: 'enum', group: 'user', options: [
      { value: 'ROLE_ADMIN', label: 'Administrador' },
      { value: 'ROLE_USER', label: 'Usuario' }
    ]},

    // Campos de concurso
    { id: 'contestId', label: 'ID de Concurso', type: 'text', group: 'contest' },
    { id: 'contestTitle', label: 'Título de Concurso', type: 'text', group: 'contest' },
    { id: 'contestDepartment', label: 'Departamento', type: 'text', group: 'contest' },
    { id: 'contestStartDate', label: 'Fecha de inicio', type: 'date', group: 'contest' },
    { id: 'contestEndDate', label: 'Fecha de fin', type: 'date', group: 'contest' },
    { id: 'contestState', label: 'Estado del concurso', type: 'enum', group: 'contest', options: [
      { value: 'DRAFT', label: 'Borrador' },
      { value: 'PUBLISHED', label: 'Publicado' },
      { value: 'INSCRIPTION_OPEN', label: 'Inscripciones Abiertas' },
      { value: 'INSCRIPTION_CLOSED', label: 'Inscripciones Cerradas' },
      { value: 'FINISHED', label: 'Finalizado' }
    ]},

    // Campos de inscripción
    { id: 'inscriptionId', label: 'ID de Inscripción', type: 'text', group: 'inscription' },
    { id: 'inscriptionState', label: 'Estado de inscripción', type: 'enum', group: 'inscription', options: [
      { value: 'NO_INSCRIPTO', label: 'No inscripto' },
      { value: 'IN_PROCESS', label: 'En proceso' },
      { value: 'PENDING', label: 'Pendiente' },
      { value: 'APPROVED', label: 'Aprobada' },
      { value: 'REJECTED', label: 'Rechazada' },
      { value: 'CANCELLED', label: 'Cancelada' }
    ]},
    { id: 'inscriptionCreatedAt', label: 'Fecha de creación', type: 'date', group: 'inscription' },
    { id: 'inscriptionUpdatedAt', label: 'Fecha de actualización', type: 'date', group: 'inscription' },

    // Campos de documentos
    { id: 'documentsCount', label: 'Total de documentos', type: 'number', group: 'document' },
    { id: 'pendingDocuments', label: 'Documentos pendientes', type: 'number', group: 'document' },
    { id: 'approvedDocuments', label: 'Documentos aprobados', type: 'number', group: 'document' },
    { id: 'rejectedDocuments', label: 'Documentos rechazados', type: 'number', group: 'document' }
  ];

  // Plantillas predefinidas
  private reportTemplates: ReportTemplate[] = [
    {
      id: 'inscriptions-by-status',
      name: 'Inscripciones por Estado',
      description: 'Reporte de inscripciones agrupadas por estado',
      fields: ['userFullName', 'userDni', 'contestTitle', 'inscriptionState', 'inscriptionCreatedAt'],
      filters: { },
      groupBy: 'inscriptionState',
      sortBy: 'inscriptionCreatedAt',
      sortDirection: 'desc'
    },
    {
      id: 'pending-inscriptions',
      name: 'Inscripciones Pendientes',
      description: 'Listado de inscripciones pendientes de revisión',
      fields: ['userFullName', 'userDni', 'userEmail', 'contestTitle', 'inscriptionCreatedAt', 'documentsCount'],
      filters: { inscriptionState: InscripcionState.PENDING },
      sortBy: 'inscriptionCreatedAt',
      sortDirection: 'asc'
    },
    {
      id: 'documents-status',
      name: 'Estado de Documentos',
      description: 'Reporte del estado de documentos por inscripción',
      fields: ['userFullName', 'contestTitle', 'documentsCount', 'pendingDocuments', 'approvedDocuments', 'rejectedDocuments'],
      filters: { },
      sortBy: 'pendingDocuments',
      sortDirection: 'desc'
    }
  ];



  /**
   * Obtiene todos los campos disponibles para reportes
   */
  getAvailableFields(): Observable<ReportField[]> {
    // En una implementación real, esto podría ser una llamada a la API
    return of(this.availableFields);
  }

  /**
   * Obtiene todas las plantillas de reportes disponibles
   */
  getReportTemplates(): Observable<ReportTemplate[]> {
    // En una implementación real, esto podría ser una llamada a la API
    return of(this.reportTemplates);
  }

  /**
   * Obtiene una plantilla de reporte específica por su ID
   * @param templateId ID de la plantilla
   */
  getReportTemplate(templateId: string): Observable<ReportTemplate | undefined> {
    return this.getReportTemplates().pipe(
      map(templates => templates.find(template => template.id === templateId))
    );
  }

  /**
   * Genera un reporte basado en los parámetros proporcionados
   * @param params Parámetros del reporte
   */
  generateReport(params: ReportParams): Observable<Record<string, unknown>[]> {
    // En una implementación real, esto sería una llamada a la API
    // return this.http.post<Record<string, unknown>[]>(`${this.apiUrl}/generate`, params);

    // Implementación mock para desarrollo
    return of(this.getMockReportData(params.fields, 20));
  }

  /**
   * Exporta un reporte en el formato especificado
   * @param data Datos del reporte
   * @param options Opciones de exportación
   */
  exportReport(data: Record<string, unknown>[], options: ExportOptions): Observable<Blob> {
    // En una implementación real, esto sería una llamada a la API
    // return this.http.post(`${this.apiUrl}/export`, { data, options }, { responseType: 'blob' });

    // Implementación mock para desarrollo
    // Aquí se implementaría la lógica de exportación real
    console.log(`Exportando reporte en formato ${options.format}`);

    // Devolvemos un blob vacío para simular la respuesta
    return of(new Blob([]));
  }

  /**
   * Obtiene estadísticas del sistema
   */
  getSystemStats(): Observable<SystemStats> {
    // En una implementación real, esto sería una llamada a la API
    // return this.http.get<SystemStats>(`${this.apiUrl}/stats`);

    // Implementación mock para desarrollo
    return of(this.getMockSystemStats());
  }

  /**
   * Genera datos mock para un reporte
   * @param fields Campos a incluir en el reporte
   * @param count Número de filas a generar
   */
  private getMockReportData(fields: string[], count: number): Record<string, unknown>[] {
    const result: Record<string, unknown>[] = [];

    for (let i = 0; i < count; i++) {
      const row: Record<string, unknown> = {};

      fields.forEach(field => {
        switch (field) {
          case 'userFullName':
            row[field] = `Usuario ${i + 1}`;
            break;
          case 'userDni':
            row[field] = `${10000000 + i}`;
            break;
          case 'userEmail':
            row[field] = `usuario${i + 1}@example.com`;
            break;
          case 'userPhone':
            row[field] = `+54 9 261 ${1000000 + i}`;
            break;
          case 'contestTitle':
            row[field] = `Concurso ${i % 5 + 1}`;
            break;
          case 'inscriptionState': {
            const states = Object.values(InscripcionState);
            row[field] = states[i % states.length];
            break;
          }
          case 'inscriptionCreatedAt': {
            const date = new Date();
            date.setDate(date.getDate() - i);
            row[field] = date.toISOString();
            break;
          }
          case 'documentsCount':
            row[field] = Math.floor(Math.random() * 10) + 1;
            break;
          case 'pendingDocuments':
            row[field] = Math.floor(Math.random() * 5);
            break;
          case 'approvedDocuments':
            row[field] = Math.floor(Math.random() * 3);
            break;
          case 'rejectedDocuments':
            row[field] = Math.floor(Math.random() * 2);
            break;
          default:
            row[field] = `Valor para ${field}`;
        }
      });

      result.push(row);
    }

    return result;
  }

  /**
   * Genera estadísticas mock del sistema
   */
  private getMockSystemStats(): SystemStats {
    return {
      users: {
        total: 1245,
        active: 980,
        byRole: {
          'ROLE_ADMIN': 15,
          'ROLE_USER': 1230
        },
        newByPeriod: {
          'Enero': 45,
          'Febrero': 38,
          'Marzo': 52,
          'Abril': 35,
          'Mayo': 15
        }
      },
      contests: {
        total: 48,
        active: 12,
        upcoming: 8,
        finished: 28,
        byDepartment: {
          'Capital': 15,
          'Godoy Cruz': 8,
          'Guaymallén': 10,
          'Las Heras': 7,
          'Luján de Cuyo': 5,
          'Maipú': 3
        }
      },
      inscriptions: {
        total: 3567,
        pending: 124,
        approved: 2890,
        rejected: 553,
        byState: {
          'NO_INSCRIPTO': 0,
          'IN_PROCESS': 124,
          'PENDING': 124,
          'APPROVED': 2890,
          'REJECTED': 553,
          'CANCELLED': 0
        },
        byPeriod: {
          'Enero': 850,
          'Febrero': 720,
          'Marzo': 980,
          'Abril': 650,
          'Mayo': 367
        }
      },
      documents: {
        total: 8976,
        pending: 342,
        approved: 7890,
        rejected: 744,
        byType: {
          'DNI': 1245,
          'Título': 1245,
          'Certificado': 2490,
          'Curriculum': 1245,
          'Otros': 2751
        }
      },
      performance: {
        averageResponseTime: 235, // ms
        errorRate: 0.5, // %
        serverLoad: 35 // %
      }
    };
  }
}
