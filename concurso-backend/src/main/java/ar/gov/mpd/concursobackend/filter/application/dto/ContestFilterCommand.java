package ar.gov.mpd.concursobackend.filter.application.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class ContestFilterCommand {
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private String department;
    private String position;

    public ContestFilterCommand(String status, LocalDate startDate, LocalDate endDate, 
                              String department, String position) {
        this.status = status;
        this.startDate = startDate;
        this.endDate = endDate;
        this.department = department;
        this.position = position;
    }
}