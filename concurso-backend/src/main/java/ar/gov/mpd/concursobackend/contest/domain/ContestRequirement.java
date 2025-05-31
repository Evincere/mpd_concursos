package ar.gov.mpd.concursobackend.contest.domain;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ContestRequirement {
    private Long id;
    private String description;
    private String category;
    private Boolean required;
    private Integer priority;
    private String documentType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ContestRequirement(Long id, String description, String category, Boolean required, 
                             Integer priority, String documentType, LocalDateTime createdAt, 
                             LocalDateTime updatedAt) {
        this.id = id;
        this.description = description;
        this.category = category;
        this.required = required;
        this.priority = priority;
        this.documentType = documentType;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
