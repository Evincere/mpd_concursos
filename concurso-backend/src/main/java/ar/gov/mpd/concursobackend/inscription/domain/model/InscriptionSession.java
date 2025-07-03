package ar.gov.mpd.concursobackend.inscription.domain.model;

import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStep;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.ContestId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.InscriptionId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.UserId;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Modelo de dominio para representar una sesión de inscripción.
 * Permite guardar y recuperar el estado de una inscripción en progreso.
 */
@Getter
@Builder
@NoArgsConstructor(force = true)
@AllArgsConstructor
public class InscriptionSession {
    @NonNull
    private final InscriptionSessionId id;
    private final InscriptionId inscriptionId;
    private final ContestId contestId;
    private final UserId userId;
    private final InscriptionStep currentStep;
    private final Map<String, Object> formData;
    private final LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime expiresAt;

    /**
     * Actualiza la sesión con nuevos datos
     * @param currentStep Paso actual del proceso de inscripción
     * @param formData Datos del formulario
     */
    public void update(InscriptionStep currentStep, Map<String, Object> formData) {
        this.updatedAt = LocalDateTime.now();
        // Extender la expiración por 24 horas desde la última actualización
        this.expiresAt = LocalDateTime.now().plusHours(24);
    }

    /**
     * Verifica si la sesión ha expirado
     * @return true si la sesión ha expirado, false en caso contrario
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(this.expiresAt);
    }
}
