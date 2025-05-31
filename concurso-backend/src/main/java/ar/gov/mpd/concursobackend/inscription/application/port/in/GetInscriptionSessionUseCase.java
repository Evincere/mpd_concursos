package ar.gov.mpd.concursobackend.inscription.application.port.in;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionSessionResponse;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Puerto de entrada para obtener sesiones de inscripción
 */
public interface GetInscriptionSessionUseCase {
    /**
     * Obtiene una sesión por su ID
     * @param id ID de la sesión
     * @return Sesión encontrada o vacío
     */
    Optional<InscriptionSessionResponse> getSessionById(UUID id);
    
    /**
     * Obtiene una sesión por su ID de inscripción
     * @param inscriptionId ID de la inscripción
     * @return Sesión encontrada o vacío
     */
    Optional<InscriptionSessionResponse> getSessionByInscriptionId(UUID inscriptionId);
    
    /**
     * Obtiene sesiones por ID de usuario
     * @return Lista de sesiones del usuario autenticado
     */
    List<InscriptionSessionResponse> getSessionsByCurrentUser();
    
    /**
     * Obtiene una sesión por ID de concurso para el usuario autenticado
     * @param contestId ID del concurso
     * @return Sesión encontrada o vacío
     */
    Optional<InscriptionSessionResponse> getSessionByContestId(Long contestId);
}
