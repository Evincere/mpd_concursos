import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

/**
 * Interfaz para las variables de plantilla
 */
export interface TemplateVariable {
  id: string;
  name: string;
  description: string;
  category: string;
  placeholder: string;
  example: string;
}

/**
 * Interfaz para las categorías de variables
 */
export interface VariableCategory {
  id: string;
  name: string;
  description: string;
}

/**
 * Servicio para gestionar las variables de plantilla
 */
@Injectable({
  providedIn: 'root'
})
export class TemplateVariablesService {
  // Variables predefinidas del sistema
  private systemVariables: TemplateVariable[] = [
    // Variables de usuario
    {
      id: 'user.fullName',
      name: 'Nombre completo',
      description: 'Nombre completo del usuario',
      category: 'user',
      placeholder: '{{user.fullName}}',
      example: 'Juan Pérez'
    },
    {
      id: 'user.firstName',
      name: 'Nombre',
      description: 'Primer nombre del usuario',
      category: 'user',
      placeholder: '{{user.firstName}}',
      example: 'Juan'
    },
    {
      id: 'user.lastName',
      name: 'Apellido',
      description: 'Apellido del usuario',
      category: 'user',
      placeholder: '{{user.lastName}}',
      example: 'Pérez'
    },
    {
      id: 'user.email',
      name: 'Email',
      description: 'Dirección de correo electrónico del usuario',
      category: 'user',
      placeholder: '{{user.email}}',
      example: 'juan.perez@example.com'
    },
    {
      id: 'user.dni',
      name: 'DNI',
      description: 'Número de documento del usuario',
      category: 'user',
      placeholder: '{{user.dni}}',
      example: '12345678'
    },

    // Variables de concurso
    {
      id: 'contest.title',
      name: 'Título del concurso',
      description: 'Título del concurso',
      category: 'contest',
      placeholder: '{{contest.title}}',
      example: 'Concurso para Defensor Público'
    },
    {
      id: 'contest.position',
      name: 'Cargo',
      description: 'Cargo del concurso',
      category: 'contest',
      placeholder: '{{contest.position}}',
      example: 'Defensor Público'
    },
    {
      id: 'contest.dependency',
      name: 'Dependencia',
      description: 'Dependencia del concurso',
      category: 'contest',
      placeholder: '{{contest.dependency}}',
      example: 'Defensoría Pública Oficial'
    },
    {
      id: 'contest.startDate',
      name: 'Fecha de inicio',
      description: 'Fecha de inicio del concurso',
      category: 'contest',
      placeholder: '{{contest.startDate}}',
      example: '01/01/2023'
    },
    {
      id: 'contest.endDate',
      name: 'Fecha de fin',
      description: 'Fecha de fin del concurso',
      category: 'contest',
      placeholder: '{{contest.endDate}}',
      example: '31/01/2023'
    },

    // Variables de inscripción
    {
      id: 'inscription.status',
      name: 'Estado de inscripción',
      description: 'Estado actual de la inscripción',
      category: 'inscription',
      placeholder: '{{inscription.status}}',
      example: 'PENDIENTE'
    },
    {
      id: 'inscription.date',
      name: 'Fecha de inscripción',
      description: 'Fecha en que se realizó la inscripción',
      category: 'inscription',
      placeholder: '{{inscription.date}}',
      example: '15/01/2023'
    },

    // Variables de sistema
    {
      id: 'system.date',
      name: 'Fecha actual',
      description: 'Fecha actual del sistema',
      category: 'system',
      placeholder: '{{system.date}}',
      example: '01/06/2023'
    },
    {
      id: 'system.time',
      name: 'Hora actual',
      description: 'Hora actual del sistema',
      category: 'system',
      placeholder: '{{system.time}}',
      example: '14:30'
    },
    {
      id: 'system.datetime',
      name: 'Fecha y hora actual',
      description: 'Fecha y hora actual del sistema',
      category: 'system',
      placeholder: '{{system.datetime}}',
      example: '01/06/2023 14:30'
    },

    // Variables de notificación
    {
      id: 'notification.type',
      name: 'Tipo de notificación',
      description: 'Tipo de la notificación enviada',
      category: 'notification',
      placeholder: '{{notification.type}}',
      example: 'Sistema'
    },
    {
      id: 'notification.acknowledgementLevel',
      name: 'Nivel de confirmación',
      description: 'Nivel de confirmación requerido para la notificación',
      category: 'notification',
      placeholder: '{{notification.acknowledgementLevel}}',
      example: 'Acuse simple'
    },
    {
      id: 'notification.subject',
      name: 'Asunto de la notificación',
      description: 'Asunto o título de la notificación',
      category: 'notification',
      placeholder: '{{notification.subject}}',
      example: 'Actualización importante del concurso'
    },

    // Variables de examen
    {
      id: 'exam.date',
      name: 'Fecha del examen',
      description: 'Fecha programada para el examen',
      category: 'exam',
      placeholder: '{{exam.date}}',
      example: '15/06/2023'
    },
    {
      id: 'exam.time',
      name: 'Hora del examen',
      description: 'Hora programada para el examen',
      category: 'exam',
      placeholder: '{{exam.time}}',
      example: '09:00'
    },
    {
      id: 'exam.location',
      name: 'Ubicación del examen',
      description: 'Lugar donde se realizará el examen',
      category: 'exam',
      placeholder: '{{exam.location}}',
      example: 'Aula Magna - Universidad Nacional'
    },
    {
      id: 'exam.status',
      name: 'Estado del examen',
      description: 'Estado actual del examen',
      category: 'exam',
      placeholder: '{{exam.status}}',
      example: 'Programado'
    },

    // Variables de documento
    {
      id: 'document.name',
      name: 'Nombre del documento',
      description: 'Nombre del documento',
      category: 'document',
      placeholder: '{{document.name}}',
      example: 'Certificado de Antecedentes Penales'
    },
    {
      id: 'document.type',
      name: 'Tipo de documento',
      description: 'Tipo o categoría del documento',
      category: 'document',
      placeholder: '{{document.type}}',
      example: 'Certificado'
    },
    {
      id: 'document.uploadDate',
      name: 'Fecha de carga',
      description: 'Fecha en que se cargó el documento',
      category: 'document',
      placeholder: '{{document.uploadDate}}',
      example: '10/05/2023'
    }
  ];

  // Categorías de variables
  private variableCategories: VariableCategory[] = [
    {
      id: 'user',
      name: 'Usuario',
      description: 'Variables relacionadas con el usuario destinatario'
    },
    {
      id: 'contest',
      name: 'Concurso',
      description: 'Variables relacionadas con los concursos'
    },
    {
      id: 'inscription',
      name: 'Inscripción',
      description: 'Variables relacionadas con las inscripciones'
    },
    {
      id: 'notification',
      name: 'Notificación',
      description: 'Variables relacionadas con la notificación actual'
    },
    {
      id: 'exam',
      name: 'Examen',
      description: 'Variables relacionadas con exámenes y evaluaciones'
    },
    {
      id: 'document',
      name: 'Documento',
      description: 'Variables relacionadas con documentos y archivos'
    },
    {
      id: 'system',
      name: 'Sistema',
      description: 'Variables del sistema'
    },
    {
      id: 'custom',
      name: 'Personalizadas',
      description: 'Variables personalizadas definidas por el usuario'
    }
  ];

  // Variables personalizadas (en una implementación real, estas se guardarían en la base de datos)
  private customVariables: TemplateVariable[] = [];



  /**
   * Obtiene todas las variables de plantilla
   * @returns Observable con las variables de plantilla
   */
  getVariables(): Observable<TemplateVariable[]> {
    return of([...this.systemVariables, ...this.customVariables]);
  }

  /**
   * Obtiene las variables de plantilla por categoría
   * @param category Categoría de las variables
   * @returns Observable con las variables de la categoría
   */
  getVariablesByCategory(category: string): Observable<TemplateVariable[]> {
    const allVariables = [...this.systemVariables, ...this.customVariables];
    const filteredVariables = allVariables.filter(variable => variable.category === category);
    return of(filteredVariables);
  }

  /**
   * Obtiene las categorías de variables
   * @returns Observable con las categorías de variables
   */
  getCategories(): Observable<VariableCategory[]> {
    return of(this.variableCategories);
  }

  /**
   * Crea una variable personalizada
   * @param variable Variable a crear
   * @returns Observable con la variable creada
   */
  createCustomVariable(variable: Omit<TemplateVariable, 'id'>): Observable<TemplateVariable> {
    const newVariable: TemplateVariable = {
      ...variable,
      id: `custom.${this.generateId()}`,
      category: 'custom'
    };

    this.customVariables.push(newVariable);
    return of(newVariable);
  }

  /**
   * Actualiza una variable personalizada
   * @param id ID de la variable a actualizar
   * @param variable Datos actualizados de la variable
   * @returns Observable con la variable actualizada
   */
  updateCustomVariable(id: string, variable: Partial<TemplateVariable>): Observable<TemplateVariable> {
    const index = this.customVariables.findIndex(v => v.id === id);

    if (index === -1) {
      throw new Error(`Variable with ID ${id} not found`);
    }

    const updatedVariable: TemplateVariable = {
      ...this.customVariables[index],
      ...variable,
      id,
      category: 'custom'
    };

    this.customVariables[index] = updatedVariable;
    return of(updatedVariable);
  }

  /**
   * Elimina una variable personalizada
   * @param id ID de la variable a eliminar
   * @returns Observable vacío
   */
  deleteCustomVariable(id: string): Observable<void> {
    const index = this.customVariables.findIndex(v => v.id === id);

    if (index === -1) {
      throw new Error(`Variable with ID ${id} not found`);
    }

    this.customVariables.splice(index, 1);
    return of(undefined);
  }

  /**
   * Procesa una plantilla reemplazando las variables con valores reales
   * @param template Plantilla a procesar
   * @param data Datos para reemplazar las variables
   * @returns Plantilla procesada
   */
  processTemplate(template: string, data: unknown): string {
    let processedTemplate = template;

    // Reemplazar variables del sistema
    processedTemplate = this.replaceSystemVariables(processedTemplate);

    // Reemplazar variables de datos
    processedTemplate = this.replaceDataVariables(processedTemplate, data);

    return processedTemplate;
  }

  /**
   * Reemplaza las variables del sistema en una plantilla
   * @param template Plantilla a procesar
   * @returns Plantilla con variables del sistema reemplazadas
   */
  private replaceSystemVariables(template: string): string {
    let processedTemplate = template;

    // Reemplazar fecha actual
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    const datetimeStr = `${dateStr} ${timeStr}`;

    processedTemplate = processedTemplate.replace(/{{system\.date}}/g, dateStr);
    processedTemplate = processedTemplate.replace(/{{system\.time}}/g, timeStr);
    processedTemplate = processedTemplate.replace(/{{system\.datetime}}/g, datetimeStr);

    return processedTemplate;
  }

  /**
   * Reemplaza las variables de datos en una plantilla
   * @param template Plantilla a procesar
   * @param data Datos para reemplazar las variables
   * @returns Plantilla con variables de datos reemplazadas
   */
  private replaceDataVariables(template: string, data: unknown): string {
    let processedTemplate = template;

    // Buscar todas las variables en la plantilla
    const variableRegex = /{{([^}]+)}}/g;
    let match;

    while ((match = variableRegex.exec(template)) !== null) {
      const fullMatch = match[0];
      const variablePath = match[1].trim();

      // Obtener el valor de la variable
      const value = this.getValueFromPath(data, variablePath);

      // Reemplazar la variable en la plantilla
      if (value !== undefined) {
        const stringValue = String(value);
        processedTemplate = processedTemplate.replace(fullMatch, stringValue);
      }
    }

    return processedTemplate;
  }

  /**
   * Obtiene un valor a partir de una ruta de acceso
   * @param obj Objeto de datos
   * @param path Ruta de acceso (por ejemplo, "user.firstName")
   * @returns Valor encontrado o undefined si no existe
   */
  private getValueFromPath(obj: unknown, path: string): unknown {
    if (!obj) {
      return undefined;
    }

    const parts = path.split('.');
    let current: Record<string, unknown> = obj as Record<string, unknown>;

    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }

      current = current[part] as Record<string, unknown>;
    }

    return current;
  }

  /**
   * Genera un ID único
   * @returns ID único
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
