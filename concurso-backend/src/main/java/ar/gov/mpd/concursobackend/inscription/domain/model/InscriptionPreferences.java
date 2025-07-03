package ar.gov.mpd.concursobackend.inscription.domain.model;

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

    public boolean isComplete() {
        return acceptedTerms &&
               confirmedPersonalData &&
               selectedCircunscripciones != null &&
               !selectedCircunscripciones.isEmpty() &&
               centroDeVida != null &&
               !centroDeVida.trim().isEmpty();
    }
}