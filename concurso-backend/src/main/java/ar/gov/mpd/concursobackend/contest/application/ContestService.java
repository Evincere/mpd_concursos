package ar.gov.mpd.concursobackend.contest.application;

import org.springframework.stereotype.Service;

import ar.gov.mpd.concursobackend.contest.domain.Contest;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestFilters;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;

import java.util.List;

@Service
public class ContestService {
    private final ContestRepository contestRepository;

    public ContestService(ContestRepository contestRepository) {
        this.contestRepository = contestRepository;
    }

    public List<Contest> getAllContests() {
        return contestRepository.findAll();
    }

    public List<Contest> getFilteredContests(ContestFilters filters) {
        return contestRepository.findByFilters(filters);
    }

    public List<Contest> searchContests(String term) {
        return contestRepository.search(term);
    }
}
