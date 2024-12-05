package ar.gov.mpd.concursobackend.contest.infrastructure.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionRequest;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionDetailResponse;
import ar.gov.mpd.concursobackend.inscription.application.port.in.CreateInscriptionUseCase;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/contests")
@RequiredArgsConstructor
public class ContestInscriptionController {

    private final CreateInscriptionUseCase createInscriptionUseCase;

    @PostMapping("/{contestId}/inscriptions")
    public ResponseEntity<InscriptionDetailResponse> createInscription(@PathVariable Long contestId) {
        InscriptionRequest request = InscriptionRequest.builder()
            .contestId(contestId)
            .userId(null) // Ajustar para obtener el userId
            .build();
        InscriptionDetailResponse inscription = createInscriptionUseCase.createInscription(request);
        return ResponseEntity.ok(inscription);
    }
}
