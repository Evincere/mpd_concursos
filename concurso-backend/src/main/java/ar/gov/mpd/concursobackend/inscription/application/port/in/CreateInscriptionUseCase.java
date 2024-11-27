package ar.gov.mpd.concursobackend.inscription.application.port.in;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionRequest;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionResponse;

public interface CreateInscriptionUseCase {
    InscriptionResponse createInscription(InscriptionRequest request);
} 