package ar.gov.mpd.concursobackend.examination.domain.model;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

import lombok.Builder;
import lombok.Value;
import ar.gov.mpd.concursobackend.examination.domain.enums.ExaminationType;

@Value
@Builder
public class Examination {
    Long id;
    String title;
    String description;
    Duration duration;
    List<Question> questions;
    ExaminationType type;
    ExaminationStatus status;
    LocalDateTime startTime;
    LocalDateTime endTime;
    
    public boolean isActive() {
        return status == ExaminationStatus.ACTIVE && 
               LocalDateTime.now().isBefore(endTime);
    }
    
    public boolean canBeStarted() {
        return status == ExaminationStatus.SCHEDULED && 
               LocalDateTime.now().isAfter(startTime);
    }
} 