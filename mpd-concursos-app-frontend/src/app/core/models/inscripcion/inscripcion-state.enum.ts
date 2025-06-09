/**
 * Possible states of an inscription
 *
 * REFACTORING PHASE 3: Legacy states removed - Only standardized English states
 *
 * Standardized states (English):
 * - ACTIVE: Initial state when an inscription is created or in progress
 * - PENDING: Inscription completed by user, waiting for admin validation
 * - COMPLETED_WITH_DOCS: Inscription completed with all required documentation
 * - COMPLETED_PENDING_DOCS: Inscription completed but with pending documentation
 * - FROZEN: Inscription frozen after peremptory deadline expired
 * - APPROVED: Inscription approved by admin
 * - REJECTED: Inscription rejected by admin
 * - CANCELLED: Inscription cancelled by user
 */
export enum InscripcionState {
  // Standard states (English) - ONLY THESE REMAIN
  ACTIVE = 'ACTIVE',                           // Initial state when inscription is created or in progress
  PENDING = 'PENDING',                         // Inscription completed, waiting for admin validation
  COMPLETED_WITH_DOCS = 'COMPLETED_WITH_DOCS', // Inscription completed with all documentation
  COMPLETED_PENDING_DOCS = 'COMPLETED_PENDING_DOCS', // Inscription completed but documentation pending
  FROZEN = 'FROZEN',                           // Inscription frozen after peremptory deadline
  APPROVED = 'APPROVED',                       // Inscription approved by admin
  REJECTED = 'REJECTED',                       // Inscription rejected by admin
  CANCELLED = 'CANCELLED'                      // Inscription cancelled by user
}

/**
 * Utility class for inscription state management
 */
export class InscripcionStateUtils {

  /**
   * States that allow resuming/continuing the inscription process
   * REFACTORING: Solo estados estándar
   */
  static readonly RESUMABLE_STATES = [
    InscripcionState.ACTIVE,
    InscripcionState.COMPLETED_PENDING_DOCS
  ];

  /**
   * States that are considered final and don't allow modifications
   * REFACTORING: Solo estados estándar
   */
  static readonly FINAL_STATES = [
    InscripcionState.APPROVED,
    InscripcionState.REJECTED,
    InscripcionState.CANCELLED,
    InscripcionState.FROZEN
  ];

  /**
   * States that allow document upload
   * REFACTORING: Solo estados estándar
   */
  static readonly DOCUMENT_UPLOAD_ALLOWED_STATES = [
    InscripcionState.ACTIVE,
    InscripcionState.COMPLETED_PENDING_DOCS
  ];

  /**
   * States that indicate the inscription is completed but pending validation
   * REFACTORING: Solo estados estándar
   */
  static readonly PENDING_VALIDATION_STATES = [
    InscripcionState.PENDING,
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
    // REFACTORING: Solo estados estándar después de eliminar legacy
    switch (state) {
      case InscripcionState.ACTIVE:
        return 'En Proceso';
      case InscripcionState.PENDING:
        return 'Pendiente';
      case InscripcionState.COMPLETED_WITH_DOCS:
        return 'Completada con Documentos';
      case InscripcionState.COMPLETED_PENDING_DOCS:
        return 'Completada - Documentos Pendientes';
      case InscripcionState.FROZEN:
        return 'Congelada';
      case InscripcionState.APPROVED:
        return 'Aprobada';
      case InscripcionState.REJECTED:
        return 'Rechazada';
      case InscripcionState.CANCELLED:
        return 'Cancelada';
      default:
        return 'Estado Desconocido';
    }
  }

  /**
   * Get CSS class for state styling
   */
  static getStateClass(state: InscripcionState): string {
    // REFACTORING: Solo estados estándar después de eliminar legacy
    switch (state) {
      case InscripcionState.ACTIVE:
        return 'status-in-process';
      case InscripcionState.PENDING:
      case InscripcionState.COMPLETED_PENDING_DOCS:
        return 'status-pending';
      case InscripcionState.COMPLETED_WITH_DOCS:
        return 'status-completed';
      case InscripcionState.FROZEN:
        return 'status-frozen';
      case InscripcionState.APPROVED:
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
