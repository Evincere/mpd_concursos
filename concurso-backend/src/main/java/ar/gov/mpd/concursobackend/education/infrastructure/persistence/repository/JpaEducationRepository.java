package ar.gov.mpd.concursobackend.education.infrastructure.persistence.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ar.gov.mpd.concursobackend.education.infrastructure.persistence.entity.EducationEntity;

/**
 * JPA repository interface for education records
 */
@Repository
public interface JpaEducationRepository extends JpaRepository<EducationEntity, UUID> {
    
    /**
     * Find all education records for a user
     * 
     * @param userId the user ID
     * @return a list of education records
     */
    List<EducationEntity> findAllByUserId(UUID userId);
} 