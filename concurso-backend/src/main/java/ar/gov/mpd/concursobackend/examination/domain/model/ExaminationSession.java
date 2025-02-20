package ar.gov.mpd.concursobackend.examination.domain.model;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Value
@Builder
public class ExaminationSession {
    UUID id;
    Long examinationId;
    UUID userId;
    LocalDateTime startTime;
    LocalDateTime deadline;
    @Builder.Default
    List<Answer> answers = new ArrayList<>();
    int currentQuestionIndex;
    ExaminationSessionStatus status;
    
    public boolean isValid() {
        return status == ExaminationSessionStatus.IN_PROGRESS && 
               LocalDateTime.now().isBefore(deadline);
    }
    
    public boolean canSubmitAnswer() {
        return isValid() && currentQuestionIndex < answers.size();
    }
} 