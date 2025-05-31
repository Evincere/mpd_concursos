/**
 * Utilidades para conversión de tipos
 */
import { IInscription, IInscriptionResponse } from '@shared/interfaces/inscripcion/inscription.interface';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';
import { InscriptionStep } from '@shared/enums/inscription-step.enum';

/**
 * Convierte una respuesta de inscripción de la API a un objeto IInscription
 * @param response Respuesta de la API
 * @returns Objeto IInscription
 */
export function mapToInscription(response: IInscriptionResponse): IInscription {
  return {
    id: response.id,
    contestId: response.contestId,
    userId: response.userId,
    state: response.status as InscripcionState,
    createdAt: new Date(response.createdAt),
    updatedAt: new Date(response.updatedAt),
    // Otros campos opcionales
  };
}

/**
 * Convierte una fecha a string en formato ISO
 * @param date Fecha a convertir
 * @returns Fecha en formato ISO o cadena vacía si la fecha es inválida
 */
export function dateToISOString(date: Date | string | null | undefined): string {
  if (!date) {
    return '';
  }
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    return dateObj.toISOString();
  } catch (error) {
    console.error('Error al convertir fecha a ISO:', error);
    return '';
  }
}

/**
 * Convierte una cadena a fecha
 * @param dateStr Cadena de fecha
 * @returns Objeto Date o null si la cadena es inválida
 */
export function stringToDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) {
    return null;
  }
  
  try {
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return date;
  } catch (error) {
    console.error('Error al convertir cadena a fecha:', error);
    return null;
  }
}

/**
 * Convierte un objeto a un tipo específico
 * @param obj Objeto a convertir
 * @param defaultValues Valores por defecto para propiedades faltantes
 * @returns Objeto convertido
 */
export function convertToType<T>(obj: Record<string, unknown>, defaultValues: Partial<T>): T {
  if (!obj) {
    return defaultValues as T;
  }
  
  // Combinar el objeto con los valores por defecto
  return { ...defaultValues, ...obj } as T;
}

/**
 * Convierte un objeto a un tipo específico con mapeo de propiedades
 * @param obj Objeto a convertir
 * @param propertyMap Mapa de propiedades (clave: propiedad en obj, valor: propiedad en T)
 * @param defaultValues Valores por defecto para propiedades faltantes
 * @returns Objeto convertido
 */
export function convertWithPropertyMap<T>(
  obj: Record<string, unknown>,
  propertyMap: Record<string, string>,
  defaultValues: Partial<T>
): T {
  if (!obj) {
    return defaultValues as T;
  }
  
  const result = { ...defaultValues } as Record<string, unknown>;
  
  // Mapear propiedades según el mapa
  for (const [sourceKey, targetKey] of Object.entries(propertyMap)) {
    if (sourceKey in obj) {
      result[targetKey] = obj[sourceKey];
    }
  }
  
  return result as T;
}
