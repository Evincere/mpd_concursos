package ar.gov.mpd.concursobackend.inscription.application.dto;

import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import lombok.Builder;
import lombok.Value;
import java.time.LocalDateTime;
import java.util.UUID;

@Value
@Builder
public class InscriptionResponse {
    UUID id;
    UUID userId;
    Long contestId;
    InscriptionStatus status;
    LocalDateTime createdAt;
}