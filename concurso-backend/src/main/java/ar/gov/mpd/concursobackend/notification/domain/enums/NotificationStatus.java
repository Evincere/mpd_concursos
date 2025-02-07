package ar.gov.mpd.concursobackend.notification.domain.enums;

public enum NotificationStatus {
    PENDING("Pendiente"),
    SENT("Enviada"),
    READ("Leída"),
    ACKNOWLEDGED("Acusada");

    private final String description;

    NotificationStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
