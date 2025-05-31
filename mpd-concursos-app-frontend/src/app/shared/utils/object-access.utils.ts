/**
 * Utilidades para acceso seguro a propiedades de objetos
 */

/**
 * Obtiene una propiedad de un objeto de forma segura
 * @param obj Objeto del que se quiere obtener la propiedad
 * @param key Clave de la propiedad
 * @param defaultValue Valor por defecto si la propiedad no existe
 * @returns El valor de la propiedad o el valor por defecto
 */
export function getProperty<T = unknown>(
  obj: Record<string, unknown> | null | undefined,
  key: string,
  defaultValue: T | null = null
): T | null {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }
  
  return (key in obj ? obj[key] as T : defaultValue);
}

/**
 * Verifica si un objeto tiene una propiedad
 * @param obj Objeto a verificar
 * @param key Clave de la propiedad
 * @returns true si el objeto tiene la propiedad, false en caso contrario
 */
export function hasProperty(
  obj: Record<string, unknown> | null | undefined,
  key: string
): boolean {
  return obj !== null && obj !== undefined && typeof obj === 'object' && key in obj;
}

/**
 * Obtiene una propiedad anidada de un objeto de forma segura
 * @param obj Objeto del que se quiere obtener la propiedad
 * @param path Ruta de la propiedad (ej: 'user.address.street')
 * @param defaultValue Valor por defecto si la propiedad no existe
 * @returns El valor de la propiedad o el valor por defecto
 */
export function getNestedProperty<T = unknown>(
  obj: Record<string, unknown> | null | undefined,
  path: string,
  defaultValue: T | null = null
): T | null {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }
  
  const keys = path.split('.');
  let current: any = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object' || !(key in current)) {
      return defaultValue;
    }
    current = current[key];
  }
  
  return current as T;
}
