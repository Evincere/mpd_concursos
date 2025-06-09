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
    // Estados estándar (únicos válidos)
    'ACTIVE': 'En Proceso',
    'PENDING': 'Pendiente Validación',
    'COMPLETED_WITH_DOCS': 'Pendiente Validación',
    'COMPLETED_PENDING_DOCS': 'Documentación Pendiente',
    'FROZEN': 'Congelada',
    'APPROVED': 'Aprobada',
    'REJECTED': 'Rechazada',
    'CANCELLED': 'Cancelada',

    // Mapeos de compatibilidad temporal (para datos legacy existentes)
    'IN_PROCESS': 'En Proceso',        // → ACTIVE
    'PENDIENTE': 'Pendiente Validación', // → PENDING
    'CONFIRMADA': 'Pendiente Validación', // → PENDING
    'INSCRIPTO': 'Aprobada',           // → APPROVED
    'NO_INSCRIPTO': 'No Inscripto'     // → Eliminar gradualmente
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
    // Estados estándar (únicos válidos)
    'ACTIVE': 'status-in-process',
    'PENDING': 'status-pending',
    'COMPLETED_WITH_DOCS': 'status-completed-with-docs',
    'COMPLETED_PENDING_DOCS': 'status-pending-docs',
    'FROZEN': 'status-frozen',
    'APPROVED': 'status-approved',
    'REJECTED': 'status-rejected',
    'CANCELLED': 'status-cancelled',

    // Mapeos de compatibilidad temporal (para datos legacy existentes)
    'IN_PROCESS': 'status-in-process',     // → ACTIVE
    'PENDIENTE': 'status-pending',         // → PENDING
    'CONFIRMADA': 'status-pending',        // → PENDING
    'INSCRIPTO': 'status-approved',        // → APPROVED
    'NO_INSCRIPTO': 'status-no-inscripto' // → Eliminar gradualmente
  };
  
  return clases[status] || 'status-unknown';
}

/**
 * Obtiene un mensaje descriptivo para el estado de una inscripción
 * @param status Estado de la inscripción
 * @returns Mensaje descriptivo para el usuario
 */
export function getInscriptionStatusMessage(status: string): string {
  const mensajes: Record<string, string> = {
    'ACTIVE': 'Tu inscripción está en proceso. Puedes continuar completando los pasos pendientes.',
    'PENDING': 'Tu inscripción está completa y pendiente de validación administrativa.',
    'COMPLETED_WITH_DOCS': 'Tu inscripción está completa con toda la documentación. Pendiente de validación administrativa.',
    'COMPLETED_PENDING_DOCS': 'Tu inscripción está completa pero faltan documentos. Tienes 3 días hábiles para completar la documentación.',
    'FROZEN': 'Tu inscripción ha sido congelada por vencimiento del plazo de documentación.',
    'APPROVED': 'Tu inscripción ha sido aprobada. ¡Felicitaciones!',
    'REJECTED': 'Tu inscripción ha sido rechazada. Revisa los comentarios del administrador.',
    'CANCELLED': 'Tu inscripción ha sido cancelada.'
  };

  return mensajes[status] || 'Estado de inscripción desconocido.';
}
