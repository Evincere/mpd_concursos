package ar.gov.mpd.concursobackend.contest.domain.enums;

/**
 * Estados posibles de un concurso
 */
public enum ContestStatus {
    DRAFT("Borrador"),
    ACTIVE("Activo"),
    IN_PROGRESS("En Progreso"),
    CLOSED("Cerrado"),
    CANCELLED("Cancelado");

    private final String description;

    ContestStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    public static ContestStatus fromString(String status) {
        try {
            return ContestStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Estado de concurso inválido: " + status);
        }
    }
}
