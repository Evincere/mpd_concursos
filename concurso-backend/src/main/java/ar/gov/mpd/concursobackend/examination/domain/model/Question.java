package ar.gov.mpd.concursobackend.examination.domain.model;

import ar.gov.mpd.concursobackend.examination.domain.enums.QuestionType;
import lombok.Builder;
import lombok.Value;

import java.util.List;
import java.util.UUID;

@Value
@Builder(toBuilder = true)
public class Question {
    UUID id;
    String text;
    QuestionType type;
    Integer score;
    Integer order;
    String correctAnswer;
    List<String> correctAnswers;
    List<Option> options;
} 