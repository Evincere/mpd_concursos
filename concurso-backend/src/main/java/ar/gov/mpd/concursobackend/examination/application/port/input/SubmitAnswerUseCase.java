package ar.gov.mpd.concursobackend.examination.application.port.input;

import java.util.UUID;

import ar.gov.mpd.concursobackend.examination.domain.model.Answer;
import lombok.Builder;
import lombok.Value;

public interface SubmitAnswerUseCase {
    Answer submitAnswer(SubmitAnswerCommand command);

    @Value
    @Builder
    class SubmitAnswerCommand {
        UUID sessionId;
        UUID questionId;
        String[] response;
        Long responseTimeInMillis;
    }
} 