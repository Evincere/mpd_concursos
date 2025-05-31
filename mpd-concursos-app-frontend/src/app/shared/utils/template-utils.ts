/**
 * Utilidades para plantillas de componentes
 */

/**
 * Formatea una fecha para mostrar en la interfaz de usuario
 * @param date Fecha a formatear (puede ser string, Date o null/undefined)
 * @param format Formato de fecha (por defecto: 'dd/MM/yyyy')
 * @returns Fecha formateada o cadena vacía si la fecha es inválida
 */
export function formatDate(date: string | Date | null | undefined, format: string = 'dd/MM/yyyy'): string {
  if (!date) {
    return '';
  }
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    // Implementación simple de formato de fecha
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    if (format === 'dd/MM/yyyy') {
      return `${day}/${month}/${year}`;
    } else if (format === 'MM/dd/yyyy') {
      return `${month}/${day}/${year}`;
    } else if (format === 'yyyy-MM-dd') {
      return `${year}-${month}-${day}`;
    } else {
      return `${day}/${month}/${year}`;
    }
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return '';
  }
}

/**
 * Verifica si un usuario tiene un rol específico
 * @param user Usuario a verificar
 * @param role Rol a verificar
 * @returns true si el usuario tiene el rol, false en caso contrario
 */
export function hasRole(user: any, role: string): boolean {
  if (!user) {
    return false;
  }
  
  // Verificar si el usuario tiene la propiedad roles
  if (Array.isArray(user.roles)) {
    return user.roles.includes(role);
  }
  
  // Verificar si el usuario tiene la propiedad authorities
  if (Array.isArray(user.authorities)) {
    return user.authorities.some((auth: any) => {
      if (typeof auth === 'string') {
        return auth === role;
      } else if (auth && typeof auth === 'object' && 'authority' in auth) {
        return auth.authority === role;
      }
      return false;
    });
  }
  
  return false;
}

/**
 * Trunca un texto a una longitud máxima
 * @param text Texto a truncar
 * @param maxLength Longitud máxima (por defecto: 50)
 * @param suffix Sufijo a agregar si el texto se trunca (por defecto: '...')
 * @returns Texto truncado
 */
export function truncateText(text: string | null | undefined, maxLength: number = 50, suffix: string = '...'): string {
  if (!text) {
    return '';
  }
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + suffix;
}

/**
 * Obtiene el valor de una propiedad de un objeto de forma segura para usar en plantillas
 * @param item Objeto del que se quiere obtener la propiedad
 * @param property Nombre de la propiedad
 * @returns Valor de la propiedad o null si no existe
 */
export function getPropertyValue(item: any, property: string): any {
  if (!item || typeof item !== 'object') {
    return null;
  }
  
  // Intentar acceder directamente
  if (property in item) {
    return item[property];
  }
  
  // Intentar acceder a propiedades anidadas
  const parts = property.split('.');
  let current = item;
  
  for (const part of parts) {
    if (!current || typeof current !== 'object' || !(part in current)) {
      return null;
    }
    current = current[part];
  }
  
  return current;
}
