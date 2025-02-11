package ar.gov.mpd.concursobackend.inscription.domain.model.enums;

public enum InscriptionStatus {
    PENDING("Pendiente"),
    APPROVED("Aceptada"),
    REJECTED("Rechazada"),
    CANCELLED("Cancelada"),
    NOT_REGISTERED("No Registrada");

    private final String description;

    InscriptionStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
} 