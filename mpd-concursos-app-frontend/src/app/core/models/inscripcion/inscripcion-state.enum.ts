/**
 * Estados posibles de una inscripción
 *
 * NO_INSCRIPTO: Estado inicial, el usuario no se ha inscrito al concurso
 * IN_PROCESS: La inscripción está en proceso pero no se ha completado (interrumpida)
 * PENDIENTE: El usuario ha completado todos los pasos de la inscripción pero aun no ha sido validada por un administrador
 * INSCRIPTO: La inscripción ha sido validada por un administrador
 * REJECTED: La inscripción ha sido rechazada por un administrador
 * CANCELLED: La inscripción ha sido cancelada por el usuario
 *
 * Nota: Se mantienen algunos estados antiguos por compatibilidad, pero se deben usar los nuevos estados estandarizados
 */
export enum InscripcionState {
  NO_INSCRIPTO = 'NO_INSCRIPTO',
  IN_PROCESS = 'IN_PROCESS',     // Nuevo estado estandarizado
  PENDING = 'PENDING',           // Mantenido por compatibilidad, equivalente a IN_PROCESS
  PENDIENTE = 'PENDIENTE',       // Nuevo estado estandarizado
  CONFIRMADA = 'CONFIRMADA',     // Mantenido por compatibilidad, equivalente a PENDIENTE
  INSCRIPTO = 'INSCRIPTO',       // Estado estandarizado
  APPROVED = 'APPROVED',         // Mantenido por compatibilidad, equivalente a INSCRIPTO
  REJECTED = 'REJECTED',         // Estado estandarizado
  CANCELLED = 'CANCELLED'        // Estado estandarizado
}
