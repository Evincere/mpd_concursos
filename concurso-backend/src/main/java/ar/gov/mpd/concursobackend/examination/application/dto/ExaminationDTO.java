package ar.gov.mpd.concursobackend.examination.application.dto;

import ar.gov.mpd.concursobackend.examination.domain.enums.ExaminationStatus;
import ar.gov.mpd.concursobackend.examination.domain.enums.ExaminationType;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Value
@Builder
public class ExaminationDTO {
    UUID id;
    String title;
    String description;
    ExaminationType type;
    ExaminationStatus status;
    LocalDateTime startTime;
    LocalDateTime endTime;
    Long durationMinutes;
    Integer maxScore;
    Integer maxAttempts;
    List<String> requirements;
    List<String> rules;
    List<String> allowedMaterials;
    CancellationDetailsDTO cancellationDetails;
}
