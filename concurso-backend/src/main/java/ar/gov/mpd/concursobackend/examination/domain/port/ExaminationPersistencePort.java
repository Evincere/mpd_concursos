package ar.gov.mpd.concursobackend.examination.domain.port;

import ar.gov.mpd.concursobackend.examination.application.dto.ExaminationBackupResponse;
import ar.gov.mpd.concursobackend.examination.domain.model.*;

import java.util.List;
import java.util.UUID;

public interface ExaminationPersistencePort {
    List<Examination> findAllExaminations();
    Examination findExamination(UUID id);
    List<Question> findQuestions(UUID examinationId);
    ExaminationSession saveSession(ExaminationSession session);
    ExaminationSession findSession(UUID sessionId);
    Answer saveAnswer(Answer answer);
    ExaminationBackupResponse getBackup(UUID id);
    void saveBackup(UUID id, String answers);
} 