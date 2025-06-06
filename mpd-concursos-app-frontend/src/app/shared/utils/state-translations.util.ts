/**
 * Utilidades para traducir estados de concursos e inscripciones
 * Centraliza todas las traducciones para mantener consistencia
 */

/**
 * Traduce estados de concursos de inglés a español
 * @param status Estado del concurso en inglés
 * @returns Estado traducido al español
 */
export function translateContestStatus(status: string | undefined | null): string {
  if (!status) return 'Desconocido';

  const estados: Record<string, string> = {
    'ACTIVE': 'Activo',
    'PUBLISHED': 'Publicado',
    'PAUSED': 'Pausado',
    'PENDING': 'Pendiente',
    'CLOSED': 'Cerrado',
    'FINISHED': 'Finalizado',
    'DRAFT': 'Borrador',
    'CANCELLED': 'Cancelado',
    'ARCHIVED': 'Archivado',
    'IN_PROGRESS': 'En Proceso'
  };

  return estados[status] || status;
}

/**
 * Traduce estados de inscripciones de inglés a español
 * @param status Estado de la inscripción en inglés
 * @returns Estado traducido al español
 */
export function translateInscriptionStatus(status: string | undefined | null): string {
  if (!status) return 'Desconocido';

  const estados: Record<string, string> = {
    'ACTIVE': 'En Proceso',
    'IN_PROCESS': 'En Proceso',
    'PENDING': 'Pendiente',
    'PENDIENTE': 'Pendiente',
    'CONFIRMADA': 'Pendiente',
    'COMPLETED_WITH_DOCS': 'Pendiente',
    'COMPLETED_PENDING_DOCS': 'Pendiente',
    'FROZEN': 'Congelada',
    'APPROVED': 'Aprobada',
    'INSCRIPTO': 'Aprobada',
    'REJECTED': 'Rechazada',
    'CANCELLED': 'Cancelada',
    'NO_INSCRIPTO': 'No Inscripto'
  };

  return estados[status] || 'Desconocido';
}

/**
 * Obtiene la clase CSS para el estado de un concurso
 * @param status Estado del concurso
 * @returns Clase CSS correspondiente
 */
export function getContestStatusClass(status: string): string {
  const clases: Record<string, string> = {
    'ACTIVE': 'status-active',
    'PUBLISHED': 'status-published',
    'PAUSED': 'status-paused',
    'PENDING': 'status-pending',
    'CLOSED': 'status-closed',
    'FINISHED': 'status-finished',
    'DRAFT': 'status-draft',
    'CANCELLED': 'status-cancelled',
    'ARCHIVED': 'status-archived',
    'IN_PROGRESS': 'status-in-progress'
  };
  
  return clases[status] || 'status-unknown';
}

/**
 * Obtiene la clase CSS para el estado de una inscripción
 * @param status Estado de la inscripción
 * @returns Clase CSS correspondiente
 */
export function getInscriptionStatusClass(status: string): string {
  const clases: Record<string, string> = {
    'ACTIVE': 'status-in-process',
    'IN_PROCESS': 'status-in-process',
    'PENDING': 'status-pending',
    'PENDIENTE': 'status-pending',
    'CONFIRMADA': 'status-pending',
    'COMPLETED_WITH_DOCS': 'status-pending',
    'COMPLETED_PENDING_DOCS': 'status-pending',
    'FROZEN': 'status-frozen',
    'APPROVED': 'status-approved',
    'INSCRIPTO': 'status-approved',
    'REJECTED': 'status-rejected',
    'CANCELLED': 'status-cancelled',
    'NO_INSCRIPTO': 'status-no-inscripto'
  };
  
  return clases[status] || 'status-unknown';
}
