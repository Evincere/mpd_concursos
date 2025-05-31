package ar.gov.mpd.concursobackend.inscription.application.port.in;

import java.util.UUID;

/**
 * Puerto de entrada para eliminar sesiones de inscripción
 */
public interface DeleteInscriptionSessionUseCase {
    /**
     * Elimina una sesión por su ID
     * @param id ID de la sesión
     */
    void deleteSession(UUID id);
    
    /**
     * Elimina una sesión por su ID de inscripción
     * @param inscriptionId ID de la inscripción
     */
    void deleteSessionByInscriptionId(UUID inscriptionId);
    
    /**
     * Elimina sesiones expiradas
     * @return Número de sesiones eliminadas
     */
    int deleteExpiredSessions();
}
