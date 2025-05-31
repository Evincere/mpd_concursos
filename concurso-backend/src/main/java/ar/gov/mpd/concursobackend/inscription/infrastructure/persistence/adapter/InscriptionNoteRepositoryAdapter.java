package ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.adapter;

import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionNote;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionNoteRepository;
import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.entity.InscriptionNoteEntity;
import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.mapper.InscriptionNoteMapper;
import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.repository.JpaInscriptionNoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementation of InscriptionNoteRepository using Spring Data JPA
 * Following hexagonal architecture, this is an adapter in the infrastructure layer
 */
@Component
@RequiredArgsConstructor
public class InscriptionNoteRepositoryAdapter implements InscriptionNoteRepository {
    private final JpaInscriptionNoteRepository jpaRepository;
    private final InscriptionNoteMapper mapper;

    @Override
    @Transactional
    public InscriptionNote save(InscriptionNote note) {
        InscriptionNoteEntity entity = mapper.toEntity(note);
        InscriptionNoteEntity savedEntity = jpaRepository.save(entity);
        return mapper.toDomain(savedEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<InscriptionNote> findById(UUID id) {
        return jpaRepository.findById(id)
                .map(mapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InscriptionNote> findByInscriptionId(UUID inscriptionId) {
        return jpaRepository.findByInscriptionId(inscriptionId)
                .stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void deleteByInscriptionId(UUID inscriptionId) {
        jpaRepository.deleteByInscriptionId(inscriptionId);
    }
}
