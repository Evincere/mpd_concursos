package ar.gov.mpd.concursobackend.examination.infrastructure.mapper;

import ar.gov.mpd.concursobackend.examination.application.dto.*;
import ar.gov.mpd.concursobackend.examination.domain.enums.ExaminationStatus;
import ar.gov.mpd.concursobackend.examination.domain.enums.SecurityViolationType;
import ar.gov.mpd.concursobackend.examination.infrastructure.persistence.entity.*;
import ar.gov.mpd.concursobackend.examination.domain.model.*;
import org.mapstruct.Named;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class ExaminationMapper {

    public Examination toDomain(ExaminationEntity entity) {
        if (entity == null)
            return null;

        return Examination.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .type(entity.getType())
                .status(entity.getStatus())
                .startTime(entity.getStartTime())
                .endTime(entity.getEndTime())
                .duration(Duration.ofMinutes(entity.getDurationMinutes()))
                .maxAttempts(1)
                .maxScore(calculateMaxScore(entity.getQuestions()))
                .questions(toDomainQuestions(entity.getQuestions()))
                .cancellationDate(entity.getCancellationDate())
                .cancellationReason(entity.getCancellationReason())
                .securityViolations(entity.getSecurityViolations())
                .requirements(entity.getRequirements())
                .rules(entity.getRules())
                .allowedMaterials(entity.getAllowedMaterials())
                .build();
    }

    public ExaminationEntity toEntity(Examination domain) {
        if (domain == null)
            return null;

        ExaminationEntity entity = new ExaminationEntity();
        entity.setId(domain.getId());
        entity.setTitle(domain.getTitle());
        entity.setDescription(domain.getDescription());
        entity.setType(domain.getType());
        entity.setStatus(domain.getStatus());
        entity.setStartTime(domain.getStartTime());
        entity.setEndTime(domain.getEndTime());
        entity.setDurationMinutes(domain.getDuration().toMinutes());
        entity.setQuestions(toEntityQuestions(domain.getQuestions()));
        entity.setCancellationDate(domain.getCancellationDate());
        entity.setCancellationReason(domain.getCancellationReason());
        entity.setSecurityViolations(domain.getSecurityViolations());
        entity.setRequirements(domain.getRequirements());
        entity.setRules(domain.getRules());
        entity.setAllowedMaterials(domain.getAllowedMaterials());
        return entity;
    }

    public Answer toDomain(AnswerEntity entity) {
        if (entity == null)
            return null;

        return Answer.builder()
                .id(entity.getId())
                .questionId(entity.getQuestionId())
                .sessionId(entity.getSession() != null ? entity.getSession().getId() : null)
                .response(entity.getResponse() != null ? entity.getResponse().split(",") : new String[0])
                .timestamp(entity.getTimestamp())
                .responseTimeInMillis(entity.getResponseTimeInMillis())
                .hash(entity.getHash())
                .attempts(entity.getAttempts())
                .status(entity.getStatus())
                .build();
    }

    public AnswerEntity toEntity(Answer domain) {
        if (domain == null)
            return null;

        AnswerEntity entity = new AnswerEntity();
        entity.setId(domain.getId());
        entity.setQuestionId(domain.getQuestionId());
        entity.setResponse(domain.getResponse() != null ? String.join(",", domain.getResponse()) : null);
        entity.setTimestamp(domain.getTimestamp());
        entity.setResponseTimeInMillis(domain.getResponseTimeInMillis());
        entity.setHash(domain.getHash());
        entity.setAttempts(domain.getAttempts());
        entity.setStatus(domain.getStatus());
        return entity;
    }

    public Question toDomain(QuestionEntity entity) {
        if (entity == null)
            return null;

        return Question.builder()
                .id(entity.getId())
                .text(entity.getText())
                .type(entity.getType())
                .score(entity.getScore())
                .order_number(entity.getOrder_number())
                .options(toDomainOptions(entity.getOptions()))
                .build();
    }

    public QuestionEntity toEntity(Question domain) {
        if (domain == null)
            return null;

        QuestionEntity entity = new QuestionEntity();
        entity.setId(domain.getId());
        entity.setText(domain.getText());
        entity.setType(domain.getType());
        entity.setScore(domain.getScore());
        entity.setOrder_number(domain.getOrder_number());
        return entity;
    }

    public List<Question> toDomainQuestions(List<QuestionEntity> entities) {
        if (entities == null)
            return null;
        return entities.stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    public List<QuestionEntity> toEntityQuestions(List<Question> domains) {
        if (domains == null)
            return null;
        return domains.stream()
                .map(this::toEntity)
                .collect(Collectors.toList());
    }

    private Integer calculateMaxScore(List<QuestionEntity> questions) {
        if (questions == null)
            return 0;
        return questions.stream()
                .mapToInt(QuestionEntity::getScore)
                .sum();
    }

    public ExaminationSession toDomain(ExaminationSessionEntity entity) {
        if (entity == null)
            return null;
        return ExaminationSession.builder()
                .id(entity.getId())
                .examinationId(entity.getExaminationId())
                .userId(entity.getUserId())
                .startTime(entity.getStartTime())
                .deadline(entity.getDeadline())
                .currentQuestionIndex(entity.getCurrentQuestionIndex())
                .status(entity.getStatus())
                .answers(toDomainAnswers(entity.getAnswers()))
                .build();
    }

    public ExaminationSessionEntity toEntity(ExaminationSession domain) {
        if (domain == null)
            return null;
        ExaminationSessionEntity entity = new ExaminationSessionEntity();
        entity.setId(domain.getId());
        entity.setExaminationId(domain.getExaminationId());
        entity.setUserId(domain.getUserId());
        entity.setStartTime(domain.getStartTime());
        entity.setDeadline(domain.getDeadline());
        entity.setCurrentQuestionIndex(domain.getCurrentQuestionIndex());
        entity.setStatus(domain.getStatus());
        entity.setAnswers(toEntityAnswers(domain.getAnswers()));
        return entity;
    }

    public ExaminationDTO toDTO(ExaminationEntity entity) {
        if (entity == null)
            return null;

        return ExaminationDTO.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .type(entity.getType())
                .status(entity.getStatus())
                .startTime(entity.getStartTime())
                .endTime(entity.getEndTime())
                .durationMinutes(entity.getDurationMinutes())
                .maxScore(calculateMaxScore(entity.getQuestions()))
                .maxAttempts(1)
                .requirements(entity.getRequirements())
                .rules(entity.getRules())
                .allowedMaterials(entity.getAllowedMaterials())
                .cancellationDetails(mapCancellationDetails(entity))
                .build();
    }

    public List<ExaminationDTO> toDTOListFromEntities(List<ExaminationEntity> entities) {
        if (entities == null)
            return null;
        return entities.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public QuestionDTO toQuestionDTO(QuestionEntity entity) {
        if (entity == null)
            return null;

        return QuestionDTO.builder()
                .id(entity.getId())
                .text(entity.getText())
                .type(entity.getType())
                .options(toOptionDTOList(entity.getOptions()))
                .score(entity.getScore())
                .order(entity.getOrder_number())
                .build();
    }

    public List<QuestionDTO> toQuestionDTOList(List<QuestionEntity> entities) {
        if (entities == null)
            return null;
        return entities.stream()
                .map(this::toQuestionDTO)
                .collect(Collectors.toList());
    }

    public OptionDTO toOptionDTO(OptionEntity entity) {
        if (entity == null)
            return null;

        return OptionDTO.builder()
                .id(entity.getId())
                .text(entity.getText())
                .order(entity.getOrder_number())
                .build();
    }

    public List<OptionDTO> toOptionDTOList(List<OptionEntity> entities) {
        if (entities == null)
            return null;
        return entities.stream()
                .map(this::toOptionDTO)
                .collect(Collectors.toList());
    }

    public ExaminationDTO toDTOFromDomain(Examination domain) {
        if (domain == null)
            return null;

        return ExaminationDTO.builder()
                .id(domain.getId())
                .title(domain.getTitle())
                .description(domain.getDescription())
                .type(domain.getType())
                .status(domain.getStatus())
                .startTime(domain.getStartTime())
                .endTime(domain.getEndTime())
                .durationMinutes(domain.getDuration().toMinutes())
                .maxScore(domain.getMaxScore())
                .maxAttempts(domain.getMaxAttempts())
                .requirements(domain.getRequirements())
                .rules(domain.getRules())
                .allowedMaterials(domain.getAllowedMaterials())
                .cancellationDetails(domain.getCancellationDate() != null ? CancellationDetailsDTO.builder()
                        .cancellationDate(domain.getCancellationDate())
                        .violations(domain.getSecurityViolations().stream()
                                .map(SecurityViolationType::valueOf)
                                .collect(Collectors.toList()))
                        .reason(domain.getCancellationReason())
                        .build() : null)
                .build();
    }

    public List<ExaminationDTO> toDTOListFromDomain(List<Examination> domains) {
        if (domains == null)
            return null;
        return domains.stream()
                .map(this::toDTOFromDomain)
                .collect(Collectors.toList());
    }

    public QuestionDTO toQuestionDTOFromDomain(Question domain) {
        if (domain == null)
            return null;

        return QuestionDTO.builder()
                .id(domain.getId())
                .text(domain.getText())
                .type(domain.getType())
                .score(domain.getScore())
                .order(domain.getOrder_number())
                .options(toOptionDTOListFromDomain(domain.getOptions()))
                .build();
    }

    public List<QuestionDTO> toQuestionDTOListFromDomain(List<Question> domains) {
        if (domains == null)
            return null;
        return domains.stream()
                .map(this::toQuestionDTOFromDomain)
                .collect(Collectors.toList());
    }

    public OptionDTO toOptionDTOFromDomain(Option domain) {
        if (domain == null)
            return null;

        return OptionDTO.builder()
                .id(domain.getId())
                .text(domain.getText())
                .order(domain.getOrder_number())
                .build();
    }

    public List<OptionDTO> toOptionDTOListFromDomain(List<Option> domains) {
        if (domains == null)
            return null;
        return domains.stream()
                .map(this::toOptionDTOFromDomain)
                .collect(Collectors.toList());
    }

    private CancellationDetailsDTO mapCancellationDetails(ExaminationEntity entity) {
        if (entity.getStatus() != ExaminationStatus.CANCELLED)
            return null;

        return CancellationDetailsDTO.builder()
                .cancellationDate(entity.getCancellationDate())
                .violations(entity.getSecurityViolations().stream()
                        .map(SecurityViolationType::valueOf)
                        .collect(Collectors.toList()))
                .reason(entity.getCancellationReason())
                .build();
    }

    @Named("stringToArray")
    private String[] stringToArray(String value) {
        return value != null ? value.split(",") : new String[0];
    }

    @Named("arrayToString")
    private String arrayToString(String[] value) {
        return value != null ? String.join(",", value) : "";
    }

    @Named("longToUuid")
    private UUID longToUuid(Long value) {
        return value != null ? new UUID(0, value) : null;
    }

    @Named("uuidToLong")
    private Long uuidToLong(UUID value) {
        return value != null ? value.getLeastSignificantBits() : null;
    }

    @Named("minutesToDuration")
    private Duration minutesToDuration(Long minutes) {
        return minutes != null ? Duration.ofMinutes(minutes) : null;
    }

    @Named("durationToMinutes")
    private Long durationToMinutes(Duration duration) {
        return duration != null ? duration.toMinutes() : null;
    }

    public List<Answer> toDomainAnswers(List<AnswerEntity> entities) {
        if (entities == null)
            return null;
        return entities.stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    public List<AnswerEntity> toEntityAnswers(List<Answer> domains) {
        if (domains == null)
            return null;
        return domains.stream()
                .map(this::toEntity)
                .collect(Collectors.toList());
    }

    public Option toDomainOption(OptionEntity entity) {
        if (entity == null)
            return null;

        return Option.builder()
                .id(entity.getId())
                .text(entity.getText())
                .order_number(entity.getOrder_number())
                .build();
    }

    public List<Option> toDomainOptions(List<OptionEntity> entities) {
        if (entities == null)
            return null;
        return entities.stream()
                .map(this::toDomainOption)
                .collect(Collectors.toList());
    }
}
