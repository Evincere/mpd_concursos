package ar.gov.mpd.concursobackend.examination.application.dto;

import ar.gov.mpd.concursobackend.examination.domain.enums.QuestionType;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class QuestionDTO {
    private UUID id;
    private String text;
    private QuestionType type;
    private List<OptionDTO> options;
    private Integer score;
    private Integer order;
    private String correctAnswer; // Only used for true/false questions
    private List<String> correctAnswers; // Used for multiple choice questions
}
