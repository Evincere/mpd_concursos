package ar.gov.mpd.concursobackend.inscription.application.port.in;

import java.util.UUID;

public interface UpdateInscriptionStatusUseCase {
    void updateStatus(UUID id, String newStatus);
}