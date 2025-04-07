/**
 * Estados posibles de una inscripción
 *
 * NO_INSCRIPTO: Usuario no inscripto en el concurso
 * PENDING: Inscripción en proceso, el usuario ha iniciado pero no completado el proceso
 * CONFIRMADA: Inscripción completada por el usuario, pendiente de validación por el administrador
 * INSCRIPTO: Inscripción validada por el administrador (reemplaza a APPROVED para mayor claridad)
 * REJECTED: Inscripción rechazada por el administrador
 * CANCELLED: Inscripción cancelada por el usuario o el administrador
 */
export enum InscripcionState {
  NO_INSCRIPTO = 'NO_INSCRIPTO',
  PENDING = 'PENDING',
  CONFIRMADA = 'CONFIRMADA',
  INSCRIPTO = 'INSCRIPTO', // Reemplaza a APPROVED
  APPROVED = 'APPROVED',   // Mantenido por compatibilidad
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}
