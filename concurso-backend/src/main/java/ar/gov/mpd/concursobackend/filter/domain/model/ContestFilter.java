package ar.gov.mpd.concursobackend.filter.domain.model;

import ar.gov.mpd.concursobackend.contest.domain.enums.ContestStatus;
import ar.gov.mpd.concursobackend.filter.domain.model.valueobjects.DateRange;
import ar.gov.mpd.concursobackend.filter.domain.model.valueobjects.Department;
import ar.gov.mpd.concursobackend.filter.domain.model.valueobjects.Position;
import lombok.Data;

@Data
public class ContestFilter {
    private final ContestStatus status;
    private final DateRange dateRange;
    private final Department department;
    private final Position position;

    public ContestFilter(ContestStatus status, DateRange dateRange, 
                        Department department, Position position) {
        this.status = status;
        this.dateRange = dateRange;
        this.department = department;
        this.position = position;
    }

    
} 