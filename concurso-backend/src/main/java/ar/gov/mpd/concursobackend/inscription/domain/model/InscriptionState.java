package ar.gov.mpd.concursobackend.inscription.domain.model;

/**
 * Enum representing the possible states of an inscription
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
public enum InscriptionState {
    // Standard states (English) - ONLY THESE REMAIN
    ACTIVE("Active"),                           // Initial state when inscription is created or in progress
    PENDING("Pending"),                         // Inscription completed, waiting for admin validation
    COMPLETED_WITH_DOCS("Completed with Docs"), // Inscription completed with all documentation
    COMPLETED_PENDING_DOCS("Completed Pending Docs"), // Inscription completed but documentation pending
    FROZEN("Frozen"),                           // Inscription frozen after peremptory deadline
    APPROVED("Approved"),                       // Inscription approved by admin
    REJECTED("Rejected"),                       // Inscription rejected by admin
    CANCELLED("Cancelled");                     // Inscription cancelled by user
    
    private final String displayName;
    
    InscriptionState(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
