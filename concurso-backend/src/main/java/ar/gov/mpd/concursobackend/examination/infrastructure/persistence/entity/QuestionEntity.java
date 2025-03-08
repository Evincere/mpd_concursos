package ar.gov.mpd.concursobackend.examination.infrastructure.persistence.entity;

import ar.gov.mpd.concursobackend.examination.domain.enums.QuestionType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "questions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String text;

    @Enumerated(EnumType.STRING)
    private QuestionType type;

    private Integer score;

    private Integer order_number;

    private String correctAnswer;

    @ElementCollection
    @CollectionTable(name = "question_correct_answers")
    private List<String> correctAnswers;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OptionEntity> options;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "examination_id")
    private ExaminationEntity examination;
}