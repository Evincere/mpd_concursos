package ar.gov.mpd.concursobackend.inscription.domain.model;

import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.*;
import lombok.Builder;
import lombok.Getter;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class Inscription {
    private final InscriptionId id;
    private final ContestId contestId;
    private final UserId userId;
    private InscriptionStatus status;
    private final LocalDateTime inscriptionDate;

    public void cancel() {
        this.status = InscriptionStatus.CANCELLED;
    }
}