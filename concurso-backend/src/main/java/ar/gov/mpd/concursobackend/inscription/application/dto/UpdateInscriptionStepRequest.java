package ar.gov.mpd.concursobackend.inscription.application.dto;

import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStep;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateInscriptionStepRequest {
    private InscriptionStep step;
    private String centroDeVida;
    private Set<String> selectedCircunscripciones;
    private Boolean acceptedTerms;
    private Boolean confirmedPersonalData;
}