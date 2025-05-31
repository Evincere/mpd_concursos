package ar.gov.mpd.concursobackend.inscription.domain.model;

/**
 * Enum representing the possible states of an inscription
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
public enum InscriptionState {
    // Standard states (English)
    ACTIVE("Active"),         // New standardized state (replaces IN_PROCESS)
    PENDING("Pending"),       // Standardized state
    APPROVED("Approved"),     // Standardized state
    REJECTED("Rejected"),     // Standardized state
    CANCELLED("Cancelled"),   // Standardized state

    // Legacy states (kept for backward compatibility)
    NO_INSCRIPTO("No Inscripto"),  // Legacy initial state
    IN_PROCESS("In Process"),      // Legacy state, now ACTIVE
    PENDIENTE("Pendiente"),        // Legacy state (Spanish), now PENDING
    INSCRIPTO("Inscripto"),        // Legacy state (Spanish), now APPROVED
    CONFIRMADA("Confirmada");      // Legacy state (Spanish), now PENDING
    
    private final String displayName;
    
    InscriptionState(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
