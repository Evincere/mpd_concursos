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

    
} 