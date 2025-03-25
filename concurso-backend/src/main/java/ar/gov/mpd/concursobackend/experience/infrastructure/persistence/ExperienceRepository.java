package ar.gov.mpd.concursobackend.experience.infrastructure.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.UserEntity;

/**
 * JPA Repository for accessing Experience entities
 */
@Repository
public interface ExperienceRepository extends JpaRepository<ExperienceEntity, UUID> {

    /**
     * Find all experiences for a specific user
     * 
     * @param user User entity
     * @return List of experience entities
     */
    List<ExperienceEntity> findByUser(UserEntity user);

    /**
     * Find all experiences for a specific user ID
     * 
     * @param userId User ID
     * @return List of experience entities
     */
    List<ExperienceEntity> findByUserId(UUID userId);

    /**
     * Find a specific experience by ID and user
     * 
     * @param id   Experience ID
     * @param user User entity
     * @return Optional containing the experience entity if found
     */
    Optional<ExperienceEntity> findByIdAndUser(UUID id, UserEntity user);

    /**
     * Delete an experience using JPQL
     */
    @Modifying
    @Query("DELETE FROM ExperienceEntity e WHERE e.id = :id")
    int deleteExperienceDirectly(@Param("id") UUID id);

    /**
     * Delete an experience using native SQL query
     */
    @Modifying
    @Query(value = "DELETE FROM experience WHERE id = :id", nativeQuery = true)
    int deleteExperienceWithNativeQuery(@Param("id") UUID id);
}