package ar.gov.mpd.concursobackend.inscription.application.mapper;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionDetailResponse;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import ar.gov.mpd.concursobackend.contest.domain.Contest;
import org.springframework.stereotype.Component;

@Component
public class InscriptionMapper {
    
    public InscriptionDetailResponse toDetailResponse(Inscription inscription, Contest contest) {
        return InscriptionDetailResponse.builder()
                .id(inscription.getId().getValue())
                .contestId(inscription.getContestId().getValue())
                .userId(inscription.getUserId().getValue().toString())
                .estado(mapStatus(inscription.getStatus()))
                .fechaPostulacion(inscription.getInscriptionDate())
                .concurso(mapContest(contest))
                .build();
    }

    private InscriptionDetailResponse.ConcursoDTO mapContest(Contest contest) {
        if (contest == null) return null;
        
        return InscriptionDetailResponse.ConcursoDTO.builder()
                .id(contest.getId())
                .titulo(contest.getTitle())
                .cargo(contest.getPosition())
                .dependencia(contest.getDependency())
                .estado(contest.getStatus().toString())
                .fechaInicio(contest.getStartDate().atStartOfDay())
                .fechaFin(contest.getEndDate().atTime(23, 59, 59))
                .build();
    }

    private String mapStatus(InscriptionStatus status) {
        return switch (status) {
            case PENDING -> "PENDIENTE";
            case ACCEPTED -> "ACEPTADA";
            case REJECTED -> "RECHAZADA";
        };
    }
} 