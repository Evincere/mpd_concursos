import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * Tipo de variable
 */
export type VariableType = 'text' | 'number' | 'date' | 'boolean' | 'object' | 'array' | 'url' | 'email';

/**
 * Contexto de variable
 */
export type VariableContext = 'user' | 'contest' | 'inscription' | 'exam' | 'document' | 'system' | 'custom';

/**
 * Definición de variable dinámica
 */
export interface DynamicVariable {
  key: string;
  label: string;
  description: string;
  type: VariableType;
  context: VariableContext;
  required: boolean;
  defaultValue?: any;
  validation?: VariableValidation;
  formatting?: VariableFormatting;
  examples?: string[];
  dependencies?: string[];
  isSystem: boolean;
  isActive: boolean;
  category?: string;
  tags?: string[];
}

/**
 * Validación de variable
 */
export interface VariableValidation {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  allowedValues?: any[];
  customValidator?: string;
}

/**
 * Formateo de variable
 */
export interface VariableFormatting {
  dateFormat?: string;
  numberFormat?: {
    decimals?: number;
    thousandsSeparator?: string;
    decimalSeparator?: string;
    prefix?: string;
    suffix?: string;
  };
  textFormat?: {
    case?: 'upper' | 'lower' | 'title' | 'sentence';
    maxLength?: number;
    truncate?: boolean;
    ellipsis?: string;
  };
  urlFormat?: {
    includeProtocol?: boolean;
    openInNewTab?: boolean;
  };
}

/**
 * Contexto de datos para resolución de variables
 */
export interface VariableResolutionContext {
  user?: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    dni: string;
    phone?: string;
    role: string;
    profileImage?: string;
    registrationDate: Date;
    lastLogin?: Date;
    isActive: boolean;
  };
  contest?: {
    id: string;
    title: string;
    description: string;
    category: string;
    type: string;
    startDate: Date;
    endDate: Date;
    inscriptionStartDate: Date;
    inscriptionEndDate: Date;
    examDate?: Date;
    resultsDate?: Date;
    status: string;
    requirements: string[];
    benefits: string[];
    location?: string;
    organizer: string;
    contactEmail: string;
    maxParticipants?: number;
    currentParticipants: number;
  };
  inscription?: {
    id: string;
    status: string;
    submittedAt: Date;
    updatedAt: Date;
    completionPercentage: number;
    documentsStatus: string;
    examStatus?: string;
    resultStatus?: string;
    score?: number;
    ranking?: number;
    notes?: string;
    reviewedBy?: string;
    reviewedAt?: Date;
  };
  exam?: {
    id: string;
    title: string;
    description: string;
    date: Date;
    startTime: string;
    endTime: string;
    duration: number;
    location: string;
    instructions: string[];
    requirements: string[];
    type: string;
    maxScore: number;
    passingScore: number;
    status: string;
  };
  document?: {
    id: string;
    name: string;
    type: string;
    status: string;
    uploadedAt: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
    comments?: string;
    size: number;
    format: string;
    url: string;
  };
  system?: {
    appName: string;
    appVersion: string;
    supportEmail: string;
    supportPhone?: string;
    baseUrl: string;
    currentDate: Date;
    currentTime: string;
    timezone: string;
    environment: string;
    organizationName: string;
    organizationLogo?: string;
    organizationAddress?: string;
    organizationWebsite?: string;
  };
  custom?: Record<string, any>;
}

/**
 * Resultado de resolución de variable
 */
export interface VariableResolution {
  key: string;
  value: any;
  formattedValue: string;
  isResolved: boolean;
  error?: string;
  dependencies?: VariableResolution[];
}

/**
 * Resultado de procesamiento de plantilla
 */
export interface TemplateProcessingResult {
  originalContent: string;
  processedContent: string;
  variables: VariableResolution[];
  unresolvedVariables: string[];
  errors: string[];
  warnings: string[];
  processingTime: number;
}

/**
 * Servicio de variables dinámicas para plantillas
 */
@Injectable({
  providedIn: 'root'
})
export class TemplateVariablesService {

  // Variables del sistema predefinidas
  private systemVariables: DynamicVariable[] = [
    // Variables de usuario
    {
      key: 'user.name',
      label: 'Nombre completo',
      description: 'Nombre completo del usuario',
      type: 'text',
      context: 'user',
      required: false,
      isSystem: true,
      isActive: true,
      examples: ['Juan Pérez', 'María García López'],
      formatting: {
        textFormat: { case: 'title' }
      }
    },
    {
      key: 'user.firstName',
      label: 'Nombre',
      description: 'Primer nombre del usuario',
      type: 'text',
      context: 'user',
      required: false,
      isSystem: true,
      isActive: true,
      examples: ['Juan', 'María'],
      formatting: {
        textFormat: { case: 'title' }
      }
    },
    {
      key: 'user.lastName',
      label: 'Apellido',
      description: 'Apellido del usuario',
      type: 'text',
      context: 'user',
      required: false,
      isSystem: true,
      isActive: true,
      examples: ['Pérez', 'García López'],
      formatting: {
        textFormat: { case: 'title' }
      }
    },
    {
      key: 'user.email',
      label: 'Email',
      description: 'Dirección de correo electrónico',
      type: 'email',
      context: 'user',
      required: false,
      isSystem: true,
      isActive: true,
      examples: ['juan.perez@email.com', 'maria.garcia@empresa.com'],
      validation: {
        pattern: '^[^@]+@[^@]+\\.[^@]+$'
      }
    },
    {
      key: 'user.dni',
      label: 'DNI',
      description: 'Documento Nacional de Identidad',
      type: 'text',
      context: 'user',
      required: false,
      isSystem: true,
      isActive: true,
      examples: ['12345678', '87654321'],
      validation: {
        pattern: '^[0-9]{7,8}$',
        minLength: 7,
        maxLength: 8
      }
    },
    {
      key: 'user.phone',
      label: 'Teléfono',
      description: 'Número de teléfono del usuario',
      type: 'text',
      context: 'user',
      required: false,
      isSystem: true,
      isActive: true,
      examples: ['+54 11 1234-5678', '011 4567-8901']
    },
    {
      key: 'user.role',
      label: 'Rol',
      description: 'Rol del usuario en el sistema',
      type: 'text',
      context: 'user',
      required: false,
      isSystem: true,
      isActive: true,
      examples: ['Postulante', 'Administrador'],
      formatting: {
        textFormat: { case: 'title' }
      }
    },

    // Variables de concurso
    {
      key: 'contest.title',
      label: 'Título del concurso',
      description: 'Nombre oficial del concurso',
      type: 'text',
      context: 'contest',
      required: false,
      isSystem: true,
      isActive: true,
      examples: ['Concurso Docente 2024', 'Selección de Personal Administrativo']
    },
    {
      key: 'contest.description',
      label: 'Descripción del concurso',
      description: 'Descripción detallada del concurso',
      type: 'text',
      context: 'contest',
      required: false,
      isSystem: true,
      isActive: true,
      examples: ['Concurso para cubrir cargos docentes...'],
      formatting: {
        textFormat: { maxLength: 200, truncate: true }
      }
    },
    {
      key: 'contest.category',
      label: 'Categoría',
      description: 'Categoría del concurso',
      type: 'text',
      context: 'contest',
      required: false,
      isSystem: true,
      isActive: true,
      examples: ['Docente', 'Administrativo', 'Técnico']
    },
    {
      key: 'contest.startDate',
      label: 'Fecha de inicio',
      description: 'Fecha de inicio del concurso',
      type: 'date',
      context: 'contest',
      required: false,
      isSystem: true,
      isActive: true,
      examples: ['15/01/2024', '2024-01-15'],
      formatting: {
        dateFormat: 'dd/MM/yyyy'
      }
    },
    {
      key: 'contest.endDate',
      label: 'Fecha de fin',
      description: 'Fecha de finalización del concurso',
      type: 'date',
      context: 'contest',
      required: false,
      isSystem: true,
      isActive: true,
      examples: ['15/02/2024', '2024-02-15'],
      formatting: {
        dateFormat: 'dd/MM/yyyy'
      }
    },
    {
      key: 'contest.inscriptionEndDate',
      label: 'Fecha límite de inscripción',
      description: 'Fecha límite para inscribirse',
      type: 'date',
      context: 'contest',
      required: false,
      isSystem: true,
      isActive: true,
      examples: ['31/01/2024', '2024-01-31'],
      formatting: {
        dateFormat: 'dd/MM/yyyy'
      }
    },
    {
      key: 'contest.location',
      label: 'Ubicación',
      description: 'Lugar donde se realizará el concurso',
      type: 'text',
      context: 'contest',
      required: false,
      isSystem: true,
      isActive: true,
      examples: ['Buenos Aires', 'Córdoba', 'Virtual']
    },
    {
      key: 'contest.maxParticipants',
      label: 'Máximo de participantes',
      description: 'Número máximo de participantes permitidos',
      type: 'number',
      context: 'contest',
      required: false,
      isSystem: true,
      isActive: true,
      examples: ['100', '50', 'Sin límite'],
      formatting: {
        numberFormat: { decimals: 0 }
      }
    },
    {
      key: 'contest.currentParticipants',
      label: 'Participantes actuales',
      description: 'Número actual de participantes inscritos',
      type: 'number',
      context: 'contest',
      required: false,
      isSystem: true,
      isActive: true,
      examples: ['45', '23'],
      formatting: {
        numberFormat: { decimals: 0 }
      }
    },

    // Variables de inscripción
    {
      key: 'inscription.status',
      label: 'Estado de inscripción',
      description: 'Estado actual de la inscripción',
      type: 'text',
      context: 'inscription',
      required: false,
      isSystem: true,
      isActive: true,
      examples: ['Pendiente', 'Aprobada', 'Rechazada', 'En revisión'],
      formatting: {
        textFormat: { case: 'title' }
      }
    },
    {
      key: 'inscription.submittedAt',
      label: 'Fecha de envío',
      description: 'Fecha en que se envió la inscripción',
      type: 'date',
      context: 'inscription',
      required: false,
      isSystem: true,
      isActive: true,
      examples: ['10/01/2024', '2024-01-10'],
      formatting: {
        dateFormat: 'dd/MM/yyyy HH:mm'
      }
    },
    {
      key: 'inscription.completionPercentage',
      label: 'Porcentaje de completitud',
      description: 'Porcentaje de completitud de la inscripción',
      type: 'number',
      context: 'inscription',
      required: false,
      isSystem: true,
      isActive: true,
      examples: ['85%', '100%', '45%'],
      formatting: {
        numberFormat: { decimals: 0, suffix: '%' }
      }
    },
    {
      key: 'inscription.documentsStatus',
      label: 'Estado de documentos',
      description: 'Estado de la documentación presentada',
      type: 'text',
      context: 'inscription',
      required: false,
      isSystem: true,
      isActive: true,
      examples: ['Completa', 'Incompleta', 'En revisión'],
      formatting: {
        textFormat: { case: 'title' }
      }
    },

    // Variables de examen
    {
      key: 'exam.title',
      label: 'Título del examen',
      description: 'Nombre del examen',
      type: 'text',
      context: 'exam',
      required: false,
      isSystem: true,
      isActive: true,
      examples: ['Examen Teórico', 'Evaluación Práctica']
    },
    {
      key: 'exam.date',
      label: 'Fecha del examen',
      description: 'Fecha programada para el examen',
      type: 'date',
      context: 'exam',
      required: false,
      isSystem: true,
      isActive: true,
      examples: ['20/02/2024', '2024-02-20'],
      formatting: {
        dateFormat: 'dd/MM/yyyy'
      }
    },
    {
      key: 'exam.startTime',
      label: 'Hora de inicio',
      description: 'Hora de inicio del examen',
      type: 'text',
      context: 'exam',
      required: false,
      isSystem: true,
      isActive: true,
      examples: ['09:00', '14:30']
    },
    {
      key: 'exam.duration',
      label: 'Duración',
      description: 'Duración del examen en minutos',
      type: 'number',
      context: 'exam',
      required: false,
      isSystem: true,
      isActive: true,
      examples: ['120', '180', '90'],
      formatting: {
        numberFormat: { decimals: 0, suffix: ' minutos' }
      }
    },
    {
      key: 'exam.location',
      label: 'Lugar del examen',
      description: 'Ubicación donde se realizará el examen',
      type: 'text',
      context: 'exam',
      required: false,
      isSystem: true,
      isActive: true,
      examples: ['Aula 101', 'Laboratorio de Informática', 'Virtual']
    },

    // Variables del sistema
    {
      key: 'system.appName',
      label: 'Nombre de la aplicación',
      description: 'Nombre del sistema',
      type: 'text',
      context: 'system',
      required: false,
      defaultValue: 'MPD Concursos',
      isSystem: true,
      isActive: true,
      examples: ['MPD Concursos']
    },
    {
      key: 'system.supportEmail',
      label: 'Email de soporte',
      description: 'Dirección de correo para soporte',
      type: 'email',
      context: 'system',
      required: false,
      defaultValue: 'soporte@mpdconcursos.gov.ar',
      isSystem: true,
      isActive: true,
      examples: ['soporte@mpdconcursos.gov.ar']
    },
    {
      key: 'system.supportPhone',
      label: 'Teléfono de soporte',
      description: 'Número de teléfono para soporte',
      type: 'text',
      context: 'system',
      required: false,
      defaultValue: '0800-123-4567',
      isSystem: true,
      isActive: true,
      examples: ['0800-123-4567', '011 4567-8900']
    },
    {
      key: 'system.baseUrl',
      label: 'URL base',
      description: 'URL base del sistema',
      type: 'url',
      context: 'system',
      required: false,
      defaultValue: 'https://concursos.mpd.gov.ar',
      isSystem: true,
      isActive: true,
      examples: ['https://concursos.mpd.gov.ar'],
      formatting: {
        urlFormat: { includeProtocol: true }
      }
    },
    {
      key: 'system.currentDate',
      label: 'Fecha actual',
      description: 'Fecha actual del sistema',
      type: 'date',
      context: 'system',
      required: false,
      isSystem: true,
      isActive: true,
      examples: ['15/01/2024', '2024-01-15'],
      formatting: {
        dateFormat: 'dd/MM/yyyy'
      }
    },
    {
      key: 'system.currentTime',
      label: 'Hora actual',
      description: 'Hora actual del sistema',
      type: 'text',
      context: 'system',
      required: false,
      isSystem: true,
      isActive: true,
      examples: ['14:30', '09:15']
    },
    {
      key: 'system.organizationName',
      label: 'Nombre de la organización',
      description: 'Nombre oficial de la organización',
      type: 'text',
      context: 'system',
      required: false,
      defaultValue: 'Ministerio Público de la Defensa',
      isSystem: true,
      isActive: true,
      examples: ['Ministerio Público de la Defensa']
    }
  ];

  constructor(
    private loggingService: LoggingService
  ) {}

  /**
   * Obtiene todas las variables disponibles
   */
  public getAvailableVariables(): DynamicVariable[] {
    return [...this.systemVariables];
  }

  /**
   * Obtiene variables por contexto
   */
  public getVariablesByContext(context: VariableContext): DynamicVariable[] {
    return this.systemVariables.filter(variable => variable.context === context);
  }

  /**
   * Obtiene variables por categoría
   */
  public getVariablesByCategory(category: string): DynamicVariable[] {
    return this.systemVariables.filter(variable => 
      variable.category === category || 
      (category === 'all' && variable.isActive)
    );
  }

  /**
   * Busca variables por término
   */
  public searchVariables(searchTerm: string): DynamicVariable[] {
    const term = searchTerm.toLowerCase();
    return this.systemVariables.filter(variable =>
      variable.key.toLowerCase().includes(term) ||
      variable.label.toLowerCase().includes(term) ||
      variable.description.toLowerCase().includes(term) ||
      variable.examples?.some(example => example.toLowerCase().includes(term))
    );
  }

  /**
   * Obtiene una variable específica por clave
   */
  public getVariable(key: string): DynamicVariable | undefined {
    return this.systemVariables.find(variable => variable.key === key);
  }

  /**
   * Extrae variables de un texto
   */
  public extractVariables(content: string): string[] {
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const matches = content.match(variablePattern) || [];
    return [...new Set(matches.map(match => match.slice(2, -2).trim()))];
  }

  /**
   * Valida variables en un texto
   */
  public validateVariables(content: string): { isValid: boolean; errors: string[]; warnings: string[] } {
    const extractedVariables = this.extractVariables(content);
    const errors: string[] = [];
    const warnings: string[] = [];

    extractedVariables.forEach(variableKey => {
      const variable = this.getVariable(variableKey);
      
      if (!variable) {
        errors.push(`Variable no reconocida: ${variableKey}`);
      } else if (!variable.isActive) {
        warnings.push(`Variable inactiva: ${variableKey}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Resuelve una variable específica
   */
  public resolveVariable(
    variableKey: string, 
    context: VariableResolutionContext
  ): Observable<VariableResolution> {
    const variable = this.getVariable(variableKey);
    
    if (!variable) {
      return of({
        key: variableKey,
        value: null,
        formattedValue: `{{${variableKey}}}`,
        isResolved: false,
        error: `Variable no encontrada: ${variableKey}`
      });
    }

    try {
      const value = this.extractValueFromContext(variableKey, context);
      const formattedValue = this.formatValue(value, variable);

      return of({
        key: variableKey,
        value,
        formattedValue,
        isResolved: value !== null && value !== undefined,
        error: value === null || value === undefined ? `Valor no disponible para: ${variableKey}` : undefined
      });
    } catch (error) {
      return of({
        key: variableKey,
        value: null,
        formattedValue: `{{${variableKey}}}`,
        isResolved: false,
        error: `Error al resolver variable: ${error}`
      });
    }
  }

  /**
   * Procesa una plantilla completa
   */
  public processTemplate(
    content: string, 
    context: VariableResolutionContext
  ): Observable<TemplateProcessingResult> {
    const startTime = Date.now();
    const extractedVariables = this.extractVariables(content);
    const resolutions: VariableResolution[] = [];
    const unresolvedVariables: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    let processedContent = content;

    // Resolver cada variable
    extractedVariables.forEach(variableKey => {
      this.resolveVariable(variableKey, context).subscribe(resolution => {
        resolutions.push(resolution);
        
        if (resolution.isResolved) {
          // Reemplazar en el contenido
          const pattern = new RegExp(`\\{\\{\\s*${this.escapeRegExp(variableKey)}\\s*\\}\\}`, 'g');
          processedContent = processedContent.replace(pattern, resolution.formattedValue);
        } else {
          unresolvedVariables.push(variableKey);
          if (resolution.error) {
            errors.push(resolution.error);
          }
        }
      });
    });

    const processingTime = Date.now() - startTime;

    return of({
      originalContent: content,
      processedContent,
      variables: resolutions,
      unresolvedVariables,
      errors,
      warnings,
      processingTime
    });
  }

  /**
   * Extrae valor del contexto usando la clave de variable
   */
  private extractValueFromContext(variableKey: string, context: VariableResolutionContext): any {
    const parts = variableKey.split('.');
    let current: any = context;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return null;
      }
    }

    return current;
  }

  /**
   * Formatea un valor según la configuración de la variable
   */
  private formatValue(value: any, variable: DynamicVariable): string {
    if (value === null || value === undefined) {
      return variable.defaultValue?.toString() || '';
    }

    // Aplicar formateo según el tipo y configuración
    switch (variable.type) {
      case 'date':
        return this.formatDate(value, variable.formatting?.dateFormat);
      case 'number':
        return this.formatNumber(value, variable.formatting?.numberFormat);
      case 'text':
        return this.formatText(value.toString(), variable.formatting?.textFormat);
      case 'email':
        return value.toString();
      case 'url':
        return this.formatUrl(value.toString(), variable.formatting?.urlFormat);
      case 'boolean':
        return value ? 'Sí' : 'No';
      default:
        return value.toString();
    }
  }

  /**
   * Formatea fecha
   */
  private formatDate(value: any, format?: string): string {
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '';

    const defaultFormat = 'dd/MM/yyyy';
    const formatToUse = format || defaultFormat;

    // Implementación básica de formateo de fecha
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return formatToUse
      .replace('dd', day)
      .replace('MM', month)
      .replace('yyyy', year)
      .replace('HH', hours)
      .replace('mm', minutes);
  }

  /**
   * Formatea número
   */
  private formatNumber(value: any, format?: any): string {
    const num = parseFloat(value);
    if (isNaN(num)) return '';

    const decimals = format?.decimals ?? 0;
    const prefix = format?.prefix || '';
    const suffix = format?.suffix || '';

    return prefix + num.toFixed(decimals) + suffix;
  }

  /**
   * Formatea texto
   */
  private formatText(value: string, format?: any): string {
    let result = value;

    if (format?.case) {
      switch (format.case) {
        case 'upper':
          result = result.toUpperCase();
          break;
        case 'lower':
          result = result.toLowerCase();
          break;
        case 'title':
          result = result.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
          );
          break;
        case 'sentence':
          result = result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
          break;
      }
    }

    if (format?.maxLength && result.length > format.maxLength) {
      if (format.truncate) {
        const ellipsis = format.ellipsis || '...';
        result = result.substring(0, format.maxLength - ellipsis.length) + ellipsis;
      }
    }

    return result;
  }

  /**
   * Formatea URL
   */
  private formatUrl(value: string, format?: any): string {
    let result = value;

    if (format?.includeProtocol && !result.startsWith('http')) {
      result = 'https://' + result;
    }

    return result;
  }

  /**
   * Escapa caracteres especiales para regex
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
