package ar.gov.mpd.concursobackend.examination.application.port.output;

import java.util.List;
import java.util.UUID;
import java.util.Optional;

import ar.gov.mpd.concursobackend.examination.domain.model.Answer;
import ar.gov.mpd.concursobackend.examination.domain.model.Examination;
import ar.gov.mpd.concursobackend.examination.domain.model.ExaminationSession;
import ar.gov.mpd.concursobackend.examination.domain.model.Question;
import ar.gov.mpd.concursobackend.examination.application.dto.ExaminationBackupResponse;
import ar.gov.mpd.concursobackend.examination.domain.enums.ExaminationSessionStatus;

public interface ExaminationPersistencePort {
    ExaminationSession saveSession(ExaminationSession session);

    ExaminationSession findSession(UUID sessionId);

    Optional<ExaminationSession> findSessionByExaminationIdAndUserId(UUID examinationId, UUID userId);

    List<ExaminationSession> findSessionsByUserId(UUID userId);

    Optional<ExaminationSession> findSessionByExaminationIdAndUserIdAndStatus(
            UUID examinationId,
            UUID userId,
            ExaminationSessionStatus status);

    boolean existsFinishedSessionByExaminationIdAndUserId(UUID examinationId, UUID userId);

    Answer saveAnswer(Answer answer);

    Examination findExamination(UUID examinationId);

    List<Question> findQuestions(UUID examinationId);

    String getAnswers(UUID examinationId);

    void saveAnswers(UUID examinationId, String answers);

    List<Examination> findAllExaminations();

    ExaminationBackupResponse getBackup(UUID id);

    void saveBackup(UUID id, String answers);
}