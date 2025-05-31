/**
 * Possible states of an inscription
 *
 * Standardized states (English):
 * - ACTIVE: Initial state when an inscription is created or in progress (formerly IN_PROCESS)
 * - PENDING: Inscription completed by user, waiting for admin validation
 * - APPROVED: Inscription approved by admin
 * - REJECTED: Inscription rejected by admin
 * - CANCELLED: Inscription cancelled by user
 *
 * Legacy states (kept for backward compatibility):
 * - NO_INSCRIPTO: User not inscribed (initial state)
 * - IN_PROCESS: Inscription in progress (now ACTIVE)
 * - PENDIENTE: Spanish for PENDING
 * - INSCRIPTO: Spanish for APPROVED
 * - CONFIRMADA: Spanish for PENDING (old terminology)
 */
export enum InscripcionState {
  // Standard states (English)
  ACTIVE = 'ACTIVE',         // New standardized state (replaces IN_PROCESS)
  PENDING = 'PENDING',       // Standardized state
  APPROVED = 'APPROVED',     // Standardized state
  REJECTED = 'REJECTED',     // Standardized state
  CANCELLED = 'CANCELLED',   // Standardized state

  // Legacy states (kept for backward compatibility)
  NO_INSCRIPTO = 'NO_INSCRIPTO',  // Legacy initial state
  IN_PROCESS = 'IN_PROCESS',      // Legacy state, now ACTIVE
  PENDIENTE = 'PENDIENTE',        // Legacy state (Spanish), now PENDING
  INSCRIPTO = 'INSCRIPTO',        // Legacy state (Spanish), now APPROVED
  CONFIRMADA = 'CONFIRMADA'       // Legacy state, now PENDING
}
