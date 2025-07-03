package ar.gov.mpd.concursobackend.inscription.domain.port;

import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionState;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Inscription entities
 * Following hexagonal architecture, this is a port in the domain layer
 */
public interface InscriptionRepository {
    /**
     * Save an inscription to the repository
     *
     * @param inscription The inscription to save
     * @return The saved inscription
     */
    Inscription save(Inscription inscription);

    /**
     * Find an inscription by its ID
     *
     * @param id The ID of the inscription to find
     * @return An Optional containing the inscription if found
     */
    Optional<Inscription> findById(UUID id);

    /**
     * Find all inscriptions for a specific user
     *
     * @param userId The ID of the user
     * @return A list of inscriptions for the user
     */
    List<Inscription> findByUserId(UUID userId);

    /**
     * Check if an inscription exists for a specific user and contest
     *
     * @param userId The ID of the user
     * @param contestId The ID of the contest
     * @return true if an inscription exists, false otherwise
     */
    boolean existsByUserIdAndContestId(UUID userId, Long contestId);

    /**
     * Find all inscriptions for a specific contest
     *
     * @param contestId The ID of the contest
     * @return A list of inscriptions for the contest
     */
    List<Inscription> findByContestId(Long contestId);

    /**
     * Find all inscriptions with pagination
     *
     * @param pageRequest Pagination information
     * @return A page of inscriptions
     */
    Page<Inscription> findAll(PageRequest pageRequest);

    /**
     * Find all inscriptions for a specific user with pagination
     *
     * @param userId The ID of the user
     * @param pageRequest Pagination information
     * @return A page of inscriptions for the user
     */
    Page<Inscription> findAllByUserId(UUID userId, PageRequest pageRequest);

    /**
     * Find all inscriptions with filters
     *
     * @param contestId The ID of the contest (optional)
     * @param search Search term for user name, email, or DNI (optional)
     * @param state The state of the inscription (optional)
     * @param startDate The start date for filtering by inscription date (optional)
     * @param endDate The end date for filtering by inscription date (optional)
     * @param sort The field to sort by (optional)
     * @param pageable Pagination information
     * @return A page of inscriptions matching the filters
     */
    Page<Inscription> findAllWithFilters(Long contestId, String search, InscriptionState state,
                                        LocalDate startDate, LocalDate endDate, String sort, Pageable pageable);

    /**
     * Find all inscriptions with filters using Specification pattern
     *
     * @param spec The specification containing the filters
     * @param pageRequest Pagination information
     * @return A page of inscriptions matching the specification
     */
    Page<Inscription> findAll(org.springframework.data.jpa.domain.Specification<Inscription> spec, PageRequest pageRequest);

    /**
     * Count inscriptions by contest ID and state
     *
     * @param contestId The ID of the contest
     * @param state The state of the inscription
     * @return The number of inscriptions matching the criteria
     */
    long countByContestIdAndState(Long contestId, InscriptionState state);

    /**
     * Check if an inscription exists by its ID
     *
     * @param id The ID of the inscription
     * @return true if the inscription exists, false otherwise
     */
    boolean existsById(UUID id);

    /**
     * Count total number of inscriptions
     *
     * @return The total number of inscriptions
     */
    long count();

    /**
     * Count inscriptions by state
     *
     * @param state The state to count
     * @return The number of inscriptions in the given state
     */
    long countByState(InscriptionState state);

    /**
     * Get inscription count by contest
     *
     * @return List of Object arrays containing contest title and count
     */
    List<Object[]> countByContest();

    /**
     * Get inscription count by department
     *
     * @return List of Object arrays containing department and count
     */
    List<Object[]> countByDepartment();

    /**
     * Check if an inscription exists by its ID (String version)
     *
     * @param id The ID of the inscription as a String
     * @return true if the inscription exists, false otherwise
     */
    default boolean existsById(String id) {
        try {
            return existsById(UUID.fromString(id));
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Delete an inscription by its ID
     *
     * @param id The ID of the inscription to delete
     */
    void deleteById(UUID id);

    /**
     * Find inscriptions by state and documentation deadline before a specific date
     *
     * @param state The state of the inscriptions to find
     * @param deadline The deadline date to compare against
     * @return A list of inscriptions matching the criteria
     */
    List<Inscription> findByStateAndDocumentationDeadlineBefore(InscriptionState state, LocalDateTime deadline);
}