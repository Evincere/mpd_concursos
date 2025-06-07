package ar.gov.mpd.concursobackend.contest.domain.enums;

/**
 * Unified contest status enum
 * Represents all possible states of a contest throughout its lifecycle
 *
 * REFACTORING: Estados específicos y eliminación de ambigüedad
 */
public enum ContestStatus {
    // Estados administrativos fijos
    DRAFT("Draft", "Borrador"),
    PUBLISHED("Published", "Publicado"),
    PAUSED("Paused", "Pausado"),
    CANCELLED("Cancelled", "Cancelado"),
    FINISHED("Finished", "Finalizado"),
    ARCHIVED("Archived", "Archivado"),

    // Estados dinámicos basados en fechas (calculados automáticamente)
    INSCRIPTION_PENDING("Inscription Pending", "Próximamente"),
    INSCRIPTION_OPEN("Inscription Open", "Inscripciones Abiertas"),
    INSCRIPTION_CLOSED("Inscription Closed", "Inscripciones Cerradas"),
    IN_EVALUATION("In Evaluation", "En Evaluación"),
    RESULTS_PUBLISHED("Results Published", "Resultados Publicados"),

    // Estados legacy - DEPRECADOS (eliminar gradualmente)
    @Deprecated
    ACTIVE("Active", "Activo"),           // USAR: INSCRIPTION_OPEN
    @Deprecated
    CLOSED("Closed", "Cerrado"),          // USAR: INSCRIPTION_CLOSED
    @Deprecated
    IN_PROGRESS("In Progress", "En Progreso"); // USAR: IN_EVALUATION

    private final String englishName;
    private final String spanishName;

    ContestStatus(String englishName, String spanishName) {
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
     * @deprecated Use getSpanishName() instead
     */
    @Deprecated
    public String getDescription() {
        return spanishName;
    }

    public static ContestStatus fromString(String status) {
        try {
            return ContestStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid contest status: " + status);
        }
    }

    /**
     * Check if this status represents an active contest
     */
    public boolean isActive() {
        return this == ACTIVE;
    }

    /**
     * Check if this status represents a final state
     */
    public boolean isFinalState() {
        return this == FINISHED || this == CANCELLED || this == ARCHIVED;
    }

    /**
     * Check if inscriptions are allowed for this status
     */
    public boolean allowsInscriptions() {
        return this == ACTIVE;
    }
}
