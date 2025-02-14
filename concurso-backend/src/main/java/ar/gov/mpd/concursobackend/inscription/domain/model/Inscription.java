package ar.gov.mpd.concursobackend.inscription.domain.model;

import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.*;
import lombok.Builder;
import lombok.Getter;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import org.springframework.lang.NonNull;

@Getter
@Builder
@AllArgsConstructor
public class Inscription {
    @NonNull
    private final InscriptionId id;
    private final ContestId contestId;
    private final UserId userId;
    private InscriptionStatus status;
    private final LocalDateTime inscriptionDate;
    private final LocalDateTime createdAt;

    public void cancel() {
        if (this.status == InscriptionStatus.CANCELLED) {
            throw new IllegalStateException("La inscripción ya está cancelada");
        }
        this.status = InscriptionStatus.CANCELLED;
    }
}