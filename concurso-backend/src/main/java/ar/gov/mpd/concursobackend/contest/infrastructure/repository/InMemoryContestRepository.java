package ar.gov.mpd.concursobackend.contest.infrastructure.repository;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;
import ar.gov.mpd.concursobackend.contest.domain.Contest;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestFilters;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import jakarta.annotation.PostConstruct;

@Repository
@Profile("test")
public class InMemoryContestRepository implements ContestRepository {
    private List<Contest> contests = new ArrayList<>();

    @PostConstruct
    public void init() {
        // Agregar algunos concursos de prueba
        contests.add(new Contest(
            1L,
            "Concurso para Fiscal",
            "FISCAL",
            LocalDate.now(),
            LocalDate.now().plusMonths(1),
            "ABIERTO",
            "Fiscal de Primera Instancia",
            "Fiscalía N°1",
            2
        ));

        contests.add(new Contest(
            2L,
            "Concurso para Defensor",
            "DEFENSOR",
            LocalDate.now().minusDays(5),
            LocalDate.now().plusMonths(2),
            "ABIERTO",
            "Defensor Público",
            "Defensoría N°3",
            1
        ));

        contests.add(new Contest(
            3L,
            "Concurso para Secretario",
            "SECRETARIO",
            LocalDate.now().plusDays(10),
            LocalDate.now().plusMonths(3),
            "PENDIENTE",
            "Secretario de Primera Instancia",
            "Juzgado N°2",
            3
        ));
    }

    @Override
    public List<Contest> findAll() {
        return new ArrayList<>(contests);
    }

    @Override
    public List<Contest> findByFilters(ContestFilters filters) {
        return contests.stream()
                .filter(contest -> matchesFilters(contest, filters))
                .collect(Collectors.toList());
    }

    @Override
    public List<Contest> search(String term) {
        if (term == null || term.trim().isEmpty()) {
            return findAll();
        }

        String searchTerm = term.toLowerCase();
        return contests.stream()
                .filter(contest -> matchesSearchTerm(contest, searchTerm))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Contest> findById(Long id) {
        return contests.stream()
                .filter(contest -> contest.getId().equals(id))
                .findFirst();
    }

    private boolean matchesFilters(Contest contest, ContestFilters filters) {
        if (filters.getStatus() != null && !filters.getStatus().equals(contest.getStatus())) {
            return false;
        }

        if (filters.getDependency() != null && !filters.getDependency().equals(contest.getDependency())) {
            return false;
        }

        if (filters.getPosition() != null && !filters.getPosition().equals(contest.getPosition())) {
            return false;
        }

        if (filters.getStartDate() != null && contest.getStartDate().isBefore(filters.getStartDate())) {
            return false;
        }

        if (filters.getEndDate() != null && contest.getEndDate().isAfter(filters.getEndDate())) {
            return false;
        }

        return true;
    }

    private boolean matchesSearchTerm(Contest contest, String term) {
        return contest.getTitle().toLowerCase().contains(term) ||
               contest.getPosition().toLowerCase().contains(term) ||
               contest.getDependency().toLowerCase().contains(term);
    }
}
