package ar.gov.mpd.concursobackend.examination.application.service;

import ar.gov.mpd.concursobackend.examination.application.port.input.StartExaminationUseCase;
import ar.gov.mpd.concursobackend.examination.application.port.input.SubmitAnswerUseCase;
import ar.gov.mpd.concursobackend.examination.application.port.output.ExaminationPersistencePort;
import ar.gov.mpd.concursobackend.examination.application.port.output.SecurityValidationPort;
import ar.gov.mpd.concursobackend.examination.domain.exception.ExaminationException;
import ar.gov.mpd.concursobackend.examination.domain.model.*;
import ar.gov.mpd.concursobackend.examination.domain.enums.AnswerStatus;
import ar.gov.mpd.concursobackend.examination.application.dto.ExaminationBackupResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExaminationService implements StartExaminationUseCase, SubmitAnswerUseCase {
    private final ExaminationPersistencePort persistencePort;
    private final SecurityValidationPort securityPort;

    @Override
    @Transactional
    public ExaminationSession startExamination(StartExaminationCommand command) {
        Examination examination = persistencePort.findExamination(command.getExaminationId());
        
        if (!examination.canBeStarted()) {
            throw new ExaminationException("Examination cannot be started");
        }

        ExaminationSession session = ExaminationSession.builder()
            .id(UUID.randomUUID())
            .examinationId(examination.getId())
            .userId(command.getUserId())
            .startTime(LocalDateTime.now())
            .deadline(LocalDateTime.now().plus(examination.getDuration()))
            .status(ExaminationSessionStatus.IN_PROGRESS)
            .currentQuestionIndex(0)
            .build();

        return persistencePort.saveSession(session);
    }

    @Override
    @Transactional
    public Answer submitAnswer(SubmitAnswerCommand command) {
        ExaminationSession session = persistencePort.findSession(command.getSessionId());
        
        if (!session.isValid()) {
            throw new ExaminationException("Invalid session");
        }

        Answer answer = Answer.builder()
            .id(UUID.randomUUID())
            .questionId(command.getQuestionId())
            .response(command.getResponse())
            .timestamp(LocalDateTime.now())
            .responseTimeInMillis(command.getResponseTimeInMillis())
            .status(AnswerStatus.SUBMITTED)
            .build();

        if (!answer.isValidResponseTime()) {
            answer = answer.toBuilder()
                .status(AnswerStatus.SUSPICIOUS)
                .build();
        }

        answer = answer.toBuilder()
            .hash(securityPort.generateAnswerHash(answer))
            .build();

        return persistencePort.saveAnswer(answer);
    }

    public ExaminationBackupResponse getBackup(Long id) {
        return ExaminationBackupResponse.builder()
            .examinationId(id)
            .answers(persistencePort.getAnswers(id))
            .timestamp(System.currentTimeMillis())
            .build();
    }

    @Transactional
    public void saveBackup(Long id, String answers) {
        persistencePort.saveAnswers(id, answers);
    }
} 