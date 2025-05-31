package ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.repository;

import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.entity.InscriptionNoteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for InscriptionNoteEntity
 */
@Repository
public interface JpaInscriptionNoteRepository extends JpaRepository<InscriptionNoteEntity, UUID> {
    /**
     * Find all notes for a specific inscription
     * 
     * @param inscriptionId The ID of the inscription
     * @return A list of notes for the inscription
     */
    List<InscriptionNoteEntity> findByInscriptionId(UUID inscriptionId);
    
    /**
     * Delete all notes for a specific inscription
     * 
     * @param inscriptionId The ID of the inscription
     */
    void deleteByInscriptionId(UUID inscriptionId);
}
