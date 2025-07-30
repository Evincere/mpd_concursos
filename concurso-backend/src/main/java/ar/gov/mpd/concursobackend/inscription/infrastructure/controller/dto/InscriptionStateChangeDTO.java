package ar.gov.mpd.concursobackend.inscription.infrastructure.controller.dto;

import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionState;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InscriptionStateChangeDTO {
    private String inscriptionId;
    private InscriptionState newState;
    private String note;
}


