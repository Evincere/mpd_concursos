/**
 * Utilidades para verificación de tipos (type guards)
 */

/**
 * Verifica si un valor es un array
 * @param value Valor a verificar
 * @returns true si el valor es un array, false en caso contrario
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Verifica si un valor es un objeto
 * @param value Valor a verificar
 * @returns true si el valor es un objeto, false en caso contrario
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Verifica si un valor es una fecha
 * @param value Valor a verificar
 * @returns true si el valor es una fecha, false en caso contrario
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Verifica si un valor es una cadena
 * @param value Valor a verificar
 * @returns true si el valor es una cadena, false en caso contrario
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Verifica si un valor es un número
 * @param value Valor a verificar
 * @returns true si el valor es un número, false en caso contrario
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Verifica si un valor es un booleano
 * @param value Valor a verificar
 * @returns true si el valor es un booleano, false en caso contrario
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Convierte un valor a fecha de forma segura
 * @param value Valor a convertir
 * @returns Una fecha válida o null si no se puede convertir
 */
export function toDate(value: unknown): Date | null {
  if (isDate(value)) {
    return value;
  }
  
  if (isString(value) || isNumber(value)) {
    const date = new Date(value);
    return !isNaN(date.getTime()) ? date : null;
  }
  
  return null;
}

/**
 * Convierte un valor a cadena de forma segura
 * @param value Valor a convertir
 * @returns Una cadena
 */
export function toString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (isDate(value)) {
    return value.toISOString();
  }
  
  return String(value);
}

/**
 * Convierte un valor a número de forma segura
 * @param value Valor a convertir
 * @param defaultValue Valor por defecto si no se puede convertir
 * @returns Un número o el valor por defecto
 */
export function toNumber(value: unknown, defaultValue: number = 0): number {
  if (isNumber(value)) {
    return value;
  }
  
  if (isString(value)) {
    const num = Number(value);
    return !isNaN(num) ? num : defaultValue;
  }
  
  if (isBoolean(value)) {
    return value ? 1 : 0;
  }
  
  return defaultValue;
}
