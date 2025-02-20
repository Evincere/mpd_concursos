package ar.gov.mpd.concursobackend.examination.infrastructure.persistence.entity;

import ar.gov.mpd.concursobackend.examination.domain.enums.QuestionType;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "questions")
@Getter
@Setter
public class QuestionEntity {
    @Id
    private UUID id;
    
    @Column(columnDefinition = "text")
    private String text;
    
    @Enumerated(EnumType.STRING)
    private QuestionType type;
    
    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<QuestionOptionEntity> options = new ArrayList<>();
    
    private Integer points;
    
    @Column(name = "order_index")
    private Integer orderIndex;
    
    @ManyToOne
    @JoinColumn(name = "examination_id")
    private ExaminationEntity examination;
}