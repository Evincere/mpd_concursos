package ar.gov.mpd.concursobackend.inscription.application.dto;

import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import lombok.Builder;
import lombok.Value;
import java.time.LocalDateTime;
import java.util.UUID;

@Value
@Builder
public class InscriptionResponse {
    Long id;
    Long contestId;
    UUID userId;
    InscriptionStatus status;
    LocalDateTime inscriptionDate;
    ContestDTO contest;

    @Value
    @Builder
    public static class ContestDTO {
        String title;
        String position;
        String department;
    }
}