package ar.gov.mpd.concursobackend.contest.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Domain model for contests
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Contest {
    private UUID id;
    private String title;
    private String description;
    private String requirements;
    private String location;
    private String district;
    private ContestType type;
    private ContestStatus status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime inscriptionStartDate;
    private LocalDateTime inscriptionEndDate;
    private LocalDateTime examDate;
    private LocalDateTime resultsDate;
    private List<ContestDocument> documents;
    private List<ContestPosition> positions;
    private UUID createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String category;
    private String dependency;
    
    /**
     * Check if inscriptions are currently open for this contest
     * 
     * @return true if inscriptions are open, false otherwise
     */
    public boolean isInscriptionOpen() {
        LocalDateTime now = LocalDateTime.now();
        return status == ContestStatus.ACTIVE &&
               inscriptionStartDate != null && 
               inscriptionEndDate != null &&
               now.isAfter(inscriptionStartDate) && 
               now.isBefore(inscriptionEndDate);
    }
    
    /**
     * Check if the contest is active
     * 
     * @return true if the contest status is ACTIVE, false otherwise
     */
    public boolean isActive() {
        return status == ContestStatus.ACTIVE;
    }
    
    /**
     * Check if the contest is finished
     * 
     * @return true if the contest status is FINISHED, false otherwise
     */
    public boolean isFinished() {
        return status == ContestStatus.FINISHED;
    }
    
    /**
     * Check if the contest is cancelled
     * 
     * @return true if the contest status is CANCELLED, false otherwise
     */
    public boolean isCancelled() {
        return status == ContestStatus.CANCELLED;
    }
    
    public String getCategory() {
        return this.category;
    }

    public String getDepartment() {
        return this.dependency;
    }
}
