package ar.gov.mpd.concursobackend.inscription.application.mapper;

import ar.gov.mpd.concursobackend.contest.domain.model.Contest;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionDetailResponse;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionResponse;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.util.InscriptionStateConverter;
import org.springframework.stereotype.Component;

@Component
public class InscriptionMapper {

    public InscriptionDetailResponse toDetailResponse(Inscription inscription, Contest contest) {
        // Log para ver el status de la inscripción
        System.out.println("🔍 [InscriptionMapper] Mapping Inscription State: " + inscription.getState() + " for ID: " + inscription.getId());

        return InscriptionDetailResponse.builder()
            .id(inscription.getId() != null ? inscription.getId().getValue() : null)
            .contestId(inscription.getContestId().getValue())
            .userId(inscription.getUserId().getValue().toString())
            .estado(inscription.getState().toString())
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
                .cargo(contest.getLocation() != null ? contest.getLocation() : "No especificado") // TODO: Cambiar a contest.getPosition() cuando se unifique
                .dependencia(contest.getDependency())
                .estado(contest.getStatus() != null ? contest.getStatus().toString() : "DESCONOCIDO")
                .fechaInicio(contest.getStartDate() != null ? contest.getStartDate() : null)
                .fechaFin(contest.getEndDate() != null ? contest.getEndDate() : null)
                .build();
    }

    public InscriptionResponse toResponse(Inscription inscription) {
        System.out.println("🔍 [InscriptionMapper] Mapping to Response - State: " + inscription.getState() +
                          " -> Status: " + InscriptionStateConverter.toStatus(inscription.getState()) +
                          " for ID: " + inscription.getId());

        return InscriptionResponse.builder()
            .id(inscription.getId().getValue())
            .userId(inscription.getUserId().getValue())
            .contestId(inscription.getContestId().getValue())
            .status(InscriptionStateConverter.toStatus(inscription.getState()))
            .createdAt(inscription.getCreatedAt())
            .build();
    }
}