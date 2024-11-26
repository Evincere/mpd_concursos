package ar.gov.mpd.concursobackend.filter.infrastructure.persistence;

import ar.gov.mpd.concursobackend.filter.application.port.out.LoadContestPort;
import ar.gov.mpd.concursobackend.filter.domain.model.Contest;
import ar.gov.mpd.concursobackend.filter.domain.model.ContestFilter;
import ar.gov.mpd.concursobackend.filter.infrastructure.database.entities.ContestEntity;
import ar.gov.mpd.concursobackend.filter.infrastructure.database.repository.ContestJpaRepository;
import ar.gov.mpd.concursobackend.filter.infrastructure.database.repository.ContestSpecifications;
import ar.gov.mpd.concursobackend.filter.infrastructure.mapper.ContestEntityMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class ContestPersistenceAdapter implements LoadContestPort {
    private final ContestJpaRepository repository;
    private final ContestEntityMapper mapper;

    @Override
    public List<Contest> findByFilters(ContestFilter filter) {
        Specification<ContestEntity> spec = ContestSpecifications.withFilter(filter);
        return repository.findAll(spec)
                .stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }
} 