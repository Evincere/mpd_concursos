package ar.gov.mpd.concursobackend.postulation.domain.enums;

/**
 * Postulation status enum
 * Represents all possible states of a postulation throughout its lifecycle
 * Updated to include documentation-specific states for better UX
 */
public enum PostulationStatus {
    ACTIVE("Active", "En Proceso"),
    PENDING("Pending", "Pendiente Validación"),
    COMPLETED_WITH_DOCS("Completed with Docs", "Pendiente Validación"),
    COMPLETED_PENDING_DOCS("Completed Pending Docs", "Documentación Pendiente"),
    FROZEN("Frozen", "Congelada"),
    APPROVED("Approved", "Aprobada"),
    REJECTED("Rejected", "Rechazada"),
    CANCELLED("Cancelled", "Cancelada");

    private final String englishName;
    private final String spanishName;

    PostulationStatus(String englishName, String spanishName) {
        this.englishName = englishName;
        this.spanishName = spanishName;
    }

    public String getEnglishName() {
        return englishName;
    }

    public String getSpanishName() {
        return spanishName;
    }

    /**
     * Creates a PostulationStatus from string representation
     * 
     * @param status String representation of the status
     * @return PostulationStatus enum value
     * @throws IllegalArgumentException if status is invalid
     */
    public static PostulationStatus fromString(String status) {
        try {
            return PostulationStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid postulation status: " + status);
        }
    }

    /**
     * Check if this status represents an active postulation
     */
    public boolean isActive() {
        return this == ACTIVE;
    }

    /**
     * Check if this status represents a final state
     */
    public boolean isFinalState() {
        return this == APPROVED || this == REJECTED || this == CANCELLED || this == FROZEN;
    }

    /**
     * Check if this status allows modifications
     */
    public boolean allowsModifications() {
        return this == ACTIVE;
    }

    /**
     * Check if this status represents a successful outcome
     */
    public boolean isSuccessful() {
        return this == APPROVED;
    }
}
