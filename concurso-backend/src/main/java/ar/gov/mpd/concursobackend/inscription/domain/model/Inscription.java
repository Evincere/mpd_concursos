package ar.gov.mpd.concursobackend.inscription.domain.model;

import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStep;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import org.springframework.lang.NonNull;

@Getter
@Builder
@NoArgsConstructor(force = true)
@AllArgsConstructor
public class Inscription {
    @NonNull
    private final InscriptionId id;
    private final ContestId contestId;
    private final UserId userId;
    private InscriptionStatus status;
    private final LocalDateTime inscriptionDate;
    private final LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @Builder.Default
    private InscriptionStep currentStep = InscriptionStep.INITIAL;
    private InscriptionPreferences preferences;

    public void cancel() {
        if (this.status == InscriptionStatus.CANCELLED) {
            throw new IllegalStateException("La inscripción ya está cancelada");
        }
        this.status = InscriptionStatus.CANCELLED;
        this.updatedAt = LocalDateTime.now();
    }

    public void updateStep(InscriptionStep newStep) {
        if (newStep.ordinal() < this.currentStep.ordinal()) {
            throw new IllegalStateException("No se puede retroceder a un paso anterior");
        }
        this.currentStep = newStep;
        this.updatedAt = LocalDateTime.now();
    }

    public void updatePreferences(InscriptionPreferences preferences) {
        this.preferences = preferences;
        this.updatedAt = LocalDateTime.now();
        
        if (preferences.isComplete() && this.currentStep == InscriptionStep.DATA_CONFIRMATION) {
            this.currentStep = InscriptionStep.COMPLETED;
            this.status = InscriptionStatus.ACTIVE;
        }
    }

    public boolean isCompleted() {
        return this.currentStep == InscriptionStep.COMPLETED;
    }
}