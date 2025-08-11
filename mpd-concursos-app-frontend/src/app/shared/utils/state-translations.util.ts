/**
 * Utilidades para traducir estados de concursos e inscripciones
 * Centraliza todas las traducciones para mantener consistencia
 * ACTUALIZADO: Corregidas traducciones duplicadas para mayor claridad
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
    'IN_PROGRESS': 'En Proceso',
    // Estados dinámicos específicos
    'INSCRIPTION_PENDING': 'Próximamente',
    'INSCRIPTION_OPEN': 'Inscripciones Abiertas',
    'INSCRIPTION_CLOSED': 'Inscripciones Cerradas',
    'IN_EVALUATION': 'En Evaluación',
    'RESULTS_PUBLISHED': 'Resultados Publicados'
  };

  return estados[status] || status;
}

/**
 * Traduce estados de inscripciones de inglés a español
 * @param status Estado de la inscripción en inglés
 * @returns Estado traducido al español
 * ACTUALIZADO: Corregidas traducciones duplicadas para mayor claridad
 */
export function translateInscriptionStatus(status: string | undefined | null): string {
  if (!status) return 'Desconocido';

  const estados: Record<string, string> = {
    // Estados estándar (únicos válidos) - CORREGIDOS para evitar duplicados
    'ACTIVE': 'En Proceso',
    'PENDING': 'Inscripción Finalizada - Pendiente de Validación', // ✅ CORREGIDO: Más específico
    'COMPLETED_WITH_DOCS': 'Documentación Completa - Pendiente de Validación', // ✅ CORREGIDO: Diferenciado de PENDING
    'COMPLETED_PENDING_DOCS': 'Documentación Pendiente - 3 Días Hábiles', // ✅ CORREGIDO: Más claro sobre el plazo
    'FROZEN': 'Congelada - Plazo Vencido',
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
    'PENDING': 'status-pending-validation',        // ✅ CORREGIDO: Clase específica
    'COMPLETED_WITH_DOCS': 'status-completed-with-docs', // ✅ CORREGIDO: Clase diferenciada
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
 * ACTUALIZADO: Mensajes más claros y diferenciados
 */
export function getInscriptionStatusMessage(status: string): string {
  const mensajes: Record<string, string> = {
    'ACTIVE': 'Tu inscripción está en proceso. Puedes continuar completando los pasos pendientes.',
    'PENDING': 'Tu inscripción ha sido finalizada exitosamente. Está pendiente de validación administrativa. No se requieren acciones adicionales de tu parte.',
    'COMPLETED_WITH_DOCS': 'Tu inscripción está completa con toda la documentación requerida. Está pendiente de validación administrativa. El proceso de revisión iniciará pronto.',
    'COMPLETED_PENDING_DOCS': 'Tu inscripción está registrada pero falta completar la documentación. Tienes 3 días hábiles para cargar todos los documentos requeridos.',
    'FROZEN': 'Tu inscripción ha sido congelada por vencimiento del plazo de documentación. Contacta al administrador si consideras que es un error.',
    'APPROVED': '¡Felicitaciones! Tu inscripción ha sido aprobada. Recibirás notificaciones sobre los próximos pasos del concurso.',
    'REJECTED': 'Tu inscripción ha sido rechazada. Revisa los comentarios del administrador para obtener más información.',
    'CANCELLED': 'Tu inscripción ha sido cancelada y no será considerada en este concurso.'
  };

  return mensajes[status] || 'Estado de inscripción desconocido. Contacta al soporte técnico.';
}
