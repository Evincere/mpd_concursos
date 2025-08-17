package ar.gov.mpd.concursobackend.postulation.domain.enums;

/**
 * Postulation status enum
 * Represents all possible states of a postulation throughout its lifecycle
 * UPDATED: Fixed duplicate translations for better UX and clarity
 * Updated to include documentation-specific states for better UX
 */
public enum PostulationStatus {
    ACTIVE("Active", "En Proceso"),
    PENDING("Pending", "Inscripción Finalizada - Pendiente de Validación"), // ✅ FIXED: More specific
    COMPLETED_WITH_DOCS("Completed with Docs", "Documentación Completa - Pendiente de Validación"), // ✅ FIXED: Differentiated from PENDING  
    COMPLETED_PENDING_DOCS("Completed Pending Docs", "Documentación Pendiente - 3 Días Hábiles"), // ✅ FIXED: Clearer about deadline
    FROZEN("Frozen", "Congelada - Plazo Vencido"), // ✅ IMPROVED: More specific
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
     * UPDATED: Only ACTIVE and COMPLETED_PENDING_DOCS allow modifications for document upload
     */
    public boolean allowsModifications() {
        return this == ACTIVE || this == COMPLETED_PENDING_DOCS;
    }

    /**
     * Check if this status represents a successful outcome
     */
    public boolean isSuccessful() {
        return this == APPROVED;
    }

    /**
     * Check if this status indicates the postulation is completed and pending administrative validation
     * ADDED: Helper method to identify states that are completed but pending validation
     */
    public boolean isPendingValidation() {
        return this == PENDING || this == COMPLETED_WITH_DOCS;
    }

    /**
     * Check if this status allows document upload
     * ADDED: Helper method to control document upload permissions
     */
    public boolean allowsDocumentUpload() {
        return this == ACTIVE || this == COMPLETED_PENDING_DOCS;
    }

    /**
     * Get detailed user-friendly message for this status
     * ADDED: More detailed messages for better user experience
     */
    public String getDetailedMessage() {
        switch (this) {
            case ACTIVE:
                return "Tu inscripción está en proceso. Puedes continuar completando los pasos pendientes.";
            case PENDING:
                return "Tu inscripción ha sido finalizada exitosamente. Está pendiente de validación administrativa.";
            case COMPLETED_WITH_DOCS:
                return "Tu inscripción está completa con toda la documentación requerida. Está pendiente de validación administrativa.";
            case COMPLETED_PENDING_DOCS:
                return "Tu inscripción está registrada pero falta completar la documentación. Tienes 3 días hábiles.";
            case FROZEN:
                return "Tu inscripción ha sido congelada por vencimiento del plazo de documentación.";
            case APPROVED:
                return "¡Felicitaciones! Tu inscripción ha sido aprobada.";
            case REJECTED:
                return "Tu inscripción ha sido rechazada. Revisa los comentarios del administrador.";
            case CANCELLED:
                return "Tu inscripción ha sido cancelada.";
            default:
                return "Estado desconocido. Contacta al soporte técnico.";
        }
    }
}
