package ar.gov.mpd.concursobackend.inscription.domain.model.enums;

public enum InscriptionStatus {
    PENDING("Pendiente"),
    ACCEPTED("Aceptada"),
    REJECTED("Rechazada");

    private final String description;

    InscriptionStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
} 