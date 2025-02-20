package ar.gov.mpd.concursobackend.examination.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.UUID;

@Entity
@Table(name = "question_options")
@Getter
@Setter
public class QuestionOptionEntity {
    @Id
    private UUID id;
    
    @Column(columnDefinition = "text")
    private String text;
    
    @Column(name = "is_correct")
    private boolean isCorrect;
    
    @ManyToOne
    @JoinColumn(name = "question_id")
    private QuestionEntity question;
} 