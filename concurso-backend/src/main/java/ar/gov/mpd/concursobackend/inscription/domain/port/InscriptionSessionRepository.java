package ar.gov.mpd.concursobackend.inscription.domain.port;

import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionSession;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionSessionId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.ContestId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.InscriptionId;
import ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects.UserId;

import java.util.List;
import java.util.Optional;

/**
 * Puerto para el repositorio de sesiones de inscripción
 */
public interface InscriptionSessionRepository {
    /**
     * Guarda una sesión de inscripción
     * @param session Sesión a guardar
     * @return Sesión guardada
     */
    InscriptionSession save(InscriptionSession session);

    /**
     * Busca una sesión por su ID
     * @param id ID de la sesión
     * @return Sesión encontrada o vacío
     */
    Optional<InscriptionSession> findById(InscriptionSessionId id);

    /**
     * Busca una sesión por su ID de inscripción
     * @param inscriptionId ID de la inscripción
     * @return Sesión encontrada o vacío
     */
    Optional<InscriptionSession> findByInscriptionId(InscriptionId inscriptionId);

    /**
     * Busca sesiones por ID de usuario
     * @param userId ID del usuario
     * @return Lista de sesiones del usuario
     */
    List<InscriptionSession> findByUserId(UserId userId);

    /**
     * Busca sesiones por ID de usuario y ID de concurso
     * @param userId ID del usuario
     * @param contestId ID del concurso
     * @return Sesión encontrada o vacío
     */
    Optional<InscriptionSession> findByUserIdAndContestId(UserId userId, ContestId contestId);

    /**
     * Elimina una sesión
     * @param id ID de la sesión a eliminar
     */
    void deleteById(InscriptionSessionId id);

    /**
     * Elimina sesiones expiradas
     * @return Número de sesiones eliminadas
     */
    int deleteExpiredSessions();
}
