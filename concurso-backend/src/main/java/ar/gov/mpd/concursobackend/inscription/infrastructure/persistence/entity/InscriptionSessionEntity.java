package ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.entity;

import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStep;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entidad JPA para persistir sesiones de inscripción
 */
@Entity
@Table(name = "inscription_sessions")
@Getter
@Setter
public class InscriptionSessionEntity {
    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private byte[] id;

    @Column(name = "inscription_id", columnDefinition = "BINARY(16)")
    private byte[] inscriptionId;

    @Column(name = "contest_id")
    private Long contestId;

    @Column(name = "user_id", columnDefinition = "BINARY(16)")
    private byte[] userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_step")
    private InscriptionStep currentStep;

    @Lob
    @Column(name = "form_data", columnDefinition = "LONGTEXT")
    private String formData;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
}
