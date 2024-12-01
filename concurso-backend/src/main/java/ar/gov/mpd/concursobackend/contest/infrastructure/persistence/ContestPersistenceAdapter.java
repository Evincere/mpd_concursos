package ar.gov.mpd.concursobackend.contest.infrastructure.persistence;

import ar.gov.mpd.concursobackend.contest.domain.Contest;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestFilters;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import ar.gov.mpd.concursobackend.contest.infrastructure.database.repository.ContestJpaRepository;
import ar.gov.mpd.concursobackend.contest.infrastructure.database.repository.ContestSpecifications;
import ar.gov.mpd.concursobackend.contest.infrastructure.mapper.ContestEntityMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@Primary
@Profile("!test")
@RequiredArgsConstructor
public class ContestPersistenceAdapter implements ContestRepository {
    private final ContestJpaRepository repository;
    private final ContestEntityMapper mapper;

    @Override
    public List<Contest> findAll() {
        return repository.findAll()
                .stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
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
}
