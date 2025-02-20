package ar.gov.mpd.concursobackend.examination.application.port.output;

import ar.gov.mpd.concursobackend.examination.domain.model.Answer;
import ar.gov.mpd.concursobackend.examination.domain.model.SecurityValidation;

public interface SecurityValidationPort {
    SecurityValidation validateAnswer(Answer answer);
    String generateAnswerHash(Answer answer);
} 