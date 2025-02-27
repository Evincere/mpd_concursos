package ar.gov.mpd.concursobackend.examination.domain.model;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import ar.gov.mpd.concursobackend.examination.domain.enums.ExaminationSessionStatus;

@Value
@Builder(toBuilder = true)
public class ExaminationSession {
    UUID id;
    UUID examinationId;
    UUID userId;
    LocalDateTime startTime;
    LocalDateTime deadline;
    @Builder.Default
    List<Answer> answers = new ArrayList<>();
    Integer currentQuestionIndex;
    ExaminationSessionStatus status;
    
    public boolean isValid() {
        return status == ExaminationSessionStatus.IN_PROGRESS && 
               LocalDateTime.now().isBefore(deadline);
    }
    
    public boolean canSubmitAnswer() {
        return isValid() && currentQuestionIndex < answers.size();
    }
} 