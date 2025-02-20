package ar.gov.mpd.concursobackend.examination.domain.model;

import ar.gov.mpd.concursobackend.examination.domain.enums.AnswerStatus;
import lombok.Builder;
import lombok.Value;
import java.time.LocalDateTime;
import java.util.UUID;

@Value
@Builder(toBuilder = true)
public class Answer {
    UUID id;
    UUID questionId;
    UUID sessionId;
    String[] response;
    LocalDateTime timestamp;
    Long responseTimeInMillis;
    String hash;
    Integer attempts;
    AnswerStatus status;

    public boolean isValidResponseTime() {
        if (responseTimeInMillis == null) return false;
        return responseTimeInMillis >= getMinimumExpectedTime();
    }

    private long getMinimumExpectedTime() {
        return 1000L;
    }
} 