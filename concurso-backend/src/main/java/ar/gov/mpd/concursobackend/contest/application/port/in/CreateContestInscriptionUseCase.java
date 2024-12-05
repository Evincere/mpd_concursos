package ar.gov.mpd.concursobackend.contest.application.port.in;

import ar.gov.mpd.concursobackend.contest.application.dto.ContestInscriptionRequest;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;

public interface CreateContestInscriptionUseCase {
    Inscription createInscription(ContestInscriptionRequest request);
}
