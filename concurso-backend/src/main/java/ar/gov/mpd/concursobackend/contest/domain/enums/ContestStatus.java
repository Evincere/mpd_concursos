package ar.gov.mpd.concursobackend.contest.domain.enums;

/**
 * Unified contest status enum
 * Represents all possible states of a contest throughout its lifecycle
 *
 * REFACTORING: Estados claros sin ambigüedad con inscripciones de usuarios
 */
public enum ContestStatus {
    // Estados administrativos fijos
    DRAFT("Draft", "Borrador"),
    SCHEDULED("Scheduled", "Programado"),        // Concurso programado, esperando fecha de inicio
    ACTIVE("Active", "Activo"),                  // Concurso activo, inscripciones abiertas
    CLOSED("Closed", "Cerrado"),                 // Inscripciones cerradas, esperando evaluación
    PAUSED("Paused", "Pausado"),
    CANCELLED("Cancelled", "Cancelado"),
    FINISHED("Finished", "Finalizado"),
    ARCHIVED("Archived", "Archivado"),

    // Estados específicos de proceso
    IN_EVALUATION("In Evaluation", "En Evaluación"),
    RESULTS_PUBLISHED("Results Published", "Resultados Publicados");

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
