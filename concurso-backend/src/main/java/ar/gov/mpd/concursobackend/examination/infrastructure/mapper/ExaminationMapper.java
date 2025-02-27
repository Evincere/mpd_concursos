package ar.gov.mpd.concursobackend.examination.infrastructure.mapper;

import ar.gov.mpd.concursobackend.examination.application.dto.*;
import ar.gov.mpd.concursobackend.examination.domain.enums.ExaminationStatus;
import ar.gov.mpd.concursobackend.examination.domain.enums.SecurityViolationType;
import ar.gov.mpd.concursobackend.examination.infrastructure.persistence.entity.*;
import ar.gov.mpd.concursobackend.examination.domain.model.*;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class ExaminationMapper {
    
    public Examination toDomain(ExaminationEntity entity) {
        if (entity == null) return null;
        
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
                .build();
    }
    
    public ExaminationEntity toEntity(Examination domain) {
        if (domain == null) return null;
        
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
        return entity;
    }
    
    public Answer toDomain(AnswerEntity entity) {
        if (entity == null) return null;
        
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
        if (domain == null) return null;
        
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
        if (entity == null) return null;
        
        return Question.builder()
                .id(entity.getId())
                .text(entity.getText())
                .type(entity.getType())
                .score(entity.getScore())
                .order(entity.getOrder())
                .build();
    }
    
    public QuestionEntity toEntity(Question domain) {
        if (domain == null) return null;
        
        QuestionEntity entity = new QuestionEntity();
        entity.setId(domain.getId());
        entity.setText(domain.getText());
        entity.setType(domain.getType());
        entity.setScore(domain.getScore());
        entity.setOrder(domain.getOrder());
        return entity;
    }
    
    public List<Question> toDomainQuestions(List<QuestionEntity> entities) {
        if (entities == null) return null;
        return entities.stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }
    
    public List<QuestionEntity> toEntityQuestions(List<Question> domains) {
        if (domains == null) return null;
        return domains.stream()
                .map(this::toEntity)
                .collect(Collectors.toList());
    }
    
    private Integer calculateMaxScore(List<QuestionEntity> questions) {
        if (questions == null) return 0;
        return questions.stream()
                .mapToInt(QuestionEntity::getScore)
                .sum();
    }
    
    @Mapping(target = "id", source = "id")
    @Mapping(target = "examinationId", source = "examinationId", qualifiedByName = "longToUuid")
    @Mapping(target = "answers", source = "answers")
    public ExaminationSession toDomain(ExaminationSessionEntity entity) {
        // Implementation needed
        throw new UnsupportedOperationException("Method not implemented");
    }
    
    @Mapping(target = "id", source = "id")
    @Mapping(target = "examinationId", source = "examinationId", qualifiedByName = "uuidToLong")
    @Mapping(target = "answers", source = "answers")
    public ExaminationSessionEntity toEntity(ExaminationSession domain) {
        // Implementation needed
        throw new UnsupportedOperationException("Method not implemented");
    }
    
    public ExaminationDTO toDTO(ExaminationEntity entity) {
        if (entity == null) return null;
        
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
                .cancellationDetails(mapCancellationDetails(entity))
                .build();
    }
    
    public List<ExaminationDTO> toDTOListFromEntities(List<ExaminationEntity> entities) {
        if (entities == null) return null;
        return entities.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    public QuestionDTO toQuestionDTO(QuestionEntity entity) {
        if (entity == null) return null;
        
        return QuestionDTO.builder()
                .id(entity.getId())
                .text(entity.getText())
                .type(entity.getType())
                .options(toOptionDTOList(entity.getOptions()))
                .score(entity.getScore())
                .order(entity.getOrder())
                .build();
    }
    
    public List<QuestionDTO> toQuestionDTOList(List<QuestionEntity> entities) {
        if (entities == null) return null;
        return entities.stream()
                .map(this::toQuestionDTO)
                .collect(Collectors.toList());
    }
    
    public OptionDTO toOptionDTO(OptionEntity entity) {
        if (entity == null) return null;
        
        return OptionDTO.builder()
                .id(entity.getId())
                .text(entity.getText())
                .order(entity.getOrder())
                .build();
    }
    
    public List<OptionDTO> toOptionDTOList(List<OptionEntity> entities) {
        if (entities == null) return null;
        return entities.stream()
                .map(this::toOptionDTO)
                .collect(Collectors.toList());
    }
    
    public ExaminationDTO toDTOFromDomain(Examination domain) {
        if (domain == null) return null;
        
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
                .build();
    }
    
    public List<ExaminationDTO> toDTOListFromDomain(List<Examination> domains) {
        if (domains == null) return null;
        return domains.stream()
                .map(this::toDTOFromDomain)
                .collect(Collectors.toList());
    }
    
    public QuestionDTO toQuestionDTOFromDomain(Question domain) {
        if (domain == null) return null;
        
        return QuestionDTO.builder()
                .id(domain.getId())
                .text(domain.getText())
                .type(domain.getType())
                .score(domain.getScore())
                .order(domain.getOrder())
                .build();
    }
    
    public List<QuestionDTO> toQuestionDTOListFromDomain(List<Question> domains) {
        if (domains == null) return null;
        return domains.stream()
                .map(this::toQuestionDTOFromDomain)
                .collect(Collectors.toList());
    }
    
    public OptionDTO toOptionDTOFromDomain(Option domain) {
        if (domain == null) return null;
        
        return OptionDTO.builder()
                .id(domain.getId())
                .text(domain.getText())
                .order(domain.getOrder())
                .build();
    }
    
    public List<OptionDTO> toOptionDTOListFromDomain(List<Option> domains) {
        if (domains == null) return null;
        return domains.stream()
                .map(this::toOptionDTOFromDomain)
                .collect(Collectors.toList());
    }
    
    private CancellationDetailsDTO mapCancellationDetails(ExaminationEntity entity) {
        if (entity.getStatus() != ExaminationStatus.CANCELLED) return null;
        
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
}
