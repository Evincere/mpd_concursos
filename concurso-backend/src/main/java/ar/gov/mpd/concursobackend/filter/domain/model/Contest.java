package ar.gov.mpd.concursobackend.filter.domain.model;

import ar.gov.mpd.concursobackend.filter.domain.model.enums.ContestStatus;
import ar.gov.mpd.concursobackend.filter.domain.model.valueobjects.*;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class Contest {
    private final ContestId id;
    private final ContestStatus status;
    private final DateRange dateRange;
    private final Department department;
    private final Position position;

    public Contest(ContestId id, 
                  ContestStatus status, 
                  DateRange dateRange,
                  Department department, 
                  Position position) {
        this.id = id;
        this.status = status;
        this.dateRange = dateRange;
        this.department = department;
        this.position = position;
    }
}

