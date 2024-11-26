package ar.gov.mpd.concursobackend.filter.domain.model.enums;

import ar.gov.mpd.concursobackend.filter.domain.model.exceptions.InvalidContestStatusException;

public enum ContestStatus {
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
        if (status == null || status.trim().isEmpty()) {
            return null;
        }

        try {
            return ContestStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new InvalidContestStatusException("Estado de concurso inválido: " + status);
        }
    }
} 