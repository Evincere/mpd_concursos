package ar.gov.mpd.concursobackend.examination.infrastructure.persistence.entity;

import ar.gov.mpd.concursobackend.examination.domain.enums.AnswerStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "answers")
@Getter
@Setter
public class AnswerEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;
    
    @Column(name = "question_id")
    private UUID questionId;

    @Column(columnDefinition = "TEXT")
    private String response;

    private LocalDateTime timestamp;

    @Column(name = "response_time_ms")
    private Long responseTimeInMillis;

    private String hash;

    private Integer attempts;

    @Enumerated(EnumType.STRING)
    private AnswerStatus status;

    @ManyToOne
    @JoinColumn(name = "session_id")
    private ExaminationSessionEntity session;
} 