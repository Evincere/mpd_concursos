package ar.gov.mpd.concursobackend.contest.infrastructure.persistence;

import ar.gov.mpd.concursobackend.contest.domain.Contest;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestFilters;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import ar.gov.mpd.concursobackend.contest.infrastructure.database.repository.ContestJpaRepository;
import ar.gov.mpd.concursobackend.contest.infrastructure.database.repository.ContestSpecifications;
import ar.gov.mpd.concursobackend.contest.infrastructure.mapper.ContestMapper;
import ar.gov.mpd.concursobackend.contest.infrastructure.database.entities.ContestEntity;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@Primary
@Profile("!test")
@RequiredArgsConstructor
public class ContestPersistenceAdapter implements ContestRepository {
    private static final Logger log = LoggerFactory.getLogger(ContestPersistenceAdapter.class);
    
    private final ContestJpaRepository repository;
    private final ContestMapper mapper;

    @Override
    public List<Contest> findAll() {
        try {
            log.debug("Iniciando búsqueda de todos los concursos");
            List<ContestEntity> entities = repository.findAll();
            log.debug("Se encontraron {} concursos", entities.size());
            
            return entities.stream()
                .map(mapper::toDomain)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error al obtener todos los concursos", e);
            throw new RuntimeException("Error al obtener todos los concursos: " + e.getMessage(), e);
        }
    }

    @Override
    public List<Contest> findByFilters(ContestFilters filters) {
        return repository.findAll(ContestSpecifications.withFilter(filters))
                .stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Contest> search(String term) {
        return repository.findAll(ContestSpecifications.withSearchTerm(term))
                .stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Contest> findById(Long id) {
        return repository.findById(id)
                .map(mapper::toDomain);
    }

    @Override
    public Contest save(Contest contest) {
        var entity = mapper.toEntity(contest);
        var savedEntity = repository.save(entity);
        return mapper.toDomain(savedEntity);
    }

    @Override
    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
