package ar.gov.mpd.concursobackend.contest.infrastructure.database.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "contest_requirements")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestRequirementEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contestId", nullable = false)
    private ContestEntity contest;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false)
    private Boolean required = true;

    @Column(nullable = false)
    private Integer priority = 1;

    @Column(name = "documentType", length = 100)
    private String documentType;

    @Column(name = "createdAt")
    private java.time.LocalDateTime createdAt;

    @Column(name = "updatedAt")
    private java.time.LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
        updatedAt = java.time.LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = java.time.LocalDateTime.now();
    }
}
