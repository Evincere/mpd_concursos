package ar.gov.mpd.concursobackend.education.infrastructure.persistence.repository;

import ar.gov.mpd.concursobackend.education.infrastructure.persistence.entity.EducationRecordEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * JPA repository interface for education records
 */
@Repository
public interface JpaEducationRepository extends JpaRepository<EducationRecordEntity, UUID> {

    /**
     * Find all education records for a user
     *
     * @param userId the user ID
     * @return a list of education records
     */
    List<EducationRecordEntity> findAllByUser_Id(UUID userId);
}