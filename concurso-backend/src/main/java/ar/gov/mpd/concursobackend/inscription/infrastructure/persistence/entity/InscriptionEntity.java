package ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.entity;

import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "inscriptions")
@Getter
@Setter
public class InscriptionEntity {
    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;
    
    private Long contestId;
    
    @Column(columnDefinition = "uuid")
    private UUID userId;
    
    @Enumerated(EnumType.STRING)
    private InscriptionStatus status;
    
    private LocalDateTime createdAt;
    private LocalDateTime inscriptionDate;
}