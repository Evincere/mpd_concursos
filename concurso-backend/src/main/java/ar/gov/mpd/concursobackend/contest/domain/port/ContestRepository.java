package ar.gov.mpd.concursobackend.contest.domain.port;

import ar.gov.mpd.concursobackend.contest.domain.enums.ContestStatus;
import ar.gov.mpd.concursobackend.contest.domain.model.Contest;

import java.util.List;
import java.util.Optional;

public interface ContestRepository {
    List<Contest> findAll();
    List<Contest> findByFilters(ContestFilters filters);
    List<Contest> search(String term);
    List<Contest> findByStatus(ContestStatus status);
    Optional<Contest> findById(Long id);
    Contest save(Contest contest);
    void deleteById(Long id);
}
