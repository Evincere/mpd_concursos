package ar.gov.mpd.concursobackend.contest.application;

import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import ar.gov.mpd.concursobackend.contest.domain.Contest;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestFilters;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import ar.gov.mpd.concursobackend.contest.infrastructure.dto.ContestStatsResponse;
import ar.gov.mpd.concursobackend.contest.application.validator.ContestValidator;

import java.util.List;
import java.util.Arrays;
import java.util.Optional;
import java.util.Map;
import org.springframework.data.domain.PageImpl;

@Service
public class ContestService {
    private final ContestRepository contestRepository;
    private final ContestValidator contestValidator;

    public ContestService(ContestRepository contestRepository, ContestValidator contestValidator) {
        this.contestRepository = contestRepository;
        this.contestValidator = contestValidator;
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

    // Métodos de administración

    /**
     * Obtiene concursos con paginación y filtros
     */
    public Page<Contest> getContestsPaged(ContestFilters filters, Pageable pageable) {
        // TODO: Implementar en el repositorio cuando esté disponible
        // Por ahora, simular paginación
        List<Contest> allContests = contestRepository.findByFilters(filters);
        return new PageImpl<>(allContests, pageable, allContests.size());
    }

    /**
     * Obtiene un concurso por ID
     */
    public Contest getContestById(Long id) {
        Optional<Contest> contest = contestRepository.findById(id);
        if (contest.isEmpty()) {
            throw new RuntimeException("Contest not found with id: " + id);
        }
        return contest.get();
    }

    /**
     * Crea un nuevo concurso
     */
    public Contest createContest(Contest contest) {
        // Validaciones de negocio
        validateContest(contest);
        return contestRepository.save(contest);
    }

    /**
     * Actualiza un concurso existente
     */
    public Contest updateContest(Contest contest) {
        // Verificar que existe
        getContestById(contest.getId());

        // Validaciones de negocio
        validateContest(contest);

        return contestRepository.save(contest);
    }

    /**
     * Cambia el estado de un concurso
     */
    public Contest changeContestStatus(Long id, String status) {
        Contest contest = getContestById(id);
        contest.setStatus(status);
        return contestRepository.save(contest);
    }

    /**
     * Elimina un concurso (solo si está en DRAFT)
     */
    public void deleteContest(Long id) {
        Contest contest = getContestById(id);
        if (!"DRAFT".equals(contest.getStatus())) {
            throw new RuntimeException("Only contests in DRAFT status can be deleted");
        }
        contestRepository.deleteById(id);
    }

    /**
     * Obtiene estadísticas de concursos
     */
    public ContestStatsResponse getContestStats() {
        List<Contest> allContests = contestRepository.findAll();

        long total = allContests.size();
        long active = allContests.stream().filter(c -> "ACTIVE".equals(c.getStatus())).count();
        long draft = allContests.stream().filter(c -> "DRAFT".equals(c.getStatus())).count();
        long closed = allContests.stream().filter(c -> "CLOSED".equals(c.getStatus())).count();
        long inProgress = allContests.stream().filter(c -> "IN_PROGRESS".equals(c.getStatus())).count();
        long cancelled = allContests.stream().filter(c -> "CANCELLED".equals(c.getStatus())).count();

        return ContestStatsResponse.builder()
                .total(total)
                .active(active)
                .draft(draft)
                .closed(closed)
                .inProgress(inProgress)
                .cancelled(cancelled)
                .byDepartment(Map.of()) // TODO: Implementar agrupación
                .byCategory(Map.of())   // TODO: Implementar agrupación
                .byStatus(Map.of())     // TODO: Implementar agrupación
                .createdThisMonth(0L)   // TODO: Implementar filtro por fecha
                .endingThisMonth(0L)    // TODO: Implementar filtro por fecha
                .averageInscriptions(0.0) // TODO: Calcular desde inscripciones
                .build();
    }

    /**
     * Obtiene departamentos disponibles
     */
    public List<String> getAvailableDepartments() {
        return Arrays.asList(
            "INFORMATICA",
            "RECURSOS_HUMANOS",
            "CONTADURIA",
            "LEGAL",
            "ADMINISTRACION"
        );
    }

    /**
     * Obtiene categorías disponibles
     */
    public List<String> getAvailableCategories() {
        return Arrays.asList(
            "PROFESIONAL",
            "TECNICO",
            "ADMINISTRATIVO",
            "OPERATIVO"
        );
    }

    /**
     * Obtiene cargos disponibles
     */
    public List<String> getAvailablePositions() {
        return Arrays.asList(
            "Desarrollador Senior",
            "Analista de Sistemas",
            "Contador",
            "Abogado",
            "Administrativo"
        );
    }

    /**
     * Valida un concurso antes de guardarlo
     */
    private void validateContest(Contest contest) {
        // Las validaciones específicas se manejan en el controlador con los DTOs
        // Aquí solo validaciones de negocio básicas
        if (contest.getTitle() == null || contest.getTitle().trim().isEmpty()) {
            throw new RuntimeException("Contest title is required");
        }

        if (contest.getStartDate() == null || contest.getEndDate() == null) {
            throw new RuntimeException("Start date and end date are required");
        }

        if (contest.getStartDate().isAfter(contest.getEndDate())) {
            throw new RuntimeException("Start date must be before end date");
        }
    }
}
