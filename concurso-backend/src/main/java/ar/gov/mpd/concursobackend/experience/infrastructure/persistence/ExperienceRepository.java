package ar.gov.mpd.concursobackend.experience.infrastructure.persistence;

import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * JPA Repository for accessing Work Experience entities
 */
@Repository
public interface ExperienceRepository extends JpaRepository<WorkExperienceEntity, UUID> {

    /**
     * Find all active (non-deleted) experiences for a specific user
     *
     * @param user User entity
     * @return List of active experience entities
     */
    @Query("SELECT e FROM WorkExperienceEntity e WHERE e.user = :user AND e.isDeleted = false ORDER BY e.startDate DESC")
    List<WorkExperienceEntity> findByUser(@Param("user") UserEntity user);

    /**
     * Find all active (non-deleted) experiences for a specific user ID
     *
     * @param userId User ID
     * @return List of active experience entities
     */
    @Query("SELECT e FROM WorkExperienceEntity e WHERE e.user.id = :userId AND e.isDeleted = false ORDER BY e.startDate DESC")
    List<WorkExperienceEntity> findByUserId(@Param("userId") UUID userId);

    /**
     * Find a specific active experience by ID and user
     *
     * @param id   Experience ID
     * @param user User entity
     * @return Optional containing the experience entity if found and not deleted
     */
    @Query("SELECT e FROM WorkExperienceEntity e WHERE e.id = :id AND e.user = :user AND e.isDeleted = false")
    Optional<WorkExperienceEntity> findByIdAndUser(@Param("id") UUID id, @Param("user") UserEntity user);

    /**
     * Find all experiences (including deleted) for a specific user ID
     * Used for administrative purposes
     *
     * @param userId User ID
     * @return List of all experience entities
     */
    @Query("SELECT e FROM WorkExperienceEntity e WHERE e.user.id = :userId ORDER BY e.startDate DESC")
    List<WorkExperienceEntity> findAllByUserId(@Param("userId") UUID userId);

    /**
     * Find deleted experiences within recovery window (24 hours)
     *
     * @param userId User ID
     * @return List of recoverable experience entities
     */
    @Query("SELECT e FROM WorkExperienceEntity e WHERE e.user.id = :userId AND e.isDeleted = true AND e.deletedAt > :cutoffTime")
    List<WorkExperienceEntity> findRecoverableByUserId(@Param("userId") UUID userId, @Param("cutoffTime") LocalDateTime cutoffTime);
}