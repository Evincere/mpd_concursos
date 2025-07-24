package ar.gov.mpd.concursobackend.contest.application;

import ar.gov.mpd.concursobackend.contest.application.validator.ContestValidator;
import ar.gov.mpd.concursobackend.contest.domain.enums.ContestStatus;
import ar.gov.mpd.concursobackend.contest.domain.model.Contest;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestFilters;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import ar.gov.mpd.concursobackend.contest.domain.service.ContestStateMachine;
import ar.gov.mpd.concursobackend.contest.infrastructure.dto.ContestStateResponse;
import ar.gov.mpd.concursobackend.contest.infrastructure.dto.ContestStatsResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

@Service
@Slf4j
public class ContestService {
    private final ContestRepository contestRepository;
    private final ContestValidator contestValidator;
    private final ContestStateMachine stateMachine;

    public ContestService(ContestRepository contestRepository, ContestValidator contestValidator, ContestStateMachine stateMachine) {
        this.contestRepository = contestRepository;
        this.contestValidator = contestValidator;
        this.stateMachine = stateMachine;
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
     * Cambia el estado de un concurso usando validación de máquina de estado
     */
    public Contest changeContestStatus(Long id, String status) {
        Contest contest = getContestById(id);
        ContestStatus currentStatus = contest.getStatus();
        ContestStatus newStatus = ContestStatus.fromString(status);

        // Validar la transición usando la máquina de estado
        stateMachine.validateTransition(currentStatus, newStatus);

        contest.setStatus(newStatus);
        return contestRepository.save(contest);
    }

    /**
     * Obtiene los estados válidos siguientes para un concurso
     */
    public Set<ContestStatus> getValidNextStates(Long contestId) {
        Contest contest = getContestById(contestId);
        return stateMachine.getValidNextStates(contest.getStatus());
    }

    /**
     * Verifica si un concurso permite inscripciones
     */
    public boolean allowsInscriptions(Long contestId) {
        Contest contest = getContestById(contestId);
        return stateMachine.allowsInscriptions(contest.getStatus());
    }

    /**
     * Verifica si un estado de concurso es final
     */
    public boolean isFinalState(ContestStatus status) {
        return stateMachine.isFinalState(status);
    }

    /**
     * Elimina un concurso (solo si está en DRAFT)
     */
    public void deleteContest(Long id) {
        Contest contest = getContestById(id);
        if (contest.getStatus() != ContestStatus.DRAFT) {
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
        // REFACTORING: Estados simplificados y claros
        long active = allContests.stream().filter(c ->
            ContestStatus.ACTIVE.equals(c.getCurrentStatus())
        ).count();
        long draft = allContests.stream().filter(c -> ContestStatus.DRAFT.equals(c.getStatus())).count();
        long closed = allContests.stream().filter(c ->
            ContestStatus.CLOSED.equals(c.getCurrentStatus())
        ).count();
        long inProgress = allContests.stream().filter(c ->
            ContestStatus.IN_EVALUATION.equals(c.getStatus())
        ).count();
        long cancelled = allContests.stream().filter(c -> ContestStatus.CANCELLED.equals(c.getStatus())).count();

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

    /**
     * Obtiene el estado dinámico actual de un concurso
     * REFACTORING: Estado dinámico calculado automáticamente
     *
     * @param contestId ID del concurso
     * @return Estado dinámico del concurso
     */
    public ContestStateResponse getContestState(Long contestId) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new IllegalArgumentException("Concurso no encontrado con ID: " + contestId));

        // Por ahora, lógica simplificada hasta unificar modelos
        ContestStatus currentStatus = calculateCurrentStatus(contest);
        boolean allowsInscriptions = stateMachine.allowsInscriptions(currentStatus);

        return ContestStateResponse.builder()
                .storedStatus(contest.getStatus())
                .currentStatus(currentStatus)
                .allowsInscriptions(allowsInscriptions)
                .inscriptionStartDate(null) // TODO: Obtener de contest_dates
                .inscriptionEndDate(null)   // TODO: Obtener de contest_dates
                .statusDescription(stateMachine.getStatusDescription(currentStatus))
                .userMessage(generateUserMessage(currentStatus, allowsInscriptions))
                .build();
    }

    /**
     * Calcula el estado actual basado en fechas (simplificado)
     */
    private ContestStatus calculateCurrentStatus(Contest contest) {
        // Por ahora, devolver el estado almacenado
        // TODO: Implementar lógica dinámica cuando unifiquemos modelos
        return contest.getStatus();
    }

    /**
     * Actualiza automáticamente los estados de concursos basándose en fechas
     * Método público para ser usado por el scheduler
     */
    @Transactional
    public void updateContestStatusesBasedOnDates() {
        log.info("🔄 [ContestService] Iniciando actualización automática de estados de concursos");

        List<Contest> scheduledContests = contestRepository.findByStatus(ContestStatus.SCHEDULED);
        List<Contest> activeContests = contestRepository.findByStatus(ContestStatus.ACTIVE);

        int updatedCount = 0;

        // Actualizar concursos SCHEDULED que deberían estar ACTIVE
        for (Contest contest : scheduledContests) {
            ContestStatus currentStatus = contest.getCurrentStatus();
            if (currentStatus != contest.getStatus()) {
                log.info("📅 [ContestService] Actualizando estado de concurso '{}': {} -> {}",
                    contest.getTitle(), contest.getStatus(), currentStatus);
                contest.setStatus(currentStatus);
                contestRepository.save(contest);
                updatedCount++;
            }
        }

        // Actualizar concursos ACTIVE que deberían estar CLOSED
        for (Contest contest : activeContests) {
            ContestStatus currentStatus = contest.getCurrentStatus();
            if (currentStatus != contest.getStatus()) {
                log.info("📅 [ContestService] Actualizando estado de concurso '{}': {} -> {}",
                    contest.getTitle(), contest.getStatus(), currentStatus);
                contest.setStatus(currentStatus);
                contestRepository.save(contest);
                updatedCount++;
            }
        }

        log.info("✅ [ContestService] Actualización automática completada: {} concursos actualizados", updatedCount);
    }

    /**
     * Genera mensaje para mostrar al usuario basado en el estado
     */
    private String generateUserMessage(ContestStatus status, boolean allowsInscriptions) {
        if (allowsInscriptions) {
            return "¡Inscripciones abiertas! Puedes postularte ahora.";
        }

        return switch (status) {
            case SCHEDULED -> "Las inscripciones abrirán próximamente.";
            case CLOSED -> "Las inscripciones han cerrado.";
            case IN_EVALUATION -> "Concurso en proceso de evaluación.";
            case RESULTS_PUBLISHED -> "Resultados disponibles.";
            case FINISHED -> "Concurso finalizado.";
            case CANCELLED -> "Concurso cancelado.";
            case ARCHIVED -> "Concurso archivado.";
            default -> "Estado: " + status.getSpanishName();
        };
    }
}
