import { Injectable } from '@angular/core';

/**
 * Tipos de restricción de entrada disponibles
 */
export enum InputRestrictionType {
  NAME = 'name',
  EMAIL = 'email',
  PHONE = 'phone',
  DNI = 'dni',
  NUMERIC = 'numeric',
  ALPHANUMERIC = 'alphanumeric',
  USERNAME = 'username',
  CUIT = 'cuit'
}

/**
 * Configuración para restricción de entrada
 */
export interface InputRestrictionConfig {
  type: InputRestrictionType;
  maxLength?: number;
  allowPaste?: boolean;
  customPattern?: RegExp;
  preventInvalidChars?: boolean;
  showFeedback?: boolean;
}

/**
 * Servicio para manejar restricciones de entrada de datos en formularios
 * Proporciona patrones y lógica para validar y filtrar caracteres en tiempo real
 */
@Injectable({
  providedIn: 'root'
})
export class InputRestrictionService {

  /**
   * Patrones de validación para diferentes tipos de campos
   */
  private readonly patterns: Record<InputRestrictionType, RegExp> = {
    [InputRestrictionType.NAME]: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]*$/,
    [InputRestrictionType.EMAIL]: /^[a-zA-Z0-9@._-]*$/,
    [InputRestrictionType.PHONE]: /^[0-9\s\-\(\)\+]*$/,
    [InputRestrictionType.DNI]: /^[0-9]*$/,
    [InputRestrictionType.NUMERIC]: /^[0-9]*$/,
    [InputRestrictionType.ALPHANUMERIC]: /^[a-zA-Z0-9]*$/,
    [InputRestrictionType.USERNAME]: /^[a-zA-Z0-9._-]*$/,
    [InputRestrictionType.CUIT]: /^[0-9\-]*$/
  };

  /**
   * Descripciones amigables para cada tipo de campo
   */
  private readonly fieldDescriptions: Record<InputRestrictionType, string> = {
    [InputRestrictionType.NAME]: 'Ingrese solo letras, espacios y acentos',
    [InputRestrictionType.EMAIL]: 'Formato de email válido',
    [InputRestrictionType.PHONE]: 'Formato: +54 11 1234-5678 o similar',
    [InputRestrictionType.DNI]: 'Solo números (7-8 dígitos)',
    [InputRestrictionType.NUMERIC]: 'Solo números',
    [InputRestrictionType.ALPHANUMERIC]: 'Letras y números únicamente',
    [InputRestrictionType.USERNAME]: 'Letras, números, punto, guión',
    [InputRestrictionType.CUIT]: 'Formato: 20-12345678-9'
  };

  /**
   * Caracteres permitidos para cada tipo (para mensajes de error)
   */
  private readonly allowedCharsDescription: Record<InputRestrictionType, string> = {
    [InputRestrictionType.NAME]: 'letras, espacios, acentos, ñ, guiones y apostrofes',
    [InputRestrictionType.EMAIL]: 'letras, números, @, punto, guión y guión bajo',
    [InputRestrictionType.PHONE]: 'números, espacios, guiones, paréntesis y signo más',
    [InputRestrictionType.DNI]: 'solo números',
    [InputRestrictionType.NUMERIC]: 'solo números',
    [InputRestrictionType.ALPHANUMERIC]: 'letras y números',
    [InputRestrictionType.USERNAME]: 'letras, números, punto, guión y guión bajo',
    [InputRestrictionType.CUIT]: 'números y guiones'
  };

  /**
   * Longitudes máximas recomendadas por tipo
   */
  private readonly maxLengths: Record<InputRestrictionType, number> = {
    [InputRestrictionType.NAME]: 50,
    [InputRestrictionType.EMAIL]: 254,
    [InputRestrictionType.PHONE]: 20,
    [InputRestrictionType.DNI]: 8,
    [InputRestrictionType.NUMERIC]: 20,
    [InputRestrictionType.ALPHANUMERIC]: 50,
    [InputRestrictionType.USERNAME]: 50,
    [InputRestrictionType.CUIT]: 13
  };

  /**
   * Valida si un carácter es permitido para el tipo especificado
   */
  isCharacterAllowed(char: string, type: InputRestrictionType): boolean {
    const pattern = this.patterns[type];
    return pattern.test(char);
  }

  /**
   * Valida si una cadena completa es válida para el tipo especificado
   */
  isStringValid(value: string, config: InputRestrictionConfig): boolean {
    if (!value) return true;

    const pattern = config.customPattern || this.patterns[config.type];

    // Validar patrón
    if (!pattern.test(value)) return false;

    // Validar longitud máxima
    const maxLength = config.maxLength || this.maxLengths[config.type];
    if (value.length > maxLength) return false;

    return true;
  }

  /**
   * Filtra una cadena removiendo caracteres no válidos
   */
  filterString(value: string, config: InputRestrictionConfig): string {
    if (!value) return '';

    const pattern = config.customPattern || this.patterns[config.type];
    let filtered = '';

    for (const char of value) {
      if (pattern.test(filtered + char)) {
        filtered += char;
      }
    }

    // Aplicar longitud máxima
    const maxLength = config.maxLength || this.maxLengths[config.type];
    return filtered.substring(0, maxLength);
  }

  /**
   * Obtiene la descripción amigable para un tipo de campo
   */
  getFieldDescription(type: InputRestrictionType): string {
    return this.fieldDescriptions[type];
  }

  /**
   * Obtiene la descripción de caracteres permitidos para un tipo
   */
  getAllowedCharsDescription(type: InputRestrictionType): string {
    return this.allowedCharsDescription[type];
  }

  /**
   * Obtiene la longitud máxima para un tipo
   */
  getMaxLength(type: InputRestrictionType): number {
    return this.maxLengths[type];
  }

  /**
   * Obtiene el patrón regex para un tipo
   */
  getPattern(type: InputRestrictionType): RegExp {
    return this.patterns[type];
  }

  /**
   * Valida si un evento de teclado debe ser permitido
   */
  shouldAllowKeyEvent(event: KeyboardEvent, config: InputRestrictionConfig): boolean {
    // Permitir teclas de control (backspace, delete, arrows, etc.)
    if (this.isControlKey(event)) {
      return true;
    }

    // Obtener el carácter que se va a insertar
    const char = event.key;

    // Validar si el carácter es permitido
    return this.isCharacterAllowed(char, config.type);
  }

  /**
   * Verifica si una tecla es de control (no imprimible)
   */
  private isControlKey(event: KeyboardEvent): boolean {
    const controlKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End', 'PageUp', 'PageDown',
      'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'
    ];

    return controlKeys.includes(event.key) ||
           event.ctrlKey ||
           event.altKey ||
           event.metaKey;
  }

  /**
   * Procesa texto pegado, filtrando caracteres no válidos
   */
  processPastedText(text: string, config: InputRestrictionConfig): string {
    if (!config.allowPaste) {
      return '';
    }

    return this.filterString(text, config);
  }

  /**
   * Genera mensaje de error personalizado para un tipo de restricción
   */
  getErrorMessage(type: InputRestrictionType, fieldName: string = 'campo'): string {
    const allowedChars = this.getAllowedCharsDescription(type);
    return `El ${fieldName} solo puede contener ${allowedChars}`;
  }

  /**
   * Genera configuración por defecto para un tipo
   */
  getDefaultConfig(type: InputRestrictionType): InputRestrictionConfig {
    return {
      type,
      maxLength: this.maxLengths[type],
      allowPaste: true,
      preventInvalidChars: true,
      showFeedback: true
    };
  }
}
