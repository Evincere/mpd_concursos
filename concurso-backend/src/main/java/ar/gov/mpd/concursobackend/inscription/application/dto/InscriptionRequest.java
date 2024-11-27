package ar.gov.mpd.concursobackend.inscription.application.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class InscriptionRequest {
    Long contestId;
    Long userId;
} 