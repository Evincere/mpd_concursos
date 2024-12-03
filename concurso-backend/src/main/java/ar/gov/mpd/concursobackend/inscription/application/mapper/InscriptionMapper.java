package ar.gov.mpd.concursobackend.inscription.application.mapper;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionDetailResponse;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.contest.domain.Contest;
import org.springframework.stereotype.Component;

@Component
public class InscriptionMapper {
    
    public InscriptionDetailResponse toDetailResponse(Inscription inscription, Contest contest) {
        // Log para ver el status de la inscripción
        System.out.println("Mapping Inscription Status: " + inscription.getStatus());
        
        return InscriptionDetailResponse.builder()
            .id(inscription.getId() != null ? inscription.getId().getValue() : null)
            .contestId(inscription.getContestId().getValue())
            .userId(inscription.getUserId().getValue().toString())
            .estado(inscription.getStatus().toString())
            .fechaPostulacion(inscription.getInscriptionDate())
            .concurso(contest != null ? toContestResponse(contest) : null)
            .build();
    }

    private InscriptionDetailResponse.ConcursoDTO toContestResponse(Contest contest) {
        if (contest == null) return InscriptionDetailResponse.ConcursoDTO.builder()
                .estado("DESCONOCIDO")
                .build();
        
        return InscriptionDetailResponse.ConcursoDTO.builder()
                .id(contest.getId())
                .titulo(contest.getTitle())
                .cargo(contest.getPosition())
                .dependencia(contest.getDependency())
                .estado(contest.getStatus() != null ? contest.getStatus().toString() : "DESCONOCIDO")
                .fechaInicio(contest.getStartDate().atStartOfDay())
                .fechaFin(contest.getEndDate().atTime(23, 59, 59))
                .build();
    }
} 