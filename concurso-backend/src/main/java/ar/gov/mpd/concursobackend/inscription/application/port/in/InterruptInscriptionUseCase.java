package ar.gov.mpd.concursobackend.inscription.application.port.in;

import java.util.UUID;

/**
 * Use case for handling interrupted inscriptions
 */
public interface InterruptInscriptionUseCase {
    
    /**
     * Marks an inscription as interrupted and sends a notification to the user
     * 
     * @param id The inscription ID
     */
    void markAsInterrupted(UUID id);
}
