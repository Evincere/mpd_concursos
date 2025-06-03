import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TemplateVariable } from './template-variables.service';

export interface PreviewData {
  user: {
    fullName: string;
    firstName: string;
    lastName: string;
    email: string;
    dni: string;
  };
  contest: {
    title: string;
    position: string;
    dependency: string;
    startDate: string;
    endDate: string;
  };
  inscription: {
    status: string;
    date: string;
  };
  notification: {
    type: string;
    acknowledgementLevel: string;
    subject: string;
  };
  exam: {
    date: string;
    time: string;
    location: string;
    status: string;
  };
  document: {
    name: string;
    type: string;
    uploadDate: string;
  };
  system: {
    date: string;
    time: string;
    datetime: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'MALFORMED' | 'UNKNOWN_VARIABLE' | 'MISSING_CLOSING' | 'NESTED_VARIABLES';
  message: string;
  position: number;
  variable: string;
}

export interface ValidationWarning {
  type: 'DEPRECATED' | 'PERFORMANCE' | 'ACCESSIBILITY';
  message: string;
  position: number;
  variable: string;
}

@Injectable({
  providedIn: 'root'
})
export class TemplatePreviewService {
  private previewDataSubject = new BehaviorSubject<PreviewData>(this.getDefaultPreviewData());
  private validationCacheMap = new Map<string, ValidationResult>();
  private previewCacheMap = new Map<string, string>();

  // Cache configuration
  private readonly CACHE_SIZE_LIMIT = 100;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private cacheTimestamps = new Map<string, number>();

  constructor() {}

  /**
   * Obtiene los datos de preview actuales
   */
  getPreviewData(): Observable<PreviewData> {
    return this.previewDataSubject.asObservable();
  }

  /**
   * Actualiza los datos de preview
   */
  updatePreviewData(data: Partial<PreviewData>): void {
    const currentData = this.previewDataSubject.value;
    const newData = { ...currentData, ...data };
    this.previewDataSubject.next(newData);
    
    // Limpiar cache cuando cambian los datos
    this.clearPreviewCache();
  }

  /**
   * Procesa un template y reemplaza las variables con datos de preview
   */
  processTemplate(template: string): string {
    const cacheKey = this.generateCacheKey(template);
    
    // Verificar cache
    if (this.isValidCache(cacheKey)) {
      const cached = this.previewCacheMap.get(cacheKey);
      if (cached) return cached;
    }

    const previewData = this.previewDataSubject.value;
    let processedTemplate = template;

    // Reemplazar variables con datos de preview
    processedTemplate = this.replaceVariables(processedTemplate, previewData);

    // Guardar en cache
    this.setCacheEntry(cacheKey, processedTemplate);

    return processedTemplate;
  }

  /**
   * Valida la sintaxis de variables en un template
   */
  validateTemplate(template: string, availableVariables: TemplateVariable[]): ValidationResult {
    const cacheKey = `validation_${this.generateCacheKey(template)}`;
    
    // Verificar cache de validación
    if (this.isValidCache(cacheKey)) {
      const cached = this.validationCacheMap.get(cacheKey);
      if (cached) return cached;
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Regex para encontrar variables
    const variableRegex = /\{\{([^}]+)\}\}/g;
    let match;

    while ((match = variableRegex.exec(template)) !== null) {
      const fullMatch = match[0];
      const variableName = match[1].trim();
      const position = match.index;

      // Validar formato de variable
      if (!this.isValidVariableFormat(variableName)) {
        errors.push({
          type: 'MALFORMED',
          message: `Variable malformada: ${fullMatch}`,
          position,
          variable: fullMatch
        });
        continue;
      }

      // Verificar si la variable existe
      const variableExists = availableVariables.some(v => 
        v.placeholder === fullMatch || v.id === variableName
      );

      if (!variableExists) {
        errors.push({
          type: 'UNKNOWN_VARIABLE',
          message: `Variable desconocida: ${fullMatch}`,
          position,
          variable: fullMatch
        });
      }

      // Verificar variables anidadas
      if (variableName.includes('{{')) {
        errors.push({
          type: 'NESTED_VARIABLES',
          message: `Variables anidadas no permitidas: ${fullMatch}`,
          position,
          variable: fullMatch
        });
      }
    }

    // Verificar llaves sin cerrar
    const openBraces = (template.match(/\{\{/g) || []).length;
    const closeBraces = (template.match(/\}\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      errors.push({
        type: 'MISSING_CLOSING',
        message: 'Variables con llaves sin cerrar correctamente',
        position: -1,
        variable: ''
      });
    }

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings
    };

    // Guardar en cache
    this.validationCacheMap.set(cacheKey, result);
    this.cacheTimestamps.set(cacheKey, Date.now());

    return result;
  }

  /**
   * Obtiene sugerencias de autocompletado para una posición en el texto
   */
  getAutocompleteSuggestions(
    text: string, 
    cursorPosition: number, 
    availableVariables: TemplateVariable[]
  ): TemplateVariable[] {
    // Buscar si estamos dentro de una variable parcial
    const beforeCursor = text.substring(0, cursorPosition);
    const afterCursor = text.substring(cursorPosition);

    // Buscar el inicio de una variable
    const lastOpenBrace = beforeCursor.lastIndexOf('{{');
    const lastCloseBrace = beforeCursor.lastIndexOf('}}');

    // Si estamos dentro de una variable ({{ sin }} correspondiente)
    if (lastOpenBrace > lastCloseBrace) {
      const partialVariable = beforeCursor.substring(lastOpenBrace + 2);
      
      // Filtrar variables que coincidan con el texto parcial
      return availableVariables.filter(variable => {
        const variableId = variable.id.toLowerCase();
        const variableName = variable.name.toLowerCase();
        const partial = partialVariable.toLowerCase().trim();
        
        return variableId.includes(partial) || variableName.includes(partial);
      }).slice(0, 10); // Limitar a 10 sugerencias
    }

    return [];
  }

  /**
   * Limpia el cache expirado
   */
  cleanExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cacheTimestamps.forEach((timestamp, key) => {
      if (now - timestamp > this.CACHE_TTL) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      this.previewCacheMap.delete(key);
      this.validationCacheMap.delete(key);
      this.cacheTimestamps.delete(key);
    });
  }

  /**
   * Obtiene estadísticas del cache
   */
  getCacheStats(): { size: number; hitRate: number; memoryUsage: string } {
    return {
      size: this.previewCacheMap.size + this.validationCacheMap.size,
      hitRate: 0, // Se puede implementar un contador de hits/misses
      memoryUsage: `${Math.round((this.previewCacheMap.size + this.validationCacheMap.size) * 0.1)}KB`
    };
  }

  // Métodos privados
  private getDefaultPreviewData(): PreviewData {
    return {
      user: {
        fullName: 'Juan Carlos Pérez',
        firstName: 'Juan Carlos',
        lastName: 'Pérez',
        email: 'juan.perez@ejemplo.com',
        dni: '12345678'
      },
      contest: {
        title: 'Concurso para Defensor Público',
        position: 'Defensor Público',
        dependency: 'Ministerio Público de la Defensa',
        startDate: '01/03/2024',
        endDate: '30/06/2024'
      },
      inscription: {
        status: 'Aprobada',
        date: '15/02/2024'
      },
      notification: {
        type: 'Sistema',
        acknowledgementLevel: 'Acuse simple',
        subject: 'Actualización importante del concurso'
      },
      exam: {
        date: '15/06/2024',
        time: '09:00',
        location: 'Aula Magna - Universidad Nacional',
        status: 'Programado'
      },
      document: {
        name: 'Certificado de Antecedentes Penales',
        type: 'Certificado',
        uploadDate: '10/05/2024'
      },
      system: {
        date: new Date().toLocaleDateString('es-AR'),
        time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        datetime: new Date().toLocaleString('es-AR')
      }
    };
  }

  private replaceVariables(template: string, data: PreviewData): string {
    let result = template;

    // Reemplazar variables de usuario
    result = result.replace(/\{\{user\.fullName\}\}/g, data.user.fullName);
    result = result.replace(/\{\{user\.firstName\}\}/g, data.user.firstName);
    result = result.replace(/\{\{user\.lastName\}\}/g, data.user.lastName);
    result = result.replace(/\{\{user\.email\}\}/g, data.user.email);
    result = result.replace(/\{\{user\.dni\}\}/g, data.user.dni);

    // Reemplazar variables de concurso
    result = result.replace(/\{\{contest\.title\}\}/g, data.contest.title);
    result = result.replace(/\{\{contest\.position\}\}/g, data.contest.position);
    result = result.replace(/\{\{contest\.dependency\}\}/g, data.contest.dependency);
    result = result.replace(/\{\{contest\.startDate\}\}/g, data.contest.startDate);
    result = result.replace(/\{\{contest\.endDate\}\}/g, data.contest.endDate);

    // Reemplazar variables de inscripción
    result = result.replace(/\{\{inscription\.status\}\}/g, data.inscription.status);
    result = result.replace(/\{\{inscription\.date\}\}/g, data.inscription.date);

    // Reemplazar variables de notificación
    result = result.replace(/\{\{notification\.type\}\}/g, data.notification.type);
    result = result.replace(/\{\{notification\.acknowledgementLevel\}\}/g, data.notification.acknowledgementLevel);
    result = result.replace(/\{\{notification\.subject\}\}/g, data.notification.subject);

    // Reemplazar variables de examen
    result = result.replace(/\{\{exam\.date\}\}/g, data.exam.date);
    result = result.replace(/\{\{exam\.time\}\}/g, data.exam.time);
    result = result.replace(/\{\{exam\.location\}\}/g, data.exam.location);
    result = result.replace(/\{\{exam\.status\}\}/g, data.exam.status);

    // Reemplazar variables de documento
    result = result.replace(/\{\{document\.name\}\}/g, data.document.name);
    result = result.replace(/\{\{document\.type\}\}/g, data.document.type);
    result = result.replace(/\{\{document\.uploadDate\}\}/g, data.document.uploadDate);

    // Reemplazar variables de sistema
    result = result.replace(/\{\{system\.date\}\}/g, data.system.date);
    result = result.replace(/\{\{system\.time\}\}/g, data.system.time);
    result = result.replace(/\{\{system\.datetime\}\}/g, data.system.datetime);

    return result;
  }

  private isValidVariableFormat(variableName: string): boolean {
    // Formato válido: categoria.propiedad (sin espacios extra, caracteres especiales)
    const validFormat = /^[a-zA-Z][a-zA-Z0-9]*\.[a-zA-Z][a-zA-Z0-9]*$/;
    return validFormat.test(variableName);
  }

  private generateCacheKey(content: string): string {
    // Generar hash simple para el cache
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private isValidCache(key: string): boolean {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp) return false;
    
    return (Date.now() - timestamp) < this.CACHE_TTL;
  }

  private setCacheEntry(key: string, value: string): void {
    // Limpiar cache si excede el límite
    if (this.previewCacheMap.size >= this.CACHE_SIZE_LIMIT) {
      this.cleanExpiredCache();
      
      // Si aún excede el límite, eliminar entradas más antiguas
      if (this.previewCacheMap.size >= this.CACHE_SIZE_LIMIT) {
        const oldestKey = Array.from(this.cacheTimestamps.entries())
          .sort(([,a], [,b]) => a - b)[0][0];
        this.previewCacheMap.delete(oldestKey);
        this.cacheTimestamps.delete(oldestKey);
      }
    }

    this.previewCacheMap.set(key, value);
    this.cacheTimestamps.set(key, Date.now());
  }

  private clearPreviewCache(): void {
    this.previewCacheMap.clear();
    // Mantener cache de validación ya que no depende de los datos de preview
  }
}
