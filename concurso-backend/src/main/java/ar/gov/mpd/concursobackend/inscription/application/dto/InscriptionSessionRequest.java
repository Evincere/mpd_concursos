package ar.gov.mpd.concursobackend.inscription.application.dto;

import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStep;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

/**
 * DTO para solicitudes de sesiones de inscripción
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InscriptionSessionRequest {
    private UUID inscriptionId;
    private Long contestId;
    private InscriptionStep currentStep;
    private Map<String, Object> formData;
}
