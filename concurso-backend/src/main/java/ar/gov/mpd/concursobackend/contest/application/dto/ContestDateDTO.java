package ar.gov.mpd.concursobackend.contest.application.dto;

import java.time.LocalDate;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ContestDateDTO {
    private Long id;
    private String label;
    private String type;
    private LocalDate startDate;
    private LocalDate endDate;
    
    public ContestDateDTO(Long id, String label, String type, LocalDate startDate, LocalDate endDate) {
        this.id = id;
        this.label = label;
        this.type = type;
        this.startDate = startDate;
        this.endDate = endDate;
    }
} 