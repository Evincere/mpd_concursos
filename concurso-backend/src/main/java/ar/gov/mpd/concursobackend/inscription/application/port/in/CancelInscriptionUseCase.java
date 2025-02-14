package ar.gov.mpd.concursobackend.inscription.application.port.in;

import java.util.UUID;

public interface CancelInscriptionUseCase {
    void cancel(UUID id);
}
