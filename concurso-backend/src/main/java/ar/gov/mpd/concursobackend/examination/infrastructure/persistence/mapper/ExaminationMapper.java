package ar.gov.mpd.concursobackend.examination.infrastructure.persistence.mapper;

import java.util.List;
import java.util.UUID;

import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

import ar.gov.mpd.concursobackend.examination.domain.model.*;
import ar.gov.mpd.concursobackend.examination.infrastructure.persistence.entity.*;

@Mapper(
    componentModel = "spring",
    unmappedTargetPolicy = ReportingPolicy.ERROR,
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface ExaminationMapper {
    
    @Mapping(target = "questions", ignore = true)
    @Mapping(target = "durationMinutes", expression = "java(domain.getDuration().toMinutes())")
    ExaminationEntity toEntity(Examination domain);
    
    @Mapping(target = "questions", ignore = true)
    @Mapping(target = "duration", expression = "java(java.time.Duration.ofMinutes(entity.getDurationMinutes()))")
    @Mapping(target = "type", source = "type")
    Examination toDomain(ExaminationEntity entity);
    
    ExaminationSessionEntity toEntity(ExaminationSession domain);
    
    ExaminationSession toDomain(ExaminationSessionEntity entity);
    
    @Mapping(target = "sessionId", source = "session.id")
    @Mapping(target = "response", expression = "java(responseToArray(entity.getResponse()))")
    Answer toDomain(AnswerEntity entity);
    
    @Mapping(target = "session", ignore = true)
    @Mapping(target = "response", expression = "java(arrayToResponse(domain.getResponse()))")
    AnswerEntity toEntity(Answer domain);
    
    @Mapping(target = "examination", ignore = true)
    QuestionEntity toEntity(Question domain);
    
    @Mapping(target = "options", source = "options")
    Question toDomain(QuestionEntity entity);
    
    List<Question> toDomainQuestions(List<QuestionEntity> entities);
    
    @Mapping(target = "question", ignore = true)
    QuestionOptionEntity toEntity(Question.QuestionOption domain);
    
    @Mapping(target = "isCorrect", source = "correct")
    Question.QuestionOption toDomain(QuestionOptionEntity entity);
    
    @AfterMapping
    default void linkQuestionOptions(@MappingTarget QuestionEntity target, Question source) {
        if (source.getOptions() != null) {
            target.setOptions(source.getOptions().stream()
                .map(option -> {
                    QuestionOptionEntity entity = toEntity(option);
                    entity.setQuestion(target);
                    return entity;
                })
                .collect(java.util.stream.Collectors.toList()));
        }
    }
    
    @AfterMapping
    default void linkExaminationQuestions(@MappingTarget ExaminationEntity target, Examination source) {
        if (source.getQuestions() != null) {
            target.setQuestions(source.getQuestions().stream()
                .map(question -> {
                    QuestionEntity entity = toEntity(question);
                    entity.setExamination(target);
                    return entity;
                })
                .collect(java.util.stream.Collectors.toList()));
        }
    }

    default String[] responseToArray(String response) {
        return response != null ? response.split(",") : new String[0];
    }

    default String arrayToResponse(String[] array) {
        return array != null ? String.join(",", array) : "";
    }

    default Long map(UUID value) {
        return value == null ? null : Long.valueOf(value.getLeastSignificantBits());
    }

    default UUID map(Long value) {
        return value == null ? null : new UUID(0, value);
    }
} 