package ar.gov.mpd.concursobackend.examination.application.port.output;

import ar.gov.mpd.concursobackend.examination.domain.model.Answer;
import ar.gov.mpd.concursobackend.examination.application.port.input.SubmitAnswerUseCase.SubmitAnswerCommand;

public interface SecurityValidationPort {
    boolean validateAnswer(SubmitAnswerCommand command);
    String generateAnswerHash(Answer answer);
} 