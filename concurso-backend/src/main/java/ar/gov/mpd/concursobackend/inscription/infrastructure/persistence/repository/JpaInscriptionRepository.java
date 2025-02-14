package ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.repository;

import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionRepository;
import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.entity.InscriptionEntity;
import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.mapper.InscriptionEntityMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class JpaInscriptionRepository implements InscriptionRepository {

    private final SpringJpaInscriptionRepository repository;
    private final InscriptionEntityMapper mapper;
    private static final Logger log = LoggerFactory.getLogger(JpaInscriptionRepository.class);

    @Override
    public Inscription save(Inscription inscription) {
        InscriptionEntity entity = mapper.toEntity(inscription);
        InscriptionEntity savedEntity = repository.save(entity);
        return mapper.toDomain(savedEntity);
    }

    @Override
    public Optional<Inscription> findById(UUID id) {
        return repository.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<Inscription> findByUserId(UUID userId) {
        return repository.findByUserId(userId).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public boolean existsByUserIdAndContestId(UUID userId, Long contestId) {
        return repository.existsByUserIdAndContestId(userId, contestId);
    }

    @Override
    public List<Inscription> findByContestId(Long contestId) {
        return repository.findByContestId(contestId).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public Page<Inscription> findAll(org.springframework.data.domain.PageRequest pageRequest) {
        log.debug("Ejecutando findAll con pageRequest: {}", pageRequest);
        
        var result = repository.findAll(pageRequest);
        log.debug("Resultado de findAll: {}", result.getContent());
        
        return result.map(mapper::toDomain);
    }
}

interface SpringJpaInscriptionRepository extends JpaRepository<InscriptionEntity, UUID> {
    List<InscriptionEntity> findByUserId(UUID userId);
    boolean existsByUserIdAndContestId(UUID userId, Long contestId);
    List<InscriptionEntity> findByContestId(Long contestId);
} 