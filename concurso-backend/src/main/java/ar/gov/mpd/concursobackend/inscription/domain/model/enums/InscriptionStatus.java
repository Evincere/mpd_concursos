package ar.gov.mpd.concursobackend.inscription.domain.model.enums;

/**
 * Enum representing the possible states of an inscription
 */
public enum InscriptionStatus {
    /**
     * Initial state when an inscription is created or in progress
     * Formerly known as IN_PROCESS
     */
    ACTIVE,
    
    /**
     * Inscription completed by user, waiting for admin validation
     */
    PENDING,
    
    /**
     * Inscription approved by admin
     */
    APPROVED,
    
    /**
     * Inscription rejected by admin
     */
    REJECTED,
    
    /**
     * Inscription cancelled by user
     */
    CANCELLED
}
