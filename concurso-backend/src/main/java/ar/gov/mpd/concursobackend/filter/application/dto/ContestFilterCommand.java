package ar.gov.mpd.concursobackend.filter.application.dto;

import java.time.LocalDate;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ContestFilterCommand {
    private final String status;
    private final LocalDate startDate;
    private final LocalDate endDate;
    private final String department;
    private final String position;

    public ContestFilterCommand(String status, LocalDate startDate, LocalDate endDate, 
                              String department, String position) {
        this.status = status;
        this.startDate = startDate;
        this.endDate = endDate;
        this.department = department;
        this.position = position;
    }
}