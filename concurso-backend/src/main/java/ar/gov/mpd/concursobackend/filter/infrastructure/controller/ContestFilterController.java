package ar.gov.mpd.concursobackend.filter.infrastructure.controller;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import ar.gov.mpd.concursobackend.filter.application.dto.ContestFilterCommand;
import ar.gov.mpd.concursobackend.filter.application.dto.ContestResponse;
import ar.gov.mpd.concursobackend.filter.application.port.in.SearchContestUseCase;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/contests")
public class ContestFilterController {
    private final SearchContestUseCase searchContestUseCase;

    public ContestFilterController(SearchContestUseCase searchContestUseCase) {
        this.searchContestUseCase = searchContestUseCase;
    }

    @GetMapping("/search")
    public ResponseEntity<List<ContestResponse>> searchContests(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String position) {
        
        ContestFilterCommand command = ContestFilterCommand.builder()
                .status(status)
                .startDate(startDate)
                .endDate(endDate)
                .department(department)
                .position(position)
                .build();
        
        List<ContestResponse> contests = searchContestUseCase.searchContests(command);
        return ResponseEntity.ok(contests);
    }
} 