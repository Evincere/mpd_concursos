package ar.gov.mpd.concursobackend.contest.domain.port;

import java.time.LocalDate;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ContestFilters {
    private String search;
    private String status;
    private String department;
    private String position;
    private String category;
    private LocalDate startDate;
    private LocalDate endDate;
    private String dependency;
}
