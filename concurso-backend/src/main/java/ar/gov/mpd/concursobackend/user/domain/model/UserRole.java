package ar.gov.mpd.concursobackend.user.domain.model;

/**
 * Enum representing the roles a user can have in the system
 */
public enum UserRole {
    USER("User"),
    ADMIN("Administrator"),
    SUPER_ADMIN("Super Administrator"),
    CONTEST_MANAGER("Contest Manager"),
    INSCRIPTION_MANAGER("Inscription Manager"),
    DOCUMENT_MANAGER("Document Manager"),
    EXAM_MANAGER("Exam Manager");
    
    private final String displayName;
    
    UserRole(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
