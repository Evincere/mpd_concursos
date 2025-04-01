package ar.gov.mpd.concursobackend.inscription.domain.model;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Set;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor(force = true)
@AllArgsConstructor
public class InscriptionPreferences {
    private final Set<String> selectedCircunscripciones;
    private final boolean acceptedTerms;
    private final boolean confirmedPersonalData;
    private final LocalDateTime termsAcceptanceDate;
    private final LocalDateTime dataConfirmationDate;
    
    public boolean isComplete() {
        return acceptedTerms && 
               confirmedPersonalData && 
               selectedCircunscripciones != null && 
               !selectedCircunscripciones.isEmpty();
    }
} 