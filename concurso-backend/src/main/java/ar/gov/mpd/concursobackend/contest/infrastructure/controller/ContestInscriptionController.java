package ar.gov.mpd.concursobackend.contest.infrastructure.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import ar.gov.mpd.concursobackend.contest.application.dto.ContestInscriptionRequest;
import ar.gov.mpd.concursobackend.contest.application.port.in.CreateContestInscriptionUseCase;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/contests")
@RequiredArgsConstructor
public class ContestInscriptionController {

    private final CreateContestInscriptionUseCase createContestInscriptionUseCase;

    @PostMapping("/{contestId}/inscriptions")
    public ResponseEntity<Inscription> createInscription(@PathVariable Long contestId) {
        ContestInscriptionRequest request = new ContestInscriptionRequest(contestId);
        Inscription inscription = createContestInscriptionUseCase.createInscription(request);
        return ResponseEntity.ok(inscription);
    }
}
