/**
 * Possible states of an inscription
 *
 * Standardized states (English):
 * - ACTIVE: Initial state when an inscription is created or in progress (formerly IN_PROCESS)
 * - PENDING: Inscription completed by user, waiting for admin validation
 * - COMPLETED_WITH_DOCS: Inscription completed with all required documentation
 * - COMPLETED_PENDING_DOCS: Inscription completed but with pending documentation
 * - FROZEN: Inscription frozen after peremptory deadline expired
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
  ACTIVE = 'ACTIVE',                           // New standardized state (replaces IN_PROCESS)
  PENDING = 'PENDING',                         // Standardized state
  COMPLETED_WITH_DOCS = 'COMPLETED_WITH_DOCS', // Inscription completed with all documentation
  COMPLETED_PENDING_DOCS = 'COMPLETED_PENDING_DOCS', // Inscription completed but documentation pending
  FROZEN = 'FROZEN',                           // Inscription frozen after peremptory deadline
  APPROVED = 'APPROVED',                       // Standardized state
  REJECTED = 'REJECTED',                       // Standardized state
  CANCELLED = 'CANCELLED',                     // Standardized state

  // Legacy states (kept for backward compatibility)
  NO_INSCRIPTO = 'NO_INSCRIPTO',  // Legacy initial state
  IN_PROCESS = 'IN_PROCESS',      // Legacy state, now ACTIVE
  PENDIENTE = 'PENDIENTE',        // Legacy state (Spanish), now PENDING
  INSCRIPTO = 'INSCRIPTO',        // Legacy state (Spanish), now APPROVED
  CONFIRMADA = 'CONFIRMADA'       // Legacy state, now PENDING
}

/**
 * Utility class for inscription state management
 */
export class InscripcionStateUtils {

  /**
   * States that allow resuming/continuing the inscription process
   */
  static readonly RESUMABLE_STATES = [
    InscripcionState.ACTIVE,
    InscripcionState.IN_PROCESS,
    InscripcionState.COMPLETED_PENDING_DOCS
  ];

  /**
   * States that are considered final and don't allow modifications
   */
  static readonly FINAL_STATES = [
    InscripcionState.APPROVED,
    InscripcionState.INSCRIPTO,
    InscripcionState.REJECTED,
    InscripcionState.CANCELLED,
    InscripcionState.FROZEN
  ];

  /**
   * States that allow document upload
   */
  static readonly DOCUMENT_UPLOAD_ALLOWED_STATES = [
    InscripcionState.ACTIVE,
    InscripcionState.IN_PROCESS,
    InscripcionState.COMPLETED_PENDING_DOCS
  ];

  /**
   * States that indicate the inscription is completed but pending validation
   */
  static readonly PENDING_VALIDATION_STATES = [
    InscripcionState.PENDING,
    InscripcionState.PENDIENTE,
    InscripcionState.CONFIRMADA,
    InscripcionState.COMPLETED_WITH_DOCS,
    InscripcionState.COMPLETED_PENDING_DOCS
  ];

  /**
   * Check if an inscription state allows resuming the process
   */
  static canResume(state: InscripcionState): boolean {
    return this.RESUMABLE_STATES.includes(state);
  }

  /**
   * Check if an inscription state is final (no modifications allowed)
   */
  static isFinal(state: InscripcionState): boolean {
    return this.FINAL_STATES.includes(state);
  }

  /**
   * Check if an inscription state allows document upload
   */
  static canUploadDocuments(state: InscripcionState): boolean {
    return this.DOCUMENT_UPLOAD_ALLOWED_STATES.includes(state);
  }

  /**
   * Check if an inscription is pending validation
   */
  static isPendingValidation(state: InscripcionState): boolean {
    return this.PENDING_VALIDATION_STATES.includes(state);
  }

  /**
   * Get user-friendly label for state
   */
  static getStateLabel(state: InscripcionState): string {
    switch (state) {
      case InscripcionState.ACTIVE:
      case InscripcionState.IN_PROCESS:
        return 'En Proceso';
      case InscripcionState.PENDING:
      case InscripcionState.PENDIENTE:
      case InscripcionState.CONFIRMADA:
        return 'Pendiente';
      case InscripcionState.COMPLETED_WITH_DOCS:
        return 'Completada con Documentos';
      case InscripcionState.COMPLETED_PENDING_DOCS:
        return 'Completada - Documentos Pendientes';
      case InscripcionState.FROZEN:
        return 'Congelada';
      case InscripcionState.APPROVED:
      case InscripcionState.INSCRIPTO:
        return 'Aprobada';
      case InscripcionState.REJECTED:
        return 'Rechazada';
      case InscripcionState.CANCELLED:
        return 'Cancelada';
      case InscripcionState.NO_INSCRIPTO:
        return 'No Inscripto';
      default:
        return 'Desconocido';
    }
  }

  /**
   * Get CSS class for state styling
   */
  static getStateClass(state: InscripcionState): string {
    switch (state) {
      case InscripcionState.ACTIVE:
      case InscripcionState.IN_PROCESS:
        return 'status-in-process';
      case InscripcionState.PENDING:
      case InscripcionState.PENDIENTE:
      case InscripcionState.CONFIRMADA:
      case InscripcionState.COMPLETED_PENDING_DOCS:
        return 'status-pending';
      case InscripcionState.COMPLETED_WITH_DOCS:
        return 'status-completed';
      case InscripcionState.FROZEN:
        return 'status-frozen';
      case InscripcionState.APPROVED:
      case InscripcionState.INSCRIPTO:
        return 'status-approved';
      case InscripcionState.REJECTED:
        return 'status-rejected';
      case InscripcionState.CANCELLED:
        return 'status-cancelled';
      default:
        return 'status-unknown';
    }
  }
}
