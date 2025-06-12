package ar.gov.mpd.concursobackend.contest.infrastructure.database.entities;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import ar.gov.mpd.concursobackend.contest.domain.enums.ContestStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import jakarta.persistence.OneToMany;
import jakarta.persistence.CascadeType;
import jakarta.persistence.PrePersist;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

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
    private LocalDate startDate;
    private LocalDate endDate;

    @Column(name = "basesUrl")
    private String basesUrl;

    @Column(name = "descriptionUrl")
    private String descriptionUrl;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "contest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ContestDateEntity> dates;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
}
