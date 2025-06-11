package ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.entity;

import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStep;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidad JPA para persistir sesiones de inscripción
 */
@Entity
@Table(name = "inscription_sessions")
@Getter
@Setter
public class InscriptionSessionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "inscriptionId", columnDefinition = "BINARY(16)")
    private UUID inscriptionId;

    @Column(name = "contestId")
    private Long contestId;

    @Column(name = "userId", columnDefinition = "BINARY(16)")
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "currentStep")
    private InscriptionStep currentStep;

    @Lob
    @Column(name = "formData", columnDefinition = "LONGTEXT")
    private String formData;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;

    @Column(name = "expiresAt")
    private LocalDateTime expiresAt;
}
