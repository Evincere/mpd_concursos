package ar.gov.mpd.concursobackend.inscription.domain.port;

import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionNote;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for InscriptionNote entities
 * Following hexagonal architecture, this is a port in the domain layer
 */
public interface InscriptionNoteRepository {
    /**
     * Save a note to the repository
     *
     * @param note The note to save
     * @return The saved note
     */
    InscriptionNote save(InscriptionNote note);

    /**
     * Find a note by its ID
     *
     * @param id The ID of the note to find
     * @return An Optional containing the note if found
     */
    Optional<InscriptionNote> findById(UUID id);

    /**
     * Find all notes for a specific inscription
     *
     * @param inscriptionId The ID of the inscription
     * @return A list of notes for the inscription
     */
    List<InscriptionNote> findByInscriptionId(UUID inscriptionId);

    /**
     * Delete a note by its ID
     *
     * @param id The ID of the note to delete
     */
    void deleteById(UUID id);

    /**
     * Delete all notes for a specific inscription
     *
     * @param inscriptionId The ID of the inscription
     */
    void deleteByInscriptionId(UUID inscriptionId);

    /**
     * Delete a note
     *
     * @param note The note to delete
     */
    default void delete(InscriptionNote note) {
        if (note != null && note.getId() != null) {
            deleteById(note.getId());
        }
    }

    /**
     * Find a note by its ID (String version)
     *
     * @param id The ID of the note as a String
     * @return An Optional containing the note if found
     */
    default Optional<InscriptionNote> findById(String id) {
        try {
            return findById(UUID.fromString(id));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
