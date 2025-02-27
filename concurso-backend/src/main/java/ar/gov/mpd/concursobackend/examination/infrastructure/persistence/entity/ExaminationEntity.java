package ar.gov.mpd.concursobackend.examination.infrastructure.persistence.entity;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import ar.gov.mpd.concursobackend.examination.domain.enums.ExaminationType;
import ar.gov.mpd.concursobackend.examination.domain.enums.ExaminationStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.CollectionTable;

@Entity
@Table(name = "examinations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExaminationEntity {
    @Id
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
    @CollectionTable(name = "examination_security_violations")
    @Column(name = "violation")
    @Builder.Default
    private List<String> securityViolations = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String answers;

    public Duration getDuration() {
        return Duration.ofMinutes(durationMinutes);
    }

    public void setDuration(Duration duration) {
        this.durationMinutes = duration.toMinutes();
    }
} 