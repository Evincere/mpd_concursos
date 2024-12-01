package ar.gov.mpd.concursobackend.contest.application.usecase;

import ar.gov.mpd.concursobackend.contest.application.port.in.ContestQueryUseCase;
import ar.gov.mpd.concursobackend.contest.domain.Contest;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestFilters;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Implementación del caso de uso para consultas de concursos
 */
@Service
@Transactional(readOnly = true)
public class ContestQueryService implements ContestQueryUseCase {
    private final ContestRepository contestRepository;

    public ContestQueryService(ContestRepository contestRepository) {
        this.contestRepository = contestRepository;
    }

    @Override
    public List<Contest> findByFilters(ContestFilters filters) {
        return contestRepository.findByFilters(filters);
    }

    @Override
    public Optional<Contest> findById(Long id) {
        return contestRepository.findById(id);
    }
}