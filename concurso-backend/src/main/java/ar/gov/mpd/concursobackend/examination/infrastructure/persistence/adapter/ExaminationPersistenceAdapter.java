package ar.gov.mpd.concursobackend.examination.infrastructure.persistence.adapter;

import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import java.time.LocalDateTime;

import org.springframework.stereotype.Component;

import ar.gov.mpd.concursobackend.examination.application.dto.ExaminationBackupResponse;
import ar.gov.mpd.concursobackend.examination.application.port.output.ExaminationPersistencePort;
import ar.gov.mpd.concursobackend.examination.domain.exception.ExaminationException;
import ar.gov.mpd.concursobackend.examination.domain.model.Answer;
import ar.gov.mpd.concursobackend.examination.domain.model.Examination;
import ar.gov.mpd.concursobackend.examination.domain.model.ExaminationSession;
import ar.gov.mpd.concursobackend.examination.domain.model.Question;
import ar.gov.mpd.concursobackend.examination.infrastructure.mapper.ExaminationMapper;
import ar.gov.mpd.concursobackend.examination.infrastructure.persistence.entity.AnswerEntity;
import ar.gov.mpd.concursobackend.examination.infrastructure.persistence.entity.ExaminationEntity;
import ar.gov.mpd.concursobackend.examination.infrastructure.persistence.entity.ExaminationSessionEntity;
import ar.gov.mpd.concursobackend.examination.infrastructure.persistence.repository.ExaminationRepository;
import ar.gov.mpd.concursobackend.examination.infrastructure.persistence.repository.ExaminationSessionJpaRepository;
import lombok.RequiredArgsConstructor;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.annotation.JsonInclude;

@Component
@RequiredArgsConstructor
public class ExaminationPersistenceAdapter implements ExaminationPersistencePort {
    private final ExaminationRepository examinationRepository;
    private final ExaminationSessionJpaRepository sessionRepository;
    private final ExaminationMapper examinationMapper;

    @Override
    public ExaminationSession saveSession(ExaminationSession session) {
        ExaminationSessionEntity entity = examinationMapper.toEntity(session);
        entity = sessionRepository.save(entity);
        return examinationMapper.toDomain(entity);
    }

    @Override
    public ExaminationSession findSession(UUID sessionId) {
        return sessionRepository.findById(sessionId)
                .map(examinationMapper::toDomain)
                .orElseThrow(() -> new ExaminationException("Session not found"));
    }

    @Override
    public Answer saveAnswer(Answer answer) {
        ExaminationSessionEntity session = sessionRepository.findById(answer.getSessionId())
                .orElseThrow(() -> new ExaminationException("Session not found"));

        AnswerEntity entity = examinationMapper.toEntity(answer);
        entity.setSession(session);
        session.getAnswers().add(entity);

        sessionRepository.save(session);
        return examinationMapper.toDomain(entity);
    }

    @Override
    public Examination findExamination(UUID examinationId) {
        return examinationRepository.findById(examinationId)
                .map(examinationMapper::toDomain)
                .orElseThrow(() -> new ExaminationException("Examination not found"));
    }

    @Override
    public List<Question> findQuestions(UUID examinationId) {
        ExaminationEntity examination = examinationRepository.findById(examinationId)
                .orElseThrow(() -> new ExaminationException("Examination not found"));
        return examinationMapper.toDomainQuestions(examination.getQuestions());
    }

    @Override
    public String getAnswers(UUID examinationId) {
        try {
            ExaminationSessionEntity session = sessionRepository.findByExaminationId(examinationId)
                    .orElseThrow(() -> new ExaminationException("Session not found"));

            List<AnswerEntity> answers = session.getAnswers();

            ObjectMapper mapper = new ObjectMapper();
            mapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
            mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
            List<Map<String, Object>> simplifiedAnswers = answers.stream()
                    .map(answer -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", answer.getId());
                        map.put("response", answer.getResponse());
                        map.put("questionId", answer.getQuestionId());
                        return map;
                    })
                    .collect(Collectors.toList());
            return mapper.writeValueAsString(simplifiedAnswers);
        } catch (Exception e) {
            return "[]";
        }
    }

    @Override
    public void saveAnswers(UUID examinationId, String answers) {
        ExaminationSessionEntity session = sessionRepository.findByExaminationId(examinationId)
                .orElseThrow(() -> new ExaminationException("Session not found"));
        try {
            ObjectMapper mapper = new ObjectMapper();
            List<AnswerEntity> answerEntities = mapper.readValue(answers,
                    mapper.getTypeFactory().constructCollectionType(List.class, AnswerEntity.class));

            session.getAnswers().clear();
            session.getAnswers().addAll(answerEntities);
            sessionRepository.save(session);
        } catch (Exception e) {
            throw new ExaminationException("Error saving answers: " + e.getMessage());
        }
    }

    @Override
    public List<Examination> findAllExaminations() {
        return examinationRepository.findAll()
                .stream()
                .map(examinationMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public ExaminationBackupResponse getBackup(UUID id) {
        ExaminationEntity entity = examinationRepository.findById(id)
                .orElseThrow(() -> new ExaminationException("Examination not found"));

        return ExaminationBackupResponse.builder()
                .answers(entity.getAnswers())
                .timestamp(LocalDateTime.now())
                .build();
    }

    @Override
    public void saveBackup(UUID id, String answers) {
        ExaminationEntity entity = examinationRepository.findById(id)
                .orElseThrow(() -> new ExaminationException("Examination not found"));

        entity.setAnswers(answers);
        examinationRepository.save(entity);
    }
}