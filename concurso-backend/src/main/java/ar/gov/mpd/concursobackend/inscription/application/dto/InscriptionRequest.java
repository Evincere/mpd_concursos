package ar.gov.mpd.concursobackend.inscription.application.dto;

import lombok.Builder;
import lombok.Value;
import java.util.UUID;

@Value
@Builder
public class InscriptionRequest {
    Long contestId;
    UUID userId;
}