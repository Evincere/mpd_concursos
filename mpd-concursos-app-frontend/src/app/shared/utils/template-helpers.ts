/**
 * Utilidades para ayudar con errores en plantillas de componentes
 */
import { isArray, isDate, safeArrayMethod, safeGet, safeLength } from './safe-access.utils';

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
  if (isArray(user.roles)) {
    return safeArrayMethod(user.roles, 'includes', [role], false) as boolean;
  }
  
  // Verificar si el usuario tiene la propiedad authorities
  if (isArray(user.authorities)) {
    return safeArrayMethod(user.authorities, 'some', [(auth: any) => {
      if (typeof auth === 'string') {
        return auth === role;
      } else if (auth && typeof auth === 'object') {
        return safeGet(auth, 'authority') === role;
      }
      return false;
    }], false) as boolean;
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
 * Maneja eventos de búsqueda de forma segura
 * @param event Evento de búsqueda
 * @param callback Función de callback
 */
export function handleSearch(event: any, callback: (query: string) => void): void {
  const query = event?.target?.value || '';
  callback(query);
}

/**
 * Cierra notificaciones de forma segura
 * @param notificationService Servicio de notificaciones
 * @param id ID de la notificación a cerrar
 */
export function closeNotification(notificationService: any, id?: string): void {
  if (notificationService && typeof notificationService.closeNotification === 'function') {
    if (id) {
      notificationService.closeNotification(id);
    } else {
      notificationService.closeAllNotifications();
    }
  }
}

/**
 * Maneja eventos de clic de forma segura
 * @param event Evento de clic
 * @param callback Función de callback
 */
export function handleClick(event: any, callback: () => void): void {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  callback();
}
