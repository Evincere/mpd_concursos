package ar.gov.mpd.concursobackend.user.domain.model;

/**
 * Enum representing the possible statuses of a user account
 */
public enum UserStatus {
    ACTIVE("Active"),
    INACTIVE("Inactive"),
    BLOCKED("Blocked"),
    TEMPORARILY_BLOCKED("Temporarily Blocked"),
    EXPIRED("Expired");
    
    private final String displayName;
    
    UserStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
