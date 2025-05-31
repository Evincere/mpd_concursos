package ar.gov.mpd.concursobackend.notification.domain.enums;

public enum NotificationType {
    INSCRIPTION("Inscripción"),
    SYSTEM("Sistema"),
    CONTEST("Concurso"),
    GENERAL("General");

    private final String description;

    NotificationType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}