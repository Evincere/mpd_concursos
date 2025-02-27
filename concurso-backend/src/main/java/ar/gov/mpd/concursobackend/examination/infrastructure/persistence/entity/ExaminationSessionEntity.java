package ar.gov.mpd.concursobackend.examination.infrastructure.persistence.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import ar.gov.mpd.concursobackend.examination.domain.enums.ExaminationSessionStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "examination_sessions")
@Getter
@Setter
public class ExaminationSessionEntity {
    @Id
    private UUID id;
    
    @Column(name = "examination_id")
    private Long examinationId;
    
    @Column(name = "user_id")
    private UUID userId;
    
    @Column(name = "start_time")
    private LocalDateTime startTime;
    
    private LocalDateTime deadline;
    
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL)
    private List<AnswerEntity> answers = new ArrayList<>();
    
    @Column(name = "current_question_index")
    private int currentQuestionIndex;
    
    @Enumerated(EnumType.STRING)
    private ExaminationSessionStatus status;
} 