package ar.gov.mpd.concursobackend.examination.infrastructure.persistence.entity;

import ar.gov.mpd.concursobackend.examination.domain.enums.ExaminationStatus;
import ar.gov.mpd.concursobackend.examination.domain.enums.ExaminationType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "examinations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExaminationEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    private String title;

    private String description;

    @Column(name = "duration_minutes")
    private Long durationMinutes;

    @OneToMany(mappedBy = "examination", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<QuestionEntity> questions = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private ExaminationStatus status;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    private ExaminationType type;

    @Column(name = "cancellation_date")
    private LocalDateTime cancellationDate;

    @Column(name = "cancellation_reason")
    private String cancellationReason;

    @ElementCollection
    @CollectionTable(name = "examination_security_violations", joinColumns = @JoinColumn(name = "examination_id"))
    @Column(name = "violation")
    @Builder.Default
    private List<String> securityViolations = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "examination_requirements", joinColumns = @JoinColumn(name = "examination_id"))
    @Column(name = "requirement")
    @Builder.Default
    private List<String> requirements = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "examination_rules", joinColumns = @JoinColumn(name = "examination_id"))
    @Column(name = "rule")
    @Builder.Default
    private List<String> rules = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "examination_allowed_materials", joinColumns = @JoinColumn(name = "examination_id"))
    @Column(name = "material")
    @Builder.Default
    private List<String> allowedMaterials = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String answers;

    public Duration getDuration() {
        return Duration.ofMinutes(durationMinutes);
    }

    public void setDuration(Duration duration) {
        this.durationMinutes = duration.toMinutes();
    }
}