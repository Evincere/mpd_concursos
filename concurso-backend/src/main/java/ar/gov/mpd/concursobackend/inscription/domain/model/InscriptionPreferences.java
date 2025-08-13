package ar.gov.mpd.concursobackend.inscription.domain.model;

import ar.gov.mpd.concursobackend.inscription.domain.service.InscriptionValidationRules;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Getter
@Builder
@NoArgsConstructor(force = true)
@AllArgsConstructor
public class InscriptionPreferences {
    private final Set<String> selectedCircunscripciones;
    private final String centroDeVida;
    private final boolean acceptedTerms;
    private final boolean confirmedPersonalData;
    private final LocalDateTime termsAcceptanceDate;
    private final LocalDateTime dataConfirmationDate;

    /**
     * ✅ ESTANDARIZACIÓN: Usar reglas centralizadas para determinar completitud
     * @deprecated Usar InscriptionValidationRules.arePreferencesComplete() en su lugar
     */
    @Deprecated
    public boolean isComplete() {
        // Mantener lógica original para compatibilidad hacia atrás
        return acceptedTerms &&
               confirmedPersonalData &&
               selectedCircunscripciones != null &&
               !selectedCircunscripciones.isEmpty() &&
               centroDeVida != null &&
               !centroDeVida.trim().isEmpty();
    }

    /**
     * ✅ NUEVO MÉTODO: Validación usando reglas centralizadas
     * Verifica completitud usando las reglas de negocio estandarizadas
     */
    public boolean isCompleteWithRules(InscriptionValidationRules validationRules) {
        return validationRules.arePreferencesComplete(this);
    }
}