package ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.entity;

import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "inscriptions")
@Getter
@Setter
public class InscriptionEntity {
    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private byte[] id;

    @Column(name = "contest_id")
    private Long contestId;

    @Column(name = "user_id", columnDefinition = "BINARY(16)")
    private byte[] userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private InscriptionStatus status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "inscription_date")
    private LocalDateTime inscriptionDate;
}