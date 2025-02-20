package ar.gov.mpd.concursobackend.examination.domain.model;


import lombok.Builder;
import lombok.Value;

import java.util.List;
import java.util.UUID;

@Value
@Builder
public class Question {
    UUID id;
    String text;
    QuestionType type;
    List<QuestionOption> options;
    Integer points;
    Integer orderIndex;
    
    @Value
    @Builder
    public static class QuestionOption {
        UUID id;
        String text;
        boolean isCorrect; // Solo usado en preguntas de opción múltiple
    }
} 