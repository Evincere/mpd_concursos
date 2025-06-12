package ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.repository;

import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.entity.InscriptionSessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA para las sesiones de inscripción
 */
@Repository
public interface InscriptionSessionJpaRepository extends JpaRepository<InscriptionSessionEntity, UUID> {
    /**
     * Busca una sesión por su ID de inscripción
     * @param inscriptionId ID de la inscripción
     * @return Sesión encontrada o vacío
     */
    Optional<InscriptionSessionEntity> findByInscriptionId(UUID inscriptionId);

    /**
     * Busca sesiones por ID de usuario
     * @param userId ID del usuario
     * @return Lista de sesiones del usuario
     */
    List<InscriptionSessionEntity> findByUserId(UUID userId);

    /**
     * Busca sesiones por ID de usuario y ID de concurso
     * @param userId ID del usuario
     * @param contestId ID del concurso
     * @return Sesión encontrada o vacío
     */
    Optional<InscriptionSessionEntity> findByUserIdAndContestId(UUID userId, Long contestId);
    
    /**
     * Elimina sesiones expiradas
     * @param now Fecha y hora actual
     * @return Número de sesiones eliminadas
     */
    @Query("DELETE FROM InscriptionSessionEntity s WHERE s.expiresAt < ?1")
    int deleteExpiredSessions(LocalDateTime now);
}
