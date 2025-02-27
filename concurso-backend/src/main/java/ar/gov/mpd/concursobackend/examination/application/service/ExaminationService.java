package ar.gov.mpd.concursobackend.examination.application.service;

import ar.gov.mpd.concursobackend.examination.application.port.input.StartExaminationUseCase;
import ar.gov.mpd.concursobackend.examination.application.port.input.SubmitAnswerUseCase;
import ar.gov.mpd.concursobackend.examination.application.port.output.ExaminationPersistencePort;
import ar.gov.mpd.concursobackend.examination.application.port.output.SecurityValidationPort;
import ar.gov.mpd.concursobackend.examination.domain.exception.ExaminationException;
import ar.gov.mpd.concursobackend.examination.domain.model.*;
import ar.gov.mpd.concursobackend.examination.domain.enums.AnswerStatus;
import ar.gov.mpd.concursobackend.examination.domain.enums.ExaminationSessionStatus;
import ar.gov.mpd.concursobackend.examination.application.dto.*;
import ar.gov.mpd.concursobackend.examination.infrastructure.mapper.ExaminationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExaminationService implements StartExaminationUseCase, SubmitAnswerUseCase {
    private final ExaminationPersistencePort persistencePort;
    private final SecurityValidationPort securityPort;
    private final ExaminationMapper mapper;

    @Transactional(readOnly = true)
    public List<ExaminationDTO> getAllExaminations() {
        return mapper.toDTOListFromDomain(persistencePort.findAllExaminations());
    }

    @Transactional(readOnly = true)
    public ExaminationDTO getExamination(UUID id) {
        return mapper.toDTOFromDomain(persistencePort.findExamination(id));
    }

    @Transactional(readOnly = true)
    public List<QuestionDTO> getExaminationQuestions(UUID id) {
        Examination examination = persistencePort.findExamination(id);
        return mapper.toQuestionDTOListFromDomain(examination.getQuestions());
    }

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
            throw new ExaminationException("Invalid examination session");
        }

        // Validate security requirements
        if (!securityPort.validateAnswer(command)) {
            throw new ExaminationException("Security validation failed");
        }

        Answer answer = Answer.builder()
            .id(UUID.randomUUID())
            .sessionId(session.getId())
            .questionId(command.getQuestionId())
            .response(command.getResponse())
            .timestamp(LocalDateTime.now())
            .responseTimeInMillis(command.getResponseTimeInMillis())
            .status(AnswerStatus.SUBMITTED)
            .build();

        return persistencePort.saveAnswer(answer);
    }

    public ExaminationBackupResponse getBackup(UUID id) {
        return persistencePort.getBackup(id);
    }

    public void saveBackup(UUID id, String answers) {
        persistencePort.saveBackup(id, answers);
    }
}