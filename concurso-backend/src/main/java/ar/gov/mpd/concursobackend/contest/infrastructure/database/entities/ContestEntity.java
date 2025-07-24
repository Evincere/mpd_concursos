package ar.gov.mpd.concursobackend.contest.infrastructure.database.entities;

import ar.gov.mpd.concursobackend.contest.domain.enums.ContestStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "contests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String category;
    private String class_;  // usando class_ porque class es palabra reservada
    private String functions;

    @Enumerated(EnumType.STRING)
    private ContestStatus status;

    private String department;
    private String position;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "inscription_start_date")
    private LocalDateTime inscriptionStartDate;

    @Column(name = "inscription_end_date")
    private LocalDateTime inscriptionEndDate;

    @Column(name = "bases_url")
    private String basesUrl;

    @Column(name = "description_url")
    private String descriptionUrl;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "contest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ContestDateEntity> dates;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
}
