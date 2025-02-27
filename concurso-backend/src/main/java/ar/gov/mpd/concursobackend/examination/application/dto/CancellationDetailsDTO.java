package ar.gov.mpd.concursobackend.examination.application.dto;

import ar.gov.mpd.concursobackend.examination.domain.enums.SecurityViolationType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class CancellationDetailsDTO {
    private LocalDateTime cancellationDate;
    private List<SecurityViolationType> violations;
    private String reason;
}
