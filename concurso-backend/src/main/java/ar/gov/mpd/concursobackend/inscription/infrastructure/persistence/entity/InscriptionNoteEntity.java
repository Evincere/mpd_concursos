package ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * JPA entity for inscription notes
 */
@Entity
@Table(name = "inscription_notes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InscriptionNoteEntity {
    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;
    
    @Column(name = "inscription_id", columnDefinition = "BINARY(16)", nullable = false)
    private UUID inscriptionId;

    @Column(name = "text", nullable = false, length = 1000)
    private String text;

    @Column(name = "created_by", columnDefinition = "BINARY(16)")
    private UUID createdBy;

    @Column(name = "created_by_username", nullable = false)
    private String createdByUsername;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
