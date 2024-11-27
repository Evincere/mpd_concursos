package ar.gov.mpd.concursobackend.inscription.domain.model;

import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.*;
import lombok.Builder;
import lombok.Value;
import java.time.LocalDateTime;

@Value
@Builder
public class Inscription {
    private InscriptionId id;
    private ContestId contestId;
    private UserId userId;
    private InscriptionStatus status;
    private LocalDateTime inscriptionDate;
} 