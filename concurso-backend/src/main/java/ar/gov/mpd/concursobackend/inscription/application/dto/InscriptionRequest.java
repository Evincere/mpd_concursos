package ar.gov.mpd.concursobackend.inscription.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InscriptionRequest {
    private Long contestId;
    private UUID userId;
}