package ar.gov.mpd.concursobackend.inscription.application.port.in;

import ar.gov.mpd.concursobackend.inscription.application.dto.UpdateInscriptionStepRequest;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import java.util.UUID;

public interface UpdateInscriptionStepUseCase {
    Inscription updateStep(UUID inscriptionId, UpdateInscriptionStepRequest request);
} 