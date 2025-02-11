package ar.gov.mpd.concursobackend.contest.infrastructure.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import ar.gov.mpd.concursobackend.contest.application.ContestService;
import ar.gov.mpd.concursobackend.contest.domain.Contest;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestFilters;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/concursos")
public class ContestController {
    private final ContestService contestService;

    public ContestController(ContestService contestService) {
        this.contestService = contestService;
    }

    @GetMapping
    public ResponseEntity<List<Contest>> getAllContests() {
        return ResponseEntity.ok(contestService.getAllContests());
    }

    @GetMapping("/filtrar")
    public ResponseEntity<List<Contest>> getFilteredContests(
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
        return ResponseEntity.ok(contestService.getFilteredContests(filters));
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<Contest>> searchContests(@RequestParam String termino) {
        return ResponseEntity.ok(contestService.searchContests(termino));
    }
}
