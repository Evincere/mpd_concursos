package ar.gov.mpd.concursobackend.contest.domain.model;

/**
 * Enum representing the types of contests
 */
public enum ContestType {
    INTERNAL("Internal"),
    EXTERNAL("External"),
    PROMOTION("Promotion"),
    TEMPORARY("Temporary"),
    PERMANENT("Permanent");
    
    private final String displayName;
    
    ContestType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
