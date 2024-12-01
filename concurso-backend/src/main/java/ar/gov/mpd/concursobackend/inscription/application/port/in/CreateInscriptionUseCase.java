package ar.gov.mpd.concursobackend.inscription.application.port.in;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionDetailResponse;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionRequest;

public interface CreateInscriptionUseCase {
    InscriptionDetailResponse createInscription(InscriptionRequest request);
} 