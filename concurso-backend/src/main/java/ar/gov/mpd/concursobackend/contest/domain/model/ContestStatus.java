package ar.gov.mpd.concursobackend.contest.domain.model;

/**
 * Enum representing the possible statuses of a contest
 */
public enum ContestStatus {
    DRAFT("Draft"),
    ACTIVE("Active"),
    PAUSED("Paused"),
    FINISHED("Finished"),
    CANCELLED("Cancelled"),
    ARCHIVED("Archived");
    
    private final String displayName;
    
    ContestStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
