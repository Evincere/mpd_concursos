package ar.gov.mpd.concursobackend.examination.domain.model;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import lombok.Builder;
import lombok.Value;
import ar.gov.mpd.concursobackend.examination.domain.enums.ExaminationStatus;
import ar.gov.mpd.concursobackend.examination.domain.enums.ExaminationType;

@Value
@Builder(toBuilder = true)
public class Examination {
    UUID id;
    String title;
    String description;
    ExaminationType type;
    ExaminationStatus status;
    LocalDateTime startTime;
    LocalDateTime endTime;
    Duration duration;
    Integer maxAttempts;
    Integer maxScore;
    List<Question> questions;
    LocalDateTime cancellationDate;
    String cancellationReason;
    List<String> securityViolations;
    
    public boolean canBeStarted() {
        if (status != ExaminationStatus.PUBLISHED) {
            return false;
        }
        
        LocalDateTime now = LocalDateTime.now();
        return now.isAfter(startTime) && now.isBefore(endTime);
    }
    
    public boolean isActive() {
        return status == ExaminationStatus.PUBLISHED || status == ExaminationStatus.IN_PROGRESS;
    }
} 