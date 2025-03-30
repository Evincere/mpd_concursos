package ar.gov.mpd.concursobackend.contest.domain.port;

import java.util.List;
import java.util.Optional;

import ar.gov.mpd.concursobackend.contest.domain.Contest;

public interface ContestRepository {
    List<Contest> findAll();
    List<Contest> findByFilters(ContestFilters filters);
    List<Contest> search(String term);
    Optional<Contest> findById(Long id);
    Contest save(Contest contest);
    void deleteById(Long id);
}
