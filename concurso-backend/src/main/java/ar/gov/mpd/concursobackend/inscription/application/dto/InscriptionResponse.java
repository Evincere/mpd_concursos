package ar.gov.mpd.concursobackend.inscription.application.dto;

import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class InscriptionResponse {
    private Long id;
    private Long contestId;
    private Long userId;
    private InscriptionStatus status;
    private LocalDateTime inscriptionDate;
} 