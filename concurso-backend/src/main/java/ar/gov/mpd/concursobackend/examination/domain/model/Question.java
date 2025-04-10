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
    Integer order_number;
    List<Option> options;

    public Integer getOrder_number() {
        return order_number;
    }

    public static class QuestionBuilder {
        public QuestionBuilder order_number(Integer order_number) {
            this.order_number = order_number;
            return this;
        }
    }
}