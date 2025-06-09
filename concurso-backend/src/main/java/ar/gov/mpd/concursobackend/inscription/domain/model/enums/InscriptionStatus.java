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
     * Inscription completed with all required documentation
     */
    COMPLETED_WITH_DOCS,

    /**
     * Inscription completed but with pending documentation
     */
    COMPLETED_PENDING_DOCS,

    /**
     * Inscription frozen after peremptory deadline expired
     */
    FROZEN,

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
