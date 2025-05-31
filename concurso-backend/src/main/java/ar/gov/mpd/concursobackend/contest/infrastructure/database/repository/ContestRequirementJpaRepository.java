package ar.gov.mpd.concursobackend.contest.infrastructure.database.repository;

import ar.gov.mpd.concursobackend.contest.infrastructure.database.entities.ContestRequirementEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContestRequirementJpaRepository extends JpaRepository<ContestRequirementEntity, Long> {

    /**
     * Encuentra todos los requisitos de un concurso específico
     */
    List<ContestRequirementEntity> findByContestId(Long contestId);

    /**
     * Encuentra todos los requisitos de un concurso ordenados por prioridad
     */
    List<ContestRequirementEntity> findByContestIdOrderByPriorityAsc(Long contestId);

    /**
     * Encuentra requisitos por categoría
     */
    List<ContestRequirementEntity> findByContestIdAndCategory(Long contestId, String category);

    /**
     * Encuentra solo los requisitos obligatorios
     */
    List<ContestRequirementEntity> findByContestIdAndRequiredTrue(Long contestId);

    /**
     * Encuentra requisitos por tipo de documento
     */
    List<ContestRequirementEntity> findByContestIdAndDocumentType(Long contestId, String documentType);

    /**
     * Cuenta los requisitos de un concurso
     */
    long countByContestId(Long contestId);

    /**
     * Cuenta los requisitos obligatorios de un concurso
     */
    long countByContestIdAndRequiredTrue(Long contestId);

    /**
     * Verifica si existe un requisito con la misma descripción para un concurso
     */
    boolean existsByContestIdAndDescription(Long contestId, String description);

    /**
     * Encuentra requisitos por concurso y descripción
     */
    List<ContestRequirementEntity> findByContestIdAndDescription(Long contestId, String description);

    /**
     * Obtiene las categorías únicas de requisitos para un concurso
     */
    @Query("SELECT DISTINCT cr.category FROM ContestRequirementEntity cr WHERE cr.contest.id = :contestId")
    List<String> findDistinctCategoriesByContestId(@Param("contestId") Long contestId);

    /**
     * Obtiene los tipos de documento únicos para un concurso
     */
    @Query("SELECT DISTINCT cr.documentType FROM ContestRequirementEntity cr WHERE cr.contest.id = :contestId AND cr.documentType IS NOT NULL")
    List<String> findDistinctDocumentTypesByContestId(@Param("contestId") Long contestId);
}
