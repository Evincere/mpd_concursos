package ar.gov.mpd.concursobackend.inscription.application.mapper;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionResponse;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import org.springframework.stereotype.Component;

@Component
public class InscriptionMapper {
    
    public InscriptionResponse toResponse(Inscription inscription) {
        return InscriptionResponse.builder()
                .id(inscription.getId() != null ? inscription.getId().getValue() : null)
                .contestId(inscription.getContestId().getValue())
                .userId(inscription.getUserId().getValue())
                .status(inscription.getStatus())
                .inscriptionDate(inscription.getInscriptionDate())
                .build();
    }
} 