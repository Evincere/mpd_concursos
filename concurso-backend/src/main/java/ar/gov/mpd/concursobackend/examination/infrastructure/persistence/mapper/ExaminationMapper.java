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

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface ExaminationMapper {

    @Mapping(target = "questions", ignore = true)
    @Mapping(target = "durationMinutes", expression = "java(domain.getDuration().toMinutes())")
    @Mapping(target = "answers", ignore = true)
    ExaminationEntity toEntity(Examination domain);

    @Mapping(target = "questions", ignore = true)
    @Mapping(target = "duration", expression = "java(java.time.Duration.ofMinutes(entity.getDurationMinutes()))")
    @Mapping(target = "type", source = "type")
    @Mapping(target = "maxAttempts", constant = "1")
    @Mapping(target = "maxScore", expression = "java(calculateMaxScore(entity.getQuestions()))")
    @Mapping(target = "requirements", source = "requirements")
    @Mapping(target = "rules", source = "rules")
    @Mapping(target = "allowedMaterials", source = "allowedMaterials")
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
    @Mapping(target = "options", ignore = true)
    @Mapping(target = "correctAnswer", ignore = true)
    @Mapping(target = "correctAnswers", ignore = true)
    QuestionEntity toEntity(Question domain);

    @Mapping(target = "options", ignore = true)
    Question toDomain(QuestionEntity entity);

    List<Question> toDomainQuestions(List<QuestionEntity> entities);

    @Mapping(target = "question", ignore = true)
    OptionEntity toEntity(Option domain);

    Option toDomain(OptionEntity entity);

    @AfterMapping
    default void linkQuestionOptions(@MappingTarget QuestionEntity target, Question source) {
        if (source.getOptions() != null) {
            target.setOptions(source.getOptions().stream()
                    .map(option -> {
                        OptionEntity entity = toEntity(option);
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

    default int calculateMaxScore(List<QuestionEntity> questions) {
        if (questions == null)
            return 0;
        return questions.stream()
                .mapToInt(QuestionEntity::getScore)
                .sum();
    }
}