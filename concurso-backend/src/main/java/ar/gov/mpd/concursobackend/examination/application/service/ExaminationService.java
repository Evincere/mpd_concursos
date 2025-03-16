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
import com.fasterxml.jackson.databind.ObjectMapper;

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

    /**
     * Verifica si un examen ya fue realizado por un usuario específico
     * 
     * @param examenId ID del examen
     * @param userId   ID del usuario
     * @return true si el examen ya fue realizado, false en caso contrario
     */
    @Transactional(readOnly = true)
    public boolean verificarExamenRealizado(UUID examenId, UUID userId) {
        return persistencePort.existsFinishedSessionByExaminationIdAndUserId(examenId, userId);
    }

    /**
     * Finaliza un examen
     * 
     * @param examenId ID del examen
     * @param userId   ID del usuario
     * @param request  Datos de finalización del examen
     */
    @Transactional
    public void finalizarExamen(UUID examenId, UUID userId, FinalizarExamenRequest request) {
        // Buscar la sesión del examen
        ExaminationSession session = persistencePort.findSessionByExaminationIdAndUserId(examenId, userId)
                .orElseThrow(
                        () -> new ExaminationException("No se encontró una sesión de examen activa para este usuario"));

        // Verificar que la sesión esté en progreso
        if (session.getStatus() != ExaminationSessionStatus.IN_PROGRESS) {
            throw new ExaminationException("La sesión de examen no está en progreso");
        }

        // Actualizar el estado de la sesión
        ExaminationSession updatedSession = session.toBuilder()
                .status(ExaminationSessionStatus.FINISHED)
                .build();

        // Guardar la sesión actualizada
        persistencePort.saveSession(updatedSession);

        // Guardar las respuestas
        if (request.getRespuestas() != null && !request.getRespuestas().isEmpty()) {
            // Convertir las respuestas a formato JSON
            try {
                ObjectMapper objectMapper = new ObjectMapper();
                String respuestasJson = objectMapper.writeValueAsString(request.getRespuestas());
                persistencePort.saveAnswers(examenId, respuestasJson);
            } catch (Exception e) {
                throw new ExaminationException("Error al procesar las respuestas del examen: " + e.getMessage());
            }
        }
    }
}