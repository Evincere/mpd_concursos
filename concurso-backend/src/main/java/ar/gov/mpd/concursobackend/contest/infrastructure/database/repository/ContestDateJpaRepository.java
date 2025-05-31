package ar.gov.mpd.concursobackend.contest.infrastructure.database.repository;

import ar.gov.mpd.concursobackend.contest.infrastructure.database.entities.ContestDateEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ContestDateJpaRepository extends JpaRepository<ContestDateEntity, Long> {

    /**
     * Encuentra todas las fechas de un concurso específico
     */
    List<ContestDateEntity> findByContestId(Long contestId);

    /**
     * Encuentra todas las fechas de un concurso ordenadas por fecha de inicio
     */
    List<ContestDateEntity> findByContestIdOrderByStartDateAsc(Long contestId);

    /**
     * Encuentra fechas por tipo
     */
    List<ContestDateEntity> findByContestIdAndType(Long contestId, String type);

    /**
     * Encuentra fechas en un rango de fechas
     */
    @Query("SELECT cd FROM ContestDateEntity cd WHERE cd.contest.id = :contestId " +
           "AND cd.startDate >= :startDate AND cd.endDate <= :endDate")
    List<ContestDateEntity> findByContestIdAndDateRange(
            @Param("contestId") Long contestId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Encuentra fechas que se superponen con un rango dado
     */
    @Query("SELECT cd FROM ContestDateEntity cd WHERE cd.contest.id = :contestId " +
           "AND ((cd.startDate <= :endDate AND cd.endDate >= :startDate))")
    List<ContestDateEntity> findOverlappingDates(
            @Param("contestId") Long contestId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Encuentra todas las fechas de todos los concursos en un rango de fechas
     */
    @Query("SELECT cd FROM ContestDateEntity cd " +
           "WHERE cd.startDate >= :startDate AND cd.endDate <= :endDate " +
           "ORDER BY cd.startDate ASC")
    List<ContestDateEntity> findAllInDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Cuenta las fechas de un concurso
     */
    long countByContestId(Long contestId);

    /**
     * Verifica si existe una fecha con el mismo tipo para un concurso
     */
    boolean existsByContestIdAndType(Long contestId, String type);
}
