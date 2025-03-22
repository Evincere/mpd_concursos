package ar.gov.mpd.concursobackend.education.domain.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import ar.gov.mpd.concursobackend.education.domain.model.Education;

/**
 * Repository interface for education records
 */
public interface EducationRepository {
    
    /**
     * Save an education record
     * 
     * @param education the education record to save
     * @return the saved education record
     */
    Education save(Education education);
    
    /**
     * Find an education record by ID
     * 
     * @param id the education record ID
     * @return an Optional containing the education record, or empty if not found
     */
    Optional<Education> findById(UUID id);
    
    /**
     * Find all education records for a user
     * 
     * @param userId the user ID
     * @return a list of education records
     */
    List<Education> findAllByUserId(UUID userId);
    
    /**
     * Delete an education record by ID
     * 
     * @param id the education record ID
     */
    void deleteById(UUID id);
    
    /**
     * Check if an education record exists
     * 
     * @param id the education record ID
     * @return true if the education record exists, false otherwise
     */
    boolean existsById(UUID id);
} 