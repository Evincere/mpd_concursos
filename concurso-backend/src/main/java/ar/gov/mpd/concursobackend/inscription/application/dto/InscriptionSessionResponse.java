package ar.gov.mpd.concursobackend.inscription.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStep;

/**
 * DTO para respuestas de sesiones de inscripción
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InscriptionSessionResponse {
    private UUID id;
    private UUID inscriptionId;
    private Long contestId;
    private UUID userId;
    private InscriptionStep currentStep;
    private Map<String, Object> formData;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime expiresAt;
}
