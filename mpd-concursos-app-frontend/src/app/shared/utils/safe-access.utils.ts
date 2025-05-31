/**
 * Utilidades para acceso seguro a propiedades
 */

/**
 * Obtiene una propiedad de un objeto de forma segura
 * @param obj Objeto del que se quiere obtener la propiedad
 * @param key Clave de la propiedad
 * @param defaultValue Valor por defecto si la propiedad no existe
 * @returns El valor de la propiedad o el valor por defecto
 */
export function safeGet<T = unknown>(
  obj: any,
  key: string,
  defaultValue: T | null = null
): T | null {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }
  
  return (key in obj ? obj[key] as T : defaultValue);
}

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
 * Convierte un valor a fecha de forma segura
 * @param value Valor a convertir
 * @returns Una fecha válida o null si no se puede convertir
 */
export function toDate(value: unknown): Date | null {
  if (isDate(value)) {
    return value;
  }
  
  if (typeof value === 'string' || typeof value === 'number') {
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
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  
  if (typeof value === 'string') {
    const num = Number(value);
    return !isNaN(num) ? num : defaultValue;
  }
  
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  
  return defaultValue;
}

/**
 * Accede de forma segura a un método de un array
 * @param arr Array o valor potencialmente array
 * @param method Nombre del método a llamar
 * @param args Argumentos para el método
 * @param defaultValue Valor por defecto si no se puede llamar al método
 * @returns El resultado del método o el valor por defecto
 */
export function safeArrayMethod<T, R>(
  arr: unknown,
  method: keyof any[],
  args: any[] = [],
  defaultValue: R | null = null
): R | null {
  if (!isArray(arr)) {
    return defaultValue;
  }
  
  const fn = arr[method];
  if (typeof fn !== 'function') {
    return defaultValue;
  }
  
  try {
    return fn.apply(arr, args) as R;
  } catch (error) {
    console.error(`Error al llamar al método ${String(method)}:`, error);
    return defaultValue;
  }
}

/**
 * Obtiene la longitud de un array de forma segura
 * @param arr Array o valor potencialmente array
 * @returns La longitud del array o 0 si no es un array
 */
export function safeLength(arr: unknown): number {
  return isArray(arr) ? arr.length : 0;
}
