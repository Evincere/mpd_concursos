package ar.gov.mpd.concursobackend.filter.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
public class ContestResponse {
    private Long id;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private String department;
    private String position;
} 