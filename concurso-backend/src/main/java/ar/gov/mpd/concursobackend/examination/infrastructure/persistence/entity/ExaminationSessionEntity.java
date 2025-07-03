package ar.gov.mpd.concursobackend.examination.infrastructure.persistence.entity;

import ar.gov.mpd.concursobackend.examination.domain.enums.ExaminationSessionStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "examination_sessions")
@Getter
@Setter
public class ExaminationSessionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "examination_id")
    private UUID examinationId;

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