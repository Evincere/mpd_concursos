package ar.gov.mpd.concursobackend.examination.application.port.output;

import java.util.List;
import java.util.UUID;

import ar.gov.mpd.concursobackend.examination.domain.model.Answer;
import ar.gov.mpd.concursobackend.examination.domain.model.Examination;
import ar.gov.mpd.concursobackend.examination.domain.model.ExaminationSession;
import ar.gov.mpd.concursobackend.examination.domain.model.Question;

public interface ExaminationPersistencePort {
    ExaminationSession saveSession(ExaminationSession session);
    ExaminationSession findSession(UUID sessionId);
    Answer saveAnswer(Answer answer);
    Examination findExamination(UUID examinationId);
    List<Question> findQuestions(UUID examinationId);
    String getAnswers(Long examinationId);
    void saveAnswers(Long examinationId, String answers);
} 