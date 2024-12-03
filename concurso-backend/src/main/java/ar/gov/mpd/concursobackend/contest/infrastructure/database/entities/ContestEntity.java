package ar.gov.mpd.concursobackend.contest.infrastructure.database.entities;

import java.time.LocalDate;

import ar.gov.mpd.concursobackend.contest.domain.enums.ContestStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "contests")
@Data
public class ContestEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Enumerated(EnumType.STRING)
    private ContestStatus status;
    
    private String department;
    private String position;
    private LocalDate startDate;
    private LocalDate endDate;
    // todo: agregar campo de titulo del concurso actualmente se esta utilizando position
}
