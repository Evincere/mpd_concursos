package ar.gov.mpd.concursobackend.contest.infrastructure.controller;

import ar.gov.mpd.concursobackend.contest.application.ContestService;
import ar.gov.mpd.concursobackend.contest.domain.model.Contest;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestFilters;
import ar.gov.mpd.concursobackend.contest.infrastructure.database.repository.ContestJpaRepository;
import ar.gov.mpd.concursobackend.contest.infrastructure.dto.ContestDTO;
import ar.gov.mpd.concursobackend.contest.infrastructure.dto.ContestStateResponse;
import ar.gov.mpd.concursobackend.contest.infrastructure.mapper.ContestMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/concursos")
public class ContestController {
    private final ContestService contestService;
    private final ContestJpaRepository contestRepository;
    private final ContestMapper contestMapper;

    public ContestController(ContestService contestService,
                           ContestJpaRepository contestRepository,
                           ContestMapper contestMapper) {
        this.contestService = contestService;
        this.contestRepository = contestRepository;
        this.contestMapper = contestMapper;
    }

    @GetMapping
    public ResponseEntity<List<ContestDTO>> getAllContests() {
        List<Contest> contests = contestService.getAllContests();
        List<ContestDTO> contestDTOs = contests.stream()
            .map(contestMapper::toDTO)
            .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(contestDTOs);
    }

    @GetMapping("/filtrar")
    public ResponseEntity<List<ContestDTO>> getFilteredContests(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) String dependency,
            @RequestParam(required = false) String position) {

        ContestFilters filters = ContestFilters.builder()
                .status(status)
                .startDate(startDate)
                .endDate(endDate)
                .dependency(dependency)
                .position(position)
                .build();
        List<Contest> contests = contestService.getFilteredContests(filters);
        List<ContestDTO> contestDTOs = contests.stream()
            .map(contestMapper::toDTO)
            .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(contestDTOs);
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<ContestDTO>> searchContests(@RequestParam String termino) {
        List<Contest> contests = contestService.searchContests(termino);
        List<ContestDTO> contestDTOs = contests.stream()
            .map(contestMapper::toDTO)
            .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(contestDTOs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContestDTO> getContestById(@PathVariable Long id) {
        try {
            Contest contest = contestService.getContestById(id);
            ContestDTO contestDTO = contestMapper.toDTO(contest);
            return ResponseEntity.ok(contestDTO);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Obtiene el estado dinámico actual de un concurso
     * REFACTORING: Endpoint para estado dinámico
     */
    @GetMapping("/{id}/estado")
    public ResponseEntity<ContestStateResponse> getContestState(@PathVariable Long id) {
        return ResponseEntity.ok(contestService.getContestState(id));
    }
}
