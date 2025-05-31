package ar.gov.mpd.concursobackend.notification.domain.model;

/**
 * Enum representing the types of notifications in the system
 */
public enum NotificationType {
    // General notification types
    INSCRIPTION("Inscription notification"),
    SYSTEM("System notification"),
    CONTEST("Contest notification"),
    DOCUMENT("Document notification"),
    EXAM("Exam notification"),
    GENERAL("General notification"),

    // Specific inscription notification types
    INSCRIPTION_CREATED("Inscription created notification"),
    INSCRIPTION_UPDATED("Inscription updated notification"),
    INSCRIPTION_APPROVED("Inscription approved notification"),
    INSCRIPTION_REJECTED("Inscription rejected notification"),
    INSCRIPTION_CANCELLED("Inscription cancelled notification"),
    INSCRIPTION_STATUS_CHANGED("Inscription status changed notification"),

    // Document notification types
    DOCUMENT_UPLOADED("Document uploaded notification"),
    DOCUMENT_APPROVED("Document approved notification"),
    DOCUMENT_REJECTED("Document rejected notification"),

    // Contest notification types
    CONTEST_CREATED("Contest created notification"),
    CONTEST_UPDATED("Contest updated notification"),
    CONTEST_CANCELLED("Contest cancelled notification"),
    CONTEST_FINISHED("Contest finished notification");

    private final String description;

    NotificationType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
