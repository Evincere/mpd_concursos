package ar.gov.mpd.concursobackend.notification.domain.enums;

public enum AcknowledgementLevel {
    NONE("Sin acuse"),
    SIMPLE("Acuse simple"),
    SIGNATURE_BASIC("Firma básica"),
    SIGNATURE_ADVANCED("Firma avanzada");

    private final String description;

    AcknowledgementLevel(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}